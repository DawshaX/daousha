import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  upsertChannelConnection: vi.fn(),
  createChangeLogEntry: vi.fn(),
};

vi.mock("./db", () => dbMock);

const { appRouter } = await import("./routers");

describe("multi-platform connection registry", () => {
  beforeEach(() => {
    dbMock.upsertChannelConnection.mockResolvedValue({ id: 4, platform: "instagram", status: "configured" });
    dbMock.createChangeLogEntry.mockResolvedValue(undefined);
  });

  it("accepts an Instagram connection record without marking it authorized", async () => {
    const caller = appRouter.createCaller({ user: { id: 1 } } as any);
    await caller.daousha.configureConnection({ platform: "instagram", label: "XDAW NOVA Instagram", status: "configured", scopeSummary: "Awaiting official OAuth" });
    expect(dbMock.upsertChannelConnection).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 1, platform: "instagram", status: "configured" }));
  });
});
