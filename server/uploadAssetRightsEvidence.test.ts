import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("upload asset rights evidence contract", () => {
  it("يمرر رابط الترخيص مع رابط الأصل إلى بوابة الحقوق عند رفع ملف", async () => {
    const source = await readFile(new URL("./routers.ts", import.meta.url), "utf8");

    expect(source).toContain("licenseUrl: url.optional()");
    expect(source).toContain("licenseUrl: input.licenseUrl");
    expect(source).toContain("assessAssetIntake(assetInput)");
  });
});
