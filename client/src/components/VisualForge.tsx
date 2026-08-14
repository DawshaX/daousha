import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VisualForge() {
  const utils = trpc.useUtils();
  const { data: projects } = trpc.daousha.operationalProjects.useQuery();
  const [projectId, setProjectId] = useState("");
  const [prompt, setPrompt] = useState("");
  const generate = trpc.daousha.generateVisual.useMutation({
    onSuccess: () => { utils.daousha.assets.invalidate(); utils.daousha.dashboard.invalidate(); toast.success("تم توليد مشهد أصلي وإرساله لبوابة المراجعة."); },
    onError: error => toast.error(error.message),
  });
  return <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><ImagePlus className="h-5 w-5 text-red-400" /> معمل المشاهد الأصلية</CardTitle><CardDescription className="mt-2 leading-6 text-zinc-500">ينتج لقطة جديدة من وصفك للمشروع، لا يعيد استخدام مقطع من الإنترنت ولا يرسلها للنشر تلقائيًا.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex flex-col gap-2 sm:flex-row"><select value={projectId} onChange={event => setProjectId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none focus:border-red-500/50"><option value="">اختر مشروعًا</option>{projects?.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select><Button disabled={!projectId || !prompt.trim() || generate.isPending} onClick={() => generate.mutate({ projectId: Number(projectId), prompt: prompt.trim() })} className="bg-red-600 hover:bg-red-500">{generate.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Sparkles className="ml-2 h-4 w-4" />}توليد المشهد</Button></div><Textarea value={prompt} onChange={event => setPrompt(event.target.value)} className="min-h-24 border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-700 focus-visible:ring-red-500/60" placeholder="صف المشهد: مكان، زاوية، حركة، مزاج، دون شعارات أو شخصيات حقيقية أو عناصر مملوكة للغير." />{generate.data?.url ? <img src={generate.data.url} alt="مشهد أصلي مولّد للمشروع" className="max-h-96 w-full rounded-xl border border-white/8 object-cover" /> : null}</CardContent></Card>;
}
