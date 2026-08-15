import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("external dependency matrix", () => {
  it("records official blockers without converting them into a publishing permission", async () => {
    const source = await readFile(new URL("../docs/external-dependency-matrix-2026-08-15.md", import.meta.url), "utf8");
    expect(source).toContain("فحص Graph للقراءة فقط أكد انتهاء الرمز أو إلغاءه");
    expect(source).toContain("Submit for review");
    expect(source).toContain("لا يحوّل أي حالة `pending` أو `expired_or_revoked` أو Sandbox إلى سماح افتراضي");
  });
});
