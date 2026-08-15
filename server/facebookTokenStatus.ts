export type FacebookTokenFailure = {
  httpStatus?: number;
  errorCode?: number;
  errorSubcode?: number;
};

export type FacebookTokenState = "active" | "unconfigured" | "expired_or_revoked" | "mismatch" | "unreachable" | "unknown_error";

export function classifyFacebookTokenFailure(failure: FacebookTokenFailure): FacebookTokenState {
  if (failure.errorCode === 190 && [463, 467].includes(failure.errorSubcode ?? -1)) return "expired_or_revoked";
  if (failure.httpStatus === 401 || failure.errorCode === 190) return "expired_or_revoked";
  if (failure.httpStatus === 403) return "mismatch";
  if (failure.httpStatus === undefined || failure.httpStatus >= 500) return "unreachable";
  return "unknown_error";
}

export function facebookTokenStateMessage(state: FacebookTokenState): string {
  switch (state) {
    case "unconfigured": return "رمز وصول صفحة Facebook غير مهيأ.";
    case "expired_or_revoked": return "انتهى رمز صفحة Facebook أو أُلغي. حدّث التفويض الرسمي قبل أي رفع.";
    case "mismatch": return "رمز Facebook لا يملك التفويض المطلوب لصفحة XDAW NOVA.";
    case "unreachable": return "تعذّر التحقق من Facebook مؤقتًا؛ لم يُجرَ أي رفع.";
    case "unknown_error": return "رفض Facebook التحقق من الصفحة؛ راجع حالة التفويض الرسمية.";
    case "active": return "رمز صفحة Facebook نشط.";
  }
}
