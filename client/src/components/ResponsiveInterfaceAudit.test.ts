import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("responsive interface audit record", () => {
  it("documents every primary route and keeps the schedule composer stacked before medium breakpoints", async () => {
    const [report, schedule] = await Promise.all([
      readFile(new URL("../../../docs/interface-qa-2026-08-15.md", import.meta.url), "utf8"),
      readFile(new URL("./ScheduleDeck.tsx", import.meta.url), "utf8"),
    ]);
    for (const route of ["`/`", "`/trends`", "`/library`", "`/studio`", "`/review`", "`/automation`", "`/insights`", "`/settings`"]) {
      expect(report).toContain(route);
    }
    expect(report).toContain("مقبول بعد الإصلاح");
    expect(schedule).toContain("sm:grid-cols-2 xl:grid-cols-4");
  });
});
