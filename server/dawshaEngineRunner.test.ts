import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = { getDawshaEngineMonitorByTaskUid: vi.fn(), listProjects: vi.fn(), createDawshaPipeline: vi.fn(), updateDawshaEngineMonitorRun: vi.fn(), createChangeLogEntry: vi.fn() };
const trendMock = { fetchGoogleTrendSignals: vi.fn() };
vi.mock("./db", () => dbMock);
vi.mock("./trendRadar", () => trendMock);
const { executeDawshaEngine } = await import("./dawshaEngineRunner");

describe("DAWSHA scheduled trend intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDawshaEngineMonitorByTaskUid.mockResolvedValue({ id: 1, ownerId: 7, status: "active", lastRunAt: null });
    dbMock.listProjects.mockResolvedValue([]);
    trendMock.fetchGoogleTrendSignals.mockImplementation((geo: string) => Promise.resolve(geo === "EG" ? [{ title: "معلومة نافعة", approximateTraffic: "100K+", sourceName: "Google Trends", sourceUrl: "https://trends.google.com/trending/rss?geo=EG" }] : []));
    dbMock.createDawshaPipeline.mockResolvedValue({ project: { id: 90 }, tasks: Array(7).fill({}) });
    dbMock.updateDawshaEngineMonitorRun.mockResolvedValue({ id: 1 });
    dbMock.createChangeLogEntry.mockResolvedValue({ id: 2 });
  });

  it("creates one constrained research pipeline and leaves media and publishing outside the scheduled run", async () => {
    const result = await executeDawshaEngine("heartbeat-1");
    expect(result).toMatchObject({ ok: true, projectId: 90, taskCount: 7 });
    expect(dbMock.createDawshaPipeline).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, title: "إشارة ترند قابلة للمراجعة — معلومة نافعة", targetLanguage: "both" }));
    expect(dbMock.createChangeLogEntry).toHaveBeenCalledWith(expect.objectContaining({ actorType: "scheduled_job", details: expect.stringContaining("ما زالت محجوبة") }));
  });

  it("does not create another project when the idempotency interval has not elapsed", async () => {
    dbMock.getDawshaEngineMonitorByTaskUid.mockResolvedValue({ id: 1, ownerId: 7, status: "active", lastRunAt: new Date() });
    await expect(executeDawshaEngine("heartbeat-1")).resolves.toMatchObject({ skipped: "intake_interval" });
    expect(trendMock.fetchGoogleTrendSignals).not.toHaveBeenCalled();
    expect(dbMock.createDawshaPipeline).not.toHaveBeenCalled();
  });

  it("allows a later scheduled retry after a prior radar error instead of treating it as a permanent pause", async () => {
    dbMock.getDawshaEngineMonitorByTaskUid.mockResolvedValue({ id: 1, ownerId: 7, status: "error", lastRunAt: null });
    await expect(executeDawshaEngine("heartbeat-1")).resolves.toMatchObject({ ok: true, projectId: 90 });
    expect(dbMock.createDawshaPipeline).toHaveBeenCalledOnce();
  });
});
