import { describe, expect, it } from "vitest";
import { needsHumanReview, platformReferences, workflowStages } from "./daousha";

describe("Daousha safeguards", () => {
  it("requires human review when rights are not approved", () => {
    expect(needsHumanReview({ licenseStatus: "pending", safetyStatus: "clear" })).toBe(true);
  });

  it("requires human review when safety is not clear", () => {
    expect(needsHumanReview({ licenseStatus: "approved", safetyStatus: "review" })).toBe(true);
  });

  it("allows the human gate to be reached only after both checks pass", () => {
    expect(needsHumanReview({ licenseStatus: "approved", safetyStatus: "clear" })).toBe(false);
  });

  it("keeps the core workflow ordered and source references available", () => {
    expect(workflowStages).toEqual(["الفكرة", "البحث", "السكربت", "الإنتاج", "المراجعة", "جاهز للنشر"]);
    expect(platformReferences.map(reference => reference.name)).toContain("Pexels");
  });
});
