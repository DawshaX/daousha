type AssetIntake = {
  title: string;
  assetKind: string;
  licenseType: string;
  sourceUrl?: string | null;
  licenseUrl?: string | null;
  attribution?: string | null;
};

const unverifiableLicense = /(unknown|unlicensed|all rights reserved|غير معروف|مجهول|غير مرخّص|غير مرخص)/i;
const originalLicense = /(original|generated|daousha|أصلي|مولّد|مولد)/i;
const sensitiveSignal = /(gore|graphic|blood|violence|weapon|suicide|قتل|دم|عنف|سلاح|انتحار)/i;

export function assessAssetIntake(asset: AssetIntake) {
  const reasons: string[] = [];
  const hasOriginalDeclaration = originalLicense.test(asset.licenseType) || originalLicense.test(asset.attribution ?? "");
  const hasTraceableRightsEvidence = Boolean(asset.sourceUrl || asset.licenseUrl || asset.attribution?.trim() || hasOriginalDeclaration);
  const rightsUnclear = unverifiableLicense.test(asset.licenseType) || !hasTraceableRightsEvidence;
  const needsSensitiveReview = sensitiveSignal.test(`${asset.title} ${asset.licenseType}`);

  if (rightsUnclear) reasons.push("مصدر أو ترخيص غير قابل للتحقق؛ جُمّدت الحقوق إلى أن يراجعها شخص مخوّل.");
  else reasons.push("تتطلب حقوق الاستخدام اعتمادًا بشريًا قبل دخول الإنتاج.");
  if (needsSensitiveReview) reasons.push("احتوى الوصف على إشارة حساسة؛ يلزم قرار سلامة بشري صريح.");
  else reasons.push("تظل السلامة قيد المراجعة إلى أن يُفحص المحتوى الفعلي.");

  return {
    licenseStatus: rightsUnclear ? "held" as const : "pending" as const,
    safetyStatus: "review" as const,
    reviewNotes: `بوابة الحقوق والسلامة: ${reasons.join(" ")}`,
  };
}
