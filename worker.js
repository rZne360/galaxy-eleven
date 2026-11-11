// Galaxy Eleven – Cloudflare Worker. Serves the website from /public and provides /api/matches and /api/news.
const LG = { PL: "E", PD: "L", CL: "C" };
const FEEDS = [
  ["BBC Sport", "https://feeds.bbci.co.uk/sport/football/rss.xml"],
  ["The Guardian", "https://www.theguardian.com/football/rss"],
  ["Sky Sports", "https://www.skysports.com/rss/12040"]
];
const memo = {};
// remembers each answer for a while so many visitors cause very few requests to the data provider
async function cached(key, ttl, fn) {
  const c = memo[key];
  if (c && Date.now() - c.t < ttl * 1e3) return c.v;
  try { const v = await fn(); memo[key] = { t: Date.now(), v }; return v; }
  catch (e) { if (c) return c.v; throw e; }
}
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "Cache-Control": "public, max-age=30" } });

async function matches(env) {
  if (!env.FOOTBALL_DATA_KEY) throw new Error("FOOTBALL_DATA_KEY is not set in Settings > Variables and Secrets");
  const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const r = await fetch(`https://api.football-data.org/v4/matches?competitions=PL,PD,CL&dateFrom=${day(-3)}&dateTo=${day(6)}`,
    { headers: { "X-Auth-Token": env.FOOTBALL_DATA_KEY } });
  if (!r.ok) throw new Error("football-data.org answered " + r.status);
  const j = await r.json();
  return {
    updated: new Date().toISOString(),
    m: j.matches.map(x => ({
      k: "f" + x.id, id: x.id, lg: LG[x.competition.code],
      h: String(x.homeTeam.id), a: String(x.awayTeam.id),
      hn: x.homeTeam.shortName || x.homeTeam.name, an: x.awayTeam.shortName || x.awayTeam.name,
      hl: x.homeTeam.crest, al: x.awayTeam.crest,
      hs: x.score.fullTime.home ?? 0, as: x.score.fullTime.away ?? 0,
      t: x.utcDate,
      fin: x.status === "FINISHED" || x.status === "AWARDED",
      live: x.status === "IN_PLAY" || x.status === "PAUSED",
      min: null, wp: null
    }))
  };
}

const tag = (s, t) => { const m = s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : ""; };
const dec = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const ago = d => { const h = (Date.now() - d) / 36e5; return h < 1 ? "just now" : h < 24 ? Math.floor(h) + "h ago" : Math.floor(h / 24) + "d ago"; };

async function news() {
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
  return all.sort((a, b) => b.d - a.d).filter(x => !seen.has(x.title) && seen.add(x.title)).slice(0, 24)
    .map(x => [/transfer|sign|loan|bid|deal|January|contract|joins|agree/i.test(x.title) ? "Transfers" : "Football", x.title, x.name + " · " + ago(x.d), x.link]);
}

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;
    try {
      if (p === "/api/matches") return json(await cached("m", 60, () => matches(env)));
      if (p === "/api/news") return json(await cached("n", 900, news));
    } catch (e) { return json({ error: String(e.message) }, 502); }
    return env.ASSETS.fetch(req);
  }
};
