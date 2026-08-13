import { describe, expect, it } from "vitest";

function canRequestPublicUpload(input: { storedPreviewAcknowledgement: Date | null; confirmPublic: boolean }) {
  return Boolean(input.storedPreviewAcknowledgement) && input.confirmPublic;
}

describe("public publishing preview requirement", () => {
  it("requires both a final-preview acknowledgement and an explicit public confirmation", () => {
    expect(canRequestPublicUpload({ storedPreviewAcknowledgement: null, confirmPublic: true })).toBe(false);
    expect(canRequestPublicUpload({ storedPreviewAcknowledgement: new Date(), confirmPublic: false })).toBe(false);
    expect(canRequestPublicUpload({ storedPreviewAcknowledgement: new Date(), confirmPublic: true })).toBe(true);
  });
});
