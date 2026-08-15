import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  getOwnedProjectVideoAsset: vi.fn(),
  upsertPrivateUploadMetadataDraft: vi.fn(),
  createChangeLogEntry: vi.fn(),
  createPublishingRun: vi.fn(),
};

vi.mock("./db", () => dbMock);

const { appRouter } = await import("./routers");

describe("private upload metadata draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getOwnedProjectVideoAsset.mockResolvedValue({ project: { id: 41, title: "فيديو تجريبي" }, asset: { id: 77, assetKind: "video" } });
    dbMock.upsertPrivateUploadMetadataDraft.mockResolvedValue({ id: 3, visibility: "private", platform: "youtube", title: "عنوان تجريبي" });
  });

  it("stores private metadata only and never starts a publishing run", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.daousha.savePrivateUploadMetadataDraft({
      projectId: 41,
      assetId: 77,
      title: "عنوان تجريبي",
      description: "وصف أصلي كافٍ لمسودة بيانات الرفع الخاصة.",
      tags: ["XDAW NOVA", "معرفة"],
    })).resolves.toMatchObject({ visibility: "private", platform: "youtube" });

    expect(dbMock.upsertPrivateUploadMetadataDraft).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 1,
      projectId: 41,
      assetId: 77,
      tags: ["XDAW NOVA", "معرفة"],
    }));
    expect(dbMock.createPublishingRun).not.toHaveBeenCalled();
  });

  it("rejects a draft when the chosen video is not linked to the owned project", async () => {
    dbMock.getOwnedProjectVideoAsset.mockResolvedValue(undefined);
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.daousha.savePrivateUploadMetadataDraft({
      projectId: 41,
      assetId: 88,
      title: "عنوان تجريبي",
      description: "وصف أصلي كافٍ لمسودة بيانات الرفع الخاصة.",
      tags: ["معرفة"],
    })).rejects.toMatchObject({ message: "اربط ملف الفيديو بالمشروع نفسه قبل حفظ مسودة الرفع." });
    expect(dbMock.upsertPrivateUploadMetadataDraft).not.toHaveBeenCalled();
  });
});
