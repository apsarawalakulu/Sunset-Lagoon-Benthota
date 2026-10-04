import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useId } from "react";
import {
  Clock,
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Users,
  Compass,
  Sparkles,
  CalendarCheck2,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Ship,
  AlertTriangle,
  Anchor,
} from "lucide-react";
import { adminAuth, type AdminUser } from "@/services/adminAuth";
import {
  scheduleApi,
  type Schedule,
  type TimeSlot,
  type AvailableBoatItem,
} from "@/services/scheduleApi";
import { api, type ExperienceData } from "@/services/api";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/schedules")({
  head: () => ({
    meta: [
      { title: "Schedule & Time Slot Management | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSchedulesPage,
});

function AdminSchedulesPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active tab: "slots" | "templates"
  const [activeTab, setActiveTab] = useState<"slots" | "templates">("slots");

  // Filter state for departure slots
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedExpFilter, setSelectedExpFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  // Data states
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);

  // Loading states
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [assigningBoatSlot, setAssigningBoatSlot] = useState<TimeSlot | null>(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Schedule | null>(null);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingSlot, setBlockingSlot] = useState<TimeSlot | null>(null);
  const [blockStatus, setBlockStatus] = useState<"blocked" | "closed" | "available">("blocked");
  const [blockNotes, setBlockNotes] = useState("");

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateStartDate, setGenerateStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [generateEndDate, setGenerateEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [generateExpId, setGenerateExpId] = useState<string>("all");

  // Load Admin Session
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

  // Load Experiences
  useEffect(() => {
    api.getExperiences().then((res) => {
      if (res?.data) setExperiences(res.data);
    }).catch(console.error);
  }, []);

  // Fetch Time Slots for selected date
  const fetchTimeSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedExpFilter !== "all") params.experience_id = Number(selectedExpFilter);
      if (selectedStatusFilter !== "all") params.status = selectedStatusFilter;

      const slots = await scheduleApi.getTimeSlots(params);
      setTimeSlots(slots);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to load departure time slots." });
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedExpFilter, selectedStatusFilter]);

  // Fetch Master Schedule Templates
  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const templates = await scheduleApi.getSchedules();
      setSchedules(templates);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to load schedule templates." });
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (activeTab === "slots") {
        fetchTimeSlots();
      } else {
        fetchSchedules();
      }
    }
  }, [authLoading, activeTab, fetchTimeSlots, fetchSchedules]);

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  const setDateToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Block / Reopen Slot Handler
  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingSlot) return;
    setActionLoading(true);
    try {
      await scheduleApi.updateSlotStatus(blockingSlot.id, blockStatus, blockNotes || null);
      setFeedback({
        type: "success",
        message: `Departure slot has been marked as ${blockStatus}.`,
      });
      setShowBlockModal(false);
      setBlockingSlot(null);
      fetchTimeSlots();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to update slot status." });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Slot Handler
  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm("Are you sure you want to delete this departure slot?")) return;
    setActionLoading(true);
    try {
      await scheduleApi.deleteTimeSlot(slotId);
      setFeedback({ type: "success", message: "Departure slot deleted successfully." });
      fetchTimeSlots();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Cannot delete departure slot." });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Generate Slots Handler
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await scheduleApi.generateSlots({
        start_date: generateStartDate,
        end_date: generateEndDate,
        experience_id: generateExpId !== "all" ? Number(generateExpId) : undefined,
      });
      setFeedback({ type: "success", message: res.message });
      setShowGenerateModal(false);
      fetchTimeSlots();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to generate departure slots." });
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule Template Delete Handler
  const handleDeleteTemplate = async (templateId: number) => {
    if (!window.confirm("Are you sure you want to delete this schedule template?")) return;
    setActionLoading(true);
    try {
      await scheduleApi.deleteSchedule(templateId);
      setFeedback({ type: "success", message: "Schedule template deleted successfully." });
      fetchSchedules();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to delete schedule template." });
    } finally {
      setActionLoading(false);
    }
  };

  // Status Badge Component
  const getSlotBadge = (status: string) => {
    switch (status) {
      case "blocked":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
            <Lock className="h-3 w-3" />
            <span>Blocked</span>
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/40 bg-slate-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
            <XCircle className="h-3 w-3" />
            <span>Closed</span>
          </span>
        );
      case "full":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <Users className="h-3 w-3" />
            <span>Full (0 Left)</span>
          </span>
        );
      case "available":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle className="h-3 w-3" />
            <span>Available</span>
          </span>
        );
    }
  };

  // Calculated Day Summary
  const daySummary = {
    total: timeSlots.length,
    available: timeSlots.filter((s) => s.effective_status === "available").length,
    full: timeSlots.filter((s) => s.effective_status === "full").length,
    blocked: timeSlots.filter((s) => s.status === "blocked" || s.status === "closed").length,
    totalBookedGuests: timeSlots.reduce((acc, s) => acc + (s.booked_guests || 0), 0),
    totalCapacity: timeSlots.reduce((acc, s) => acc + (s.capacity || 0), 0),
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071318] text-slate-200">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400 font-sans">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span>Validating Schedule Permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout admin={admin} pageTitle="Schedule & Time Slots">
      <div className="space-y-6">
        {/* Top Header & Overview */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-amber-100">
              Schedule & Time Slot Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Control safari departures, boat capacities, real-time seat availability, and slot blocking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Auto-Generate Slots</span>
            </button>

            {activeTab === "slots" ? (
              <button
                onClick={() => {
                  setEditingSlot(null);
                  setShowSlotModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-400 transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Time Slot</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-400 transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Template</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-xs ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-200"
                : "border-red-500/30 bg-red-950/40 text-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="flex border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("slots")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-all cursor-pointer ${
              activeTab === "slots"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CalendarCheck2 className="h-4 w-4" />
            <span>Daily Departures & Capacity</span>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-all cursor-pointer ${
              activeTab === "templates"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Recurring Schedule Templates ({schedules.length})</span>
          </button>
        </div>

        {/* TAB 1: DAILY TIME SLOTS & CALENDAR VIEW */}
        {activeTab === "slots" && (
          <div className="space-y-6">
            {/* Date Navigator & Filters Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Date Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => shiftDate(-1)}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-amber-300 transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <button
                  onClick={() => shiftDate(1)}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-amber-300 transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={setDateToday}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-amber-300 transition-colors"
                >
                  Today
                </button>
              </div>

              {/* Experience & Status Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Experience:</span>
                  <select
                    value={selectedExpFilter}
                    onChange={(e) => setSelectedExpFilter(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="all">All Experiences</option>
                    {experiences.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Status:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="blocked">Blocked</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <button
                  onClick={fetchTimeSlots}
                  disabled={loadingSlots}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-amber-300 transition-colors"
                  title="Refresh Departures"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingSlots ? "animate-spin text-amber-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Daily Metric Overview Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Date
                </div>
                <div className="mt-1 font-serif text-lg font-medium text-amber-200">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Departures
                </div>
                <div className="mt-1 font-serif text-lg font-medium text-slate-100">
                  {daySummary.total} Slots
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                  Available Slots
                </div>
                <div className="mt-1 font-serif text-lg font-medium text-emerald-300">
                  {daySummary.available} Open
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                  Passenger Seats
                </div>
                <div className="mt-1 font-serif text-lg font-medium text-amber-100">
                  {daySummary.totalBookedGuests} / {daySummary.totalCapacity}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-center">
                <div className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">
                  Blocked / Closed
                </div>
                <div className="mt-1 font-serif text-lg font-medium text-rose-300">
                  {daySummary.blocked} Slots
                </div>
              </div>
            </div>

            {/* Time Slots Table */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-md">
              {loadingSlots ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-500" />
                  <span>Loading departures for {selectedDate}...</span>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-base font-medium text-slate-300">
                    No departures scheduled for this date
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Generate departures from your active recurring templates, or add a custom departure time slot.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                    >
                      Generate From Templates
                    </button>
                    <button
                      onClick={() => {
                        setEditingSlot(null);
                        setShowSlotModal(true);
                      }}
                      className="rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                    >
                      Add Custom Slot
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-5 py-3.5">Departure Time</th>
                        <th className="px-5 py-3.5">Experience Package</th>
                        <th className="px-5 py-3.5">Assigned Vessel</th>
                        <th className="px-5 py-3.5">Capacity & Bookings</th>
                        <th className="px-5 py-3.5">Available Seats</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {timeSlots.map((slot) => {
                        const bookedPercentage =
                          slot.capacity > 0
                            ? Math.min(100, Math.round((slot.booked_guests / slot.capacity) * 100))
                            : 0;

                        return (
                          <tr
                            key={slot.id}
                            className={`transition-colors ${
                              slot.status === "blocked"
                                ? "bg-red-950/10 hover:bg-red-950/20"
                                : "hover:bg-slate-800/40"
                            }`}
                          >
                            {/* Time */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-400" />
                                <span className="font-semibold text-slate-100">
                                  {slot.formatted_time}
                                </span>
                              </div>
                              {slot.schedule && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {slot.schedule.name}
                                </div>
                              )}
                            </td>

                            {/* Experience */}
                            <td className="px-5 py-4">
                              <div className="font-medium text-amber-100">
                                {slot.experience?.title || "Bentota Boat Safari"}
                              </div>
                              {slot.notes && (
                                <div className="text-[10px] text-slate-400 italic mt-0.5">
                                  Note: {slot.notes}
                                </div>
                              )}
                            </td>

                            {/* Assigned Vessel */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              {slot.boat ? (
                                <button
                                  onClick={() => setAssigningBoatSlot(slot)}
                                  className="group inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-500/20 transition"
                                  title="Click to change or manage assigned boat"
                                >
                                  <Ship className="h-3.5 w-3.5 text-amber-400" />
                                  <span className="font-semibold">{slot.boat.name}</span>
                                  <span className="font-mono text-[10px] text-amber-400/70">
                                    ({slot.boat.registration_number})
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setAssigningBoatSlot(slot)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-400 hover:border-amber-500/40 hover:text-amber-300 transition"
                                  title="Assign a vessel to this departure"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Assign Boat</span>
                                </button>
                              )}
                            </td>

                            {/* Capacity Progress */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="w-36">
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-slate-300 font-medium">
                                    {slot.booked_guests} / {slot.capacity}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    {bookedPercentage}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      slot.is_full
                                        ? "bg-amber-500"
                                        : bookedPercentage > 50
                                          ? "bg-emerald-500"
                                          : "bg-teal-500"
                                    }`}
                                    style={{ width: `${bookedPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Available Seats */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`font-serif text-base font-semibold ${
                                  slot.available_seats === 0
                                    ? "text-slate-500"
                                    : slot.available_seats <= 2
                                      ? "text-amber-400"
                                      : "text-emerald-400"
                                }`}
                              >
                                {slot.available_seats} Seats
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              {getSlotBadge(slot.effective_status)}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 whitespace-nowrap text-right space-x-1">
                              {slot.status === "blocked" ? (
                                <button
                                  onClick={() => {
                                    setBlockingSlot(slot);
                                    setBlockStatus("available");
                                    setBlockNotes("");
                                    setShowBlockModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/20 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/30"
                                  title="Reopen slot"
                                >
                                  <Unlock className="h-3 w-3" />
                                  <span>Reopen</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setBlockingSlot(slot);
                                    setBlockStatus("blocked");
                                    setBlockNotes(slot.notes || "");
                                    setShowBlockModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-950/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-900/30"
                                  title="Block slot for maintenance or weather"
                                >
                                  <Lock className="h-3 w-3" />
                                  <span>Block</span>
                                </button>
                              )}

                              <button
                                onClick={() => setAssigningBoatSlot(slot)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-300"
                                title="Assign or manage vessel"
                              >
                                <Ship className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setEditingSlot(slot);
                                  setShowSlotModal(true);
                                }}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-300"
                                title="Edit capacity / times"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={slot.booked_guests > 0}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  slot.booked_guests > 0
                                    ? "Cannot delete slot with active bookings"
                                    : "Delete slot"
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RECURRING SCHEDULE TEMPLATES */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-medium text-amber-100">
                  Master Departure Templates
                </h2>
                <p className="text-xs text-slate-400">
                  These recurring templates automatically generate daily departure slots.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Template</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingSchedules ? (
                <div className="col-span-full p-12 text-center text-xs text-slate-500">
                  <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-500" />
                  <span>Loading schedule templates...</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-800 p-8 text-center text-xs text-slate-400">
                  No schedule templates created yet. Click "New Template" to add your first standard departure.
                </div>
              ) : (
                schedules.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-sm space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                          <Compass className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-serif text-base font-medium text-amber-100">
                            {tpl.name}
                          </h3>
                          <div className="text-[11px] text-slate-400">
                            {tpl.experience?.title}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          tpl.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {tpl.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timing:</span>
                        <span className="font-mono text-amber-200">
                          {tpl.start_time} - {tpl.end_time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recurrence:</span>
                        <span>
                          {tpl.is_recurring
                            ? tpl.day_of_week === null
                              ? "Daily (All Days)"
                              : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
                                  tpl.day_of_week
                                ]
                            : tpl.specific_date || "Specific Date"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Default Capacity:</span>
                        <span className="font-medium text-slate-200">{tpl.default_capacity} Guests</span>
                      </div>
                      {tpl.notes && (
                        <div className="text-[11px] text-slate-400 italic pt-1">
                          "{tpl.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-800/80 pt-3">
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setShowTemplateModal(true);
                        }}
                        className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-amber-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: BLOCK / REOPEN SLOT */}
        {showBlockModal && blockingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-serif text-lg font-medium text-amber-100">
                  Update Slot Operational Status
                </h3>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleBlockSubmit} className="space-y-4 text-xs">
                <div>
                  <div className="text-slate-400">Departure:</div>
                  <div className="font-medium text-amber-200 text-sm mt-0.5">
                    {blockingSlot.experience?.title} · {blockingSlot.formatted_time}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date: {blockingSlot.date} · Booked Guests: {blockingSlot.booked_guests}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-block-status" className="font-semibold text-slate-300">Operational Status</label>
                  <select
                    id="modal-block-status"
                    value={blockStatus}
                    onChange={(e: any) => setBlockStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
                  >
                    <option value="available">Available (Open for bookings)</option>
                    <option value="blocked">Blocked (Maintenance, Private Charter, Weather)</option>
                    <option value="closed">Closed (Permanently shut for this day)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-block-reason" className="font-semibold text-slate-300">Reason / Notes</label>
                  <textarea
                    id="modal-block-reason"
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Engine maintenance, high river swell, or private booking..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none placeholder:text-slate-600"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowBlockModal(false)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                  >
                    {actionLoading ? "Updating..." : "Save Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: AUTO-GENERATE DEPARTURE SLOTS */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-serif text-lg font-medium">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span>Auto-Generate Departure Slots</span>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateSubmit} className="space-y-4 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  Generate concrete departure time slots from your active recurring templates across a selected date window. Existing slots will not be overwritten.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-gen-start" className="font-semibold text-slate-300">Start Date</label>
                    <input
                      id="modal-gen-start"
                      type="date"
                      required
                      value={generateStartDate}
                      onChange={(e) => setGenerateStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-gen-end" className="font-semibold text-slate-300">End Date</label>
                    <input
                      id="modal-gen-end"
                      type="date"
                      required
                      value={generateEndDate}
                      onChange={(e) => setGenerateEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-gen-exp" className="font-semibold text-slate-300">Experience Scope</label>
                  <select
                    id="modal-gen-exp"
                    value={generateExpId}
                    onChange={(e) => setGenerateExpId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
                  >
                    <option value="all">All Experiences ({experiences.length})</option>
                    {experiences.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                  >
                    {actionLoading ? "Generating..." : "Generate Slots"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD / EDIT TIME SLOT */}
        {showSlotModal && (
          <SlotFormModal
            experiences={experiences}
            slot={editingSlot}
            initialDate={selectedDate}
            onClose={() => {
              setShowSlotModal(false);
              setEditingSlot(null);
            }}
            onSaved={() => {
              setShowSlotModal(false);
              setEditingSlot(null);
              setFeedback({ type: "success", message: "Departure slot saved successfully." });
              fetchTimeSlots();
            }}
          />
        )}

        {/* MODAL 4: ADD / EDIT SCHEDULE TEMPLATE */}
        {showTemplateModal && (
          <TemplateFormModal
            experiences={experiences}
            template={editingTemplate}
            onClose={() => {
              setShowTemplateModal(false);
              setEditingTemplate(null);
            }}
            onSaved={() => {
              setShowTemplateModal(false);
              setEditingTemplate(null);
              setFeedback({ type: "success", message: "Schedule template saved successfully." });
              fetchSchedules();
            }}
          />
        )}

        {/* MODAL 5: ASSIGN / MANAGE BOAT */}
        {assigningBoatSlot && (
          <BoatAssignmentModal
            slot={assigningBoatSlot}
            onClose={() => setAssigningBoatSlot(null)}
            onSaved={() => {
              setAssigningBoatSlot(null);
              setFeedback({ type: "success", message: "Vessel assignment updated successfully." });
              fetchTimeSlots();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Sub-component: Add / Edit Single Time Slot Modal
function SlotFormModal({
  experiences,
  slot,
  initialDate,
  onClose,
  onSaved,
}: {
  experiences: ExperienceData[];
  slot: TimeSlot | null;
  initialDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const expSelectId = useId();
  const dateInputId = useId();
  const startInputId = useId();
  const endInputId = useId();
  const capInputId = useId();
  const statusSelectId = useId();
  const notesAreaId = useId();

  const [experienceId, setExperienceId] = useState<number>(
    slot?.experience_id || (experiences[0] ? Number(experiences[0].id) : 1)
  );
  const [date, setDate] = useState<string>(slot?.date || initialDate);
  const [startTime, setStartTime] = useState<string>(
    slot?.start_time ? slot.start_time.substring(0, 5) : "08:00"
  );
  const [endTime, setEndTime] = useState<string>(
    slot?.end_time ? slot.end_time.substring(0, 5) : "10:00"
  );
  const [capacity, setCapacity] = useState<number>(slot?.capacity || 8);
  const [status, setStatus] = useState<"available" | "blocked" | "closed">(
    slot?.status || "available"
  );
  const [notes, setNotes] = useState<string>(slot?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationInfo = (() => {
    if (!startTime || !endTime) return null;
    const sParts = startTime.split(":");
    const eParts = endTime.split(":");
    if (sParts.length < 2 || eParts.length < 2) return null;
    const sh = Number(sParts[0]);
    const sm = Number(sParts[1]);
    const eh = Number(eParts[0]);
    const em = Number(eParts[1]);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return { valid: false, text: "End time must be after start time" };
    if (diff % 60 === 0) {
      const h = diff / 60;
      return { valid: true, text: h === 1 ? "1 Hour" : `${h} Hours` };
    }
    if (diff % 30 === 0) {
      return { valid: true, text: `${diff / 60} Hours` };
    }
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { valid: true, text: h === 0 ? `${m} Mins` : `${h}h ${m}m` };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (slot) {
        await scheduleApi.updateTimeSlot(slot.id, {
          experience_id: experienceId,
          date,
          start_time: startTime,
          end_time: endTime,
          capacity,
          status,
          notes: notes || null,
        });
      } else {
        await scheduleApi.createTimeSlot({
          experience_id: experienceId,
          date,
          start_time: startTime,
          end_time: endTime,
          capacity,
          status,
          notes: notes || null,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Failed to save departure slot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-serif text-lg font-medium text-amber-100">
            {slot ? "Edit Departure Slot" : "Create New Departure Slot"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label htmlFor={expSelectId} className="font-semibold text-slate-300">Experience Package</label>
            <select
              id={expSelectId}
              value={experienceId}
              onChange={(e) => setExperienceId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
            >
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={dateInputId} className="font-semibold text-slate-300">Departure Date</label>
            <input
              id={dateInputId}
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor={startInputId} className="font-semibold text-slate-300">Start Time</label>
              <input
                id={startInputId}
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={endInputId} className="font-semibold text-slate-300">End Time</label>
              <input
                id={endInputId}
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          {durationInfo && (
            <div className={`rounded-md px-3 py-1.5 text-[11px] font-medium flex items-center justify-between ${
              durationInfo.valid
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : "bg-rose-950/30 border border-rose-500/20 text-rose-400"
            }`}>
              <span className="text-slate-400">Calculated Duration:</span>
              <span className="font-semibold">{durationInfo.text}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor={capInputId} className="font-semibold text-slate-300">Passenger Capacity</label>
              <input
                id={capInputId}
                type="number"
                min={1}
                max={100}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={statusSelectId} className="font-semibold text-slate-300">Initial Status</label>
              <select
                id={statusSelectId}
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              >
                <option value="available">Available</option>
                <option value="blocked">Blocked</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={notesAreaId} className="font-semibold text-slate-300">Notes (Optional)</label>
            <textarea
              id={notesAreaId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Afternoon mangrove tide window"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Saving..." : slot ? "Update Slot" : "Create Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Add / Edit Recurring Schedule Template Modal
function TemplateFormModal({
  experiences,
  template,
  onClose,
  onSaved,
}: {
  experiences: ExperienceData[];
  template: Schedule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tplExpId = useId();
  const tplNameId = useId();
  const tplRecId = useId();
  const tplDayId = useId();
  const tplStartId = useId();
  const tplEndId = useId();
  const tplCapId = useId();
  const tplStatusId = useId();
  const tplNotesId = useId();

  const [experienceId, setExperienceId] = useState<number>(
    template?.experience_id || (experiences[0] ? Number(experiences[0].id) : 1)
  );
  const [name, setName] = useState<string>(template?.name || "");
  const [isRecurring, setIsRecurring] = useState<boolean>(
    template?.is_recurring ?? true
  );
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    template?.day_of_week === null || template?.day_of_week === undefined
      ? "all"
      : String(template.day_of_week)
  );
  const [startTime, setStartTime] = useState<string>(
    template?.start_time ? template.start_time.substring(0, 5) : "07:00"
  );
  const [endTime, setEndTime] = useState<string>(
    template?.end_time ? template.end_time.substring(0, 5) : "09:00"
  );
  const [capacity, setCapacity] = useState<number>(template?.default_capacity || 8);
  const [status, setStatus] = useState<"active" | "inactive">(template?.status || "active");
  const [notes, setNotes] = useState<string>(template?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationInfo = (() => {
    if (!startTime || !endTime) return null;
    const sParts = startTime.split(":");
    const eParts = endTime.split(":");
    if (sParts.length < 2 || eParts.length < 2) return null;
    const sh = Number(sParts[0]);
    const sm = Number(sParts[1]);
    const eh = Number(eParts[0]);
    const em = Number(eParts[1]);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return { valid: false, text: "End time must be after start time" };
    if (diff % 60 === 0) {
      const h = diff / 60;
      return { valid: true, text: h === 1 ? "1 Hour" : `${h} Hours` };
    }
    if (diff % 30 === 0) {
      return { valid: true, text: `${diff / 60} Hours` };
    }
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { valid: true, text: h === 0 ? `${m} Mins` : `${h}h ${m}m` };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        experience_id: experienceId,
        name,
        is_recurring: isRecurring,
        day_of_week: dayOfWeek === "all" ? null : Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        default_capacity: capacity,
        status,
        notes: notes || null,
      };

      if (template) {
        await scheduleApi.updateSchedule(template.id, payload);
      } else {
        await scheduleApi.createSchedule(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Failed to save schedule template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-serif text-lg font-medium text-amber-100">
            {template ? "Edit Schedule Template" : "New Schedule Template"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label htmlFor={tplExpId} className="font-semibold text-slate-300">Experience Package</label>
            <select
              id={tplExpId}
              value={experienceId}
              onChange={(e) => setExperienceId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
            >
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={tplNameId} className="font-semibold text-slate-300">Template Name</label>
            <input
              id={tplNameId}
              type="text"
              required
              placeholder="e.g. Daily Sunrise River Cruise"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor={tplRecId} className="font-semibold text-slate-300">Recurrence</label>
              <select
                id={tplRecId}
                value={isRecurring ? "recurring" : "single"}
                onChange={(e) => setIsRecurring(e.target.value === "recurring")}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              >
                <option value="recurring">Recurring Schedule</option>
                <option value="single">Single Departure</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={tplDayId} className="font-semibold text-slate-300">Day of Week</label>
              <select
                id={tplDayId}
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                disabled={!isRecurring}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none disabled:opacity-50"
              >
                <option value="all">Daily (All Days)</option>
                <option value="1">Every Monday</option>
                <option value="2">Every Tuesday</option>
                <option value="3">Every Wednesday</option>
                <option value="4">Every Thursday</option>
                <option value="5">Every Friday</option>
                <option value="6">Every Saturday</option>
                <option value="0">Every Sunday</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor={tplStartId} className="font-semibold text-slate-300">Start Time</label>
              <input
                id={tplStartId}
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={tplEndId} className="font-semibold text-slate-300">End Time</label>
              <input
                id={tplEndId}
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          {durationInfo && (
            <div className={`rounded-md px-3 py-1.5 text-[11px] font-medium flex items-center justify-between ${
              durationInfo.valid
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : "bg-rose-950/30 border border-rose-500/20 text-rose-400"
            }`}>
              <span className="text-slate-400">Calculated Duration:</span>
              <span className="font-semibold">{durationInfo.text}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor={tplCapId} className="font-semibold text-slate-300">Default Capacity</label>
              <input
                id={tplCapId}
                type="number"
                min={1}
                max={100}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={tplStatusId} className="font-semibold text-slate-300">Status</label>
              <select
                id={tplStatusId}
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={tplNotesId} className="font-semibold text-slate-300">Notes</label>
            <textarea
              id={tplNotesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Best light for kingfishers and monitors"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Saving..." : template ? "Update Template" : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Boat Assignment & Fleet Availability Modal
function BoatAssignmentModal({
  slot,
  onClose,
  onSaved,
}: {
  slot: TimeSlot;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [boats, setBoats] = useState<AvailableBoatItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBoats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await scheduleApi.getAvailableBoats(slot.id);
      setBoats(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load fleet availability.");
    } finally {
      setLoading(false);
    }
  }, [slot.id]);

  useEffect(() => {
    fetchBoats();
  }, [fetchBoats]);

  const handleAssign = async (boatId: number) => {
    try {
      setActionLoading(true);
      setError(null);
      await scheduleApi.assignBoat(slot.id, boatId);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to assign vessel to departure.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm("Are you sure you want to unassign this vessel? The departure capacity will revert to the default template capacity.")) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await scheduleApi.unassignBoat(slot.id);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to unassign vessel.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-amber-100">
                Vessel Assignment & Availability
              </h3>
              <p className="text-xs text-slate-400">
                Smart conflict detection, interval overlap protection, and capacity sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Departure Details Strip */}
        <div className="border-b border-slate-800 bg-slate-950/40 px-6 py-3 text-xs">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">Experience</span>
              <div className="truncate font-medium text-slate-200">
                {slot.experience?.title || "Bentota River Safari"}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">Date & Time</span>
              <div className="font-medium text-amber-300">
                {slot.date} · {slot.formatted_time}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">Duration</span>
              <div className="font-medium text-slate-300">
                {slot.duration || "N/A"}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">Current Occupancy</span>
              <div className="font-medium text-slate-300">
                {slot.booked_guests} / {slot.capacity} passengers
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Currently Assigned Vessel Card */}
          {slot.boat ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-3">
                {slot.boat.image_url ? (
                  <img
                    src={slot.boat.image_url}
                    alt={slot.boat.name}
                    className="h-12 w-16 rounded-lg border border-amber-500/20 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                    <Ship className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      Assigned Vessel
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {slot.boat.registration_number}
                    </span>
                  </div>
                  <h4 className="mt-0.5 font-serif text-base font-medium text-amber-100">
                    {slot.boat.name}
                  </h4>
                  <div className="text-xs text-slate-400">
                    Capacity: <strong className="text-slate-200">{slot.boat.capacity} seats</strong> · Status: <span className="capitalize">{slot.boat.status}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUnassign}
                disabled={actionLoading}
                className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/30 transition disabled:opacity-50"
              >
                {actionLoading ? "Removing..." : "Remove Vessel"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/30 p-3.5 text-xs text-slate-400">
              <Anchor className="h-4 w-4 text-slate-500 shrink-0" />
              <span>No vessel currently assigned. Departure is operating on default template capacity ({slot.capacity} seats).</span>
            </div>
          )}

          {/* Fleet Availability List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fleet Status for this Departure
              </h4>
              <button
                type="button"
                onClick={fetchBoats}
                disabled={loading}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 transition"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-amber-400" : ""}`} />
                <span>Refresh Fleet</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-500" />
                <span>Analyzing fleet schedules and interval conflicts...</span>
              </div>
            ) : boats.length === 0 ? (
              <div className="rounded-xl border border-slate-800 p-6 text-center text-xs text-slate-400">
                No vessels found in fleet database. Add boats under Boat Management.
              </div>
            ) : (
              <div className="space-y-2">
                {boats.map((boat) => {
                  const isCurrent = slot.boat?.id === boat.id;
                  return (
                    <div
                      key={boat.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                        isCurrent
                          ? "border-amber-500/40 bg-amber-500/[0.04]"
                          : boat.is_available
                            ? "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                            : "border-slate-800/60 bg-slate-950/20 opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {boat.image_url ? (
                          <img
                            src={boat.image_url}
                            alt={boat.name}
                            className="h-11 w-14 shrink-0 rounded-lg border border-slate-800 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400">
                            <Ship className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-sm font-medium text-slate-100">
                              {boat.name}
                            </span>
                            <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                              {boat.registration_number}
                            </span>
                            {isCurrent ? (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                                Currently Assigned
                              </span>
                            ) : boat.is_available ? (
                              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                                <CheckCircle className="h-3 w-3" />
                                Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
                                <XCircle className="h-3 w-3" />
                                Unavailable
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                            <span>Capacity: <strong className="text-slate-300">{boat.capacity} seats</strong></span>
                            <span>•</span>
                            <span className="capitalize">Status: {boat.status}</span>
                          </div>

                          {boat.reason && (
                            <div className="mt-1.5 inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-950/30 px-2 py-0.5 text-[11px] font-medium text-rose-400">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{boat.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center sm:self-center">
                        {isCurrent ? (
                          <span className="px-3 py-1.5 text-xs font-semibold text-amber-400/80">
                            Assigned
                          </span>
                        ) : boat.is_available ? (
                          <button
                            type="button"
                            onClick={() => handleAssign(boat.id)}
                            disabled={actionLoading}
                            className="w-full sm:w-auto rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400 transition disabled:opacity-50"
                          >
                            {actionLoading ? "Assigning..." : "Assign Vessel"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full sm:w-auto cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900/40 px-3.5 py-1.5 text-xs font-medium text-slate-600"
                            title={boat.reason || "Vessel not available"}
                          >
                            Unavailable
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-800 bg-slate-950/60 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

