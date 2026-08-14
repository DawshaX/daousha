import type { Express } from "express";

export const TIKTOK_SITE_VERIFICATION_FILENAME = "tiktoknsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i.txt";
export const TIKTOK_SITE_VERIFICATION_CONTENT = "tiktok-developers-site-verification=nsNkmBhHm5g8QO0aIkogWjPQ4PG3DE6i";

export function registerTikTokSiteVerificationRoute(app: Express) {
  app.get(`/${TIKTOK_SITE_VERIFICATION_FILENAME}`, (_req, res) => {
    res.type("text/plain").send(TIKTOK_SITE_VERIFICATION_CONTENT);
  });
}
