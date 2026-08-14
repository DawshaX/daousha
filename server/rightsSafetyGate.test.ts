import { describe, expect, it } from "vitest";
import { assessAssetIntake } from "./rightsSafetyGate";

describe("rights and safety intake gate", () => {
  it("holds an asset when its license or origin is unverifiable", () => {
    const decision = assessAssetIntake({ title: "Clip", assetKind: "video", licenseType: "unknown" });
    expect(decision.licenseStatus).toBe("held");
    expect(decision.safetyStatus).toBe("review");
    expect(decision.reviewNotes).toContain("غير قابل للتحقق");
  });

  it("keeps sourced assets pending human rights approval and flags sensitive signals", () => {
    const decision = assessAssetIntake({ title: "Graphic violence explainer", assetKind: "video", licenseType: "CC BY 4.0", sourceUrl: "https://example.com/license" });
    expect(decision.licenseStatus).toBe("pending");
    expect(decision.safetyStatus).toBe("review");
    expect(decision.reviewNotes).toContain("إشارة حساسة");
  });

  it("recognizes an original declaration as traceable rights evidence without auto-approving it", () => {
    const decision = assessAssetIntake({ title: "Original scene", assetKind: "image", licenseType: "مشهد مولّد أصليًا بواسطة دعوشة" });
    expect(decision.licenseStatus).toBe("pending");
    expect(decision.safetyStatus).toBe("review");
  });
});
