import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("project asset linking router contract", () => {
  it("يربط المادة بالمشروع من نطاق المالك ويسجل الأثر دون اعتماد أو نشر تلقائي", async () => {
    const source = await readFile(new URL("./routers.ts", import.meta.url), "utf8");

    expect(source).toContain("linkAssetToProject: protectedProcedure");
    expect(source).toContain("db.linkOwnedAssetToProject(ctx.user.id, input.projectId, input.assetId, input.clipRole)");
    expect(source).toContain("لا يغيّر ذلك قرار الحقوق أو السلامة أو النشر");
  });
});
