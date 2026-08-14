import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  ArrowUpRight,
  AudioLines,
  BellRing,
  Bot,
  CheckCheck,
  ChevronLeft,
  CircleGauge,
  Clock3,
  FileVideo,
  FolderKanban,
  Gauge,
  Globe2,
  ImagePlus,
  Layers3,
  LibraryBig,
  Link2,
  ListChecks,
  LockKeyhole,
  Orbit,
  Play,
  Plus,
  RadioTower,
  Search,
  ShieldCheck,
  Skull,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Video,
  WandSparkles,
} from "lucide-react";
import { platformReferences, workflowStages } from "@shared/daousha";
import LaunchConsole from "@/components/LaunchConsole";
import AssetVault from "@/components/AssetVault";
import ReviewQueue from "@/components/ReviewQueue";
import ReviewPublishDesk from "@/components/ReviewPublishDesk";
import ScriptForge from "@/components/ScriptForge";
import SourceRegistry from "@/components/SourceRegistry";
import VisualForge from "@/components/VisualForge";
import ScheduleDeck from "@/components/ScheduleDeck";
import ChangeLogPanel from "@/components/ChangeLogPanel";
import AnalyticsBridge from "@/components/AnalyticsBridge";
import ChannelControlCenter from "@/components/ChannelControlCenter";
import ContentMixPanel from "@/components/ContentMixPanel";
import ProjectBriefStudio from "@/components/ProjectBriefStudio";
import TrendRadar from "@/components/TrendRadar";
import PerformanceInsights from "@/components/PerformanceInsights";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Section =
  | "dashboard"
  | "trends"
  | "library"
  | "studio"
  | "review"
  | "automation"
  | "insights"
  | "evolution"
  | "settings";

const sectionMeta: Record<Section, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "DAOSHA / CONTROL ROOM",
    title: "غرفة التحكم",
    description: "راقب دورة المحتوى كاملة، من الإشارة الأولى إلى مراجعة النشر.",
  },
  trends: {
    eyebrow: "SIGNAL RADAR",
    title: "رادار الترندات",
    description: "مصادر عربية وإنجليزية تُراجع قبل إضافتها إلى شبكة الرصد.",
  },
  library: {
    eyebrow: "RIGHTS VAULT",
    title: "مكتبة المواد",
    description: "لكل لقطة مصدر ورخصة وحالة مراجعة واضحة قبل دخول الإنتاج.",
  },
  studio: {
    eyebrow: "VIDEO FORGE",
    title: "استوديو الإنتاج",
    description: "حوّل الفكرة إلى حزمة فيديو أصلية باللغتين، مع نقطة تحكم بشرية.",
  },
  review: {
    eyebrow: "HUMAN GATE",
    title: "بوابة المراجعة",
    description: "لا يخرج أي محتوى من دعوشة قبل اكتمال الحقوق والسلامة وموافقتك.",
  },
  automation: {
    eyebrow: "PULSE ENGINE",
    title: "الأتمتة والجدولة",
    description: "شغّل المحرك ضمن قواعد حقوق وسلامة وسقف نشر واضح وسجل لا يضيع.",
  },
  insights: {
    eyebrow: "SIGNAL INTELLIGENCE",
    title: "التحليلات",
    description: "اربط الحسابات الرسمية لاحقًا لتظهر بيانات المشاهدة والاحتفاظ والتفاعل.",
  },
  evolution: {
    eyebrow: "GOVERNED EVOLUTION",
    title: "سجل التطوير",
    description: "النظام يقترح تحسينات؛ الاعتماد والتنفيذ لا يتمان إلا بعد مراجعتك.",
  },
  settings: {
    eyebrow: "SYSTEM CORE",
    title: "إعدادات النظام",
    description: "اربط المصادر الرسمية والتخزين والتنبيهات من مكان واحد.",
  },
};

function Frame({ section, children }: { section: Section; children: React.ReactNode }) {
  const meta = sectionMeta[section];
  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-6 pb-8" dir="rtl">
      <header className="flex flex-col justify-between gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <p className="font-mono text-[10px] tracking-[0.28em] text-red-400/90" dir="ltr">
            {meta.eyebrow}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{meta.title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <Badge className="border border-red-500/25 bg-red-500/10 px-3 py-1 text-red-300 hover:bg-red-500/10">
            <span className="ml-2 h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#ff3048]" />
            وضع الحماية مفعّل
          </Badge>
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07] hover:text-white"
            onClick={() => toast("ستظهر هنا التنبيهات عند ربط قنواتك ومصادر البيانات.")}
          >
            <BellRing className="ml-2 h-4 w-4" />
            التنبيهات
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}

