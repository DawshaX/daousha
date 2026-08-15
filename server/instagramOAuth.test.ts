import { describe, expect, it } from "vitest";
import { buildInstagramAuthorizationUrl, INSTAGRAM_BACKGROUND_SCOPES } from "./instagramOAuth";

describe("Instagram OAuth", () => {
  it("requests the minimum background-publishing scopes through the official Instagram authorization endpoint", () => {
    const url = new URL(buildInstagramAuthorizationUrl("1631810545232311", "https://example.com/api/integrations/instagram/callback", "csrf-state"));
    expect(url.origin).toBe("https://www.instagram.com");
    expect(url.pathname).toBe("/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("1631810545232311");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/api/integrations/instagram/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")?.split(",")).toEqual([...INSTAGRAM_BACKGROUND_SCOPES]);
    expect(url.searchParams.get("enable_fb_login")).toBe("false");
    expect(url.searchParams.get("state")).toBe("csrf-state");
  });
});
