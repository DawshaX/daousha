import { describe, expect, it } from "vitest";

const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
const runLivePlatformTests = process.env.RUN_LIVE_PLATFORM_TESTS === "true";
// Meta Graph API returns the canonical Graph Page ID, which may differ from the public profile URL ID.
const expectedPageId = "1265727539958933";

describe.skipIf(!runLivePlatformTests)("Facebook Page access token secret", () => {
  it("authenticates as the approved XDAW NOVA Page without exposing the token", async () => {
    expect(token).toBeTruthy();
    const response = await fetch(`https://graph.facebook.com/v26.0/me?fields=id,name&access_token=${encodeURIComponent(token!)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { id?: string; name?: string };
    expect(payload.id).toBe(expectedPageId);
    expect(payload.name).toBe("XDAW NOVA");
  });
});
