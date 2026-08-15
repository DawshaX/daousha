import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("ReviewPublishDesk private metadata draft", () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ReviewPublishDesk.tsx"), "utf8");

  it("exposes a private draft action distinct from preflight and upload", () => {
    expect(source).toContain("savePrivateUploadMetadataDraft");
    expect(source).toContain("حفظ مسودة خاصة");
    expect(source).toContain("لا تفحص الحواجز ولا ترفع ملفًا ولا تنشر محتوى");
  });
});
