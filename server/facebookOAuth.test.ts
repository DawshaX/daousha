import { describe, expect, it } from "vitest";
import { facebookScopes, getFacebookAppDomain, getFacebookRedirectUri } from "./facebookOAuth";

describe("Facebook OAuth", () => {
  it("uses a same-origin callback and only page-management scopes", () => {
    const redirect = getFacebookRedirectUri({ protocol: "https", header: name => name === "host" ? "xdaw.example" : undefined } as never);
    expect(redirect).toBe("https://xdaw.example/api/integrations/facebook/callback");
    expect(getFacebookAppDomain({ header: name => name === "host" ? "xdaw.example:443" : undefined } as never)).toBe("xdaw.example");
    expect(facebookScopes()).toEqual(expect.arrayContaining(["pages_show_list", "pages_manage_posts", "pages_read_engagement"]));
    expect(facebookScopes()).not.toContain("business_management");
  });
});
