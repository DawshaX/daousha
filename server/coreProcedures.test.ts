import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  createProject: vi.fn(),
  createSource: vi.fn(),
  reviewSource: vi.fn(),
  createAsset: vi.fn(),
  reviewAsset: vi.fn(),
  createChangeLogEntry: vi.fn(),
  getOwnedProject: vi.fn(),
  updateProjectStatus: vi.fn(),
  listChannelConnections: vi.fn(),
  createSchedule: vi.fn(),
};
const notificationMock = { notifyOwnerOperationalEvent: vi.fn() };
const storageMock = { storagePut: vi.fn() };
const imageMock = { listImageModels: vi.fn(), generateImage: vi.fn() };
const scriptMock = { generateOriginalScript: vi.fn() };
vi.mock("./db", () => dbMock);
vi.mock("./operationalNotifications", () => notificationMock);
vi.mock("./storage", () => storageMock);
vi.mock("./_core/imageGeneration", () => imageMock);
vi.mock("./contentBrain", () => scriptMock);
const { appRouter } = await import("./routers");

describe("core content procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createProject.mockResolvedValue({ id: 11, title: "فكرة أصلية" });
    dbMock.createSource.mockResolvedValue({ id: 12, name: "مرجع موثوق", trustStatus: "proposed" });
    dbMock.reviewSource.mockResolvedValue({ id: 12, name: "مرجع موثوق", trustStatus: "approved" });
    dbMock.createAsset.mockResolvedValue({ id: 13, title: "صوت أصلي", licenseStatus: "held", safetyStatus: "review" });
    dbMock.reviewAsset.mockResolvedValue({ id: 13, title: "صوت أصلي", licenseStatus: "approved", safetyStatus: "clear" });
    dbMock.createChangeLogEntry.mockResolvedValue({ id: 14 });
    dbMock.getOwnedProject.mockResolvedValue({ id: 11, title: "فكرة أصلية", projectKind: "standalone", status: "production" });
    dbMock.updateProjectStatus.mockResolvedValue({ id: 11, title: "فكرة أصلية", status: "review" });
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "youtube", status: "authorized", credentialCiphertext: "cipher" }]);
    dbMock.createSchedule.mockResolvedValue({ id: 15, projectId: 11, platform: "youtube", status: "draft" });
    notificationMock.notifyOwnerOperationalEvent.mockResolvedValue({ delivered: false });
    storageMock.storagePut.mockResolvedValue({ key: "daousha/7/raw/clip.mp4", url: "https://storage.example/clip.mp4" });
    imageMock.listImageModels.mockResolvedValue({ models: [{ model: "image-model" }] });
  });

  it("creates a project and registers a source as proposed under the authenticated owner", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 } } as any);
    await expect(caller.daousha.createProject({ title: "فكرة أصلية", targetLanguage: "both", contentFormat: "short" })).resolves.toMatchObject({ id: 11 });
    await expect(caller.daousha.addSource({ name: "مرجع موثوق", url: "https://example.com/source", sourceKind: "reference", language: "both" })).resolves.toMatchObject({ trustStatus: "proposed" });
    expect(dbMock.createProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, title: "فكرة أصلية" }));
    expect(dbMock.createSource).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, trustStatus: "proposed" }));
  });

  it("registers assets for review and records auditable human source and asset decisions", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 } } as any);
    await expect(caller.daousha.registerAsset({ title: "صوت أصلي", assetKind: "audio", licenseType: "مادة أصلية" })).resolves.toMatchObject({ id: 13 });
    expect(notificationMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, eventType: "review_required" }));

    await expect(caller.daousha.reviewSource({ sourceId: 12, trustStatus: "approved" })).resolves.toMatchObject({ trustStatus: "approved" });
    await expect(caller.daousha.reviewAsset({ assetId: 13, licenseStatus: "approved", safetyStatus: "clear" })).resolves.toMatchObject({ licenseStatus: "approved", safetyStatus: "clear" });
    expect(dbMock.createChangeLogEntry).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, category: "source", actorType: "user" }));
    expect(dbMock.createChangeLogEntry).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, category: "safety_rule", actorType: "user" }));
  });

  it("enforces the byte upload limit before storage and preserves provider failures without creating an asset", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 } } as any);
    const tooLarge = Buffer.alloc(10 * 1024 * 1024 + 8).toString("base64");
    await expect(caller.daousha.uploadAsset({ title: "ملف كبير", fileName: "clip.mp4", contentType: "video/mp4", base64: tooLarge, assetKind: "video", licenseType: "مادة أصلية" })).rejects.toThrow("أكبر من الحد الأولي");
    expect(storageMock.storagePut).not.toHaveBeenCalled();

    storageMock.storagePut.mockRejectedValue(new Error("storage unavailable"));
    await expect(caller.daousha.uploadAsset({ title: "ملف صغير", fileName: "clip.mp4", contentType: "video/mp4", base64: Buffer.from("safe upload").toString("base64"), assetKind: "video", licenseType: "مادة أصلية" })).rejects.toThrow("storage unavailable");
    expect(dbMock.createAsset).not.toHaveBeenCalled();
  });

  it("creates a schedule draft only for an operational project on officially authorized YouTube", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 } } as any);
    await expect(caller.daousha.createScheduleDraft({ projectId: 11, platform: "youtube", cronExpression: "0 0 9 * * *", timeZone: "Africa/Cairo" })).resolves.toMatchObject({ id: 15, status: "draft" });
    expect(dbMock.createSchedule).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, projectId: 11, platform: "youtube" }));

    dbMock.getOwnedProject.mockResolvedValue({ id: 12, projectKind: "package_parent" });
    await expect(caller.daousha.createScheduleDraft({ projectId: 12, platform: "youtube", cronExpression: "0 0 9 * * *", timeZone: "Africa/Cairo" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMock.createSchedule).toHaveBeenCalledTimes(1);
  });

  it("notifies the owner when an operational project enters human review", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 } } as any);
    await expect(caller.daousha.transitionProject({ projectId: 11, status: "review" })).resolves.toMatchObject({ status: "review" });
    expect(notificationMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, eventType: "project_review_required", title: "مشروع بانتظار مراجعة" }));
  });

  it("does not create assets, scripts, or review notifications when an AI provider fails", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 } } as any);
    imageMock.generateImage.mockRejectedValue(new Error("image provider unavailable"));
    scriptMock.generateOriginalScript.mockRejectedValue(new Error("script provider unavailable"));

    await expect(caller.daousha.generateVisual({ projectId: 11, prompt: "مشهد أصلي طويل ومناسب للمراجعة" })).rejects.toThrow("image provider unavailable");
    await expect(caller.daousha.generateScript({ projectId: 11 })).rejects.toThrow("script provider unavailable");
    expect(dbMock.createAsset).not.toHaveBeenCalled();
    expect(notificationMock.notifyOwnerOperationalEvent).not.toHaveBeenCalled();
  });

  it("registers a generated supporting visual as a review-required B-roll asset", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 } } as any);
    imageMock.generateImage.mockResolvedValue({ url: "https://images.example/broll.png" });
    dbMock.createAsset.mockResolvedValue({ id: 19, title: "مادة B-roll أصلية — فكرة أصلية" });

    await expect(caller.daousha.generateVisual({ projectId: 11, prompt: "تفاصيل بصرية أصلية لدعم الفكرة", outputRole: "broll" })).resolves.toMatchObject({ assetId: 19 });
    expect(dbMock.createAsset).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, title: "مادة B-roll أصلية — فكرة أصلية", assetKind: "image" }));
    expect(notificationMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, eventType: "review_required" }));
  });
});
