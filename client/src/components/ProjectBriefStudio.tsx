import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { describeProductionPackage } from "@shared/daousha";
import { Clapperboard, FileText, FolderPlus, Globe2, Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function ProjectBriefStudio() {
  const utils = trpc.useUtils();
  const { data: projects } = trpc.daousha.projects.useQuery();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<"ar" | "en" | "both">("both");
  const [contentFormat, setContentFormat] = useState<"short" | "long">("short");
  const [lastCreatedTitle, setLastCreatedTitle] = useState<string | null>(null);
  const packagePlan = useMemo(() => describeProductionPackage(targetLanguage, contentFormat), [targetLanguage, contentFormat]);
  const createProject = trpc.daousha.createProject.useMutation({
    onSuccess: project => {
      setLastCreatedTitle(project.title);
      setTitle("");
      setBrief("");
      utils.daousha.projects.invalidate();
      utils.daousha.dashboard.invalidate();
      toast.success("تم إنشاء المشروع. اختره من مولّد السكربت أسفل الاستوديو للبدء.");
    },
    onError: error => toast.error(error.message),
  });
  const createPackage = trpc.daousha.createTwoFormatProjectPackage.useMutation({ onSuccess: bundle => { setLastCreatedTitle(`${bundle.parent.title} + نسختين`); setTitle(""); setBrief(""); utils.daousha.projects.invalidate(); utils.daousha.dashboard.invalidate(); toast.success("تم إنشاء فكرة أم ونسختي Short وLong للمراجعة."); }, onError: error => toast.error(error.message) });

  const recentProjects = projects?.slice(0, 4) ?? [];
  const submit = () => {
    if (title.trim().length < 3) { toast.error("اكتب عنوانًا واضحًا من ثلاثة أحرف على الأقل."); return; }
    createProject.mutate({ title: title.trim(), brief: brief.trim() || undefined, targetLanguage, contentFormat });
  };
  const submitPackage = () => { if (title.trim().length < 3) { toast.error("اكتب عنوانًا واضحًا من ثلاثة أحرف على الأقل."); return; } createPackage.mutate({ title: title.trim(), brief: brief.trim() || undefined, targetLanguage }); };

  return <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
    <Card className="border-red-500/18 bg-zinc-950/60">
      <CardHeader><CardTitle className="flex items-center gap-2 text-white"><FolderPlus className="h-5 w-5 text-red-400" /> موجز مشروع جديد</CardTitle><CardDescription className="mt-2 leading-6 text-zinc-500">أنشئ مشروعًا حقيقيًا أولًا، ثم ينتج الاستوديو مسودة سكربت ومشاهد قابلة للمراجعة. لا ينشر هذا النموذج أي محتوى.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Input value={title} onChange={event => setTitle(event.target.value)} maxLength={255} placeholder="عنوان الفيديو أو السؤال المركزي" className="border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-700" />
        <Textarea value={brief} onChange={event => setBrief(event.target.value)} maxLength={12000} className="min-h-32 border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-700" placeholder="اكتب الرسالة، الجمهور المقصود، والزاوية الأصلية. اذكر ما يجب تجنبه أو ما يحتاج توثيقًا." />
        <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-xs text-zinc-500"><span>اللغات</span><select value={targetLanguage} onChange={event => setTargetLanguage(event.target.value as "ar" | "en" | "both")} className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none"><option value="both">العربية والإنجليزية</option><option value="ar">العربية</option><option value="en">الإنجليزية</option></select></label><label className="space-y-2 text-xs text-zinc-500"><span>صيغة الحزمة</span><select value={contentFormat} onChange={event => setContentFormat(event.target.value as "short" | "long")} className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-200 outline-none"><option value="short">Reel / Short</option><option value="long">فيديو طويل</option></select></label></div>
        <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-xs leading-6 text-zinc-400"><Globe2 className="ml-2 inline h-4 w-4 text-red-400" />{packagePlan.languageLabel} · {packagePlan.formatLabel}<span className="mt-1 block text-amber-100/70"><ShieldCheck className="ml-1 inline h-3.5 w-3.5" />المشروع يتوقف عند بوابة الحقوق والسلامة والمراجعة البشرية.</span></div>
        <div className="grid gap-2 sm:grid-cols-2"><Button disabled={createProject.isPending || title.trim().length < 3} onClick={submit} className="bg-red-600 hover:bg-red-500">{createProject.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FolderPlus className="ml-2 h-4 w-4" />}إنشاء المشروع</Button><Button disabled={createPackage.isPending || title.trim().length < 3} onClick={submitPackage} variant="outline" className="border-red-500/30 bg-red-500/[0.06] text-red-100 hover:bg-red-500/15 hover:text-white">{createPackage.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Clapperboard className="ml-2 h-4 w-4" />}حزمة Short + Long</Button></div>
        {lastCreatedTitle ? <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-emerald-100">تم إنشاء «{lastCreatedTitle}». الخطوة التالية: اختره في مولّد السكربت أدناه.</p> : null}
      </CardContent>
    </Card>
      <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><Clapperboard className="h-5 w-5 text-red-400" /> مشاريع الاستوديو</CardTitle><CardDescription className="mt-2 text-zinc-500">الفكرة الأم حاوية فقط؛ الإنتاج والمراجعة والنشر يقتصرون على النسخ التابعة.</CardDescription></CardHeader><CardContent className="space-y-3">{recentProjects.length ? recentProjects.map(project => <div key={project.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-200">{project.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">{project.brief || "بانتظار موجز تفصيلي."}</p></div><Badge variant="outline" className="shrink-0 border-white/10 text-[10px] text-zinc-400">{project.projectKind === "package_parent" ? "فكرة أم" : project.status}</Badge></div><div className="mt-3 flex gap-2 text-[10px] text-zinc-500"><span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{project.targetLanguage.toUpperCase()}</span><span>·</span><span>{project.projectKind === "package_parent" ? "حاوية محايدة" : project.orientation === "vertical" ? "Short / Vertical" : project.orientation === "horizontal" ? "Long / Horizontal" : project.contentFormat === "short" ? "Short" : "Long"}</span>{project.parentProjectId ? <><span>·</span><span className="text-red-200/70">تابع للفكرة #{project.parentProjectId}</span></> : null}</div></div>) : <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-600">أنشئ أول مشروع من الموجز لتظهر حزمته هنا.</div>}</CardContent></Card>
  </section>;
}
