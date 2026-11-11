// Cloudflare Pages Function: collects football headlines (title + link only) from public RSS feeds.
// Edit FEEDS to add or remove sources. Check each publisher's terms for commercial use.
const FEEDS = [
  ["BBC Sport", "https://feeds.bbci.co.uk/sport/football/rss.xml"],
  ["The Guardian", "https://www.theguardian.com/football/rss"],
  ["Sky Sports", "https://www.skysports.com/rss/12040"]
];
const tag = (s, t) => { const m = s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : ""; };
const dec = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const ago = d => { const h = (Date.now() - d) / 36e5; return h < 1 ? "just now" : h < 24 ? Math.floor(h) + "h ago" : Math.floor(h / 24) + "d ago"; };

export async function onRequest(ctx) {
  const cache = caches.default, key = new Request(new URL(ctx.request.url).origin + "/api/news");
  const hit = await cache.match(key); if (hit) return hit;
  const all = [];
  await Promise.all(FEEDS.map(async ([name, url]) => {
    try {
      const xml = await (await fetch(url, { headers: { "user-agent": "GalaxyEleven/1.0" } })).text();
      for (const it of xml.split(/<item[ >]/).slice(1, 14)) {
        const title = dec(tag(it, "title")), link = tag(it, "link") || (it.match(/<link>([^<]+)/) || [])[1];
        const d = new Date(tag(it, "pubDate")).getTime();
        if (title && /^https?:\/\//.test(link || "") && d) all.push({ title, link, d, name });
      }
    } catch (e) {}
  }));
  const seen = new Set();
  const out = all.sort((a, b) => b.d - a.d).filter(x => !seen.has(x.title) && seen.add(x.title)).slice(0, 24)
    .map(x => [/transfer|sign|loan|bid|deal|January|contract|joins|agree/i.test(x.title) ? "Transfers" : "Football", x.title, x.name + " · " + ago(x.d), x.link]);
  const res = new Response(JSON.stringify(out), { headers: { "content-type": "application/json", "Cache-Control": "public, max-age=900" } });
  if (out.length) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