function MetricCard({ label, value, description, icon: Icon }: { label: string; value: string; description: string; icon: React.ElementType }) {
  return (
    <Card className="group overflow-hidden border-white/8 bg-zinc-950/60 shadow-[0_18px_60px_rgba(0,0,0,.25)] backdrop-blur">
      <CardContent className="relative p-5">
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-red-500/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-white" dir="ltr">{value}</p>
            <p className="mt-2 text-xs text-zinc-500">{description}</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-red-300 shadow-[0_0_22px_rgba(239,68,68,.14)]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatZero({ label, sublabel, value = "0" }: { label: string; sublabel: string; value?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
      <p className="font-mono text-2xl font-bold text-white" dir="ltr">{value}</p>
      <p className="mt-1 text-xs text-zinc-300">{label}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{sublabel}</p>
    </div>
  );
}

function Dashboard() {
  const { data: dashboard } = trpc.daousha.dashboard.useQuery();
  const stats = dashboard?.stats;
  return (
    <Frame section="dashboard">
      <section className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-[radial-gradient(circle_at_82%_22%,rgba(239,68,68,.20),transparent_27%),linear-gradient(118deg,rgba(19,19,22,.97),rgba(8,8,10,.97))] p-6 sm:p-8">
        <div className="absolute -left-20 -top-28 opacity-[0.09]" aria-hidden="true">
          <Skull className="h-80 w-80 text-red-500" strokeWidth={0.7} />
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_.8fr] lg:items-center">
          <div className="space-y-5">
            <Badge className="border border-red-500/20 bg-red-950/40 text-red-200 hover:bg-red-950/40">نقطة البداية الآمنة</Badge>
            <h2 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
              ابنِ خط محتوى يعرف متى <span className="text-red-400">يتوقف</span> قبل أن يعرف متى ينشر.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              ابدأ بمشروع واحد، أضف مادة ذات ترخيص واضح، ثم مرّرها عبر السكربت والإنتاج والمراجعة. لا يتجاوز المحرك الحقوق أو السلامة أو سقف النشر حتى عند تفعيل التشغيل المستقل.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-red-600 text-white shadow-[0_0_28px_rgba(239,68,68,.28)] hover:bg-red-500" onClick={() => toast("أنشئ مشروعك الأول من الاستوديو.")}> 
                <Plus className="ml-2 h-4 w-4" /> مشروع فيديو جديد
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08] hover:text-white" onClick={() => toast("افتح مكتبة المواد لإضافة أصل أو رابط مرخّص.")}> 
                <LibraryBig className="ml-2 h-4 w-4" /> إضافة مادة مرخّصة
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatZero value={String(stats?.activeProjects ?? 0)} label="مشروعات نشطة" sublabel="كل مشروع يبدأ من الفكرة" />
            <StatZero value={String(stats?.reviewProjects ?? 0)} label="جاهز للمراجعة" sublabel="ينتظر قرارك البشري" />
            <StatZero value={String(stats?.activeSchedules ?? 0)} label="نشرات مجدولة" sublabel="لا تفعّل قبل الاعتماد" />
            <StatZero value={String(dashboard?.connections?.filter(connection => connection.status === "authorized").length ?? 0)} label="قنوات مرتبطة" sublabel="تفويض رسمي فقط" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="مواد مرخّصة جاهزة" value={String(stats?.approvedAssets ?? 0)} description="بعد الحقوق والسلامة" icon={Gauge} />
        <MetricCard label="مراجع معتمدة" value={String(platformReferences.length)} description="مكتبات ومصادر تمهيدية" icon={Link2} />
        <MetricCard label="بوابات مراجعة" value="3" description="حقوق، سلامة، موافقة بشرية" icon={ShieldCheck} />
        <MetricCard label="لغات الإنتاج" value="AR / EN" description="تُفعّل لكل مشروع" icon={Globe2} />
      </section>

      <LaunchConsole />

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="border-white/8 bg-zinc-950/60">
          <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-white/7 pb-4">
            <div>
              <CardTitle className="text-base text-white">نبض خط الإنتاج</CardTitle>
              <CardDescription className="mt-1 text-zinc-500">كل فيديو يمر بنفس البوابات، دون اختصارات.</CardDescription>
            </div>
            <CircleGauge className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {workflowStages.map((stage, index) => (
                <div key={stage} className="relative rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                  {index < workflowStages.length - 1 ? <ChevronLeft className="absolute -left-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-red-400/60 xl:block" /> : null}
                  <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 font-mono text-xs text-red-200">{index + 1}</span>
                  <p className="mt-2 text-xs font-medium text-zinc-200">{stage}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-3 text-xs leading-6 text-amber-100/75">
              <AlertTriangle className="ml-2 inline h-4 w-4 text-amber-400" />
              النشر محجوب افتراضيًا. في الوضع المستقل، لا يصبح المشروع مؤهلًا إلا بعد فحص الحقوق والسلامة والأصالة وسقف النشر.
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-zinc-950/60">
          <CardHeader className="border-b border-white/7 pb-4">
            <CardTitle className="flex items-center gap-2 text-base text-white"><RadioTower className="h-4 w-4 text-red-400" /> حالة المحركات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {[
              ["رادار الترندات", "بانتظار اعتماد مصادر الرصد", "متوقف"],
              ["مكتبة الحقوق", "جاهزة لإضافة مواد مرخّصة", "جاهز"],
              ["إنتاج الذكاء الاصطناعي", "يُشغّل من الاستوديو", "عند الطلب"],
              ["النشر", "يتطلب ربط منصة واجتياز سياسة الحماية", "محمي"],
            ].map(([name, detail, state]) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-white/7 bg-white/[0.02] px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-zinc-200">{name}</p>
                  <p className="mt-1 text-[11px] text-zinc-600">{detail}</p>
                </div>
                <Badge variant="outline" className="border-white/10 text-[10px] text-zinc-400">{state}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </Frame>
  );
}

function Trends() {
  return (
    <Frame section="trends">
      <TrendRadar />
      <SourceRegistry />
    </Frame>
  );
}

function Library() {
  return (
    <Frame section="library">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="border-white/8 bg-zinc-950/60">
          <CardHeader><CardTitle className="text-white">خزنة الحقوق</CardTitle><CardDescription className="mt-2 text-zinc-500">كل مادة تتطلب مصدرًا وترخيصًا وحالة مراجعة قبل دخول الإنتاج.</CardDescription></CardHeader>
          <CardContent><AssetVault /></CardContent>
        </Card>
        <Card className="border-white/8 bg-zinc-950/60">
          <CardHeader><CardTitle className="text-white">المراجع المدمجة</CardTitle><CardDescription className="mt-2 text-zinc-500">قائمة أولية قابلة للمراجعة والتوسعة.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {platformReferences.map((reference) => (
              <a key={reference.name} href={reference.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-white/7 bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-red-500/25 hover:bg-red-500/[0.03]">
                <div><p className="text-xs font-semibold text-zinc-200">{reference.name}</p><p className="mt-1 text-[11px] text-zinc-600">{reference.kind}</p></div>
                <ArrowUpRight className="h-4 w-4 text-zinc-500" />
              </a>
            ))}
          </CardContent>
        </Card>
      </section>
    </Frame>
  );
}

function Studio() {
  return (
    <Frame section="studio">
      <ProjectBriefStudio />
      <ScriptForge />
      <VisualForge />
    </Frame>
  );
}

function Review() {
  return (
    <Frame section="review">
      <section className="grid gap-5 lg:grid-cols-3">
        {["الحقوق", "السلامة", "الموافقة البشرية"].map((gate, index) => (
          <Card key={gate} className="border-white/8 bg-zinc-950/60">
            <CardHeader><div className="flex items-center justify-between"><span className="font-mono text-sm text-red-400">0{index + 1}</span><LockKeyhole className="h-5 w-5 text-zinc-500" /></div><CardTitle className="mt-5 text-lg text-white">{gate}</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-6 text-zinc-500">لا توجد مواد معلقة في هذه البوابة الآن. عند إضافة مشروع ستظهر كل الملاحظات والأدلة المطلوبة هنا.</p><div className="mt-5 flex items-center gap-2 text-xs text-zinc-600"><span className="h-2 w-2 rounded-full bg-zinc-700" /> بانتظار مشروع</div></CardContent>
          </Card>
        ))}
      </section>
      <PublishPreviewGate />
      <ReviewPublishDesk />
      <ReviewQueue />
    </Frame>
  );
}

function PublishPreviewGate() {
  const { data: projectVideoAssets } = trpc.daousha.projectVideoAssets.useQuery();
  const pair = projectVideoAssets?.find(item => item.project.status !== "published") ?? projectVideoAssets?.[0];
  const videoAsset = pair?.asset;
  const project = pair?.project;
  const utils = trpc.useUtils();
  const acknowledgePreview = trpc.daousha.acknowledgeProjectPreview.useMutation({
    onSuccess: () => { toast.success("تم حفظ إقرار معاينة الفيديو في سجل المشروع."); utils.daousha.projectVideoAssets.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const previewAcknowledged = Boolean(project?.previewAcknowledgedAt);

  return (
    <Card className="overflow-hidden border-red-500/20 bg-[linear-gradient(145deg,rgba(69,10,10,.22),rgba(9,9,11,.88))]">
      <CardHeader className="border-b border-white/8 pb-4">
        <CardTitle className="flex items-center gap-2 text-white"><Play className="h-5 w-5 text-red-400" /> معاينة إلزامية قبل النشر</CardTitle>
        <CardDescription className="mt-2 leading-6 text-zinc-500">لا يقبل مسار النشر العام في الدورات التالية أي طلب ما لم يتضمن إقرارًا بأن النسخة النهائية عُرضت داخل هذه البوابة.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
          {videoAsset?.storageUrl ? <video controls preload="metadata" src={videoAsset.storageUrl} className="aspect-video w-full bg-black" /> : <div className="flex aspect-video items-center justify-center text-sm text-zinc-500">لا يوجد فيديو نهائي متاح للمعاينة بعد.</div>}
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/8 bg-black/20 p-4">
          <div><p className="text-sm font-semibold text-zinc-100">{videoAsset?.title ?? "بانتظار ملف فيديو"}</p><p className="mt-2 text-xs leading-6 text-zinc-500">شاهد الفيديو، وتحقق من الصوت والترجمة والرسالة والحقوق قبل طلب النشر. الإقرار لا ينشر الفيديو بنفسه؛ إنه شرط منفصل عن التأكيد العلني.</p></div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/[0.02] p-3"><span className="text-xs text-zinc-300">راجعت النسخة النهائية داخل المنصة</span><Button size="sm" variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08] hover:text-white" disabled={!videoAsset?.storageUrl || !project || previewAcknowledged || acknowledgePreview.isPending} onClick={() => project && acknowledgePreview.mutate({ projectId: project.id })}>{previewAcknowledged ? "تم الحفظ" : acknowledgePreview.isPending ? "جارٍ الحفظ…" : "حفظ الإقرار"}</Button></div>
          <Badge className={previewAcknowledged ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/10" : "border border-amber-500/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/10"}>{previewAcknowledged ? "المعاينة مُقَرّة" : "المعاينة مطلوبة"}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function Automation() {
  return (
    <Frame section="automation">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="border-white/8 bg-zinc-950/60">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Clock3 className="h-5 w-5 text-red-400" /> قواعد التشغيل</CardTitle><CardDescription className="mt-2 leading-6 text-zinc-500">الأتمتة تسرّع العمل، لكنها لا تتجاوز الحقوق والسلامة وسقف النشر.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["تحويل الأفكار المعتمدة إلى موجز إنتاج", "مفعّل عند الطلب", true],
              ["فحص اكتمال بيانات الترخيص", "مفعّل دائمًا", true],
              ["إرسال أي مشروع إلى النشر النهائي", "محجوب حتى اجتياز الحواجز والربط الرسمي", false],
            ].map(([name, detail, enabled]) => (
              <div key={String(name)} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div><p className="text-sm font-medium text-zinc-200">{name as string}</p><p className="mt-1 text-xs text-zinc-600">{detail as string}</p></div><Switch checked={enabled as boolean} onCheckedChange={() => toast("تُحفظ قواعد التشغيل عند ربط محرك الجدولة.")} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-red-500/18 bg-[linear-gradient(145deg,rgba(69,10,10,.4),rgba(9,9,11,.8))]">
          <CardHeader><Bot className="h-7 w-7 text-red-300" /><CardTitle className="mt-4 text-white">تشغيل مستمر، بحراسة مستمرة.</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-7 text-zinc-400">يقسم المحرك العمل إلى دورات قصيرة مسجلة: رصد، تقييم، إنتاج، ثم رفع. لا يعيد النشر عند الفشل، ولا يتجاوز الحد الزمني أو سقف النشر اليومي، ومفتاح الإيقاف يقطع الرفع الجديد فورًا.</p><Button className="mt-6 bg-red-600 hover:bg-red-500" onClick={() => toast("فعّل قواعد النشر والربط من مركز القنوات في الإعدادات.")}><Plus className="ml-2 h-4 w-4" /> ضبط المحرك</Button></CardContent>
        </Card>
      </section>
      <ContentMixPanel />
      <ScheduleDeck />
    </Frame>
  );
}

function Insights() {
  return (
    <Frame section="insights">
      <PerformanceInsights />
      <AnalyticsBridge />
    </Frame>
  );
}

function Evolution() {
  return (
    <Frame section="evolution">
      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="border-red-500/18 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><Bot className="h-5 w-5 text-red-400" /> مبدأ التطوير المحكوم</CardTitle></CardHeader><CardContent><p className="text-sm leading-7 text-zinc-400">دعوشة يمكنه تسجيل اقتراح لمصدر أو قاعدة أو قدرة جديدة عندما يكتشف حاجة حقيقية. لكنه لا يضيف كودًا، ولا يربط مصدرًا، ولا يغيّر النشر من تلقاء نفسه. كل اقتراح يظل في هذا السجل حتى تعتمدَه.</p><div className="mt-5 rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3 text-xs leading-6 text-red-100/70"><ShieldCheck className="ml-2 inline h-4 w-4 text-red-400" /> التحكم البشري شرط بنيوي، وليس زرًا تجميليًا.</div></CardContent></Card>
        <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="text-white">اقتراحات أولية</CardTitle><CardDescription className="mt-2 text-zinc-500">لا توجد تحديثات تم تنفيذها تلقائيًا.</CardDescription></CardHeader><CardContent className="space-y-3">{[["مصدر لقطات جديد", "راجع رخصته وشروط استخدام واجهته قبل التفعيل."],["محلل احتفاظ بالفيديو", "يتطلب وصولًا رسميًا إلى بيانات المنصة."],["مترجم مراجعة ثانٍ", "يُقترح عند ظهور فرق كبير بين النص والترجمة."]].map(([title, detail]) => <div key={title} className="flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4"><div><p className="text-sm font-medium text-zinc-200">{title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p></div><Badge variant="outline" className="border-amber-500/25 bg-amber-500/[0.04] text-amber-200">مقترح</Badge></div>)}</CardContent></Card>
      </section>
      <ChangeLogPanel />
    </Frame>
  );
}

function Settings() {
  return (
    <Frame section="settings">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[["القنوات الرسمية", "اربط YouTube أو TikTok أو Instagram من الواجهات الرسمية عند الجاهزية.", Globe2],["التخزين السحابي", "ملفات المشاريع والمواد تبقى منظمة في تخزين آمن مع بياناتها الوصفية.", UploadCloud],["التنبيهات", "استلم تنبيهًا عند تعثر مهمة أو وصول فيديو لبوابة المراجعة.", BellRing]].map(([title, detail, Icon]) => { const ItemIcon = Icon as React.ElementType; return <Card key={String(title)} className="border-white/8 bg-zinc-950/60"><CardHeader><ItemIcon className="h-6 w-6 text-red-400" /><CardTitle className="mt-5 text-white">{title as string}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-zinc-500">{detail as string}</p><Button variant="outline" className="mt-5 w-full border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white" onClick={() => toast("يحتاج هذا الربط إلى موافقتك وبيانات الوصول الخاصة بك.")}>تهيئة الربط</Button></CardContent></Card>})}
      </section>
      <ChannelControlCenter />
      <Card className="border-red-500/18 bg-zinc-950/60"><CardHeader><CardTitle className="text-white">دورة التحديث والنشر</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm leading-7 text-zinc-400 md:grid-cols-2"><p><b className="text-red-300">تحديث فوري:</b> إضافة مشروع أو مادة أو مصدر أو تعديل إعداد موجود يظهر فور الحفظ داخل النسخة المنشورة.</p><p><b className="text-red-300">إصدار جديد:</b> تغيير واجهة دعوشة أو الكود أو إضافة قدرة جديدة يتطلب حفظ نسخة جديدة ثم الضغط على Publish لنقلها للموقع العام.</p></CardContent></Card>
    </Frame>
  );
}

export default function Workspace({ section }: { section: Section }) {
  const screens: Record<Section, React.ReactNode> = {
    dashboard: <Dashboard />,
    trends: <Trends />,
    library: <Library />,
    studio: <Studio />,
    review: <Review />,
    automation: <Automation />,
    insights: <Insights />,
    evolution: <Evolution />,
    settings: <Settings />,
  };
  return screens[section];
}
