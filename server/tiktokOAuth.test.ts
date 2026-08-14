import { describe, expect, it } from "vitest";
import { getTikTokAuthorizeUrl } from "./tiktokOAuth";

describe("TikTok OAuth authorization URL", () => {
  it("requests the minimum identity, draft upload, and direct post scopes", () => {
    const url = new URL(getTikTokAuthorizeUrl({ clientKey: "client-key", redirectUri: "https://xdawnova.example/api/integrations/tiktok/callback", state: "csrf-state" }));

    expect(url.origin).toBe("https://www.tiktok.com");
    expect(url.pathname).toBe("/v2/auth/authorize/");
    expect(url.searchParams.get("client_key")).toBe("client-key");
    expect(url.searchParams.get("state")).toBe("csrf-state");
    expect(url.searchParams.get("scope")).toBe("user.info.basic,video.upload,video.publish");
    expect(url.searchParams.get("redirect_uri")).toBe("https://xdawnova.example/api/integrations/tiktok/callback");
  });
});
