import { describe, expect, it } from "vitest";
import { FACEBOOK_OAUTH_DOMAINS, facebookOAuthDomainIsReady, facebookScopes, getFacebookAppDomain, getFacebookRedirectUri } from "./facebookOAuth";

describe("Facebook OAuth", () => {
  it("uses a same-origin callback and only the active page scopes needed to select a Page and publish eligible content", () => {
    const redirect = getFacebookRedirectUri({ protocol: "https", header: name => name === "host" ? "xdaw.example" : undefined } as never);
    expect(redirect).toBe("https://xdaw.example/api/integrations/facebook/callback");
    expect(getFacebookAppDomain({ header: name => name === "host" ? "xdaw.example:443" : undefined } as never)).toBe("xdaw.example");
    expect(FACEBOOK_OAUTH_DOMAINS).toEqual(["xdawnova.int.eu.org", "daousha-vide-nbqlahcj.manus.space"]);
    expect(facebookOAuthDomainIsReady({ header: name => name === "host" ? "xdawnova.int.eu.org" : undefined } as never)).toBe(true);
    expect(facebookOAuthDomainIsReady({ header: name => name === "host" ? "daousha-vide-nbqlahcj.manus.space" : undefined } as never)).toBe(true);
    expect(facebookOAuthDomainIsReady({ header: name => name === "host" ? "xdaw.example" : undefined } as never)).toBe(false);
    expect(facebookScopes()).toEqual(["pages_show_list", "pages_read_engagement", "pages_manage_posts"]);
    expect(facebookScopes()).not.toContain("publish_video");
    expect(facebookScopes()).not.toContain("business_management");
    expect(facebookScopes()).not.toContain("pages_manage_engagement");
    expect(facebookScopes()).not.toContain("pages_manage_metadata");
    expect(facebookScopes()).not.toContain("read_insights");
  });
});
