import { summarizePerformance, type PerformanceSnapshot } from "./performanceSummary";

export type PerformanceImprovementSuggestion = {
  id: "retention_hook" | "engagement_cta" | "single_variable_experiment";
  title: string;
  rationale: string;
};

/**
 * Produces one review-only workflow recommendation from real, current performance readings.
 * It never changes a policy, connector, schedule, or publishing action.
 */
export function derivePerformanceImprovementSuggestion(snapshots: PerformanceSnapshot[]): PerformanceImprovementSuggestion | undefined {
  const summary = summarizePerformance(snapshots);
  if (!summary.current.length) return undefined;

  if (summary.averageRetention < 40) {
    return {
      id: "retention_hook",
      title: "اختبار خطاف أو ترتيب فكرة لتحسين الاحتفاظ",
      rationale: `متوسط الاحتفاظ الموثق هو ${summary.averageRetention.toFixed(1)}%. اقترح اختبار تعديل واحد على خطاف البداية أو ترتيب الفكرة في نسخة واحدة فقط، ثم تسجيل لقطة جديدة للمقارنة. لا يغير هذا الاقتراح أي نشر أو سياسة تلقائيًا.`,
    };
  }

  if (summary.engagementRate < 2) {
    return {
      id: "engagement_cta",
      title: "اختبار دعوة واحدة واضحة للفعل",
      rationale: `معدل التفاعل الموثق هو ${summary.engagementRate.toFixed(1)}%. اقترح إضافة دعوة واحدة أصيلة للفعل أو سؤال ختامي في نسخة واحدة فقط، ثم تسجيل لقطة مقارنة. لا يغير هذا الاقتراح أي نشر أو سياسة تلقائيًا.`,
    };
  }

  return {
    id: "single_variable_experiment",
    title: "اختبار متغير إنتاجي واحد قابل للقياس",
    rationale: `تظهر اللقطات الحالية احتفاظًا متوسطه ${summary.averageRetention.toFixed(1)}% وتفاعلًا ${summary.engagementRate.toFixed(1)}%. اقترح اختبار متغير إنتاجي واحد فقط، مثل ترتيب المعلومة أو بنية العنوان، مع إبقاء الحقوق والسلامة والنشر دون تغيير تلقائي.`,
  };
}
