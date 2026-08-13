import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { executeScheduledPublish } from "./scheduledPublishing";

export function registerScheduledRoutes(app: Express) {
  app.post("/api/scheduled/publish", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const result = await executeScheduledPublish(user.taskUid);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });
}
