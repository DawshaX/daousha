import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Lightbulb, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AnalyticsBridge() {
  const utils = trpc.useUtils();
  const { data: projects } = trpc.daousha.projects.useQuery();
  const { data: dashboard } = trpc.daousha.dashboard.useQuery();
  const [projectId, setProjectId] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [views, setViews] = useState("");
  const [engagements, setEngagements] = useState("");
  const [retention, setRetention] = useState("");
  const record = trpc.daousha.recordAnalytics.useMutation({ onSuccess: () => { setViews(""); setEngagements(""); setRetention(""); utils.daousha.dashboard.invalidate(); toast.success("تم حفظ لقطة التحليل الموثقة."); }, onError: error => toast.error(error.message) });
  const snapshotCount = dashboard?.snapshots.length ?? 0;
  return <section className="grid gap-5 xl:grid-cols-[1fr_.9fr]"><Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><BarChart3 className="h-5 w-5 text-red-400" /> سجل أداء موثق</CardTitle><CardDescription className="mt-2 text-zinc-500">أدخل أرقامًا من حساب رسمي أو من تقرير موثوق؛ لا تُنشئ المنصة مشاهدات أو أرقامًا من تلقاء نفسها.</CardDescription></CardHeader><CardContent><form className="grid gap-2 md:grid-cols-2" onSubmit={event => { event.preventDefault(); record.mutate({ projectId: projectId ? Number(projectId) : undefined, platform, views: Number(views), engagements: Number(engagements), retentionRate: Number(retention) }); }}><select value={projectId} onChange={event => setProjectId(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none"><option value="">بدون مشروع محدد</option>{projects?.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select><input value={platform} onChange={event => setPlatform(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none" /><input value={views} onChange={event => setViews(event.target.value)} required min="0" type="number" placeholder="المشاهدات" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none" /><input value={engagements} onChange={event => setEngagements(event.target.value)} required min="0" type="number" placeholder="التفاعلات" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none" /><input value={retention} onChange={event => setRetention(event.target.value)} required min="0" max="100" type="number" placeholder="الاحتفاظ %" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none" /><Button type="submit" disabled={record.isPending} className="bg-red-600 hover:bg-red-500"><Plus className="ml-2 h-4 w-4" />حفظ اللقطة</Button></form></CardContent></Card><Card className="border-red-500/18 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><Lightbulb className="h-5 w-5 text-red-400" /> توصية تشغيل</CardTitle></CardHeader><CardContent><p className="text-sm leading-7 text-zinc-400">{snapshotCount === 0 ? "لا توجد بيانات أداء بعد. اربط القناة رسميًا أو سجل أول لقطة موثقة قبل اتخاذ قرار تحسين." : "قارن نسخ الفيديو وموضوعاته من لقطات الأداء، ثم اختبر تغييرًا واحدًا في كل مرة. هذه توصية لتحسين الاختبار وليست ضمانًا للمشاهدات أو الدخل."}</p></CardContent></Card></section>;
}
