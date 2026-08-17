export const DAWSHA_PIPELINE_STAGES = ["trend_scan", "script", "translation", "rights_check", "safety_check", "render", "publish"] as const;

export type DawshaPipelineTask = {
  taskKind: typeof DAWSHA_PIPELINE_STAGES[number];
  status: "queued" | "completed" | "blocked";
  detail: string;
};

export function buildDawshaPipelineTasks(input: { trendSourceUrl?: string; targetLanguage: "ar" | "en" | "both" }): DawshaPipelineTask[] {
  return [
    { taskKind: "trend_scan", status: input.trendSourceUrl ? "completed" : "queued", detail: input.trendSourceUrl ? `سُجل مرجع الترند: ${input.trendSourceUrl}` : "بانتظار إشارة ترند أو مرجع موثق." },
    { taskKind: "script", status: "queued", detail: "صياغة مسودة سكربت أصلي مطابق للموجز." },
    { taskKind: "translation", status: input.targetLanguage === "both" ? "queued" : "completed", detail: input.targetLanguage === "both" ? "تحضير النسخة الثانية بعد اعتماد المسودة الأساسية." : "لا تحتاج الحزمة ترجمة ثانية." },
    { taskKind: "rights_check", status: "blocked", detail: "يتطلب أصل فيديو أو مادة مرخصة مع رابط المصدر والترخيص." },
    { taskKind: "safety_check", status: "blocked", detail: "يفتح تلقائيًا بعد ربط أصل واضح الحقوق بالمشروع." },
    { taskKind: "render", status: "blocked", detail: "يتطلب مشاهد أصلية أو مرخصة وصوتًا أو أصل فيديو متاحًا." },
    { taskKind: "publish", status: "blocked", detail: "يفتح بعد الحقوق والسلامة وCanary وصحة القناة." },
  ];
}
