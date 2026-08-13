import { describe, expect, it } from "vitest";
import { isOwnedLinkedVideo } from "./projectAssetGuard";

describe("project-video ownership guard", () => {
  it("accepts only a video whose link belongs to the exact selected project and asset", () => {
    expect(isOwnedLinkedVideo({ projectId: 4, assetId: 9, assetKind: "video", link: { projectId: 4, assetId: 9 } })).toBe(true);
    expect(isOwnedLinkedVideo({ projectId: 4, assetId: 9, assetKind: "video", link: { projectId: 4, assetId: 10 } })).toBe(false);
    expect(isOwnedLinkedVideo({ projectId: 4, assetId: 9, assetKind: "image", link: { projectId: 4, assetId: 9 } })).toBe(false);
    expect(isOwnedLinkedVideo({ projectId: 4, assetId: 9, assetKind: "video", link: null })).toBe(false);
  });
});
