import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  updatePublishingPolicy: vi.fn(),
  createChangeLogEntry: vi.fn(),
};

vi.mock("./db", () => dbMock);

const { appRouter } = await import("./routers");

describe("content mix policy integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.updatePublishingPolicy.mockResolvedValue({ dailyShortTarget: 4, dailyLongTarget: 2 });
    dbMock.createChangeLogEntry.mockResolvedValue(undefined);
  });

  it("persists distinct short and long daily targets with the publishing policy", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await caller.daousha.updatePublishingPolicy({ mode: "guarded_auto", publicPublishingEnabled: true, killSwitchEnabled: true, requirePrivateCanary: true, minIntervalMinutes: 10, maxPublicationsPerDay: 6, dailyShortTarget: 4, dailyLongTarget: 2 });
    expect(dbMock.updatePublishingPolicy).toHaveBeenCalledWith(1, expect.objectContaining({ dailyShortTarget: 4, dailyLongTarget: 2 }));
  });

  it("rejects a cadence configuration outside the allowed interval and daily-cap ranges", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.daousha.updatePublishingPolicy({ mode: "guarded_auto", publicPublishingEnabled: true, killSwitchEnabled: false, requirePrivateCanary: true, minIntervalMinutes: 9, maxPublicationsPerDay: 6, dailyShortTarget: 4, dailyLongTarget: 2 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.daousha.updatePublishingPolicy({ mode: "guarded_auto", publicPublishingEnabled: true, killSwitchEnabled: false, requirePrivateCanary: true, minIntervalMinutes: 10, maxPublicationsPerDay: 145, dailyShortTarget: 4, dailyLongTarget: 2 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.updatePublishingPolicy).not.toHaveBeenCalled();
  });
});
