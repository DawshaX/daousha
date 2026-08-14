import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ContentMixPanel responsive safeguards", () => {
  it("preserves readable columns with horizontal scrolling and an explicit empty state", async () => {
    const source = await readFile(new URL("./ContentMixPanel.tsx", import.meta.url), "utf8");
    expect(source).toContain('overflow-x-auto rounded-xl border border-white/8');
    expect(source).toContain('min-w-[620px]');
    expect(source).toContain("لا توجد علاقات مشروع-فيديو مسجلة بعد.");
  });
});
