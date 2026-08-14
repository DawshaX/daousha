import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ScheduleDeck guarded scheduling UI", () => {
  it("limits schedule creation and activation to operational projects and an authorized YouTube credential", async () => {
    const source = await readFile(new URL("./ScheduleDeck.tsx", import.meta.url), "utf8");
    expect(source).toContain("operationalProjects");
    expect(source).toContain('connection.platform === "youtube"');
    expect(source).toContain("connection.credentialCiphertext");
    expect(source).toContain("لا يمكن إنشاء مسودة لمنصة غير جاهزة");
    expect(source).toContain("حواجز الحقوق والسلامة والمعاينة نفسها");
  });
});
