import { describe, expect, it } from "vitest";
import { filterOperationalProjectVideoAssets, isOperationalProject } from "./packageOperationalGuard";

describe("package operational guard", () => {
  it("excludes only the package parent from operational queues", () => {
    expect(isOperationalProject({ projectKind: "package_parent" })).toBe(false);
    expect(isOperationalProject({ projectKind: "package_variant" })).toBe(true);
    expect(isOperationalProject({ projectKind: "standalone" })).toBe(true);
  });

  it("removes package parents from project-video lists used by daily targets and publishing", () => {
    const items = filterOperationalProjectVideoAssets([
      { project: { id: 1, projectKind: "package_parent" as const }, assetId: 1 },
      { project: { id: 2, projectKind: "package_variant" as const }, assetId: 2 },
      { project: { id: 3, projectKind: "standalone" as const }, assetId: 3 },
    ]);
    expect(items.map(item => item.project.id)).toEqual([2, 3]);
  });
});
