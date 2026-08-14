import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = { getOwnedProject: vi.fn(), listChannelConnections: vi.fn(), listOperationalProjects: vi.fn(), recordAnalyticsSnapshot: vi.fn(), getContentMixStatus: vi.fn(), listOwnedProjectVideoAssets: vi.fn() };
vi.mock("./db", () => dbMock);
const { appRouter } = await import("./routers");

describe("package parent router guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getOwnedProject.mockResolvedValue({ id: 41, ownerId: 1, title: "فكرة أم", projectKind: "package_parent", status: "idea" });
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "youtube", status: "authorized", credentialCiphertext: "cipher" }]);
  });

  it("rejects generating, scheduling, or recording analytics for a parent container", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 }, req: { headers: {} } } as any);
    await expect(caller.daousha.generateScript({ projectId: 41 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.daousha.createScheduleDraft({ projectId: 41, platform: "youtube", cronExpression: "0 0 9 * * *", timeZone: "UTC" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.daousha.recordAnalytics({ projectId: 41, platform: "YouTube", contentVariant: "both", views: 10, engagements: 1, retentionRate: 50 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMock.recordAnalyticsSnapshot).not.toHaveBeenCalled();
  });

  it("keeps a parent out of review, daily goals, and operational project-video lists", async () => {
    const variants = [
      { id: 42, ownerId: 1, title: "نسخة قصيرة", projectKind: "package_variant", orientation: "vertical", contentFormat: "short", status: "review" },
      { id: 43, ownerId: 1, title: "نسخة طويلة", projectKind: "package_variant", orientation: "horizontal", contentFormat: "long", status: "idea" },
    ];
    dbMock.listOperationalProjects.mockResolvedValue(variants);
    dbMock.getContentMixStatus.mockResolvedValue({ dailyShortTarget: 4, dailyLongTarget: 2, publishedShorts: 0, publishedLongs: 0, readyShorts: 1, readyLongs: 0 });
    dbMock.listOwnedProjectVideoAssets.mockResolvedValue([{ project: variants[0], asset: { id: 7, assetKind: "video" }, link: { projectId: 42, assetId: 7 } }]);
    const caller = appRouter.createCaller({ user: { id: 1 }, req: { headers: {} } } as any);

    await expect(caller.daousha.transitionProject({ projectId: 41, status: "review" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.daousha.operationalProjects()).resolves.toEqual(variants);
    await expect(caller.daousha.contentMixStatus()).resolves.toMatchObject({ readyShorts: 1, readyLongs: 0 });
    await expect(caller.daousha.projectVideoAssets()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ project: expect.objectContaining({ id: 42 }) })]));
    expect(dbMock.listOwnedProjectVideoAssets).not.toHaveReturnedWith(expect.arrayContaining([expect.objectContaining({ project: expect.objectContaining({ id: 41 }) })]));
  });
});
