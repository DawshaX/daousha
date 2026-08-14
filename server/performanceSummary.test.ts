import { describe, expect, it } from "vitest";
import { breakdownCurrentPerformance, performanceExperimentAdvice, summarizePerformance } from "../shared/performanceSummary";

describe("performance summary", () => {
  it("uses the latest snapshot per platform-project scope rather than adding repeated readings", () => {
    const summary = summarizePerformance([
      { platform: "YouTube", projectId: 1, contentVariant: "ar", views: 100, engagements: 4, retentionRate: 45, capturedAt: "2026-08-10T00:00:00Z" },
      { platform: "YouTube", projectId: 1, contentVariant: "ar", views: 180, engagements: 9, retentionRate: 50, capturedAt: "2026-08-11T00:00:00Z" },
      { platform: "Instagram", projectId: 2, contentVariant: "en", views: 50, engagements: 2, retentionRate: 35, capturedAt: "2026-08-11T00:00:00Z" },
    ]);
    expect(summary.totalViews).toBe(230);
    expect(summary.totalEngagements).toBe(11);
    expect(summary.averageRetention).toBe(42.5);
    expect(performanceExperimentAdvice(summary)).toContain("مستقرة");
    expect(breakdownCurrentPerformance(summary, "contentVariant").map(item => item.label)).toEqual(["ar", "en"]);
  });
});
