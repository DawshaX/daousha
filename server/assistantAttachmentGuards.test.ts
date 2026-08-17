import { describe, expect, it } from "vitest";
import { NOVA_ATTACHMENT_MAX_BYTES, safeNOVAAttachmentFilename, validateNOVAAttachment } from "./assistantAttachmentGuards";

describe("حواجز مرفقات NOVA", () => {
  it("تقبل ملفًا نصيًا صغيرًا وتنقي اسمه قبل التخزين", () => { expect(validateNOVAAttachment("text/plain", Buffer.from("hello").toString("base64")).toString()).toBe("hello"); expect(safeNOVAAttachmentFilename("مخطط 1?.txt")).toBe("مخطط_1_.txt"); });
  it("ترفض نوعًا غير مسموح أو حمولة تتجاوز الحد", () => { expect(() => validateNOVAAttachment("application/zip", "eA==")).toThrow("نوع المرفق غير مسموح"); expect(() => validateNOVAAttachment("text/plain", Buffer.alloc(NOVA_ATTACHMENT_MAX_BYTES + 1).toString("base64"))).toThrow("الحد الأقصى"); });
});
