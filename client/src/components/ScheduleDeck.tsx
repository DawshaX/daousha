import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ScheduleDeck() {
  const utils = trpc.useUtils();
  const { data: projects } = trpc.daousha.projects.useQuery();
  const { data: schedules } = trpc.daousha.schedules.useQuery();
  const [projectId, setProjectId] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [cron, setCron] = useState("0 0 9 * * *");
  const create = trpc.daousha.createScheduleDraft.useMutation({ onSuccess: () => { utils.daousha.schedules.invalidate(); utils.daousha.dashboard.invalidate(); toast.success("حُفظت مسودة الجدولة. لا يوجد نشر مفعّل بعد."); }, onError: error => toast.error(error.message) });
  return <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><CalendarClock className="h-5 w-5 text-red-400" /> مسودات الجدولة</CardTitle><CardDescription className="mt-2 leading-6 text-zinc-500">اكتب الوقت بتنسيق UTC من ستة حقول. لا تُنشّط المسودة أي مهمة ولا تنشر محتوى قبل النشر والربط الرسمي والموافقة البشرية.</CardDescription></CardHeader><CardContent className="space-y-4"><form className="grid gap-2 md:grid-cols-4" onSubmit={event => { event.preventDefault(); create.mutate({ projectId: Number(projectId), platform, cronExpression: cron, timeZone: "UTC" }); }}><select required value={projectId} onChange={event => setProjectId(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none"><option value="">اختر مشروعًا</option>{projects?.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select><input value={platform} onChange={event => setPlatform(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none" /><input dir="ltr" value={cron} onChange={event => setCron(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 font-mono text-sm text-zinc-100 outline-none" /><Button type="submit" disabled={!projectId || create.isPending} className="bg-red-600 hover:bg-red-500"><Plus className="ml-2 h-4 w-4" />حفظ مسودة</Button></form><div className="space-y-2">{schedules?.length === 0 ? <p className="rounded-lg border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-600">لا توجد مسودات جدولة بعد.</p> : schedules?.map(schedule => <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3"><div><p className="text-sm text-zinc-200">{schedule.platform}</p><p dir="ltr" className="mt-1 font-mono text-[10px] text-zinc-600">{schedule.cronExpression} · {schedule.timeZone}</p></div><Badge variant="outline" className="border-amber-500/20 text-amber-200">مسودة غير مفعلة</Badge></div>)}</div></CardContent></Card>;
}
