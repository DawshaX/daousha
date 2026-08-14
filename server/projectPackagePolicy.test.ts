import { describe, expect, it } from "vitest";
import { describeProductionPackage } from "../shared/daousha";

describe("production package policy", () => {
  it("describes a bilingual short package without promising publication", () => {
    expect(describeProductionPackage("both", "short")).toEqual({
      languageLabel: "نسختان مستقلتان: عربية وإنجليزية",
      formatLabel: "نسخة عمودية قصيرة",
      requiresHumanReview: true,
    });
  });
});
