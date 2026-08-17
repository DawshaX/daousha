import { TRPCError } from "@trpc/server";

export const NOVA_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
export const NOVA_ATTACHMENT_MIME_TYPES = new Set(["text/plain", "application/pdf", "image/jpeg", "image/png", "image/webp", "audio/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"]);

export function validateNOVAAttachment(mimeType: string, base64: string) {
  if (!NOVA_ATTACHMENT_MIME_TYPES.has(mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "نوع المرفق غير مسموح." });
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > NOVA_ATTACHMENT_MAX_BYTES) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "الحد الأقصى للمرفق 4 ميغابايت." });
  return bytes;
}
export function safeNOVAAttachmentFilename(filename: string) { return filename.replace(/[^\w.\-ء-ي]/g, "_"); }
