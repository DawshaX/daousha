import { describe, expect, it } from "vitest";

describe("Facebook App Domains live verification", () => {
  const runLive = process.env.RUN_LIVE_PLATFORM_TESTS === "true" ? it : it.skip;

  runLive("reads the configured App Domains without authorizing a user or changing the application", async () => {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    expect(appId).toMatch(/^\d+$/);
    expect(appSecret).toBeTruthy();
    const url = new URL(`https://graph.facebook.com/v26.0/${appId}`);
    url.search = new URLSearchParams({ fields: "app_domains", access_token: `${appId}|${appSecret}` }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    const payload = await response.json() as { app_domains?: string[]; error?: { message?: string } };
    expect(response.ok, payload.error?.message ?? "Meta rejected the app domain inspection").toBe(true);
    expect(payload.app_domains ?? []).toContain("daousha-vide-nbqlahcj.manus.space");
  }, 30_000);
});
