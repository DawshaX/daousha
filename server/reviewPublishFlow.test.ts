import { describe, expect, it } from "vitest";
import { canConfirmPublicPublish, publicPublishConfirmationPhrase } from "../client/src/lib/publishReviewFlow";

describe("review publish desk flow", () => {
  it("does not enable public confirmation until preview, preflight, and explicit phrase all pass", () => {
    expect(canConfirmPublicPublish({ previewAcknowledged: false, preflightVisibility: "public", confirmation: publicPublishConfirmationPhrase })).toBe(false);
    expect(canConfirmPublicPublish({ previewAcknowledged: true, preflightVisibility: "private", confirmation: publicPublishConfirmationPhrase })).toBe(false);
    expect(canConfirmPublicPublish({ previewAcknowledged: true, preflightVisibility: "public", confirmation: "موافق" })).toBe(false);
    expect(canConfirmPublicPublish({ previewAcknowledged: true, preflightVisibility: "public", confirmation: publicPublishConfirmationPhrase })).toBe(true);
  });
});
