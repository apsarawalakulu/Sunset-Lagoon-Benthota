import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ChartColumn,
  Eye,
  MousePointerClick,
  Radio,
  Undo2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminAuth } from "@/services/adminAuth";
import { analyticsApi, type AnalyticsSummary } from "@/services/analyticsApi";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Website Analytics | Admin | Sunset Lagoon Boat House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAnalyticsPage,
});

const EMPTY: AnalyticsSummary = {
  visitors: 0,
  pageViews: 0,
  bounceRate: 0,
  onlineNow: 0,
  daily: [],
  topPages: [],
  referrers: [],
};

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="size-4 text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-2 font-serif text-4xl font-light text-slate-100">
        {value}
        {suffix && <span className="text-xl text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}

function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(adminAuth.getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<AnalyticsSummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (!adminAuth.isAuthenticated()) {
        navigate({ to: "/admin/login" });
        return;
      }
      try {
        const user = await adminAuth.getMe();
        if (isMounted) {
          setAdmin(user);
          setAuthLoading(false);
        }
      } catch {
        if (isMounted) navigate({ to: "/admin/login" });
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await analyticsApi.overview(days);
      setData(summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load analytics.";
      if (/session|Unauthorized/i.test(msg)) {
        navigate({ to: "/admin/login" });
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [days, navigate]);

  useEffect(() => {
    if (!authLoading && admin) load();
  }, [load, authLoading, admin]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#071318] text-slate-300">
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <AdminLayout admin={admin} pageTitle="Website Analytics">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/80">
              <ChartColumn className="size-4" /> First-party tracking
            </p>
            <h1 className="mt-1 font-serif text-3xl font-light text-slate-100">Website Analytics</h1>
            <p className="mt-1 text-sm text-slate-400">
              Visitors, page views and traffic sources for the public site. Admin visits are excluded.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 p-1">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  days === d ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Eye} label="Visitors" value={loading ? "—" : data.visitors} />
          <StatCard icon={MousePointerClick} label="Page views" value={loading ? "—" : data.pageViews} />
          <StatCard icon={Undo2} label="Bounce rate" value={loading ? "—" : data.bounceRate} suffix={loading ? "" : "%"} />
          <StatCard icon={Radio} label="Online now" value={loading ? "—" : data.onlineNow} />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Traffic · last {days} days</h2>
          <div className="mt-4 h-64">
            {loading ? (
              <div className="grid h-full place-items-center text-sm text-slate-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Area type="monotone" dataKey="views" name="Page views" stroke="#f59e0b" strokeWidth={2} fill="url(#viewsFill)" />
                  <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#34d399" strokeWidth={2} fill="url(#visitorsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Top pages</h2>
            {data.topPages.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No page views yet in this period.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {data.topPages.map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-[13px] text-slate-200">{p.path}</span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {p.views} views · {p.visitors} visitors
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Top referrers</h2>
            {data.referrers.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No external referrers yet — most visitors arrive directly or via Google search.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {data.referrers.map((r) => (
                  <li key={r.host} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-[13px] text-slate-200">{r.host}</span>
                    <span className="shrink-0 text-xs text-slate-400">{r.views} visits</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
