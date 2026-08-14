import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Gauge, LockKeyhole, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function PerformanceImprovementLoop() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.daousha.performanceImprovementSuggestions.useQuery();
  const record = trpc.daousha.recordPerformanceImprovement.useMutation({
    onSuccess: result => {
      toast.success(result.created ? "سُجل اقتراح الأداء بانتظار مراجعتك." : "هذا الاقتراح مسجل بالفعل بانتظار المراجعة.");
      utils.daousha.performanceImprovementSuggestions.invalidate();
      utils.daousha.proposals.invalidate();
      utils.daousha.dashboard.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  return <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><Gauge className="h-5 w-5 text-red-400" /> اقتراحات التحسين من الأداء</CardTitle><CardDescription className="mt-2 text-zinc-500">تُقرأ اللقطات الموثقة فقط. التسجيل لا ينفذ تغييرًا ولا يبدل سياسة أو تفويضًا أو نشرًا.</CardDescription></CardHeader><CardContent className="space-y-3">{isLoading ? <p className="text-sm text-zinc-500">جارٍ قراءة لقطات الأداء…</p> : !data?.suggestions.length ? <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm leading-6 text-zinc-500">{data?.message ?? "لا توجد لقطات أداء موثقة بعد."}</div> : data.suggestions.map(suggestion => <div key={suggestion.id} className="rounded-xl border border-red-500/15 bg-red-500/[0.035] p-4"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-medium text-zinc-100"><Sparkles className="h-4 w-4 text-red-400" /> {suggestion.title}</p><p className="mt-2 text-xs leading-6 text-zinc-400">{suggestion.rationale}</p></div><Badge variant="outline" className="shrink-0 border-amber-500/25 bg-amber-500/[0.04] text-amber-200">مقترح</Badge></div>{suggestion.recorded ? <p className="mt-3 flex items-center gap-2 text-xs text-emerald-300"><LockKeyhole className="h-3.5 w-3.5" /> مسجل بانتظار مراجعة بشرية</p> : <Button className="mt-3 w-full bg-red-600 hover:bg-red-500" disabled={record.isPending} onClick={() => record.mutate({ suggestionId: suggestion.id })}>{record.isPending ? "جارٍ تسجيل الاقتراح…" : "تسجيل للمراجعة فقط"}</Button>}</div>)}</CardContent></Card>;
}
