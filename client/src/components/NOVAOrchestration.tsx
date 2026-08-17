import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BrainCircuit, Copy, Globe2, ListChecks, Play, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NOVAOrchestration() {
  const utils = trpc.useUtils();
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [pairCommand, setPairCommand] = useState("");
  const [referenceQuery, setReferenceQuery] = useState("");
  const [referenceProvider, setReferenceProvider] = useState<"pexels" | "pixabay" | "mixkit">("pexels");
  const [pinterestReferenceTitle, setPinterestReferenceTitle] = useState("");
  const [pinterestReferenceUrl, setPinterestReferenceUrl] = useState("");
  const [researchTitle, setResearchTitle] = useState("");
  const [researchFinding, setResearchFinding] = useState("");
  const [researchSourceUrl, setResearchSourceUrl] = useState("");
  const memories = trpc.nova.memories.useQuery();
  const playbooks = trpc.nova.playbooks.useQuery();
  const pairing = trpc.nova.telegramPairingStatus.useQuery();
  const sourceHealth = trpc.daousha.sourceHealthMonitor.useQuery();
  const sources = trpc.daousha.sources.useQuery();
  const addMemory = trpc.nova.addMemory.useMutation({
    onSuccess: () => { setMemoryTitle(""); setMemoryContent(""); utils.nova.memories.invalidate(); toast.success("حُفظت الذاكرة للمراجعة والاستخدام داخل NOVA."); },
    onError: error => toast.error(error.message),
  });
  const createPlaybook = trpc.nova.createPlaybook.useMutation({
    onSuccess: () => { utils.nova.playbooks.invalidate(); toast.success("أُنشئ Playbook للمحتوى. لا ينفذ نشرًا بنفسه."); },
    onError: error => toast.error(error.message),
  });
  const runPlaybook = trpc.nova.runPlaybook.useMutation({
    onSuccess: result => {
      utils.nova.playbookRuns.invalidate();
      utils.nova.workspace.invalidate();
      toast[result.status === "completed" ? "success" : "warning"](result.reply);
    },
    onError: error => toast.error(error.message),
  });
  const configureTelegram = trpc.nova.configureTelegramWebhook.useMutation({ onSuccess: () => toast.success("تم ربط أوامر Telegram المحكومة بالنطاق المنشور."), onError: error => toast.error(error.message) });
  const createPairing = trpc.nova.createTelegramPairing.useMutation({
    onSuccess: result => { setPairCommand(result.command); pairing.refetch(); toast.success("أُنشئ رمز ربط صالح لعشر دقائق."); },
    onError: error => toast.error(error.message),
  });
  const activateSourceHealth = trpc.daousha.activateSourceHealthMonitor.useMutation({
    onSuccess: result => { sourceHealth.refetch(); toast.success(`فُعلت مراقبة المصادر. الموعد التالي: ${result.nextExecutionAt ? new Date(result.nextExecutionAt).toLocaleString("ar-EG") : "سيظهر بعد جدولة Heartbeat"}.`); },
    onError: error => toast.error(error.message),
  });
  const addPinterestReference = trpc.daousha.addSource.useMutation({
    onSuccess: () => { setPinterestReferenceTitle(""); setPinterestReferenceUrl(""); utils.daousha.sources.invalidate(); toast.success("سُجل مرجع Pinterest للمراجعة البصرية فقط."); },
    onError: error => toast.error(error.message),
  });
  const addResearchNote = trpc.nova.addKnowledge.useMutation({
    onSuccess: () => { setResearchTitle(""); setResearchFinding(""); setResearchSourceUrl(""); toast.success("حُفظت ملاحظة البحث في قاعدة معرفة NOVA."); },
    onError: error => toast.error(error.message),
  });
  const pinterestUrlIsValid = /^https?:\/\/(?:[a-z]{2,3}\.)?pinterest\.[a-z.]+\/(?:pin|ideas)\/|^https?:\/\/pin\.it\//i.test(pinterestReferenceUrl.trim());
  const licensedReferenceUrl = referenceProvider === "pexels"
    ? `https://www.pexels.com/search/videos/${encodeURIComponent(referenceQuery.trim())}/`
    : referenceProvider === "pixabay"
      ? `https://pixabay.com/videos/search/${encodeURIComponent(referenceQuery.trim())}/`
      : `https://mixkit.co/free-stock-video/search/${encodeURIComponent(referenceQuery.trim())}/`;
  const visualReferences = (sources.data ?? []).filter(source => source.sourceKind === "reference").slice(0, 4);

  return <section className="grid gap-5 xl:grid-cols-2" dir="rtl">
    <Card className="border-white/8 bg-zinc-950/65">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white"><BrainCircuit className="h-5 w-5 text-red-400" /> ذاكرة NOVA</CardTitle>
        <CardDescription className="text-zinc-500">تفضيلات وقرارات ظاهرة لك وقابلة للمراجعة؛ لا تحفظ كلمات مرور أو رموزًا.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={memoryTitle} onChange={event => setMemoryTitle(event.target.value)} placeholder="عنوان التفضيل أو القرار" className="border-white/10 bg-black/20 text-zinc-100" />
        <Textarea value={memoryContent} onChange={event => setMemoryContent(event.target.value)} placeholder="مثال: أفضل أن تكون افتتاحية Reels عربية مختصرة وهادئة." className="border-white/10 bg-black/20 text-zinc-100" />
        <Button className="bg-red-600 hover:bg-red-500" disabled={!memoryTitle.trim() || !memoryContent.trim() || addMemory.isPending} onClick={() => addMemory.mutate({ kind: "preference", title: memoryTitle, content: memoryContent })}><Plus className="ml-2 h-4 w-4" /> حفظ ذاكرة</Button>
        <div className="space-y-2 pt-2">{(memories.data ?? []).slice(0, 4).map(memory => <div key={memory.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><p className="text-xs font-semibold text-zinc-200">{memory.title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{memory.content}</p></div>)}</div>
      </CardContent>
    </Card>
    <Card className="border-white/8 bg-zinc-950/65">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white"><Globe2 className="h-5 w-5 text-red-400" /> مصادر اللقطات والبحث</CardTitle>
        <CardDescription className="text-zinc-500">مصادر للمراجعة فقط. لا يجلب NOVA موادًا تلقائيًا، ولا يحذف علامة مائية، ولا يحوّل ترخيص المصدر إلى ملكية خاصة.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="rounded-lg border border-red-500/15 bg-red-500/[0.03] p-3">
          <p className="text-xs font-semibold text-zinc-200">بحث مرجعي مرخّص</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">اختر Pexels أو Pixabay أو Mixkit لتصفح اللقطات وترخيصها يدويًا؛ لا يحمل NOVA أي ملف ولا يسجله كمادة أو يرسل شيئًا للنشر.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[.7fr_1fr_auto]"><select value={referenceProvider} onChange={event => setReferenceProvider(event.target.value as typeof referenceProvider)} className="h-8 rounded-md border border-white/10 bg-black/20 px-2 text-xs text-zinc-100" aria-label="مصدر البحث المرجعي"><option value="pexels">Pexels</option><option value="pixabay">Pixabay</option><option value="mixkit">Mixkit</option></select><Input value={referenceQuery} onChange={event => setReferenceQuery(event.target.value)} placeholder="مثال: calm sunrise" className="h-8 border-white/10 bg-black/20 text-xs text-zinc-100" /><Button size="sm" variant="outline" className="h-8 shrink-0 border-red-500/30 bg-red-500/5 text-xs text-red-100 hover:bg-red-500/15" disabled={referenceQuery.trim().length < 2} onClick={() => window.open(licensedReferenceUrl, "_blank", "noopener,noreferrer")}>فتح المرجع</Button></div>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/20 p-3">
          <p className="text-xs font-semibold text-zinc-200">مرجع Pinterest بصري</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">سجّل Pin أو Idea كمصدر إلهام موثق فقط. لا يحمّل NOVA الوسائط ولا يقصها أو يعيد توزيعها.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.3fr_auto]"><Input value={pinterestReferenceTitle} onChange={event => setPinterestReferenceTitle(event.target.value)} placeholder="اسم الفكرة أو التركيب" className="h-8 border-white/10 bg-black/20 text-xs text-zinc-100" /><Input value={pinterestReferenceUrl} onChange={event => setPinterestReferenceUrl(event.target.value)} dir="ltr" placeholder="https://www.pinterest.com/pin/..." className="h-8 border-white/10 bg-black/20 text-xs text-zinc-100" /><Button size="sm" variant="outline" className="h-8 border-red-500/30 bg-red-500/5 text-xs text-red-100 hover:bg-red-500/15" disabled={!pinterestUrlIsValid || pinterestReferenceTitle.trim().length < 2 || addPinterestReference.isPending} onClick={() => addPinterestReference.mutate({ name: `Pinterest — ${pinterestReferenceTitle.trim()}`, url: pinterestReferenceUrl.trim(), sourceKind: "reference", language: "both", notes: "مرجع إلهام بصري فقط. لا يمنح ترخيصًا لتنزيل Pin أو استخدامه أو إعادة توزيعه؛ يجب إنتاج مشهد أصلي أو تسجيل مادة مرخصة منفصلة." })}>{addPinterestReference.isPending ? "جارٍ التسجيل…" : "تسجيل مرجع"}</Button></div>
        </div>
        {visualReferences.length ? <div className="rounded-lg border border-fuchsia-500/15 bg-fuchsia-500/[0.025] p-3"><p className="text-xs font-semibold text-fuchsia-100">مراجع بصرية مسجلة</p><p className="mt-1 text-[11px] leading-5 text-zinc-500">تُعرض كرابط وفكرة فقط. لا تتحول هذه المراجع إلى مواد إنتاج أو تصريح تنزيل أو نشر.</p><div className="mt-2 space-y-2">{visualReferences.map(source => <div key={source.id} className="flex items-center justify-between gap-3 rounded-md border border-white/8 bg-black/20 px-2 py-2"><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-zinc-200">{source.name}</p><p className="mt-0.5 text-[10px] text-zinc-600">{source.trustStatus === "approved" ? "مرجع معتمد" : "بانتظار المراجعة"} · إلهام فقط</p></div><a href={source.url} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] text-fuchsia-200 hover:text-fuchsia-100">فتح المرجع ↗</a></div>)}</div></div> : null}
        <div className="rounded-lg border border-white/8 bg-black/20 p-3">
          <p className="text-xs font-semibold text-zinc-200">نتيجة قراءة موثقة</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">سجل ما قرأته من صفحة رسمية أو مصدر مرخص مع رابطه. لا يعتبر ذلك اعتمادًا للمادة أو تصريحًا بالنشر.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={researchTitle} onChange={event => setResearchTitle(event.target.value)} placeholder="عنوان النتيجة" className="h-8 border-white/10 bg-black/20 text-xs text-zinc-100" /><Input value={researchSourceUrl} onChange={event => setResearchSourceUrl(event.target.value)} dir="ltr" placeholder="https://source.example/..." className="h-8 border-white/10 bg-black/20 text-xs text-zinc-100" /></div>
          <Textarea value={researchFinding} onChange={event => setResearchFinding(event.target.value)} placeholder="ماذا أثبت المصدر؟ اكتب ملخصًا قصيرًا قابلًا للمراجعة." className="mt-2 min-h-20 border-white/10 bg-black/20 text-xs text-zinc-100" />
          <Button size="sm" variant="outline" className="mt-2 h-8 border-red-500/30 bg-red-500/5 text-xs text-red-100 hover:bg-red-500/15" disabled={researchTitle.trim().length < 2 || researchFinding.trim().length < 5 || !/^https:\/\//i.test(researchSourceUrl.trim()) || addResearchNote.isPending} onClick={() => addResearchNote.mutate({ category: "rights", title: researchTitle.trim(), content: researchFinding.trim(), sourceUrl: researchSourceUrl.trim() })}>{addResearchNote.isPending ? "جارٍ الحفظ…" : "حفظ نتيجة القراءة"}</Button>
        </div>
        {(sources.data ?? []).filter(source => source.sourceKind === "asset" || source.sourceKind === "audio").slice(0, 5).map(source => (
          <div key={source.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-zinc-200">{source.name}</p><span className={source.trustStatus === "approved" ? "text-[10px] text-emerald-300" : "text-[10px] text-amber-300"}>{source.trustStatus === "approved" ? "معتمد" : "بانتظار المراجعة"}</span></div>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">{source.notes || "تحقق من ترخيص كل لقطة، الأشخاص، الشعارات، ونسبة الاستخدام قبل التسجيل."}</p>
            <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] text-red-200 hover:text-red-100">فتح صفحة المصدر ↗</a>
          </div>
        ))}
        {!sources.isLoading && !(sources.data ?? []).some(source => source.sourceKind === "asset" || source.sourceKind === "audio") ? <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-zinc-500">لا توجد مصادر لقطات مسجلة بعد.</p> : null}
      </CardContent>
    </Card>
    <Card className="border-white/8 bg-zinc-950/65">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white"><ListChecks className="h-5 w-5 text-red-400" /> Playbooks المحتوى</CardTitle>
        <CardDescription className="text-zinc-500">تنفّذ الوصفة خطوات القراءة المسموحة فقط، وتسجل أي حظر أو فشل في نفس سجل NOVA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-red-500/10" disabled={configureTelegram.isPending} onClick={() => configureTelegram.mutate({ publicBaseUrl: window.location.origin })}><ShieldCheck className="ml-2 h-4 w-4" /> تفعيل Webhook Telegram</Button>
        <div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-xs font-semibold text-zinc-200">ربط محادثتك بـNOVA</p><p className="mt-1 text-[11px] leading-5 text-zinc-500">ينشئ رمزًا صالحًا لعشر دقائق. أرسله للبوت كما هو، ثم تصبح محادثتك هي الواجهة المعتمدة.</p><Button size="sm" className="mt-3 bg-red-600 hover:bg-red-500" disabled={createPairing.isPending} onClick={() => createPairing.mutate()}>{pairing.data?.status === "paired" ? "إعادة ربط Telegram" : "إنشاء رمز الربط"}</Button>{pairCommand ? <button onClick={() => { navigator.clipboard.writeText(pairCommand); toast.success("نُسخ الأمر."); }} className="mt-3 flex w-full items-center justify-between rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-100"><span>{pairCommand}</span><Copy className="h-3.5 w-3.5" /></button> : null}{pairing.data?.status === "paired" ? <p className="mt-2 text-xs text-emerald-300">محادثة Telegram موثقة ومربوطة.</p> : null}</div>
        <div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-xs font-semibold text-zinc-200">مراقبة المصادر المعتمدة</p><p className="mt-1 text-[11px] leading-5 text-zinc-500">تفحص إتاحة الروابط المعتمدة كل 12 ساعة فقط؛ لا تجلب المقالات ولا تضيف معرفة تلقائيًا.</p><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-zinc-600">{sourceHealth.data ? `الحالة: ${sourceHealth.data.status}` : "غير مفعلة"}</span><Button size="sm" variant="outline" className="h-7 border-red-500/30 bg-red-500/5 px-2 text-xs text-red-100 hover:bg-red-500/15" disabled={activateSourceHealth.isPending} onClick={() => activateSourceHealth.mutate()}>{activateSourceHealth.isPending ? "جارٍ التفعيل…" : "تفعيل المراقبة"}</Button></div></div>
        <Button variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-red-500/10" disabled={createPlaybook.isPending} onClick={() => createPlaybook.mutate({ title: "تجهيز حزمة مراجعة", description: "مراجعة حالة المشروع والأصول قبل بوابة المراجعة.", impact: "draft", steps: [{ title: "عرض الحالة التشغيلية", toolName: "get_operational_overview" }, { title: "تسجيل مسودة مشروع عند الحاجة", toolName: "create_project_draft", inputTemplate: "تُستخدم فقط بعد طلب المالك." }] })}><Plus className="ml-2 h-4 w-4" /> إضافة وصفة مراجعة</Button>
        <div className="space-y-2">{(playbooks.data ?? []).map(playbook => <div key={playbook.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-zinc-200">{playbook.title}</p><ShieldCheck className="h-4 w-4 text-red-300" /></div><p className="mt-1 text-xs text-zinc-500">{playbook.description}</p><div className="mt-2 flex items-center justify-between gap-2"><p className="text-[10px] text-zinc-600">{playbook.steps.length} خطوات · {playbook.impact}</p><Button size="sm" variant="outline" className="h-7 border-red-500/30 bg-red-500/5 px-2 text-xs text-red-100 hover:bg-red-500/15" disabled={runPlaybook.isPending} onClick={() => runPlaybook.mutate({ playbookId: playbook.id })}><Play className="ml-1 h-3.5 w-3.5" /> تشغيل محكوم</Button></div></div>)}</div>
      </CardContent>
    </Card>
  </section>;
}
