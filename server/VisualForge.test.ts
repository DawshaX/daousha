import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("VisualForge original-scene UI", () => {
  it("uses operational projects and describes original generation with mandatory review rather than automatic publishing", async () => {
    const source = await readFile(new URL("./VisualForge.tsx", import.meta.url), "utf8");
    expect(source).toContain("operationalProjects");
    expect(source).toContain("generateVisual");
    expect(source).toContain("لا يعيد استخدام مقطع من الإنترنت");
    expect(source).toContain("لا يرسلها للنشر تلقائيًا");
    expect(source).toContain("دون شعارات أو شخصيات حقيقية أو عناصر مملوكة للغير");
    expect(source).toContain('value="broll"');
    expect(source).toContain('value="cover"');
    expect(source).toContain("outputRole");
  });
});
