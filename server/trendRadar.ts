export type TrendSignal = {
  title: string;
  publishedAt: string | null;
  approximateTraffic: string | null;
  priority: "high" | "medium" | "review";
  sourceName: "Google Trends";
  sourceUrl: string;
};

const cache = new Map<string, { expiresAt: number; signals: TrendSignal[] }>();
const CACHE_MS = 10 * 60 * 1_000;

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function tagValue(fragment: string, tag: string) {
  const match = fragment.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? decodeXml(match[1]) : null;
}

export function calculateTrendPriority(approximateTraffic: string | null) {
  const normalized = approximateTraffic?.toUpperCase().replace(/[+,\s]/g, "") ?? "";
  const match = normalized.match(/^(\d+(?:\.\d+)?)([KM])?$/);
  if (!match) return "review" as const;
  const value = Number(match[1]) * (match[2] === "M" ? 1_000_000 : match[2] === "K" ? 1_000 : 1);
  return value >= 100_000 ? "high" as const : value >= 10_000 ? "medium" as const : "review" as const;
}

export function parseGoogleTrendsRss(xml: string, sourceUrl: string): TrendSignal[] {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)).flatMap(match => {
    const title = tagValue(match[1], "title");
    if (!title) return [];
    const approximateTraffic = tagValue(match[1], "ht:approx_traffic");
    return [{
      title,
      publishedAt: tagValue(match[1], "pubDate"),
      approximateTraffic,
      priority: calculateTrendPriority(approximateTraffic),
      sourceName: "Google Trends" as const,
      sourceUrl,
    }];
  });
}

export async function fetchGoogleTrendSignals(geo: "EG" | "US") {
  const cached = cache.get(geo);
  if (cached && cached.expiresAt > Date.now()) return cached.signals;
  const sourceUrl = `https://trends.google.com/trending/rss?geo=${geo}`;
  const response = await fetch(sourceUrl, { headers: { "user-agent": "XDAW-NOVA-TrendRadar/1.0" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error("تعذر جلب موجز Google Trends الآن.");
  const signals = parseGoogleTrendsRss(await response.text(), sourceUrl);
  if (!signals.length) throw new Error("لم يرجع موجز Google Trends إشارات قابلة للعرض الآن.");
  cache.set(geo, { expiresAt: Date.now() + CACHE_MS, signals });
  return signals;
}
