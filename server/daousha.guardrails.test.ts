import { describe, expect, it } from "vitest";
import { needsHumanReview, platformReferences, workflowStages } from "../shared/daousha";

describe("Daousha guardrails", () => {
  it("keeps a material out of publishing until rights and safety are both clear", () => {
    expect(needsHumanReview({ licenseStatus: "pending", safetyStatus: "clear" })).toBe(true);
    expect(needsHumanReview({ licenseStatus: "approved", safetyStatus: "review" })).toBe(true);
    expect(needsHumanReview({ licenseStatus: "approved", safetyStatus: "clear" })).toBe(false);
  });

  it("retains a stable ordered workflow and licensed reference catalog", () => {
    expect(workflowStages).toEqual(["الفكرة", "البحث", "السكربت", "الإنتاج", "المراجعة", "جاهز للنشر"]);
    expect(platformReferences.map(reference => reference.name)).toContain("Pexels");
  });
});
