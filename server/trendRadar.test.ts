import { describe, expect, it } from "vitest";
import { calculateTrendPriority, parseGoogleTrendsRss } from "./trendRadar";

describe("Google Trends radar parser", () => {
  it("retains the source, title, time, and traffic reference from an RSS item", () => {
    const xml = `<rss><channel><item><title><![CDATA[موضوع عربي]]></title><pubDate>Fri, 14 Aug 2026 02:30:00 -0700</pubDate><ht:approx_traffic xmlns:ht="urn:test">200K+</ht:approx_traffic></item></channel></rss>`;
    expect(parseGoogleTrendsRss(xml, "https://trends.google.com/trending/rss?geo=EG")).toEqual([{
      title: "موضوع عربي",
      publishedAt: "Fri, 14 Aug 2026 02:30:00 -0700",
      approximateTraffic: "200K+",
      priority: "high",
      sourceName: "Google Trends",
      sourceUrl: "https://trends.google.com/trending/rss?geo=EG",
    }]);
  });

  it("uses approximate traffic only as a transparent review priority", () => {
    expect(calculateTrendPriority("100K+")).toBe("high");
    expect(calculateTrendPriority("25K+")).toBe("medium");
    expect(calculateTrendPriority(null)).toBe("review");
  });
});
