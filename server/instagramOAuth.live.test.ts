import { describe, expect, it } from "vitest";
import * as db from "./db";
import { getAuthenticatedInstagramProfile } from "./instagramOAuth";

describe("Instagram OAuth live verification", () => {
  const runLive = process.env.RUN_LIVE_PLATFORM_TESTS === "true" ? it : it.skip;

  runLive("reads the authorized professional account without creating or publishing media", async () => {
    const connection = await db.getChannelConnection(7170001, "instagram");
    expect(connection?.status).toBe("authorized");
    expect(connection?.credentialCiphertext).toBeTruthy();
    const profile = await getAuthenticatedInstagramProfile(connection!);
    expect(profile.id).toBe(connection?.externalAccountRef);
    expect(profile.username.toLowerCase()).toBe("xdaw_nova");
  }, 30_000);
});
