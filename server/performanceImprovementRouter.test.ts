import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = { getDashboardData: vi.fn(), createProposal: vi.fn() };
vi.mock("./db", () => dbMock);
const { appRouter } = await import("./routers");

const lowRetentionSnapshot = { projectId: 1, platform: "YouTube", contentVariant: "ar", views: 100, engagements: 5, retentionRate: 32, capturedAt: new Date("2026-08-14T00:00:00Z") };

describe("performance improvement router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDashboardData.mockResolvedValue({ snapshots: [lowRetentionSnapshot], proposals: [] });
    dbMock.createProposal.mockResolvedValue({ id: 71, title: "اختبار خطاف أو ترتيب فكرة لتحسين الاحتفاظ", state: "proposed" });
  });

  it("returns a review-only suggestion derived from documented snapshots", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.daousha.performanceImprovementSuggestions()).resolves.toMatchObject({ suggestions: [expect.objectContaining({ id: "retention_hook", recorded: false })] });
  });

  it("records a workflow proposal only after an explicit request and never when performance data is absent", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.daousha.recordPerformanceImprovement({ suggestionId: "retention_hook" })).resolves.toMatchObject({ created: true, proposal: expect.objectContaining({ state: "proposed" }) });
    expect(dbMock.createProposal).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 1, proposalKind: "workflow", state: "proposed" }));

    dbMock.getDashboardData.mockResolvedValue({ snapshots: [], proposals: [] });
    await expect(caller.daousha.recordPerformanceImprovement({ suggestionId: "retention_hook" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(dbMock.createProposal).toHaveBeenCalledTimes(1);
  });
});
