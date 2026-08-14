import { describe, expect, it } from "vitest";
import { describeProductionPackage } from "../shared/daousha";
import { describeTwoFormatPackage } from "../shared/projectPackage";

describe("production package policy", () => {
  it("describes a bilingual short package without promising publication", () => {
    expect(describeProductionPackage("both", "short")).toEqual({
      languageLabel: "نسختان مستقلتان: عربية وإنجليزية",
      formatLabel: "نسخة عمودية قصيرة",
      requiresHumanReview: true,
    });
  });

  it("builds linked short and long variants from one original parent idea", () => {
    const bundle = describeTwoFormatPackage({ title: "نور ومعرفة", brief: "فكرة أصلية", targetLanguage: "both" });
    expect(bundle.parent.title).toContain("الفكرة الأم");
    expect(bundle.parent.projectKind).toBe("package_parent");
    expect(bundle.variants.map(item => item.contentFormat)).toEqual(["short", "long"]);
    expect(bundle.variants.map(item => item.orientation)).toEqual(["vertical", "horizontal"]);
    expect(bundle.variants.every(item => item.targetLanguage === "both")).toBe(true);
  });
});
