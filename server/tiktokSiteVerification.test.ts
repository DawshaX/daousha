import express from "express";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import {
  registerTikTokSiteVerificationRoute,
  TIKTOK_SITE_VERIFICATION_CONTENT,
  TIKTOK_SITE_VERIFICATION_FILENAME,
} from "./tiktokSiteVerification";

describe("TikTok URL-prefix verification", () => {
  it("uses TikTok's exact verification filename and public text payload", () => {
    expect(TIKTOK_SITE_VERIFICATION_FILENAME).toBe("tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt");
    expect(TIKTOK_SITE_VERIFICATION_CONTENT).toBe("tiktok-developers-site-verification=nsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i");
  });

  it("serves the exact signature without cacheable intermediaries", async () => {
    const app = express();
    registerTikTokSiteVerificationRoute(app);
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected an ephemeral TCP port");

      const response = await fetch(`http://127.0.0.1:${address.port}/${TIKTOK_SITE_VERIFICATION_FILENAME}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(response.headers.get("cache-control")).toBe("no-store, no-cache, must-revalidate, max-age=0");
      expect(response.headers.get("pragma")).toBe("no-cache");
      expect(await response.text()).toBe(TIKTOK_SITE_VERIFICATION_CONTENT);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});
