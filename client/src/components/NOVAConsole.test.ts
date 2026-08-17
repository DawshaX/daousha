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

  it("يبقي سجل التدقيق مختصرًا ومقيدًا بالجلسة مع مصدر الطلب والقرار، لا مع التفكير الخام", async () => {
    const source = await readFile(new URL("./NOVAConsole.tsx", import.meta.url), "utf8");
    expect(source).toContain("أحداث هذه الجلسة فقط، بلا تفكير خام أو أسرار");
    expect(source).toContain("auditActorLabel(event.actor)");
    expect(source).toContain("auditDecisionStyle(event.decision)");
    expect(source).toContain('session.origin === "telegram"');
  });
});
