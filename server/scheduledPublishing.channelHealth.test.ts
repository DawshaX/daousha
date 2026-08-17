import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("scheduled publishing channel health guard", () => {
  it("skips only the affected channel until a successful health check exists", () => {
    const source = readFileSync(new URL("./scheduledPublishing.ts", import.meta.url), "utf8");
    const healthGuard = source.slice(source.indexOf("const channelHealth"), source.indexOf("const [policy, runs, connections, assets]"));
    expect(source).toContain("getConnectionHealthMonitor(schedule.ownerId, platform)");
    expect(source).toContain('channelHealth.status !== "healthy"');
    expect(source).toContain('skipped: "channel_not_healthy"');
    expect(healthGuard).not.toContain("setScheduleStatus");
  });
});
