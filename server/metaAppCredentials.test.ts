import { describe, expect, it } from "vitest";

describe("Meta app credentials", () => {
  it("are accepted by Graph API for the configured application", async () => {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    expect(appId).toBeTruthy();
    expect(appSecret).toBeTruthy();

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${appId}?fields=id,name&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
      { signal: AbortSignal.timeout(15_000) },
    );
    const payload = (await response.json()) as { id?: string; error?: { message?: string } };

    expect(response.ok, payload.error?.message).toBe(true);
    expect(payload.id).toBe(appId);
  }, 20_000);
});
