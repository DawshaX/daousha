export type ProjectPackageInput = { title: string; brief?: string; targetLanguage: "ar" | "en" | "both" };

export function describeTwoFormatPackage(input: ProjectPackageInput) {
  const title = input.title.trim();
  return {
    parent: { title: `${title} — الفكرة الأم`, brief: input.brief, targetLanguage: input.targetLanguage, projectKind: "package_parent" as const, orientation: "none" as const },
    variants: [
      { title: `${title} — Short / Reel`, contentFormat: "short" as const, targetLanguage: input.targetLanguage, projectKind: "package_variant" as const, orientation: "vertical" as const },
      { title: `${title} — Long Form`, contentFormat: "long" as const, targetLanguage: input.targetLanguage, projectKind: "package_variant" as const, orientation: "horizontal" as const },
    ],
  };
}
