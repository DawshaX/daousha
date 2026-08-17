import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { executeEuOrgDomainMonitor } from "./domainMonitoring";
import { executeScheduledPublish } from "./scheduledPublishing";
import { executeYouTubeHealthMonitor } from "./youtubeHealthMonitoring";
import { executeInstagramHealthMonitor } from "./instagramHealthMonitoring";
import { executeFacebookHealthMonitor } from "./facebookHealthMonitoring";
import { executeSourceHealthMonitor } from "./sourceHealthMonitoring";
import { executeDawshaEngine } from "./dawshaEngineRunner";

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

  app.post("/api/scheduled/euorg-domain-monitor", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await executeEuOrgDomainMonitor(user.taskUid));
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });

  app.post("/api/scheduled/youtube-health-monitor", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await executeYouTubeHealthMonitor(user.taskUid));
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });

  app.post("/api/scheduled/instagram-health-monitor", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await executeInstagramHealthMonitor(user.taskUid));
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });

  app.post("/api/scheduled/facebook-health-monitor", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await executeFacebookHealthMonitor(user.taskUid));
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });

  app.post("/api/scheduled/source-health-monitor", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await executeSourceHealthMonitor(user.taskUid));
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });

  app.post("/api/scheduled/dawsha-engine", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await executeDawshaEngine(user.taskUid));
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });
}
