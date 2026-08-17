import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Activity, Archive, BellRing, Bot, BrainCircuit, CheckCircle2, CircleAlert, Database, Flame, KeyRound, Loader2, LockKeyhole, MessageSquarePlus, Network, Orbit, Radar, ShieldAlert, ShieldCheck, Skull, Sparkles, Terminal, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const NOVA_SUGGESTED_PROMPTS = [
  "ما حالة القنوات والمهام المجدولة؟",
  "ما حالة التفويض وتجديد الرموز؟",
  "ما حالة مزودي الذكاء الاصطناعي؟",
  "اعرض آخر التنبيهات التشغيلية",
  "ما الذي يحتاج مراجعة الآن؟",
  "اعرض الذاكرة والـPlaybooks",
  "تذكر أن الأولوية للعربية أولاً",
  "ابحث في قاعدة المعرفة عن الحقوق",
  "مسودة جيميني عن أذكار قصيرة مع تنبيه حقوقي",
];

export const NOVA_MEMORY_GUIDANCE = "ذاكرة NOVA تحفظ قرارات وتفضيلات DAWSHA الصريحة فقط؛ لا تحفظ كلمات مرور أو رموز دخول أو مفاتيح وصول.";

const planState = {
  proposed: ["مقترحة", "border-amber-500/25 bg-amber-500/10 text-amber-100"],
  approved: ["معتمدة", "border-sky-500/25 bg-sky-500/10 text-sky-100"],
  executing: ["قيد التنفيذ", "border-violet-500/25 bg-violet-500/10 text-violet-100"],
  completed: ["مكتملة", "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"],
  blocked: ["محجوبة", "border-red-500/25 bg-red-500/10 text-red-100"],
  failed: ["تعذرت", "border-red-500/25 bg-red-500/10 text-red-100"],
} as const;

function formatTime(value: Date | string) {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
}

function auditDecisionStyle(decision: string) {
  if (["completed", "allowed"].includes(decision)) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (["blocked", "denied"].includes(decision)) return "border-amber-500/25 bg-amber-500/10 text-amber-100";
  if (decision === "failed") return "border-red-500/25 bg-red-500/10 text-red-100";
  return "border-white/10 bg-white/[0.04] text-zinc-400";
}

function Metric({ label, value, detail, tone = "red" }: { label: string; value: string | number; detail: string; tone?: "red" | "green" | "amber" | "violet" }) {
  const toneClasses = {
    red: "from-red-500/20 via-red-500/5 to-transparent border-red-500/20 text-red-200",
    green: "from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-200",
    amber: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20 text-amber-100",
    violet: "from-violet-500/20 via-violet-500/5 to-transparent border-violet-500/20 text-violet-200",
  }[tone];
  return <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3 ${toneClasses}`}><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p><p className="mt-1 line-clamp-1 text-[10px] text-zinc-500">{detail}</p></div>;
}

function StatusOrb({ title, detail, active, icon: Icon }: { title: string; detail: string; active: boolean; icon: typeof Activity }) {
  return <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/7 bg-black/25 p-2.5"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${active ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-zinc-700 bg-zinc-900 text-zinc-500"}`}><Icon className="h-4 w-4" /></div><div className="min-w-0"><div className="flex items-center gap-1.5"><p className="truncate text-[10px] font-bold text-zinc-200">{title}</p><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400 shadow-[0_0_9px_rgba(74,222,128,.9)]" : "bg-amber-400"}`} /></div><p className="truncate text-[9px] text-zinc-600">{detail}</p></div></div>;
}

