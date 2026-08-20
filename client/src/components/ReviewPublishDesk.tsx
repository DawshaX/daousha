import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { canConfirmPublicPublish, publicPublishConfirmationPhrase } from "@/lib/publishReviewFlow";
import { CheckCheck, Play, Send, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ReviewPublishDesk() {
  const utils = trpc.useUtils();
  const { data: projectVideoAssets } = trpc.daousha.projectVideoAssets.useQuery();
  const [selectedKey, setSelectedKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("XDAW NOVA, original content, معرفة, knowledge");
  const [publicReady, setPublicReady] = useState(false);
  const [privateRequired, setPrivateRequired] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const selectedPair = projectVideoAssets?.find(item => `${item.project.id}:${item.asset.id}` === selectedKey) ?? projectVideoAssets?.find(item => item.project.status !== "published") ?? projectVideoAssets?.[0];
  const project = selectedPair?.project;
  const videoAsset = selectedPair?.asset;

  useEffect(() => {
    if (!project || !videoAsset) return;
    setTitle(project.title);
    setDescription([project.scriptArabic, project.scriptEnglish].filter(Boolean).join("\n\n"));
    setPublicReady(false);
    setPrivateRequired(false);
    setConfirmation("");
    setSelectedKey(`${project.id}:${videoAsset.id}`);
  }, [project?.id, videoAsset?.id]);

  const preflight = trpc.daousha.preflightVettedYouTubeVideo.useMutation({
    onSuccess: result => {
      if (!result.decision.allowed) {
        toast.error(result.decision.reason);
        return;
      }
      if (result.decision.visibility === "private") {
        setPrivateRequired(true);
        setPublicReady(false);
        toast("تتطلب السياسة نسخة خاصة أولًا؛ لم يتم رفع أي ملف.");
        return;
      }
      setPrivateRequired(false);
      setPublicReady(true);
      toast.success("اجتاز الفيديو الفحص. اكتب عبارة التأكيد لتفعيل النشر العام.");
    },
    onError: error => toast.error(error.message),
  });

  const upload = trpc.daousha.uploadVettedYouTubeVideo.useMutation({
    onSuccess: result => {
      if (result.published) {
        toast.success(result.visibility === "public" ? "تم نشر الفيديو العام وتسجيل الرابط." : "تم رفع النسخة الخاصة بنجاح.");
        utils.daousha.projectVideoAssets.invalidate();
        utils.daousha.publishingRuns.invalidate();
      } else {
        toast.error(result.reason ?? "لم يكتمل الرفع.");
      }
    },
    onError: error => toast.error(error.message),
  });

  const data = project && videoAsset ? { projectId: project.id, assetId: videoAsset.id, title: title.trim(), description: description.trim(), tags: tagsText.split(",").map(tag => tag.trim()).filter(Boolean) } : null;
  const previewSaved = Boolean(project?.previewAcknowledgedAt);
  const baseDisabled = !data || !previewSaved || !data.title || data.description.length < 10;

  return (
    <Card className="border-red-500/20 bg-[linear-gradient(145deg,rgba(69,10,10,.28),rgba(9,9,11,.9))]">
      <CardHeader className="border-b border-white/8 pb-4">
        <CardTitle className="flex items-center gap-2 text-white"><Send className="h-5 w-5 text-red-400" /> مكتب النشر بعد المراجعة</CardTitle>
        <CardDescription className="mt-2 leading-6 text-zinc-500">يفحص هذا المكتب الحواجز دون رفع أولًا. لا يظهر التأكيد العام إلا بعد وجود إقرار معاينة محفوظ للمشروع نفسه.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {!project || !videoAsset ? <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-500">أضف مشروعًا غير منشور وملف فيديو معتمدًا لتفعيل مكتب النشر.</div> : <>
          <label className="block text-xs text-zinc-400">المشروع ونسخة الفيديو<select value={`${project.id}:${videoAsset.id}`} onChange={event => setSelectedKey(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-red-500/60">{projectVideoAssets?.map(item => <option key={`${item.project.id}:${item.asset.id}`} value={`${item.project.id}:${item.asset.id}`}>{item.project.title} — {item.asset.title}</option>)}</select></label>
          <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-[11px] text-zinc-500">إقرار المعاينة</p><p className="mt-1 text-sm text-zinc-100">{previewSaved ? "محفوظ على الخادم" : "مطلوب من بوابة المراجعة"}</p></div><div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-[11px] text-zinc-500">حالة الفحص</p><p className="mt-1 text-sm text-zinc-100">{publicReady ? "جاهز لتأكيد عام" : privateRequired ? "يتطلب نسخة خاصة" : "لم يُفحص بعد"}</p></div></div>
          <Input value={title} onChange={event => setTitle(event.target.value)} className="border-white/10 bg-black/30 text-zinc-100" placeholder="عنوان الفيديو" />
          <Textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-28 border-white/10 bg-black/30 text-zinc-100" placeholder="وصف الفيديو" />
          <Input value={tagsText} onChange={event => setTagsText(event.target.value)} className="border-white/10 bg-black/30 text-zinc-100" placeholder="وسوم مفصولة بفاصلة" />
          <div className="flex flex-wrap gap-3"><Button className="bg-red-600 hover:bg-red-500" disabled={baseDisabled || preflight.isPending} onClick={() => data && preflight.mutate({ projectId: data.projectId, assetId: data.assetId })}><ShieldAlert className="ml-2 h-4 w-4" /> {preflight.isPending ? "جارٍ الفحص…" : "فحص الحواجز"}</Button>{privateRequired ? <Button variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08] hover:text-white" disabled={baseDisabled || upload.isPending} onClick={() => data && upload.mutate({ ...data, confirmPublic: false })}><Play className="ml-2 h-4 w-4" /> رفع نسخة خاصة</Button> : null}</div>
          {publicReady ? <div className="space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4"><p className="text-sm leading-6 text-amber-100">اكتب العبارة التالية كما هي لتأكيد نشر هذا الفيديو علنًا: <b>{publicPublishConfirmationPhrase}</b></p><Input value={confirmation} onChange={event => setConfirmation(event.target.value)} className="border-amber-500/20 bg-black/30 text-zinc-100" placeholder={publicPublishConfirmationPhrase} /><Button className="w-full bg-red-600 hover:bg-red-500" disabled={!canConfirmPublicPublish({ previewAcknowledged: previewSaved, preflightVisibility: publicReady ? "public" : null, confirmation }) || upload.isPending} onClick={() => data && upload.mutate({ ...data, confirmPublic: true })}><CheckCheck className="ml-2 h-4 w-4" /> {upload.isPending ? "جارٍ النشر…" : "تأكيد النشر العام"}</Button></div> : null}
          <Badge className={previewSaved ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/10" : "border border-amber-500/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/10"}>{previewSaved ? "المعاينة شرط محفوظ" : "احفظ إقرار المعاينة أولًا"}</Badge>
        </>}
      </CardContent>
    </Card>
  );
}
