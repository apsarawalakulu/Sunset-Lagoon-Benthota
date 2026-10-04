import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  Archive,
  Trash2,
  Eye,
  X,
  Clock,
  Send,
  User,
  Inbox,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { adminAuth, type AdminUser, type DashboardData } from "@/services/adminAuth";
import {
  adminMessagesApi,
  type ContactMessageItem,
  type ContactMessageStats,
  type MessageStatus,
} from "@/services/adminMessages";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Contact Messages | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [stats, setStats] = useState<ContactMessageStats>({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0,
    archived: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal states
  const [activeMessage, setActiveMessage] = useState<ContactMessageItem | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<ContactMessageItem | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const loadMessages = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [currentUser, msgResponse, dashData] = await Promise.all([
          adminAuth.getMe(),
          adminMessagesApi.getMessages({
            status: selectedStatus,
            search: searchTerm,
          }),
          adminAuth.getDashboardData().catch(() => null),
        ]);

        setAdmin(currentUser);
        setMessages(msgResponse.data || []);
        if (msgResponse.stats) {
          setStats(msgResponse.stats);
        }
        if (dashData) {
          setDashboardData(dashData);
        }
      } catch (err: any) {
        console.error("Messages load error:", err);
        if (err?.status === 401 || err?.status === 403) {
          navigate({ to: "/admin/login" });
          return;
        }
        setError(
          err?.message ||
            "Unable to retrieve contact messages. Please check your internet connection."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate, selectedStatus, searchTerm]
  );

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadMessages(true);
  }, [navigate, loadMessages]);

  // Handle Quick Status Actions
  const handleMarkAsRead = async (message: ContactMessageItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading(message.id);
    try {
      const res = await adminMessagesApi.markAsRead(message.id);
      setSuccessMessage(`Message from ${message.name} marked as read.`);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? res.data : m))
      );
      if (activeMessage?.id === message.id) {
        setActiveMessage(res.data);
      }
      // Refresh live stats
      const updated = await adminMessagesApi.getMessages({
        status: selectedStatus,
        search: searchTerm,
      });
      setStats(updated.stats);
    } catch (err: any) {
      setError(err?.message || "Failed to mark message as read.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsReplied = async (message: ContactMessageItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading(message.id);
    try {
      const res = await adminMessagesApi.markAsReplied(message.id);
      setSuccessMessage(`Message from ${message.name} marked as replied.`);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? res.data : m))
      );
      if (activeMessage?.id === message.id) {
        setActiveMessage(res.data);
      }
      const updated = await adminMessagesApi.getMessages({
        status: selectedStatus,
        search: searchTerm,
      });
      setStats(updated.stats);
    } catch (err: any) {
      setError(err?.message || "Failed to mark message as replied.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (message: ContactMessageItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading(message.id);
    try {
      const res = await adminMessagesApi.markAsArchived(message.id);
      setSuccessMessage(`Message from ${message.name} archived.`);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? res.data : m))
      );
      if (activeMessage?.id === message.id) {
        setActiveMessage(res.data);
      }
      const updated = await adminMessagesApi.getMessages({
        status: selectedStatus,
        search: searchTerm,
      });
      setStats(updated.stats);
    } catch (err: any) {
      setError(err?.message || "Failed to archive message.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsUnread = async (message: ContactMessageItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoading(message.id);
    try {
      const res = await adminMessagesApi.updateStatus(message.id, "unread");
      setSuccessMessage(`Message from ${message.name} marked as unread.`);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? res.data : m))
      );
      if (activeMessage?.id === message.id) {
        setActiveMessage(res.data);
      }
      const updated = await adminMessagesApi.getMessages({
        status: selectedStatus,
        search: searchTerm,
      });
      setStats(updated.stats);
    } catch (err: any) {
      setError(err?.message || "Failed to update message status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingMessage) return;
    const target = deletingMessage;
    setActionLoading(target.id);
    try {
      await adminMessagesApi.deleteMessage(target.id);
      setSuccessMessage(`Message from ${target.name} deleted permanently.`);
      setMessages((prev) => prev.filter((m) => m.id !== target.id));
      if (activeMessage?.id === target.id) {
        setActiveMessage(null);
      }
      setDeletingMessage(null);
      const updated = await adminMessagesApi.getMessages({
        status: selectedStatus,
        search: searchTerm,
      });
      setStats(updated.stats);
    } catch (err: any) {
      setError(err?.message || "Failed to delete message.");
    } finally {
      setActionLoading(null);
    }
  };

  const openMessageDetail = (message: ContactMessageItem) => {
    setActiveMessage(message);
    // Auto-mark as read if opened while unread
    if (message.status === "unread") {
      handleMarkAsRead(message);
    }
  };

  // Badge counts for Admin Layout navigation
  const badgeCounts = useMemo(
    () => ({
      bookings: dashboardData?.statistics?.pending_bookings ?? 0,
      messages: stats.unread,
      reviews: dashboardData?.statistics?.pending_reviews ?? 0,
    }),
    [dashboardData, stats.unread]
  );

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case "unread":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>New / Unread</span>
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
            <Check className="h-3 w-3" />
            <span>Read</span>
          </span>
        );
      case "replied":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            <span>Replied</span>
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
            <Archive className="h-3 w-3" />
            <span>Archived</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/40 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminLayout admin={admin} pageTitle="Contact Inquiries" badgeCounts={badgeCounts}>
      <div className="space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-xs">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-medium tracking-tight text-amber-100 sm:text-3xl">
                  Contact Inquiries
                </h1>
                <p className="text-xs text-slate-400">
                  Manage inquiries submitted through the public website contact form.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => loadMessages(false)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-amber-200 disabled:opacity-50"
              title="Refresh messages feed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {/* Total Messages */}
          <div
            onClick={() => setSelectedStatus("all")}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              selectedStatus === "all"
                ? "border-amber-500/60 bg-slate-900/90 shadow-md shadow-amber-950/20"
                : "border-slate-800/90 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                All Inquiries
              </span>
              <Inbox className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 font-serif text-2xl font-medium text-amber-100 sm:text-3xl">
              {stats.total}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">All customer messages</div>
          </div>

          {/* New / Unread */}
          <div
            onClick={() => setSelectedStatus("unread")}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              selectedStatus === "unread"
                ? "border-amber-500 bg-amber-500/10 shadow-md shadow-amber-950/30"
                : "border-slate-800/90 bg-slate-900/50 hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                New / Unread
              </span>
              <span className="relative flex h-2 w-2">
                {stats.unread > 0 && (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </>
                )}
              </span>
            </div>
            <div className="mt-2 font-serif text-2xl font-medium text-amber-400 sm:text-3xl">
              {stats.unread}
            </div>
            <div className="mt-1 text-[10px] text-amber-300/70">Awaiting attention</div>
          </div>

          {/* Read */}
          <div
            onClick={() => setSelectedStatus("read")}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              selectedStatus === "read"
                ? "border-sky-500/60 bg-sky-500/10 shadow-md"
                : "border-slate-800/90 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                Read
              </span>
              <Check className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2 font-serif text-2xl font-medium text-sky-100 sm:text-3xl">
              {stats.read}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">Opened inquiries</div>
          </div>

          {/* Replied */}
          <div
            onClick={() => setSelectedStatus("replied")}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              selectedStatus === "replied"
                ? "border-emerald-500/60 bg-emerald-500/10 shadow-md"
                : "border-slate-800/90 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                Replied
              </span>
              <Send className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 font-serif text-2xl font-medium text-emerald-100 sm:text-3xl">
              {stats.replied}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">Addressed by team</div>
          </div>

          {/* Archived */}
          <div
            onClick={() => setSelectedStatus("archived")}
            className={`col-span-2 sm:col-span-1 cursor-pointer rounded-xl border p-4 transition-all ${
              selectedStatus === "archived"
                ? "border-slate-600 bg-slate-800/60 shadow-md"
                : "border-slate-800/90 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Archived
              </span>
              <Archive className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 font-serif text-2xl font-medium text-slate-300 sm:text-3xl">
              {stats.archived}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">Past inquiries</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 shadow-sm">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Messages", count: stats.total },
              { id: "unread", label: "New / Unread", count: stats.unread },
              { id: "read", label: "Read", count: stats.read },
              { id: "replied", label: "Replied", count: stats.replied },
              { id: "archived", label: "Archived", count: stats.archived },
            ].map((tab) => {
              const active = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-xs"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search sender, email, phone, text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 pl-8.5 pr-8 text-xs text-slate-200 placeholder-slate-500 transition-colors focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Message Feed / Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-slate-800 bg-slate-900/40 p-4 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-40 rounded bg-slate-800" />
                  <div className="h-4 w-20 rounded bg-slate-800" />
                </div>
                <div className="mt-3 h-3 w-3/4 rounded bg-slate-800/60" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-800/40" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/90 bg-slate-900/30 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500 mb-4">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-slate-300">
              No contact messages found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {searchTerm
                ? `No messages matched your search query "${searchTerm}".`
                : selectedStatus !== "all"
                ? `There are currently no messages in the "${selectedStatus}" status.`
                : "Customer messages submitted through the public website will appear here."}
            </p>
            {(searchTerm || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSelectedStatus("all");
                  setSearchTerm("");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-amber-400 hover:border-slate-700 hover:text-amber-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isUnread = message.status === "unread";
              const isReplied = message.status === "replied";
              const isArchived = message.status === "archived";

              return (
                <div
                  key={message.id}
                  onClick={() => openMessageDetail(message)}
                  className={`group relative rounded-xl border p-4 sm:p-5 transition-all cursor-pointer ${
                    isUnread
                      ? "border-amber-500/50 bg-gradient-to-r from-slate-900 via-slate-900/90 to-[#0e2229] shadow-sm shadow-amber-950/20 hover:border-amber-400"
                      : isReplied
                      ? "border-emerald-500/20 bg-slate-900/60 hover:border-emerald-500/40"
                      : isArchived
                      ? "border-slate-800/50 bg-slate-950/40 opacity-75 hover:opacity-100 hover:border-slate-700"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main Content & Sender Info */}
                    <div className="space-y-2 max-w-3xl">
                      {/* Top Meta Line: Sender, Status, Date */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isUnread ? "text-amber-100" : "text-slate-200"
                            }`}
                          >
                            {message.name}
                          </span>
                        </div>

                        {getStatusBadge(message.status)}

                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{message.created_at_formatted}</span>
                          <span>·</span>
                          <span>{message.created_at_diff}</span>
                        </span>
                      </div>

                      {/* Subject */}
                      <div className="font-serif text-base font-medium text-amber-200/95">
                        {message.subject || "(No subject provided)"}
                      </div>

                      {/* Message Preview */}
                      <p className="text-xs leading-relaxed text-slate-300 line-clamp-2">
                        {message.message}
                      </p>

                      {/* Contact Channels Strip */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-300">
                          <Mail className="h-3 w-3 text-amber-400/80" />
                          <span>{message.email}</span>
                        </span>

                        {message.phone && (
                          <span className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-300">
                            <Phone className="h-3 w-3 text-emerald-400/80" />
                            <span>{message.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div
                      className="flex flex-wrap items-center gap-1.5 pt-2 lg:pt-0 lg:flex-col lg:items-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Direct Contact Channels */}
                      <div className="flex items-center gap-1">
                        {/* Email Action */}
                        <a
                          href={message.quick_actions.email_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] font-medium text-amber-300 hover:border-amber-500/50 hover:bg-slate-900 transition-colors"
                          title={`Send email to ${message.email}`}
                        >
                          <Mail className="h-3 w-3" />
                          <span>Email</span>
                        </a>

                        {/* Call Action */}
                        {message.quick_actions.tel_url && (
                          <a
                            href={message.quick_actions.tel_url}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] font-medium text-sky-300 hover:border-sky-500/50 hover:bg-slate-900 transition-colors"
                            title={`Call ${message.phone}`}
                          >
                            <Phone className="h-3 w-3" />
                            <span>Call</span>
                          </a>
                        )}

                        {/* WhatsApp Action */}
                        {message.quick_actions.whatsapp_url && (
                          <a
                            href={message.quick_actions.whatsapp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-900/40 transition-colors"
                            title={`Chat on WhatsApp with ${message.name}`}
                          >
                            <MessageCircle className="h-3 w-3 text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* State Change Quick Toggles */}
                      <div className="flex items-center gap-1 pt-1">
                        {isUnread ? (
                          <button
                            onClick={(e) => handleMarkAsRead(message, e)}
                            disabled={actionLoading === message.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:text-amber-200"
                            title="Mark as Read"
                          >
                            <Check className="h-3 w-3 text-sky-400" />
                            <span className="hidden sm:inline">Mark Read</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleMarkAsUnread(message, e)}
                            disabled={actionLoading === message.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:text-amber-300"
                            title="Mark as Unread"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden sm:inline">Unread</span>
                          </button>
                        )}

                        {!isReplied && (
                          <button
                            onClick={(e) => handleMarkAsReplied(message, e)}
                            disabled={actionLoading === message.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-950/30"
                            title="Mark as Replied"
                          >
                            <Send className="h-3 w-3" />
                            <span className="hidden sm:inline">Replied</span>
                          </button>
                        )}

                        {!isArchived ? (
                          <button
                            onClick={(e) => handleArchive(message, e)}
                            disabled={actionLoading === message.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            title="Archive message"
                          >
                            <Archive className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleMarkAsRead(message, e)}
                            disabled={actionLoading === message.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            title="Unarchive to Read"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden sm:inline">Unarchive</span>
                          </button>
                        )}

                        {/* Open Details */}
                        <button
                          onClick={() => openMessageDetail(message)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-amber-400 hover:border-amber-500/40 hover:text-amber-300"
                          title="View complete inquiry"
                        >
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">View</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingMessage(message);
                          }}
                          className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-1 text-slate-500 hover:border-rose-500/40 hover:text-rose-400"
                          title="Delete message permanently"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message Details Modal */}
        {activeMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-[#071318] p-6 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => setActiveMessage(null)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl font-medium text-amber-100">
                    {activeMessage.name}
                  </span>
                  {getStatusBadge(activeMessage.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>{activeMessage.created_at_formatted}</span>
                    <span>({activeMessage.created_at_diff})</span>
                  </span>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="my-4 grid grid-cols-1 gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Email Address</span>
                  <div className="mt-0.5 flex items-center gap-2 font-medium text-slate-200">
                    <Mail className="h-3.5 w-3.5 text-amber-400" />
                    <a
                      href={activeMessage.quick_actions.email_url}
                      className="hover:text-amber-300 hover:underline"
                    >
                      {activeMessage.email}
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Phone Number</span>
                  <div className="mt-0.5 flex items-center gap-2 font-medium text-slate-200">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    {activeMessage.phone ? (
                      <a
                        href={activeMessage.quick_actions.tel_url || "#"}
                        className="hover:text-emerald-300 hover:underline"
                      >
                        {activeMessage.phone}
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Contact Actions Strip */}
              <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 mb-2">
                  Quick Customer Contact Actions
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={activeMessage.quick_actions.email_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 transition-all"
                  >
                    <Mail className="h-4 w-4 text-amber-400" />
                    <span>Email Customer</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>

                  {activeMessage.quick_actions.tel_url && (
                    <a
                      href={activeMessage.quick_actions.tel_url}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 transition-all"
                    >
                      <Phone className="h-4 w-4 text-sky-400" />
                      <span>Call Customer</span>
                    </a>
                  )}

                  {activeMessage.quick_actions.whatsapp_url && (
                    <a
                      href={activeMessage.quick_actions.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition-all"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      <span>WhatsApp Customer</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>

              {/* Subject & Message Content */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Subject</span>
                  <h4 className="mt-0.5 font-serif text-lg font-medium text-amber-100">
                    {activeMessage.subject || "(No subject)"}
                  </h4>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Message Content</span>
                  <div className="mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap selection:bg-amber-500/30">
                    {activeMessage.message}
                  </div>
                </div>
              </div>

              {/* Status Action Buttons Footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeMessage.status !== "read" && (
                    <button
                      onClick={() => handleMarkAsRead(activeMessage)}
                      disabled={actionLoading === activeMessage.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-sky-300 hover:border-sky-500/40 hover:bg-slate-800"
                    >
                      <Check className="h-3.5 w-3.5 text-sky-400" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  {activeMessage.status !== "replied" && (
                    <button
                      onClick={() => handleMarkAsReplied(activeMessage)}
                      disabled={actionLoading === activeMessage.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <Send className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Mark as Replied</span>
                    </button>
                  )}

                  {activeMessage.status !== "archived" ? (
                    <button
                      onClick={() => handleArchive(activeMessage)}
                      disabled={actionLoading === activeMessage.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Archive</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAsRead(activeMessage)}
                      disabled={actionLoading === activeMessage.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Unarchive</span>
                    </button>
                  )}

                  {activeMessage.status !== "unread" && (
                    <button
                      onClick={() => handleMarkAsUnread(activeMessage)}
                      disabled={actionLoading === activeMessage.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-amber-400 hover:border-amber-500/40"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Mark as Unread</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeletingMessage(activeMessage)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>

                  <button
                    onClick={() => setActiveMessage(null)}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-gradient-to-b from-slate-900 to-[#071318] p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-rose-200">
                  Delete Contact Message?
                </h3>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                Are you sure you want to permanently delete the inquiry from{" "}
                <span className="font-semibold text-amber-200">
                  {deletingMessage.name}
                </span>{" "}
                ({deletingMessage.email})? This action cannot be undone.
              </p>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeletingMessage(null)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === deletingMessage.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500 bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
