import { describe, expect, it } from "vitest";
import { executeYouTubeHealthMonitor } from "./youtubeHealthMonitoring";

describe("YouTube health monitor live verification", () => {
  const runLive = process.env.RUN_LIVE_PLATFORM_TESTS === "true" ? it : it.skip;

  runLive("checks the scheduled connection without uploading or publishing a video", async () => {
    const result = await executeYouTubeHealthMonitor("io2YJxuEqSxPCgFze2SL4r");
    expect(result.ok).toBe(true);
    expect(result.status).toBe("healthy");
  }, 45_000);
});
