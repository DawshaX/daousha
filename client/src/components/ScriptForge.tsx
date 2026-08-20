import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BookOpenText, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ScriptForge() {
  const { data: projects, isLoading } = trpc.daousha.operationalProjects.useQuery();
  const [projectId, setProjectId] = useState("");
  const generate = trpc.daousha.generateScript.useMutation({
    onSuccess: () => toast.success("تم حفظ مسودة السكربت داخل المشروع. راجعها قبل الإنتاج."),
    onError: error => toast.error(error.message),
  });
  const draft = generate.data?.draft;
  return <Card className="border-red-500/18 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><BookOpenText className="h-5 w-5 text-red-400" /> مولّد السكربت الأصلي</CardTitle><CardDescription className="mt-2 leading-6 text-zinc-500">يكتب مسودة عربية وإنجليزية من موجز مشروعك، مع ملاحظات حقوق وسلامة. لا ينشر ولا يصنع فيديو أو صوتًا تلقائيًا.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><select value={projectId} onChange={event => setProjectId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none focus:border-red-500/50"><option value="">{isLoading ? "جارٍ تحميل المشروعات…" : "اختر مشروعًا"}</option>{projects?.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select><Button disabled={!projectId || generate.isPending} onClick={() => generate.mutate({ projectId: Number(projectId) })} className="bg-red-600 hover:bg-red-500">{generate.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Sparkles className="ml-2 h-4 w-4" />}إنشاء مسودة</Button></div>{draft ? <><div className="rounded-xl border border-red-500/15 bg-red-500/[0.035] p-3 text-xs leading-6 text-zinc-400">يمثل كل نص مسارًا للمراجعة قبل التسجيل: <b className="text-zinc-200">التعليق النصي</b> و<b className="text-zinc-200">الترجمة/النص المصاحب</b>. لا يولد الاستوديو ملفًا صوتيًا ولا يرفع أي فيديو من هذه الخطوة.</div><div className="grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-white/8 bg-white/[0.02] p-4"><Badge className="bg-red-500/10 text-red-200 hover:bg-red-500/10">AR · تعليق وترجمة</Badge><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{draft.arabicScript}</p></div><div className="rounded-xl border border-white/8 bg-white/[0.02] p-4" dir="ltr"><Badge className="bg-red-500/10 text-red-200 hover:bg-red-500/10">EN · narration & subtitles</Badge><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{draft.englishScript}</p></div><div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4 text-xs leading-6 text-amber-100/75"><b>الحقوق:</b> {draft.rightsNote}</div><div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs leading-6 text-zinc-400"><b className="text-zinc-200">السلامة:</b> {draft.safetyNote}</div></div></> : null}</CardContent></Card>;
}
