import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Instagram health monitoring boundary", () => {
  it("refreshes and reads the official account without importing the Reel publisher", () => {
    const source = readFileSync(new URL("./instagramHealthMonitoring.ts", import.meta.url), "utf8");
    expect(source).toContain("getAuthenticatedInstagramProfile");
    expect(source).toContain("لم يُنشأ أو يُنشر أي Reel");
    expect(source).not.toContain("publishVettedInstagramReel");
  });

  it("mounts Instagram monitoring on a dedicated cron route", () => {
    const source = readFileSync(new URL("./scheduledRoutes.ts", import.meta.url), "utf8");
    expect(source).toContain('"/api/scheduled/instagram-health-monitor"');
    expect(source).toContain("executeInstagramHealthMonitor");
  });
});
