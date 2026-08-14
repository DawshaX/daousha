import { describe, expect, it } from "vitest";
import { derivePerformanceImprovementSuggestion } from "../shared/performanceImprovement";

describe("performance improvement suggestions", () => {
  it("does not fabricate an improvement proposal without real performance snapshots", () => {
    expect(derivePerformanceImprovementSuggestion([])).toBeUndefined();
  });

  it("prioritizes a single retention experiment when documented retention is low", () => {
    const suggestion = derivePerformanceImprovementSuggestion([{ projectId: 1, platform: "YouTube", contentVariant: "ar", views: 100, engagements: 5, retentionRate: 32, capturedAt: "2026-08-14T00:00:00Z" }]);
    expect(suggestion).toMatchObject({ id: "retention_hook" });
    expect(suggestion?.rationale).toContain("32.0%");
  });

  it("proposes one measurable variable when retention and engagement are stable", () => {
    const suggestion = derivePerformanceImprovementSuggestion([{ projectId: 1, platform: "YouTube", contentVariant: "en", views: 100, engagements: 4, retentionRate: 55, capturedAt: "2026-08-14T00:00:00Z" }]);
    expect(suggestion).toMatchObject({ id: "single_variable_experiment" });
    expect(suggestion?.rationale).toContain("دون تغيير تلقائي");
  });
});
