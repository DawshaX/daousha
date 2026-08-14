import type { Express } from "express";

export const TIKTOK_SITE_VERIFICATION_FILENAME = "tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt";
export const TIKTOK_SITE_VERIFICATION_CONTENT = "tiktok-developers-site-verification=nsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i";

export function registerTikTokSiteVerificationRoute(app: Express) {
  app.get(`/${TIKTOK_SITE_VERIFICATION_FILENAME}`, (_req, res) => {
    res
      .set({
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      })
      .type("text/plain")
      .status(200)
      .send(TIKTOK_SITE_VERIFICATION_CONTENT);
  });
}
