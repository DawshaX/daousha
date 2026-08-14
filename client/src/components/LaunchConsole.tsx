import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FolderKanban, RadioTower, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const inputClass = "h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-red-500/50";

export default function LaunchConsole() {
  const utils = trpc.useUtils();
  const [projectTitle, setProjectTitle] = useState("");
  const [projectBrief, setProjectBrief] = useState("");
  const [contentFormat, setContentFormat] = useState<"short" | "long">("short");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [assetTitle, setAssetTitle] = useState("");
  const [assetSourceUrl, setAssetSourceUrl] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const refresh = () => utils.daousha.dashboard.invalidate();
  const projectMutation = trpc.daousha.createProject.useMutation({
    onSuccess: () => { setProjectTitle(""); setProjectBrief(""); setContentFormat("short"); refresh(); toast.success("تم إنشاء مشروع جديد داخل غرفة دعوشة."); },
    onError: error => toast.error(error.message),
  });
  const sourceMutation = trpc.daousha.addSource.useMutation({
    onSuccess: () => { setSourceName(""); setSourceUrl(""); refresh(); toast.success("حُفظ المصدر كمقترح بانتظار الاعتماد."); },
    onError: error => toast.error(error.message),
  });
  const assetMutation = trpc.daousha.registerAsset.useMutation({
    onSuccess: () => { setAssetTitle(""); setAssetSourceUrl(""); setLicenseType(""); refresh(); toast.success("سُجلت المادة في بوابة الحقوق للمراجعة."); },
    onError: error => toast.error(error.message),
  });

  return <section className="grid gap-4 xl:grid-cols-3">
    <Card className="border-red-500/18 bg-zinc-950/60"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-white"><FolderKanban className="h-4 w-4 text-red-400" /> مشروع جديد</CardTitle><CardDescription className="text-xs text-zinc-600">ابدأ الفكرة وحدد هل هي Reel/Short أم فيديو طويل، دون إطلاق أي مهمة خارجية.</CardDescription></CardHeader><CardContent><form className="space-y-2" onSubmit={event => { event.preventDefault(); projectMutation.mutate({ title: projectTitle, brief: projectBrief || undefined, targetLanguage: "both", contentFormat }); }}><input value={projectTitle} onChange={event => setProjectTitle(event.target.value)} required minLength={3} placeholder="عنوان الفيديو أو الحملة" className={inputClass} /><select value={contentFormat} onChange={event => setContentFormat(event.target.value as "short" | "long")} className={inputClass}><option value="short">Reel / Short عمودي</option><option value="long">فيديو طويل أفقي</option></select><input value={projectBrief} onChange={event => setProjectBrief(event.target.value)} placeholder="موجز اختياري" className={inputClass} /><Button type="submit" disabled={projectMutation.isPending} className="w-full bg-red-600 hover:bg-red-500">{projectMutation.isPending ? "جارٍ الحفظ…" : "إنشاء المشروع"}</Button></form></CardContent></Card>
    <Card className="border-white/8 bg-zinc-950/60"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-white"><RadioTower className="h-4 w-4 text-red-400" /> مصدر رصد</CardTitle><CardDescription className="text-xs text-zinc-600">يحفظ كمقترح ولا يبدأ الرصد تلقائيًا.</CardDescription></CardHeader><CardContent><form className="space-y-2" onSubmit={event => { event.preventDefault(); sourceMutation.mutate({ name: sourceName, url: sourceUrl, sourceKind: "trend", language: "both" }); }}><input value={sourceName} onChange={event => setSourceName(event.target.value)} required minLength={2} placeholder="اسم المصدر" className={inputClass} /><input dir="ltr" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} required type="url" placeholder="https://…" className={inputClass} /><Button type="submit" disabled={sourceMutation.isPending} variant="outline" className="w-full border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08] hover:text-white">{sourceMutation.isPending ? "جارٍ الحفظ…" : "إرسال للاعتماد"}</Button></form></CardContent></Card>
    <Card className="border-white/8 bg-zinc-950/60"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-white"><ShieldCheck className="h-4 w-4 text-red-400" /> مادة مرخّصة</CardTitle><CardDescription className="text-xs text-zinc-600">تظل معلّقة حتى تتحقق الحقوق والسلامة.</CardDescription></CardHeader><CardContent><form className="space-y-2" onSubmit={event => { event.preventDefault(); assetMutation.mutate({ title: assetTitle, assetKind: "video", licenseType, sourceUrl: assetSourceUrl || undefined }); }}><input value={assetTitle} onChange={event => setAssetTitle(event.target.value)} required minLength={2} placeholder="اسم المادة" className={inputClass} /><div className="grid grid-cols-2 gap-2"><input value={licenseType} onChange={event => setLicenseType(event.target.value)} required minLength={2} placeholder="نوع الرخصة" className={inputClass} /><input dir="ltr" value={assetSourceUrl} onChange={event => setAssetSourceUrl(event.target.value)} type="url" placeholder="رابط المصدر" className={inputClass} /></div><Button type="submit" disabled={assetMutation.isPending} variant="outline" className="w-full border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08] hover:text-white">{assetMutation.isPending ? "جارٍ الحفظ…" : "إرسال لبوابة الحقوق"}</Button></form></CardContent></Card>
  </section>;
}
