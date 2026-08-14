export type PerformanceSnapshot = {
  projectId?: number | null;
  platform: string;
  contentVariant: "ar" | "en" | "both" | "none";
  views: number;
  engagements: number;
  retentionRate: number;
  capturedAt: Date | string;
};

function snapshotTime(value: Date | string) {
  return new Date(value).getTime();
}

export function summarizePerformance(snapshots: PerformanceSnapshot[]) {
  const latestByScope = new Map<string, PerformanceSnapshot>();
  for (const snapshot of [...snapshots].sort((a, b) => snapshotTime(b.capturedAt) - snapshotTime(a.capturedAt))) {
    const key = `${snapshot.platform}:${snapshot.projectId ?? "all"}`;
    if (!latestByScope.has(key)) latestByScope.set(key, snapshot);
  }
  const current = Array.from(latestByScope.values());
  const totalViews = current.reduce((total, snapshot) => total + snapshot.views, 0);
  const totalEngagements = current.reduce((total, snapshot) => total + snapshot.engagements, 0);
  const averageRetention = current.length ? current.reduce((total, snapshot) => total + snapshot.retentionRate, 0) / current.length : 0;
  return {
    current,
    totalViews,
    totalEngagements,
    engagementRate: totalViews ? (totalEngagements / totalViews) * 100 : 0,
    averageRetention,
    recent: [...snapshots].sort((a, b) => snapshotTime(a.capturedAt) - snapshotTime(b.capturedAt)).slice(-8),
  };
}

export function performanceExperimentAdvice(summary: ReturnType<typeof summarizePerformance>) {
  if (!summary.current.length) return "لا توجد لقطات أداء موثقة بعد. سجّل قراءة من حساب رسمي قبل اقتراح أي تحسين.";
  if (summary.averageRetention < 40) return "الاحتفاظ الموثق منخفض نسبيًا. اختبر تحسين الخطاف أو ترتيب الفكرة في نسخة واحدة فقط، ثم سجّل لقطة جديدة للمقارنة.";
  if (summary.engagementRate < 2) return "التفاعل الموثق محدود مقارنة بالمشاهدات. اختبر دعوة واحدة واضحة للفعل أو سؤالًا أصيلًا في نهاية نسخة واحدة، من دون وعد بنتيجة.";
  return "تُظهر اللقطات الحالية إشارات مستقرة. حافظ على الفكرة والحقوق، واختبر تغييرًا واحدًا قابلًا للقياس في كل دورة.";
}

export function breakdownCurrentPerformance(summary: ReturnType<typeof summarizePerformance>, dimension: "platform" | "contentVariant") {
  const groups = new Map<string, PerformanceSnapshot[]>();
  for (const snapshot of summary.current) {
    const key = snapshot[dimension];
    const items = groups.get(key) ?? [];
    items.push(snapshot);
    groups.set(key, items);
  }
  return Array.from(groups.entries()).map(([label, items]) => {
    const views = items.reduce((total, snapshot) => total + snapshot.views, 0);
    const engagements = items.reduce((total, snapshot) => total + snapshot.engagements, 0);
    return { label, views, engagements, engagementRate: views ? (engagements / views) * 100 : 0, averageRetention: items.reduce((total, snapshot) => total + snapshot.retentionRate, 0) / items.length };
  }).sort((a, b) => b.views - a.views);
}
