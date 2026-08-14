import { describe, expect, it } from "vitest";
import { TIKTOK_SITE_VERIFICATION_CONTENT, TIKTOK_SITE_VERIFICATION_FILENAME } from "./tiktokSiteVerification";

describe("TikTok URL-prefix verification", () => {
  it("uses TikTok's exact verification filename and public text payload", () => {
    expect(TIKTOK_SITE_VERIFICATION_FILENAME).toBe("tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt");
    expect(TIKTOK_SITE_VERIFICATION_CONTENT).toBe("tiktok-developers-site-verification=nsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i\n");
  });
});
