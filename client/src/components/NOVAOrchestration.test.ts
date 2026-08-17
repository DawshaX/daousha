import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("NOVA Orchestration source catalog", () => {
  it("يعرض مصادر الأصول من نطاق المالك مع تحذير الحقوق والحالة، لا كأداة تنزيل", async () => {
    const source = await readFile(new URL("./NOVAOrchestration.tsx", import.meta.url), "utf8");

    expect(source).toContain("trpc.daousha.sources.useQuery");
    expect(source).toContain("مصادر اللقطات والبحث");
    expect(source).toContain("لا يجلب NOVA موادًا تلقائيًا");
    expect(source).toContain("لا يحذف علامة مائية");
    expect(source).toContain('source.sourceKind === "asset" || source.sourceKind === "audio"');
    expect(source).toContain("بحث مرجعي مرخّص");
    expect(source).toContain("https://www.pexels.com/search/videos/");
    expect(source).toContain('target="_blank"');
    expect(source).toContain("لا يحمل NOVA أي ملف");
    expect(source).toContain("مرجع Pinterest بصري");
    expect(source).toContain("pinterestUrlIsValid");
    expect(source).toContain('sourceKind: "reference"');
    expect(source).toContain("لا يمنح ترخيصًا لتنزيل Pin أو استخدامه أو إعادة توزيعه");
    expect(source).not.toContain("yt-dlp");
  });
});
