import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  CalendarCheck2,
  Compass,
  MessageSquareQuote,
  Mail,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Users,
  Ship,
  PlusCircle,
} from "lucide-react";
import {
  adminAuth,
  type AdminUser,
  type DashboardData,
  type RecentBooking,
} from "@/services/adminAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Sunset Lagoon Boat House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [currentUser, dashboardData] = await Promise.all([
          adminAuth.getMe(),
          adminAuth.getDashboardData(),
        ]);
        setAdmin(currentUser);
        setData(dashboardData);
      } catch (err: any) {
        console.error("Dashboard data load error:", err);
        if (err?.status === 401 || err?.status === 403) {
          navigate({ to: "/admin/login" });
          return;
        }
        setError(
          err?.message ||
            "Unable to retrieve live dashboard metrics. Please check your internet connection or try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      navigate({ to: "/admin/login" });
      return;
    }
    fetchDashboard(true);
  }, [navigate, fetchDashboard]);

  const stats = data?.statistics;
  const recentBookings = data?.recent_bookings || [];

  const badgeCounts = {
    bookings: stats?.pending_bookings ?? 0,
    messages: stats?.unread_contact_messages ?? 0,
    reviews: stats?.pending_reviews ?? 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle className="h-3 w-3" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal-300">
            <CheckCircle className="h-3 w-3" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
            <XCircle className="h-3 w-3" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <Clock className="h-3 w-3" />
            <span className="capitalize">{status}</span>
          </span>
        );
    }
  };

  return (
    <AdminLayout admin={admin} pageTitle="Dashboard Overview" badgeCounts={badgeCounts}>
      <div className="space-y-8">
        {/* Welcome & Top Controls Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-amber-100">
              Welcome back, {admin?.name || "Administrator"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Real-time operational overview for Sunset Lagoon Boat House Bentota.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(false)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 hover:border-amber-500/50 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
            </button>
          </div>
        </div>

        {/* Error Alert if request failed */}
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
            <button
              onClick={() => fetchDashboard(true)}
              className="shrink-0 font-semibold underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick Actions Strip */}
        <div className="rounded-xl border border-slate-800/90 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 p-4 sm:p-5 shadow-lg">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 font-sans">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Link
              to="/admin/bookings"
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900 hover:text-amber-200 group"
            >
              <span className="flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-amber-400" />
                <span>View Bookings</span>
              </span>
              <ArrowRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 group-hover:text-amber-300 transition-all" />
            </Link>

            <Link
              to="/admin/bookings"
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900 hover:text-amber-200 group"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                <span>Add Booking</span>
              </span>
              <ArrowRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 group-hover:text-amber-300 transition-all" />
            </Link>

            <Link
              to="/admin/boats"
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900 hover:text-amber-200 group"
            >
              <span className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-amber-400" />
                <span>Manage Boats</span>
              </span>
              <ArrowRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 group-hover:text-amber-300 transition-all" />
            </Link>

            <Link
              to="/admin/schedules"
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900 hover:text-amber-200 group"
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Safari Schedule</span>
              </span>
              <ArrowRight className="h-3 w-3 text-slate-500 group-hover:translate-x-0.5 group-hover:text-amber-300 transition-all" />
            </Link>
          </div>
        </div>

        {/* Statistics Cards Grid (Sunset Lagoon Palette) */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium tracking-wide text-amber-100">
              Operational Statistics
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Live Database Feed
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse"
                >
                  <div className="h-4 w-24 rounded bg-slate-800 mb-4" />
                  <div className="h-8 w-16 rounded bg-slate-800 mb-3" />
                  <div className="h-3 w-32 rounded bg-slate-800/60" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary Safari Operations Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Today's Bookings & Guests */}
                <div className="rounded-xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-[#0c1f24] p-5 shadow-md hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Today's Bookings
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <CalendarCheck2 className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-2 font-serif text-3xl font-medium text-amber-100">
                    {stats?.today_bookings ?? 0}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px]">
                    <div className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Users className="h-3.5 w-3.5" />
                      <span>{stats?.today_guests ?? 0} Today's Guests</span>
                    </div>
                    <Link
                      to="/admin/bookings"
                      className="text-amber-400/80 hover:text-amber-300 font-medium hover:underline text-[10px]"
                    >
                      View Today →
                    </Link>
                  </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="rounded-xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-[#0c1f24] p-5 shadow-md hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Upcoming Bookings
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-2 font-serif text-3xl font-medium text-amber-100">
                    {stats?.upcoming_bookings ?? 0}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px]">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span className="font-bold">{stats?.confirmed_bookings ?? 0}</span>
                      <span className="text-slate-400">Confirmed total</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">
                      {stats?.total_bookings ?? 0} all-time
                    </span>
                  </div>
                </div>

                {/* Pending Bookings */}
                <div className="rounded-xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-[#0c1f24] p-5 shadow-md hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Pending Bookings
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-medium text-amber-400">
                      {stats?.pending_bookings ?? 0}
                    </span>
                    {(stats?.pending_bookings ?? 0) > 0 && (
                      <span className="inline-flex size-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px]">
                    <span className="text-amber-300/80">Requires confirmation</span>
                    <Link
                      to="/admin/bookings"
                      className="text-amber-400 hover:text-amber-300 font-medium hover:underline text-[10px]"
                    >
                      Review →
                    </Link>
                  </div>
                </div>

                {/* Available Boats */}
                <div className="rounded-xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-[#0c1f24] p-5 shadow-md hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Available Boats
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                      <Ship className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-2 font-serif text-3xl font-medium text-amber-100">
                    {stats?.available_boats ?? 0}{" "}
                    <span className="text-sm font-sans font-normal text-slate-400">
                      / {stats?.total_boats ?? 2} Fleet
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px]">
                    <span className="text-emerald-400 font-medium">Ready for departure</span>
                    <Link
                      to="/admin/boats"
                      className="text-amber-400/80 hover:text-amber-300 font-medium hover:underline text-[10px]"
                    >
                      Boats →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Secondary Operational Strip: Reviews, Inquiries & Experiences */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Compass className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-200">
                        {stats?.active_experiences ?? 0} Safari Experiences
                      </div>
                      <div className="text-[10px] text-slate-400">Active on public website</div>
                    </div>
                  </div>
                  <Link to="/admin/experiences" className="text-amber-400/80 hover:text-amber-300 text-[10px] font-medium">
                    Manage →
                  </Link>
                </div>

                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <MessageSquareQuote className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-200">
                        {stats?.total_reviews ?? 0} Guest Reviews
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {stats?.approved_reviews ?? 0} approved · {stats?.pending_reviews ?? 0} pending
                      </div>
                    </div>
                  </div>
                  <Link to="/admin/reviews" className="text-amber-400/80 hover:text-amber-300 text-[10px] font-medium">
                    Moderate →
                  </Link>
                </div>

                <div className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-200">
                        {stats?.unread_contact_messages ?? 0} Unread Messages
                      </div>
                      <div className="text-[10px] text-slate-400">Customer contact inquiries</div>
                    </div>
                  </div>
                  <Link to="/admin/messages" className="text-amber-400/80 hover:text-amber-300 text-[10px] font-medium">
                    Inbox →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Bookings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-medium tracking-wide text-amber-100">
                Recent Bookings
              </h2>
              <p className="text-xs text-slate-400">
                Latest customer safari reservations received through the website.
              </p>
            </div>

            <Link
              to="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>View All Bookings</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-md">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-amber-500" />
                <span>Loading recent booking records...</span>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 text-slate-500">
                  <CalendarCheck2 className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-base font-medium text-slate-300">
                  No bookings recorded yet
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  When visitors submit a safari reservation on the public website, their bookings will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th scope="col" className="px-5 py-3.5">Reference</th>
                      <th scope="col" className="px-5 py-3.5">Guest</th>
                      <th scope="col" className="px-5 py-3.5">Experience</th>
                      <th scope="col" className="px-5 py-3.5">Date & Time</th>
                      <th scope="col" className="px-5 py-3.5">Party Size</th>
                      <th scope="col" className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentBookings.map((booking: RecentBooking) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-slate-800/40"
                      >
                        {/* Reference */}
                        <td className="px-5 py-4 font-mono font-semibold text-amber-300 whitespace-nowrap">
                          {booking.booking_reference}
                        </td>

                        {/* Guest */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-300">
                              <User className="h-3 w-3" />
                            </div>
                            <span className="font-medium text-slate-100">{booking.full_name}</span>
                          </div>
                        </td>

                        {/* Experience */}
                        <td className="px-5 py-4 text-slate-300">
                          {booking.experience?.title || "Bentota Boat Safari"}
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-4 text-slate-300 whitespace-nowrap">
                          <div>{booking.booking_date}</div>
                          {booking.preferred_time && (
                            <div className="text-[10px] text-slate-500">{booking.preferred_time}</div>
                          )}
                        </td>

                        {/* Guests */}
                        <td className="px-5 py-4 whitespace-nowrap text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                            <span>{booking.number_of_guests} {booking.number_of_guests === 1 ? "Guest" : "Guests"}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {getStatusBadge(booking.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