export default function NOVAConsole() {
  const utils = trpc.useUtils();
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>();
  const [advisorPrompt, setAdvisorPrompt] = useState("");
  const [advisorProvider, setAdvisorProvider] = useState<"gemini" | "openai">("gemini");
  const [advisorDraft, setAdvisorDraft] = useState<string | undefined>();
  const workspaceInput = useMemo(() => selectedSessionId ? { sessionId: selectedSessionId } : undefined, [selectedSessionId]);
  const workspace = trpc.nova.workspace.useQuery(workspaceInput, { refetchInterval: 15_000, refetchOnWindowFocus: true });
  const memories = trpc.nova.memories.useQuery(undefined, { refetchInterval: 15_000, refetchOnWindowFocus: true });
  const playbooks = trpc.nova.playbooks.useQuery(undefined, { refetchInterval: 15_000, refetchOnWindowFocus: true });
  const dashboard = trpc.daousha.dashboard.useQuery(undefined, { refetchInterval: 15_000, refetchOnWindowFocus: true });
  const advisorProviders = trpc.nova.advisorProviders.useQuery(undefined, { refetchInterval: 60_000, refetchOnWindowFocus: true });

  const createSession = trpc.nova.createSession.useMutation({
    onSuccess: session => { setSelectedSessionId(session.id); utils.nova.workspace.invalidate(); utils.nova.sessions.invalidate(); toast.success("فُتحت نواة NOVA جديدة."); },
    onError: error => toast.error(error.message),
  });
  const archiveSession = trpc.nova.archiveSession.useMutation({
    onSuccess: () => { setSelectedSessionId(undefined); utils.nova.workspace.invalidate(); utils.nova.sessions.invalidate(); toast.success("أُرشفت الجلسة مع إبقاء سجلها المحكوم."); },
    onError: error => toast.error(error.message),
  });
  const sendMessage = trpc.nova.sendMessage.useMutation({
    onSuccess: result => { setSelectedSessionId(result.session.id); utils.nova.workspace.invalidate(); utils.nova.sessions.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const createAdvisorDraft = trpc.nova.createAdvisorDraft.useMutation({
    onSuccess: result => { setAdvisorDraft(result.content); utils.nova.workspace.invalidate(); toast.success(`أُنشئت مسودة إرشادية عبر ${result.provider}.`); },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!selectedSessionId && workspace.data?.session?.id) setSelectedSessionId(workspace.data.session.id);
  }, [selectedSessionId, workspace.data?.session?.id]);

  const messages: Message[] = useMemo(() => (workspace.data?.messages ?? []).map(message => ({ role: message.role === "system" ? "assistant" : message.role, content: message.content })), [workspace.data?.messages]);
  const session = workspace.data?.session;
  const plans = workspace.data?.plans ?? [];
  const activePlaybooks = playbooks.data?.filter(item => item.status === "active").length ?? 0;
  const readyProviders = advisorProviders.data?.filter(item => item.status === "ready").length ?? 0;
  const audit = workspace.data?.audit ?? [];
  const dashboardStats = dashboard.data?.stats;
  const authorizedChannels = dashboard.data?.connections?.filter(connection => connection.status === "authorized").length ?? 0;

  return <section dir="rtl" className="relative isolate overflow-hidden rounded-[28px] border border-red-500/15 bg-[#08090d] p-3 sm:p-5">
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(rgba(239,68,68,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,.045)_1px,transparent_1px)] [background-size:32px_32px]" />
    <div className="pointer-events-none absolute -right-24 -top-36 -z-10 h-80 w-80 rounded-full bg-red-600/20 blur-[110px]" />
    <div className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 h-80 w-80 rounded-full bg-violet-700/15 blur-[110px]" />

    <header className="relative overflow-hidden rounded-[22px] border border-red-500/20 bg-[radial-gradient(circle_at_78%_0%,rgba(239,68,68,.24),transparent_28%),linear-gradient(110deg,rgba(20,7,10,.96),rgba(8,10,16,.96))] px-4 py-5 sm:px-6">
      <div className="pointer-events-none absolute -left-8 -bottom-10 opacity-20"><Flame className="h-40 w-40 text-red-500" /></div>
      <div className="pointer-events-none absolute left-[36%] top-3 opacity-[.08]"><Skull className="h-28 w-28 text-white" /></div>
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-200 shadow-[0_0_35px_rgba(239,68,68,.28)]"><Orbit className="absolute h-9 w-9 animate-[spin_13s_linear_infinite] text-red-400/70" /><Skull className="h-5 w-5" /></div>
          <div><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-[10px] font-bold tracking-[0.28em] text-red-300">DAWSHA // NOVA CORE</p><Badge className="border border-emerald-500/25 bg-emerald-500/10 text-[9px] text-emerald-200 hover:bg-emerald-500/10"><Activity className="ml-1 h-3 w-3" /> LIVE SYNC</Badge></div><h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">غرفة عمليات <span className="text-red-400">NOVA</span></h1><p className="mt-1.5 max-w-2xl text-xs leading-6 text-zinc-400">وكيل DAWSHA الموحد: يفهم أوامر الويب وTelegram، ويعرض قراراته وسجله وذاكرته ضمن حدود الحقوق والسلامة والنشر المحكوم.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[430px]">
          <Metric label="جلسات" value={workspace.data?.sessions?.length ?? 0} detail="سياق موحد" tone="violet" />
          <Metric label="ذاكرة" value={memories.data?.length ?? 0} detail="قرارات DAWSHA" tone="red" />
          <Metric label="Playbooks" value={activePlaybooks} detail="قراءة آمنة" tone="amber" />
          <Metric label="مزودون" value={readyProviders} detail="مسودة صريحة" tone="green" />
        </div>
      </div>
      <div className="relative mt-5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3"><span className="font-mono text-[9px] tracking-[.18em] text-zinc-600">NOVA_SIGNAL:</span><Badge className="border border-red-500/25 bg-red-500/10 text-[10px] text-red-100 hover:bg-red-500/10"><ShieldAlert className="ml-1 h-3 w-3" /> الحماية غير قابلة للتجاوز</Badge><Badge className="border border-white/10 bg-black/25 text-[10px] text-zinc-400 hover:bg-black/25"><Network className="ml-1 h-3 w-3" /> الويب + Telegram</Badge><span className="mr-auto text-[10px] text-zinc-600">تحديث لوحة NOVA كل 15 ثانية</span></div>
    </header>

    <div className="mt-4 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_310px]">
      <aside className="order-2 space-y-3 xl:order-1">
        <Card className="overflow-hidden border-white/8 bg-black/35"><CardContent className="p-0"><div className="flex items-center justify-between border-b border-white/8 bg-white/[.025] px-3 py-3"><div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-red-300" /><p className="text-xs font-black text-white">سجل النوى</p></div><Button size="icon" variant="outline" aria-label="جلسة NOVA جديدة" className="h-7 w-7 border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => createSession.mutate()} disabled={createSession.isPending}>{createSession.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}</Button></div><ScrollArea className="h-[230px] p-2">{(workspace.data?.sessions ?? []).map(item => <button key={item.id} onClick={() => setSelectedSessionId(item.id)} className={`mb-1.5 w-full rounded-xl border p-2.5 text-right transition-all ${session?.id === item.id ? "border-red-500/30 bg-red-500/[.09] shadow-[0_0_18px_rgba(239,68,68,.08)]" : "border-transparent hover:border-white/8 hover:bg-white/[.03]"}`}><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-[10px] font-bold leading-5 text-zinc-200">{item.title}</p><span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${item.status === "active" ? "bg-emerald-400" : "bg-zinc-600"}`} /></div><p className="mt-1 text-[9px] text-zinc-600">{formatTime(item.updatedAt)}</p></button>)}{!workspace.isLoading && (workspace.data?.sessions?.length ?? 0) === 0 ? <p className="p-4 text-center text-[10px] leading-5 text-zinc-600">افتح أول نواة محادثة لـDAWSHA.</p> : null}</ScrollArea></CardContent></Card>
        <Card className="border-red-500/15 bg-gradient-to-br from-red-500/[.10] to-transparent"><CardContent className="p-3"><div className="flex items-start gap-2.5"><Flame className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><div><p className="text-[11px] font-bold text-red-100">إنذار أخلاقي</p><p className="mt-1 text-[10px] leading-5 text-red-100/65">البحث عن ترند أو مادة لا يساوي حق تنزيلها أو نسبتها. أي إنتاج يمر من الحقوق ثم السلامة ثم المعاينة.</p></div></div></CardContent></Card>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><StatusOrb title="قلب الذاكرة" detail={`${memories.data?.length ?? 0} قرارًا موثقًا`} active icon={Database} /><StatusOrb title="سجل الأمان" detail="بدون أسرار أو تفكير خام" active icon={LockKeyhole} /><StatusOrb title="التحديث الذكي" detail="يعرض تغير البيانات الحقيقية" active={Boolean(audit.length)} icon={Radar} /></div>
      </aside>

      <main className="order-1 overflow-hidden rounded-2xl border border-red-500/18 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,.12),transparent_38%),rgba(8,9,14,.78)] xl:order-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-black/25 px-4 py-3"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-200"><Bot className="h-4 w-4" /></div><div><p className="text-xs font-black text-white">NOVA // EXECUTION CHANNEL</p><p className="text-[9px] text-zinc-600">قرار واضح · سجل قابل للتدقيق · حواجز نشطة</p></div></div><div className="flex items-center gap-2"><Badge className="border border-emerald-500/20 bg-emerald-500/10 text-[9px] text-emerald-100 hover:bg-emerald-500/10"><CheckCircle2 className="ml-1 h-3 w-3" /> قناة موحدة</Badge>{session ? <Badge className="border border-white/10 bg-white/[.03] text-[9px] text-zinc-400 hover:bg-white/[.03]">{session.origin === "telegram" ? "Telegram" : "الويب"} · #{session.id}</Badge> : null}</div></div>
        {!session ? <div className="flex min-h-[620px] flex-col items-center justify-center px-8 text-center"><div className="relative grid h-20 w-20 place-items-center rounded-[24px] border border-red-500/30 bg-red-500/10 text-red-200 shadow-[0_0_55px_rgba(239,68,68,.22)]"><Zap className="h-8 w-8" /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,1)]" /></div><p className="mt-6 font-mono text-[10px] tracking-[.3em] text-red-300">DAWSHA ACCESS GRANTED</p><h2 className="mt-2 text-2xl font-black text-white">افتح نواة NOVA</h2><p className="mt-3 max-w-md text-xs leading-6 text-zinc-500">ابدأ بسؤال عن القنوات أو المراجعات أو الذاكرة، أو اطلب مسودة إرشادية. NOVA لا ينشر أو ينزّل أو يغيّر سياسة وحده.</p><Button className="mt-6 bg-red-600 px-5 text-xs font-bold hover:bg-red-500" onClick={() => createSession.mutate()} disabled={createSession.isPending}>{createSession.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <MessageSquarePlus className="ml-2 h-4 w-4" />} بدء جلسة DAWSHA</Button></div> : <AIChatBox messages={messages} onSendMessage={content => sendMessage.mutate({ sessionId: session.id, content })} isLoading={sendMessage.isPending} height="620px" placeholder="اكتب أمر DAWSHA إلى NOVA… مثال: ما حالة القنوات؟" emptyStateMessage="اسأل عن القنوات، المراجعات، الذاكرة أو مزودي الذكاء الاصطناعي. كل نتيجة تُكتب في سجل قابل للمراجعة." suggestedPrompts={NOVA_SUGGESTED_PROMPTS} enableVoiceInput voiceLanguage="ar-EG" className="rounded-none border-0 bg-transparent shadow-none" />}
        {session ? <div className="flex items-center justify-between gap-3 border-t border-white/8 bg-black/30 px-4 py-3"><p className="text-[9px] text-zinc-600">DAWSHA CORE · مزامنة الويب وTelegram · تحديث كل 15 ثانية</p><Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-zinc-500 hover:bg-red-500/10 hover:text-red-200" onClick={() => archiveSession.mutate({ sessionId: session.id })} disabled={archiveSession.isPending}><Archive className="ml-1 h-3 w-3" /> أرشفة النواة</Button></div> : null}
      </main>

      <aside className="order-3 space-y-3">
        <Card className="border-white/8 bg-black/35"><CardContent className="p-3"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-black text-white"><BrainCircuit className="h-4 w-4 text-red-300" /> ذاكرة DAWSHA</p><p className="mt-1 text-[9px] leading-5 text-zinc-600">نفس السياق يظهر في الويب وTelegram.</p></div><Badge className="border border-red-500/20 bg-red-500/[.08] text-[9px] text-red-100 hover:bg-red-500/[.08]">{memories.data?.length ?? 0} عنصر</Badge></div><div className="mt-3 space-y-2">{memories.isLoading ? <p className="text-[10px] text-zinc-600">يجري قراءة الذاكرة…</p> : (memories.data?.length ?? 0) > 0 ? memories.data?.slice(0, 3).map(memory => <div key={memory.id} className="rounded-xl border border-white/6 bg-white/[.025] p-2.5"><p className="line-clamp-1 text-[10px] font-bold text-zinc-200">{memory.title}</p><p className="mt-1 text-[9px] text-zinc-600">{formatTime(memory.updatedAt)}</p></div>) : <p className="rounded-xl border border-dashed border-white/10 p-3 text-[10px] leading-5 text-zinc-600">لا توجد ذاكرة بعد. اكتب «تذكر أن…» لقرار غير حساس.</p>}</div><p className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/[.04] p-2 text-[9px] leading-5 text-amber-100/75">{NOVA_MEMORY_GUIDANCE}</p></CardContent></Card>
        <Card className="border-red-500/18 bg-[linear-gradient(145deg,rgba(58,12,17,.62),rgba(9,9,13,.92))]"><CardContent className="p-3"><div className="flex items-center justify-between"><div><p className="flex items-center gap-2 text-xs font-black text-white"><Sparkles className="h-4 w-4 text-red-300" /> محطة المسودات</p><p className="mt-1 text-[9px] text-zinc-600">بدون أدوات تنفيذ أو نشر</p></div><Badge className="border border-red-500/20 bg-red-500/10 text-[9px] text-red-100 hover:bg-red-500/10">طلب صريح</Badge></div><div className="mt-3 flex flex-wrap gap-1.5">{advisorProviders.data?.map(provider => <button key={provider.id} type="button" disabled={provider.status !== "ready" || provider.id === "perplexity"} onClick={() => provider.id !== "perplexity" && setAdvisorProvider(provider.id)} className={`rounded-lg border px-2 py-1 text-[9px] transition-colors ${provider.id === advisorProvider ? "border-red-500/40 bg-red-500/15 text-red-100" : "border-white/8 bg-black/20 text-zinc-500"} ${provider.status !== "ready" ? "cursor-not-allowed opacity-50" : "hover:border-white/20"}`}>{provider.title} · {provider.status === "ready" ? "متاح" : provider.status === "disabled" ? "متوقف" : "غير مهيأ"}</button>)}</div><p className="mt-2 rounded-lg border border-white/6 bg-black/25 px-2 py-1.5 text-[9px] leading-5 text-zinc-500">{advisorProviders.data?.find(provider => provider.id === advisorProvider)?.detail ?? "يجري تحميل حالة المزود. لا ترسل أسرارًا."}</p><Textarea value={advisorPrompt} onChange={event => setAdvisorPrompt(event.target.value)} placeholder="أعطني هيكل سكربت قصير عن…" className="mt-2 min-h-20 resize-none border-white/10 bg-black/30 text-[10px] leading-5 text-zinc-200 placeholder:text-zinc-700" maxLength={6000} /><Button size="sm" className="mt-2 w-full bg-red-600 text-[10px] hover:bg-red-500" disabled={createAdvisorDraft.isPending || advisorPrompt.trim().length < 3} onClick={() => createAdvisorDraft.mutate({ provider: advisorProvider, prompt: advisorPrompt, language: "ar" })}>{createAdvisorDraft.isPending ? <Loader2 className="ml-1 h-3 w-3 animate-spin" /> : <Sparkles className="ml-1 h-3 w-3" />} إنشاء مسودة آمنة</Button>{advisorDraft ? <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-amber-500/15 bg-black/25 p-2.5"><p className="mb-1 text-[9px] font-bold text-amber-100">نتيجة إرشادية — مراجعة بشرية مطلوبة</p><p className="whitespace-pre-wrap text-[10px] leading-5 text-zinc-300">{advisorDraft}</p></div> : null}</CardContent></Card>
        <Card className="border-white/8 bg-black/35"><CardContent className="p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><BellRing className="h-4 w-4 text-red-300" /><p className="text-xs font-black text-white">نبض التنفيذ</p></div><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.9)]" /></div><div className="mt-3 space-y-2">{plans.slice(0, 3).map(plan => { const state = planState[plan.status]; return <div key={plan.id} className="rounded-xl border border-white/7 bg-white/[.025] p-2.5"><div className="flex items-center justify-between gap-2"><Badge className={`border px-1.5 py-0 text-[8px] ${state[1]}`}>{state[0]}</Badge><span className="font-mono text-[9px] text-zinc-600">#{plan.id}</span></div><p className="mt-1.5 line-clamp-2 text-[10px] leading-5 text-zinc-300">{plan.summary}</p></div>; })}{plans.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-3 text-[10px] leading-5 text-zinc-600">لا توجد خطط في هذه النواة بعد.</p> : null}</div></CardContent></Card>
        <Card className="border-red-500/20 bg-red-500/[.045]"><CardContent className="p-3"><div className="flex gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><p className="text-[9px] leading-5 text-red-100/75"><strong className="text-red-100">خطر محكوم:</strong> NOVA لا ينزّل محتوى الغير ولا يزيل علامات الحقوق ولا ينشر خارج فحص الحقوق والسلامة والمعاينة وCanary وسقف النشر.</p></div></CardContent></Card>
      </aside>
    </div>

    <section className="mt-4 grid gap-3 md:grid-cols-[1fr_1.25fr]"><Card className="border-white/8 bg-black/30"><CardContent className="p-3"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-black text-white"><Network className="h-4 w-4 text-red-300" /> وصلات النواة</p><span className="font-mono text-[9px] tracking-widest text-zinc-600">READ // AUDIT</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><StatusOrb title="الذاكرة" detail={`${memories.data?.length ?? 0} قرار موثق`} active icon={Database} /><StatusOrb title="المراجعة" detail={`${dashboardStats?.reviewProjects ?? 0} ينتظر بوابة بشرية`} active icon={ShieldCheck} /><StatusOrb title="الجدولة" detail={`${dashboardStats?.activeSchedules ?? 0} نشرات محكومة`} active icon={Activity} /><StatusOrb title="القنوات" detail={`${authorizedChannels} تفويضات رسمية`} active={authorizedChannels > 0} icon={Network} /></div></CardContent></Card><Card className="border-white/8 bg-black/30"><CardContent className="p-3"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-black text-white"><Radar className="h-4 w-4 text-red-300" /> آخر أثر قابل للتدقيق</p><Badge className="border border-white/10 bg-white/[.03] text-[8px] text-zinc-500 hover:bg-white/[.03]">بدون أسرار</Badge></div><div className="mt-3 space-y-2">{audit.slice(0, 3).map(event => <div key={event.id} className="flex items-start justify-between gap-3 border-b border-white/6 pb-2 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-[10px] font-bold text-zinc-200">{event.action}</p><p className="mt-1 text-[9px] text-zinc-600">{formatTime(event.createdAt)} {event.target ? `· ${event.target}` : ""}</p></div><Badge className={`shrink-0 border text-[8px] ${auditDecisionStyle(event.decision)}`}>{event.decision}</Badge></div>)}{audit.length === 0 ? <p className="text-[10px] leading-5 text-zinc-600">ستظهر الأحداث هنا بعد أول أمر من DAWSHA.</p> : null}</div></CardContent></Card></section>
  </section>;
}
