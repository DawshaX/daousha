import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  getOwnedProjectVideoAsset: vi.fn(),
  getPublishingPolicy: vi.fn(),
  listPublishingRuns: vi.fn(),
};

vi.mock("./db", () => dbMock);

const { appRouter } = await import("./routers");

describe("preflightVettedYouTubeVideo project-asset integration", () => {
  beforeEach(() => {
    dbMock.getOwnedProjectVideoAsset.mockResolvedValue(undefined);
    dbMock.getPublishingPolicy.mockResolvedValue({});
    dbMock.listPublishingRuns.mockResolvedValue([]);
  });

  it("rejects an asset that is not linked to the selected project before evaluating or uploading", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.daousha.preflightVettedYouTubeVideo({ projectId: 44, assetId: 99 })).rejects.toMatchObject({
      message: "اربط ملف الفيديو بالمشروع نفسه قبل فحص النشر.",
    });
    expect(dbMock.getOwnedProjectVideoAsset).toHaveBeenCalledWith(1, 44, 99);
  });
});
