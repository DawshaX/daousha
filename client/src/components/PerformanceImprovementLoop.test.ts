import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("PerformanceImprovementLoop review-only UI", () => {
  it("renders documented-performance suggestions with a review-only registration action", async () => {
    const source = await readFile(new URL("./PerformanceImprovementLoop.tsx", import.meta.url), "utf8");
    expect(source).toContain("performanceImprovementSuggestions");
    expect(source).toContain("recordPerformanceImprovement");
    expect(source).toContain("تسجيل للمراجعة فقط");
    expect(source).toContain("لا ينفذ تغييرًا ولا يبدل سياسة أو تفويضًا أو نشرًا");
  });
});
