import { describe, expect, it } from "vitest";
import { hasApprovedSafeVideo, isAllowedWorkflowTransition } from "./workflowGuards";

describe("workflow guards", () => {
  it("permits forward progress and explicit rework but rejects skipped review", () => {
    expect(isAllowedWorkflowTransition("idea", "script")).toBe(true);
    expect(isAllowedWorkflowTransition("review", "production")).toBe(true);
    expect(isAllowedWorkflowTransition("production", "approved")).toBe(false);
    expect(isAllowedWorkflowTransition("published", "production")).toBe(false);
  });

  it("requires a linked video with both rights and safety approval", () => {
    expect(hasApprovedSafeVideo([{ asset: { assetKind: "video", licenseStatus: "approved", safetyStatus: "clear" } }])).toBe(true);
    expect(hasApprovedSafeVideo([{ asset: { assetKind: "video", licenseStatus: "pending", safetyStatus: "clear" } }])).toBe(false);
    expect(hasApprovedSafeVideo([{ asset: { assetKind: "image", licenseStatus: "approved", safetyStatus: "clear" } }])).toBe(false);
  });
});
