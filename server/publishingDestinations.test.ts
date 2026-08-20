import { describe, expect, it } from "vitest";
import { resolveDistributionReadiness } from "./publishingDestinations";

describe("distribution readiness", () => {
  it("uses only the YouTube OAuth credential for fully automatic publishing", () => {
    const readiness = resolveDistributionReadiness([
      { platform: "youtube", status: "authorized", credentialCiphertext: "encrypted-token" },
      { platform: "instagram", status: "configured" },
      { platform: "facebook", status: "configured" },
      { platform: "tiktok", status: "configured" },
    ]);

    expect(readiness.find(item => item.platform === "youtube")).toMatchObject({ eligible: true, mode: "automatic_api" });
    expect(readiness.find(item => item.platform === "instagram")).toMatchObject({ eligible: false, mode: "not_authorized" });
  });

  it("does not treat an authorized Instagram connector as browser-driven automation", () => {
    const readiness = resolveDistributionReadiness([{ platform: "instagram", status: "authorized", scopeSummary: "Official connector" }]);

    expect(readiness.find(item => item.platform === "instagram")).toMatchObject({ eligible: true, mode: "confirmation_required" });
    expect(readiness.find(item => item.platform === "facebook")).toMatchObject({ eligible: false, mode: "not_authorized" });
  });

  it("keeps mixed platform readiness parallel but never promotes confirmation-only or configured destinations to automatic publishing", () => {
    const readiness = resolveDistributionReadiness([
      { platform: "youtube", status: "authorized", credentialCiphertext: "encrypted-token" },
      { platform: "instagram", status: "authorized", scopeSummary: "Official connector" },
      { platform: "facebook", status: "authorized", credentialCiphertext: "encrypted-page-token" },
      { platform: "tiktok", status: "configured" },
    ]);

    expect(readiness).toHaveLength(4);
    expect(readiness.find(item => item.platform === "youtube")).toMatchObject({ eligible: true, mode: "automatic_api" });
    expect(readiness.find(item => item.platform === "instagram")).toMatchObject({ eligible: true, mode: "confirmation_required" });
    expect(readiness.find(item => item.platform === "facebook")).toMatchObject({ eligible: true, mode: "confirmation_required" });
    expect(readiness.find(item => item.platform === "tiktok")).toMatchObject({ eligible: false, mode: "not_authorized" });
  });
});
