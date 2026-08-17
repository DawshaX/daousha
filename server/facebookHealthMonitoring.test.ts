import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Facebook health monitoring boundary", () => {
  it("verifies the authorized Page identity without importing the video uploader", () => {
    const source = readFileSync(new URL("./facebookHealthMonitoring.ts", import.meta.url), "utf8");
    expect(source).toContain("verifyAuthorizedFacebookPage");
    expect(source).toContain("لم يُرفع أو يُنشر أي فيديو");
    expect(source).not.toContain("uploadVettedVideoToFacebookPage");
  });

  it("mounts Facebook monitoring on a dedicated authenticated cron route", () => {
    const source = readFileSync(new URL("./scheduledRoutes.ts", import.meta.url), "utf8");
    expect(source).toContain('"/api/scheduled/facebook-health-monitor"');
    expect(source).toContain("executeFacebookHealthMonitor");
  });
});
