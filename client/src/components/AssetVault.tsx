import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Copy, ExternalLink, FileVideo, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function assetKindFromType(type: string) {
  if (type.startsWith("video/")) return "video" as const;
  if (type.startsWith("audio/")) return "audio" as const;
  if (type.startsWith("image/")) return "image" as const;
  return "other" as const;
}

export default function AssetVault() {
  const utils = trpc.useUtils();
  const { data: assets, isLoading } = trpc.daousha.assets.useQuery();
  const [file, setFile] = useState<File | null>(null);
  const [licenseType, setLicenseType] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [attribution, setAttribution] = useState("");
  const upload = trpc.daousha.uploadAsset.useMutation({
    onSuccess: () => { setFile(null); setLicenseType(""); setSourceUrl(""); setAttribution(""); utils.daousha.assets.invalidate(); utils.daousha.dashboard.invalidate(); toast.success("حُفظت المادة في التخزين ووضعت في بوابة الحقوق."); },
    onError: error => toast.error(error.message),
  });

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) { toast.error("الحد الأولي للرفع هو 10 ميغابايت للمادة الواحدة."); event.target.value = ""; return; }
    setFile(picked);
  };

  const submit = async () => {
    if (!file || !licenseType.trim()) { toast.error("اختر مادة وأدخل نوع الترخيص أولًا."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("تعذر قراءة الملف")); reader.readAsDataURL(file); });
    const base64 = dataUrl.split(",")[1];
    if (!base64) { toast.error("تعذر تجهيز الملف للرفع."); return; }
    upload.mutate({ title: file.name, fileName: file.name, contentType: file.type || "application/octet-stream", base64, assetKind: assetKindFromType(file.type), licenseType: licenseType.trim(), sourceUrl: sourceUrl.trim() || undefined, attribution: attribution.trim() || undefined });
  };

  return <div className="space-y-5">
    <div className="rounded-xl border border-dashed border-red-500/28 bg-red-500/[0.03] p-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-zinc-100">أضف مادة إلى الخزنة</p><p className="mt-1 text-xs leading-5 text-zinc-600">يُرفع الملف إلى تخزين آمن، لكنه يبقى معلقًا إلى أن يعتمد الترخيص والسلامة. الحد الأولي: 10 ميغابايت.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/[0.06]"><UploadCloud className="h-4 w-4 text-red-400" /> اختيار ملف<input type="file" className="hidden" accept="video/*,audio/*,image/*" onChange={selectFile} /></label></div>
      {file ? <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"><p className="truncate rounded-lg border border-white/8 bg-black/20 px-3 py-2.5 text-xs text-zinc-300" dir="ltr">{file.name}</p><input value={licenseType} onChange={event => setLicenseType(event.target.value)} required minLength={2} placeholder="نوع الترخيص (مطلوب)" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-red-500/50" /><input value={attribution} onChange={event => setAttribution(event.target.value)} placeholder="نسبة المصدر أو صاحب المادة" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-red-500/50" /><input dir="ltr" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} type="url" placeholder="رابط المصدر (اختياري)" className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-red-500/50" /><Button disabled={upload.isPending} onClick={submit} className="bg-red-600 hover:bg-red-500">{upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "رفع للمراجعة"}</Button></div> : null}
    </div>
    <div className="space-y-2">
      {isLoading ? <p className="py-5 text-center text-xs text-zinc-600">جارٍ تحميل المكتبة…</p> : null}
      {!isLoading && assets?.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-white/8 bg-black/20 text-center"><ImagePlus className="h-9 w-9 text-zinc-700" /><p className="mt-3 text-sm font-semibold text-zinc-300">لا توجد مواد محفوظة بعد</p><p className="mt-1 max-w-sm text-xs leading-5 text-zinc-600">ابدأ بأصل تملك حق استخدامه، وسجّل مصدره وترخيصه قبل دخول الإنتاج.</p></div> : null}
      {assets?.map(asset => <div key={asset.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-300">{asset.assetKind === "video" ? <FileVideo className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}</div><div className="min-w-0"><p className="truncate text-xs font-semibold text-zinc-200">{asset.title}</p><p className="mt-1 text-[10px] text-zinc-600">{asset.licenseType}{asset.attribution ? ` · ${asset.attribution}` : ""}</p></div></div><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-amber-500/20 bg-amber-500/[0.04] text-[10px] text-amber-200">{asset.licenseStatus === "pending" ? "حقوق قيد المراجعة" : asset.licenseStatus}</Badge><Badge variant="outline" className="border-white/10 text-[10px] text-zinc-500">{asset.safetyStatus}</Badge>{asset.storageUrl ? <><button aria-label="نسخ رابط التخزين" onClick={() => { navigator.clipboard.writeText(asset.storageUrl ?? ""); toast.success("تم نسخ رابط التخزين."); }} className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-zinc-400 hover:text-red-300"><Copy className="h-3.5 w-3.5" /></button><a aria-label="فتح المادة" href={asset.storageUrl} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-zinc-400 hover:text-red-300"><ExternalLink className="h-3.5 w-3.5" /></a></> : null}</div></div>)}
    </div>
  </div>;
}
