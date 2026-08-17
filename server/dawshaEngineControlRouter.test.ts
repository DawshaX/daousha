import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = { getDawshaEngineMonitor: vi.fn(), setDawshaEngineMonitorStatus: vi.fn(), createChangeLogEntry: vi.fn() };
const heartbeatMock = { createHeartbeatJob: vi.fn(), updateHeartbeatJob: vi.fn() };
vi.mock("./db", () => dbMock);
vi.mock("./_core/heartbeat", () => heartbeatMock);
const { appRouter } = await import("./routers");

describe("DAWSHA engine controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDawshaEngineMonitor.mockResolvedValue({ id: 3, ownerId: 7, scheduleCronTaskUid: "heartbeat-engine", status: "active" });
    heartbeatMock.updateHeartbeatJob.mockResolvedValue({ nextExecutionAt: null });
    dbMock.setDawshaEngineMonitorStatus.mockResolvedValue({ id: 3, ownerId: 7, status: "paused" });
    dbMock.createChangeLogEntry.mockResolvedValue({ id: 4 });
  });

  it("pauses only the owner's DAWSHA Heartbeat and records the non-publishing decision", async () => {
    const caller = appRouter.createCaller({ user: { id: 7 }, req: { headers: { cookie: "app_session_id=session-token" } } } as any);

    await expect(caller.daousha.pauseDawshaEngine()).resolves.toMatchObject({ status: "paused" });
    expect(heartbeatMock.updateHeartbeatJob).toHaveBeenCalledWith("heartbeat-engine", { enable: false }, "session-token");
    expect(dbMock.setDawshaEngineMonitorStatus).toHaveBeenCalledWith(7, "paused", expect.stringContaining("لا يُنشأ مشروع بحث جديد"));
    expect(dbMock.createChangeLogEntry).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, category: "workflow", actorType: "user", summary: "إيقاف دورة رصد DAWSHA" }));
  });
});
