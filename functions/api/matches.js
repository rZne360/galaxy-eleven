// Cloudflare Pages Function: fetches fixtures + scores for the Premier League, La Liga and Champions League
// from football-data.org (free plan) and caches the answer for 60 seconds so many visitors = 1 request/minute.
const LG = { PL: "E", PD: "L", CL: "C" };
const json = (o, status = 200, extra = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...extra } });

export async function onRequest(ctx) {
  const cache = caches.default;
  const key = new Request(new URL(ctx.request.url).origin + "/api/matches");
  const hit = await cache.match(key);
  if (hit) return hit;
  const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  try {
    const r = await fetch(
      `https://api.football-data.org/v4/matches?competitions=PL,PD,CL&dateFrom=${day(-3)}&dateTo=${day(6)}`,
      { headers: { "X-Auth-Token": ctx.env.FOOTBALL_DATA_KEY } }
    );
    if (!r.ok) throw new Error("football-data.org answered " + r.status);
    const j = await r.json();
    const m = j.matches.map(x => ({
      k: "f" + x.id, id: x.id, lg: LG[x.competition.code],
      h: String(x.homeTeam.id), a: String(x.awayTeam.id),
      hn: x.homeTeam.shortName || x.homeTeam.name, an: x.awayTeam.shortName || x.awayTeam.name,
      hl: x.homeTeam.crest, al: x.awayTeam.crest,
      hs: x.score.fullTime.home ?? 0, as: x.score.fullTime.away ?? 0,
      t: x.utcDate,
      fin: x.status === "FINISHED" || x.status === "AWARDED",
      live: x.status === "IN_PLAY" || x.status === "PAUSED",
      min: null, wp: null
    }));
    const res = json({ m, updated: new Date().toISOString() }, 200, { "Cache-Control": "public, max-age=60" });
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (e) {
    return json({ error: String(e.message) }, 502);
  }
}
