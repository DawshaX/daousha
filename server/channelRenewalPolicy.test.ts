import { describe, expect, it } from "vitest";
import { buildChannelRenewalGuidance } from "./channelRenewalPolicy";

describe("channel renewal policy", () => {
  it("distinguishes server-side refresh from manual reauthorization and keeps TikTok excluded", () => {
    const guidance = buildChannelRenewalGuidance([
      { platform: "youtube", status: "authorized" },
      { platform: "instagram", status: "authorized" },
      { platform: "facebook", status: "authorized" },
      { platform: "telegram", status: "authorized" },
      { platform: "tiktok", status: "configured" },
    ]);

    expect(guidance.find(item => item.platform === "youtube")?.mode).toBe("server_refresh");
    expect(guidance.find(item => item.platform === "instagram")?.mode).toBe("server_refresh");
    expect(guidance.find(item => item.platform === "facebook")?.mode).toBe("reauthorize");
    expect(guidance.find(item => item.platform === "telegram")?.mode).toBe("persistent");
    expect(guidance.find(item => item.platform === "tiktok")?.mode).toBe("excluded");
  });
});
