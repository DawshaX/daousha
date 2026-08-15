import { describe, expect, it } from "vitest";
import { executeInstagramHealthMonitor } from "./instagramHealthMonitoring";

describe("Instagram health monitor live verification", () => {
  const runLive = process.env.RUN_LIVE_PLATFORM_TESTS === "true" ? it : it.skip;

  runLive("checks the scheduled connection without creating or publishing a Reel", async () => {
    const result = await executeInstagramHealthMonitor("7XmW4Ei5AaKaGZHesLQLGG");
    expect(result.ok).toBe(true);
    expect(result.status).toBe("healthy");
  }, 45_000);
});
