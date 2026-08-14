export function describeUploadFailure(error: unknown) {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const redacted = raw
    .replace(/\b(bearer)\s+[A-Za-z0-9._~+\-/=]+/gi, "$1 [محجوب]")
    .replace(/\b(access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization)\s*[:=]\s*[^\s,;&]+/gi, "$1=[محجوب]");
  return redacted.trim().slice(0, 320) || "سبب فني غير محدد";
}
