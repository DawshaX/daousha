import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = { createTwoFormatProjectPackage: vi.fn(), createChangeLogEntry: vi.fn() };
vi.mock("./db", () => dbMock);
const { appRouter } = await import("./routers");

describe("two-format package router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createTwoFormatProjectPackage.mockResolvedValue({ parent: { id: 10, title: "فكرة أم" }, variants: [{ id: 11, contentFormat: "short" }, { id: 12, contentFormat: "long" }] });
    dbMock.createChangeLogEntry.mockResolvedValue(undefined);
  });

  it("creates a linked original short and long package without scheduling or publishing", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 }, req: { headers: {} } } as any);
    const bundle = await caller.daousha.createTwoFormatProjectPackage({ title: "نور ومعرفة", brief: "فكرة أصلية", targetLanguage: "both" });
    expect(dbMock.createTwoFormatProjectPackage).toHaveBeenCalledWith({ ownerId: 1, title: "نور ومعرفة", brief: "فكرة أصلية", targetLanguage: "both" });
    expect(bundle.variants.map((item: { contentFormat: string }) => item.contentFormat)).toEqual(["short", "long"]);
    expect(dbMock.createChangeLogEntry).toHaveBeenCalledWith(expect.objectContaining({ category: "workflow" }));
  });
});
