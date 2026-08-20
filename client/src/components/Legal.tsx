import { Link } from "wouter";

type LegalPageKind = "privacy" | "terms" | "data-deletion";

const contactEmail = "DawshaxLOL@gmail.com";

export const legalPages: Record<LegalPageKind, { eyebrow: string; title: string; intro: string; sections: Array<{ title: string; body: string }> }> = {
  privacy: {
    eyebrow: "XDAW NOVA Publisher · Privacy",
    title: "سياسة الخصوصية",
    intro: "تشرح هذه الصفحة كيف يتعامل تطبيق XDAW NOVA Publisher مع بيانات حسابات Meta المصرّح بها لإدارة صفحة المحتوى الرسمية.",
    sections: [
      { title: "البيانات التي نصل إليها", body: "لا يصل التطبيق إلا إلى بيانات صفحة Facebook التي يسمح بها مديرها عبر التفويض الرسمي، مثل معرّف الصفحة، حالة النشر، المنشورات التي أنشأها التطبيق، وقياسات التفاعل اللازمة للمتابعة." },
      { title: "سبب الاستخدام", body: "تستخدم البيانات لتنفيذ نشر محتوى أصلي معتمد، وتسجيل النتيجة داخل غرفة تحكم XDAW NOVA، وعرض مؤشرات أداء مرتبطة بالصفحة المفوضة فقط." },
      { title: "الحماية والمشاركة", body: "لا يبيع التطبيق البيانات ولا يشاركها مع أطراف إعلانية. تحفظ مفاتيح التفويض في مخزن أسرار محمي، وتقتصر صلاحيات الوصول على مسؤول الحساب والمستخدمين الذين يضيفهم مدير التطبيق رسميًا." },
      { title: "الاحتفاظ والاتصال", body: `يحتفظ التطبيق فقط بما يلزم للتشغيل والسجل التدقيقي. لطلب استفسار أو حذف بيانات، تواصل مع ${contactEmail}.` },
    ],
  },
  terms: {
    eyebrow: "XDAW NOVA Publisher · Terms",
    title: "شروط الخدمة",
    intro: "تحكم هذه الشروط استخدام تطبيق XDAW NOVA Publisher لإدارة ونشر المحتوى على الصفحات التي يملكها المستخدم أو يملك تفويضًا صريحًا لإدارتها.",
    sections: [
      { title: "الاستخدام المسموح", body: "يستخدم التطبيق فقط لنشر أو إدارة محتوى أصلي أو مرخّص، وبما يتوافق مع سياسات Meta والمنصة المستهدفة." },
      { title: "مسؤولية المدير", body: "يتحمل مدير الصفحة مسؤولية صحة التفويض، وملكية المواد، والامتثال للحقوق واللوائح قبل اعتماد أي نشر." },
      { title: "حدود التشغيل", body: "لا يضمن التطبيق نتائج مشاهدة أو دخلًا أو استمرارية أي خدمة خارجية. قد يتوقف النشر عند فشل الحواجز أو عند سحب التفويض أو تغيير سياسات المنصة." },
      { title: "التواصل", body: `للاستفسارات المتعلقة بهذه الشروط، اكتب إلى ${contactEmail}.` },
    ],
  },
  "data-deletion": {
    eyebrow: "XDAW NOVA Publisher · Data deletion",
    title: "تعليمات حذف البيانات",
    intro: "يمكن لمدير صفحة أو حساب مفوّض طلب حذف البيانات المرتبطة بتطبيق XDAW NOVA Publisher في أي وقت.",
    sections: [
      { title: "الطلب", body: `أرسل رسالة من البريد المرتبط بالحساب أو الصفحة إلى ${contactEmail} بعنوان «Data Deletion — XDAW NOVA».` },
      { title: "ما نحتاجه", body: "أدرج معرّف الصفحة أو رابطها واسم الحساب الذي منح التفويض، دون إرسال كلمات مرور أو رموز تحقق." },
      { title: "التنفيذ", body: "نلغي رموز التفويض المرتبطة ونحذف بيانات الاتصال والسجل التشغيلي التي لا تلزمنا قانونيًا أو أمنيًا للاحتفاظ بها." },
      { title: "التأكيد", body: "نرسل تأكيدًا على البريد نفسه بعد اكتمال المعالجة. يمكن كذلك إلغاء التفويض مباشرةً من إعدادات Meta الخاصة بالحساب." },
    ],
  },
};

export default function Legal({ kind }: { kind: LegalPageKind }) {
  const page = legalPages[kind];
  return (
    <main className="min-h-screen bg-[#09090b] px-5 py-10 text-zinc-100 sm:px-8 sm:py-16" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-red-500/30 pb-7">
          <p className="mb-3 font-mono text-xs tracking-[0.18em] text-red-400" dir="ltr">{page.eyebrow}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-300">{page.intro}</p>
        </header>

        <section className="space-y-5">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[0_0_36px_rgba(239,68,68,0.05)]">
              <h2 className="text-lg font-semibold text-red-300">{section.title}</h2>
              <p className="mt-2 leading-8 text-zinc-300">{section.body}</p>
            </article>
          ))}
        </section>

        <footer className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <Link href="/privacy" className="hover:text-red-300">الخصوصية</Link>
          <Link href="/terms" className="hover:text-red-300">الشروط</Link>
          <Link href="/data-deletion" className="hover:text-red-300">حذف البيانات</Link>
          <Link href="/" className="hover:text-red-300">العودة إلى XDAW NOVA</Link>
        </footer>
      </div>
    </main>
  );
}
