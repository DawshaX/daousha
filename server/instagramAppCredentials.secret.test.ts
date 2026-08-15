import { describe, expect, it } from "vitest";

const instagramAppId = process.env.INSTAGRAM_APP_ID;
const instagramAppSecret = process.env.INSTAGRAM_APP_SECRET;

describe("Instagram app credentials", () => {
  const runLive = process.env.RUN_LIVE_PLATFORM_TESTS === "true" ? it : it.skip;

  runLive("validates the configured app token with Meta without exposing the secret", async () => {
    expect(instagramAppId).toMatch(/^\d{8,}$/);
    expect(instagramAppSecret).toBeTruthy();

    const appAccessToken = `${instagramAppId}|${instagramAppSecret}`;
    const debugUrl = new URL("https://graph.facebook.com/v23.0/debug_token");
    debugUrl.searchParams.set("input_token", appAccessToken);
    const response = await fetch(debugUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${appAccessToken}` },
    });
    const payload = await response.json() as { data?: { app_id?: string; is_valid?: boolean }; error?: { message?: string } };

    expect(response.ok, payload.error?.message ?? "Meta rejected the Instagram app token").toBe(true);
    expect(payload.data?.app_id).toBe(instagramAppId);
    expect(payload.data?.is_valid).toBe(true);
  }, 20_000);
});
