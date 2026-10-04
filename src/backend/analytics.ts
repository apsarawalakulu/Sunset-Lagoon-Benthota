import { createServerFn } from "@tanstack/react-start";
import { db, ensureSchema } from "./db";
import { requireAdmin } from "./auth";

type Row = Record<string, unknown>;
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export interface AnalyticsDaily {
  date: string;
  views: number;
  visitors: number;
}

export interface AnalyticsPage {
  path: string;
  views: number;
  visitors: number;
}

export interface AnalyticsReferrer {
  host: string;
  views: number;
}

export interface AnalyticsSummary {
  visitors: number;
  pageViews: number;
  bounceRate: number;
  onlineNow: number;
  daily: AnalyticsDaily[];
  topPages: AnalyticsPage[];
  referrers: AnalyticsReferrer[];
}

/** Record one page view. Public, no auth. Admin pages are never tracked (see tracker). */
export const trackPageViewFn = createServerFn({ method: "POST" })
  .inputValidator((d: { path: string; referrer?: string | null | undefined; visitorId: string }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const path = String(data.path || "").slice(0, 200);
    if (!/^\/[a-z0-9/_\-.]*$/i.test(path)) return { success: false };
    if (path.startsWith("/admin")) return { success: false };
    const visitorId = String(data.visitorId || "").slice(0, 64) || "anon";
    const referrer = String(data.referrer || "").slice(0, 500) || null;
    let host: string | null = null;
    if (referrer) {
      try {
        host = new URL(referrer).hostname.toLowerCase();
      } catch {
        host = null;
      }
    }
    const sql = db();
    // Ignore rapid double-fires (React strict effects, double taps).
    const recent = await sql`
      SELECT id FROM page_views
      WHERE visitor_id = ${visitorId} AND path = ${path} AND created_at > NOW() - INTERVAL '30 seconds'
      LIMIT 1
    `;
    if (recent.length === 0) {
      await sql`
        INSERT INTO page_views (path, referrer, referrer_host, visitor_id)
        VALUES (${path}, ${referrer}, ${host}, ${visitorId})
      `;
    }
    return { success: true };
  });

const SELF_HOSTS = ["localhost", "127.0.0.1", "sunsetlagoon.boats"];

export const analyticsOverviewFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; days?: number | undefined }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await ensureSchema();
    const sql = db();
    const days = data.days === 30 ? 30 : 7;

    const totals = await sql`
      SELECT COUNT(*)::int AS views, COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views WHERE created_at >= CURRENT_DATE - (${days - 1} || ' days')::interval
    `;
    const online = await sql`
      SELECT COUNT(DISTINCT visitor_id)::int AS c
      FROM page_views WHERE created_at > NOW() - INTERVAL '5 minutes'
    `;
    const bounce = await sql`
      WITH vd AS (
        SELECT visitor_id, created_at::date AS d, COUNT(*) AS c
        FROM page_views WHERE created_at >= CURRENT_DATE - (${days - 1} || ' days')::interval
        GROUP BY visitor_id, created_at::date
      )
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE c = 1)::int AS single
      FROM vd
    `;
    const daily = await sql`
      SELECT to_char(g.d, 'YYYY-MM-DD') AS date,
        COUNT(pv.id)::int AS views,
        COUNT(DISTINCT pv.visitor_id)::int AS visitors
      FROM generate_series(CURRENT_DATE - (${days - 1} || ' days')::interval, CURRENT_DATE, '1 day') AS g(d)
      LEFT JOIN page_views pv ON pv.created_at::date = g.d
      GROUP BY g.d ORDER BY g.d ASC
    `;
    const pages = await sql`
      SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views WHERE created_at >= CURRENT_DATE - (${days - 1} || ' days')::interval
      GROUP BY path ORDER BY views DESC LIMIT 8
    `;
    const refs = await sql`
      SELECT referrer_host AS host, COUNT(*)::int AS views
      FROM page_views
      WHERE created_at >= CURRENT_DATE - (${days - 1} || ' days')::interval
        AND referrer_host IS NOT NULL
      GROUP BY referrer_host ORDER BY views DESC LIMIT 8
    `;

    const t = (totals[0] as unknown as Row) ?? {};
    const b = (bounce[0] as unknown as Row) ?? {};
    const bTotal = num(b["total"]);
    const summary: AnalyticsSummary = {
      visitors: num(t["visitors"]),
      pageViews: num(t["views"]),
      bounceRate: bTotal > 0 ? Math.round((num(b["single"]) / bTotal) * 100) : 0,
      onlineNow: num((online[0] as unknown as Row)?.["c"]),
      daily: (daily as unknown as Row[]).map((r) => ({
        date: String(r["date"] ?? ""),
        views: num(r["views"]),
        visitors: num(r["visitors"]),
      })),
      topPages: (pages as unknown as Row[]).map((r) => ({
        path: String(r["path"] ?? "/"),
        views: num(r["views"]),
        visitors: num(r["visitors"]),
      })),
      referrers: (refs as unknown as Row[])
        .map((r) => ({ host: String(r["host"] ?? ""), views: num(r["views"]) }))
        .filter((r) => r.host !== "" && !SELF_HOSTS.some((s) => r.host === s || r.host.endsWith(`.${s}`) || r.host.endsWith("vercel.app"))),
    };
    return { success: true, data: summary };
  });
