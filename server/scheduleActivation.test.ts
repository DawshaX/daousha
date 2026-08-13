import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  getOwnedSchedule: vi.fn(),
  activateSchedule: vi.fn(),
  createChangeLogEntry: vi.fn(),
};
const heartbeatMock = { createHeartbeatJob: vi.fn(), updateHeartbeatJob: vi.fn() };

vi.mock("./db", () => dbMock);
vi.mock("./_core/heartbeat", () => heartbeatMock);

const { appRouter } = await import("./routers");

describe("schedule activation", () => {
  beforeEach(() => {
    dbMock.getOwnedSchedule.mockResolvedValue({ id: 8, ownerId: 1, projectId: 12, platform: "YouTube", cronExpression: "0 */30 * * * *", status: "draft", scheduleCronTaskUid: null });
    heartbeatMock.createHeartbeatJob.mockResolvedValue({ taskUid: "cron_xdaw_8", nextExecutionAt: "2026-08-14T10:00:00.000Z" });
    dbMock.activateSchedule.mockResolvedValue({ id: 8, status: "active", scheduleCronTaskUid: "cron_xdaw_8" });
    dbMock.createChangeLogEntry.mockResolvedValue(undefined);
  });

  it("creates a task bound to the scheduled publication callback and stores its durable task id", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 }, req: { headers: { cookie: "app_session_id=owner-session" } } } as any);
    await caller.daousha.activateSchedule({ scheduleId: 8 });
    expect(heartbeatMock.createHeartbeatJob).toHaveBeenCalledWith(expect.objectContaining({ path: "/api/scheduled/publish", cron: "0 */30 * * * *" }), "owner-session");
    expect(dbMock.activateSchedule).toHaveBeenCalledWith(1, 8, "cron_xdaw_8", "2026-08-14T10:00:00.000Z");
  });
});
