import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Loader2, Orbit, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TrendRadar() {
  const utils = trpc.useUtils();
  const [geo, setGeo] = useState<"EG" | "US">("EG");
  const { data, isLoading, error, refetch, isFetching } = trpc.daousha.trendSignals.useQuery({ geo });
  const createProject = trpc.daousha.createProject.useMutation({
    onSuccess: project => { utils.daousha.projects.invalidate(); utils.daousha.dashboard.invalidate(); toast.success(`أضيفت «${project.title}» كمشروع داخلي بانتظار الموجز والمراجعة.`); },
    onError: issue => toast.error(issue.message),
  });
  const createFromSignal = (signal: { title: string; sourceName: string; sourceUrl: string }) => {
    createProject.mutate({ title: signal.title, brief: `إشارة مرجعية من ${signal.sourceName}: ${signal.sourceUrl}\nتحتاج صياغة زاوية أصلية، والتحقق من السلامة والحقوق قبل الإنتاج.`, targetLanguage: "both", contentFormat: "short" });
  };
  const priorityLabel = { high: "أولوية عالية للمراجعة", medium: "أولوية متوسطة", review: "تحتاج تقديرًا" } as const;

  return <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
    <Card className="border-red-500/18 bg-zinc-950/60"><CardHeader className="flex-row items-start justify-between gap-4 space-y-0"><div><CardTitle className="flex items-center gap-2 text-white"><Orbit className="h-5 w-5 text-red-400" /> رادار الإشارات الحية</CardTitle><CardDescription className="mt-2 leading-6 text-zinc-500">قراءة فقط من Google Trends مع تخزين مؤقت قصير. الإشارة لا تعني توصية أو ضمانًا، ولا تتحول إلى نشر تلقائي.</CardDescription></div><div className="flex items-center gap-2"><select value={geo} onChange={event => setGeo(event.target.value as "EG" | "US")} className="h-8 rounded-md border border-white/10 bg-black/30 px-2 text-xs text-zinc-200"><option value="EG">مصر · عربي</option><option value="US">الولايات المتحدة · English</option></select><Button size="icon" variant="outline" disabled={isFetching} onClick={() => refetch()} className="border-white/10 bg-white/[0.03] text-zinc-300"><RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></Button></div></CardHeader><CardContent className="space-y-2">{isLoading ? <div className="flex min-h-40 items-center justify-center text-sm text-zinc-500"><Loader2 className="ml-2 h-4 w-4 animate-spin" />جارٍ قراءة الإشارات…</div> : null}{error ? <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 text-sm leading-6 text-amber-100">{error.message}</p> : null}{data?.signals.map(signal => <div key={`${signal.title}-${signal.publishedAt}`} className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-zinc-200">{signal.title}</p><p className="mt-1 text-[11px] text-zinc-600">{signal.publishedAt ? new Date(signal.publishedAt).toLocaleString("ar-EG") : "وقت غير متاح"}</p></div><div className="flex shrink-0 flex-col items-end gap-1"><Badge variant="outline" className="border-red-500/20 bg-red-500/[0.04] text-[10px] text-red-200">{signal.approximateTraffic ? `تقريبي: ${signal.approximateTraffic}` : "إشارة صاعدة"}</Badge><span className="text-[10px] text-zinc-500">{priorityLabel[signal.priority]}</span></div></div><div className="mt-3 flex flex-wrap items-center gap-2"><a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-300">{signal.sourceName}<ArrowUpRight className="h-3.5 w-3.5" /></a><Button size="sm" variant="outline" disabled={createProject.isPending} onClick={() => createFromSignal(signal)} className="mr-auto border-white/10 bg-white/[0.03] text-xs text-zinc-200"><Plus className="ml-1 h-3.5 w-3.5" />تحويل إلى مشروع</Button></div></div>)}</CardContent></Card>
    <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><ShieldCheck className="h-5 w-5 text-red-400" /> كيف تُقرأ الإشارة؟</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-7 text-zinc-400"><p>يُعرض المصدر والوقت وحجم الاهتمام التقريبي حين يوفره الموجز. هذه قراءة للبحث، وليست تصريحًا لاستخدام مقاطع أو صور أو موسيقى مرتبطة بالموضوع.</p><p>زر «تحويل إلى مشروع» ينشئ بطاقة داخلية فقط. يجب كتابة زاوية أصلية ثم اجتياز الحقوق والسلامة والمراجعة قبل أي إنتاج أو توزيع.</p><a href="https://developers.google.com/search/docs/monitor-debug/trends-start" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200">إرشادات Google Trends <ArrowUpRight className="h-3.5 w-3.5" /></a></CardContent></Card>
  </section>;
}
