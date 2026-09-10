import DashboardLayout from "@/components/DashboardLayout";
import { HeroBanner, StartButton, FeatureCard } from "@/components/ui/hero";

export default function Home() {
  return (
    <DashboardLayout>
      <HeroBanner>
        <h1 className="text-5xl md:text-6xl font-black tracking-wider title-font violet-400 mb-4">
          Daousha —<br />
          <span className="violet-300">Content Automation Engine</span>
        </h1>
        <p className="text-violet-300 text-lg max-w-2xl leading-relaxed">
          المصنع الذكي لإنتاج ونشر المحتوى القصري تلقائياً على جميع المنصات
        </p>
        <FeatureCard>
          <h3 className="font-medium title-violet mb-3">ما نقدمه:</h3>
          <ul className="list-disc list-inside space-y-2 text-violet-300">
            <li>إنتاج فيديو 9:16 بأسلوب سينمائي</li>
            <li>غلاف ولوجو مميز بـ "دوشة"</li>
            <li>تعليق صوتي بأسلوب Charing</li>
            <li>نشر آلي الساعةي على YouTube & Instagram & Facebook</li>
            <li>فحص TikTok والربط التلقائي</li>
            <li>إشعارات تلجرام فورية</li>
          </ul>
        </FeatureCard>
        <StartButton onClick={() => window.location.href="/automation"}>
          تبدأ الرحلة
        </StartButton>
      </HeroBanner>
    </DashboardLayout>
  );
}