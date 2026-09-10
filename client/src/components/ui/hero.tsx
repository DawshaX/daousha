import { cn } from "@/lib/utils";

export interface HeroBannerProps {
  children: React.ReactNode;
  subtitle?: string;
  buttonText?: string;
  buttonOnClick?: () => void;
}

export function HeroBanner({ children, subtitle, buttonText = "ابدأ الآن", buttonOnClick }: HeroBannerProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-violet-950 via-violet-1000 to-violet-950 py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-3xl rounded-full opacity-80" />
      </div>
      <div className="relative z-10 text-center max-w-4xl">
        {children}
        {subtitle && <p className="mt-6 text-violet-300 text-lg leading-relaxed max-w-2xl">{subtitle}</p>}
        {buttonOnClick && (
          <button
            onClick={buttonOnClick}
            className="mt-8 inline-flex items-center rounded-md bg-violet-600 px-6 py-3 text-lg font-semibold text-white hover:bg-violet-500 transition-colors shadow-[0_4px_20px_rgba(147,51,234,.3)]"
          >
            {buttonText}
          </button>
        )}
      </div>
    </section>
  );
}

export interface FeatureCardProps {
  title: string;
  children: React.ReactNode;
}

export function FeatureCard({ title, children }: FeatureCardProps) {
  return (
    <div className="relative bg-violet-950/50 backdrop-blur border border-violet-500/20 rounded-2xl p-6 mt-8">
      <h3 className="font-medium title-violet mb-3 text-xl">{title}</h3>
      <div className="space-y-2 text-violet-300">{children}</div>
    </div>
  );
}