import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ReviewQueue human approval UI", () => {
  it("presents only operational project reviews and states that approval cannot publish or connect an account", async () => {
    const source = await readFile(new URL("./ReviewQueue.tsx", import.meta.url), "utf8");
    expect(source).toContain("operationalProjects");
    expect(source).toContain("تعرض النسخ التشغيلية فقط");
    expect(source).toContain("الاعتماد لا ينشر ولا يربط أي حساب");
    expect(source).toContain('status: "approved"');
  });
});
