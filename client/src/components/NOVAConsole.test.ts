import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("NOVA Console", () => {
  it("يعرض اقتراحات للأوامر الحتمية المتاحة بدل ادعاء تنفيذ غير محكوم", async () => {
    const source = await readFile(new URL("./NOVAConsole.tsx", import.meta.url), "utf8");
    expect(source).toContain("ما حالة التفويض وتجديد الرموز؟");
    expect(source).toContain("اعرض آخر التنبيهات التشغيلية");
    expect(source).toContain("اعرض الذاكرة والـPlaybooks");
    expect(source).toContain("ابحث في قاعدة المعرفة عن الحقوق");
    expect(source).not.toContain("أعطني كلمات مرور");
  });

  it("يجلب ملخص الذاكرة والـPlaybooks من إجراءات NOVA المالك-المقيدة ويؤكد حظر الأسرار", async () => {
    const source = await readFile(new URL("./NOVAConsole.tsx", import.meta.url), "utf8");
    expect(source).toContain("trpc.nova.memories.useQuery");
    expect(source).toContain("trpc.nova.playbooks.useQuery");
    expect(source).toContain("لا تحفظ كلمات مرور أو رموز دخول أو مفاتيح وصول");
    expect(source).toContain('item.status === "active"');
  });

  it("يبقي سجل التدقيق مختصرًا ومقيدًا بالجلسة وبدون أسرار أو تفكير خام", async () => {
    const source = await readFile(new URL("./NOVAConsole.tsx", import.meta.url), "utf8");
    expect(source).toContain("آخر أثر قابل للتدقيق");
    expect(source).toContain("بدون أسرار");
    expect(source).toContain("auditDecisionStyle(event.decision)");
    expect(source).toContain('session.origin === "telegram"');
  });

  it("يعرض مزودي المسودة الإرشادية عبر سجل خادمي ويحافظ على حواجز الأسرار وPerplexity API", async () => {
    const source = await readFile(new URL("./NOVAConsole.tsx", import.meta.url), "utf8");
    expect(source).toContain("trpc.nova.advisorProviders.useQuery");
    expect(source).toContain("trpc.nova.createAdvisorDraft.useMutation");
    expect(source).toContain("بدون أدوات تنفيذ أو نشر");
    expect(source).toContain("لا ترسل أسرارًا");
    expect(source).toContain("provider.id === advisorProvider");
    expect(source).toContain("يجري تحميل حالة المزود");
  });

  it("يعتمد هوية DAWSHA ويعرض وصلات الذاكرة والمراجعة والجدولة مع حواجز حقوق المحتوى", async () => {
    const source = await readFile(new URL("./NOVAConsole.tsx", import.meta.url), "utf8");
    expect(source).toContain("DAWSHA // NOVA CORE");
    expect(source).toContain("وصلات النواة");
    expect(source).toContain("الحقوق ثم السلامة ثم المعاينة");
    expect(source).toContain("تحديث لوحة NOVA كل 15 ثانية");
    expect(source).toContain("trpc.daousha.dashboard.useQuery");
    expect(source).toContain("تفويضات رسمية");
  });
});
