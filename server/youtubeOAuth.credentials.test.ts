import { describe, expect, it } from "vitest";

describe("YouTube OAuth client credentials", () => {
  it("are accepted by Google before the authorization-code exchange", async () => {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: "authorization_code",
        code: "xdaw-credential-validation-no-user-code",
        redirect_uri: "https://example.invalid/oauth-validation",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).not.toBe("invalid_client");
    expect(["invalid_grant", "invalid_request"]).toContain(payload.error);
  }, 20_000);
});
