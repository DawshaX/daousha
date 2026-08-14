import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ScriptForge bilingual narration and subtitle framing", () => {
  it("labels the Arabic and English drafts as reviewable narration and subtitle text without claiming automatic audio or video generation", async () => {
    const source = await readFile(new URL("./ScriptForge.tsx", import.meta.url), "utf8");
    expect(source).toContain("AR · تعليق وترجمة");
    expect(source).toContain("EN · narration & subtitles");
    expect(source).toContain("لا يولد الاستوديو ملفًا صوتيًا");
    expect(source).toContain("لا يرفع أي فيديو من هذه الخطوة");
  });
});
