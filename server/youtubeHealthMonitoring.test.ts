import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("YouTube connection health monitor boundaries", () => {
  it("refreshes and reads the authorized channel without importing an upload path", async () => {
    const source = await readFile(new URL("./youtubeHealthMonitoring.ts", import.meta.url), "utf8");
    expect(source).toContain("getAuthenticatedYouTubeChannel");
    expect(source).toContain("لم يُرفع أو يُنشر أي محتوى");
    expect(source).not.toContain("uploadVettedVideoToYouTube");
  });

  it("uses a cron-only route distinct from scheduled publishing", async () => {
    const source = await readFile(new URL("./scheduledRoutes.ts", import.meta.url), "utf8");
    expect(source).toContain('/api/scheduled/youtube-health-monitor');
    expect(source).toContain("executeYouTubeHealthMonitor");
  });
});
