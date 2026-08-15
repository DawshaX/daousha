import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ScheduleDeck guarded scheduling UI", () => {
  it("limits schedule creation and activation to operational projects and an authorized server-side destination", async () => {
    const source = await readFile(new URL("./ScheduleDeck.tsx", import.meta.url), "utf8");
    expect(source).toContain("operationalProjects");
    expect(source).toContain('connection.platform === "youtube"');
    expect(source).toContain('connection.platform === "instagram"');
    expect(source).toContain('connection.platform === "facebook"');
    expect(source).toContain("connection.credentialCiphertext");
    expect(source).toContain("يجب تفويض القناة المختارة رسميًا قبل إنشاء المسودة");
    expect(source).toContain("اعتمد الحزمة في بوابة المراجعة مرة واحدة");
  });

  it("stacks the schedule composer on phones before using multi-column layouts", async () => {
    const source = await readFile(new URL("./ScheduleDeck.tsx", import.meta.url), "utf8");
    expect(source).toContain("sm:grid-cols-2 xl:grid-cols-4");
    expect(source).not.toContain("md:grid-cols-4");
  });
});
