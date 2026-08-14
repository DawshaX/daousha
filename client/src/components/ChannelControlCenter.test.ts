import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ChannelControlCenter distribution panel", () => {
  it("renders the parallel destinations panel from server readiness rather than browser-session state", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain("وجهات النشر المتوازي");
    expect(source).toContain("integrations?.distributionReadiness");
    expect(source).toContain("لا تستخدم أي جلسة متصفح شخصية");
    expect(source).toContain('mode === "automatic_api"');
    expect(source).toContain('mode === "confirmation_required"');
  });
});
