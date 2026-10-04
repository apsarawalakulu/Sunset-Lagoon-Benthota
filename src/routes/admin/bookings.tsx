import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CalendarCheck2,
  RefreshCw,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  Sailboat,
  Phone,
  Calendar,
  FileText,
  UserX,
  AlertTriangle,
  Check,
  Loader2,
  Printer,
  Globe,
  MessageSquare,
  Building,
  RotateCcw,
  X,
} from "lucide-react";
import { adminAuth, type AdminUser } from "@/services/adminAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  adminBookingApi,
  type Booking,
  type BookingStatus,
  type BookingSource,
  type BookingMetrics,
  type DepartureManifestData,
} from "@/services/adminBookingApi";
import { api, type ExperienceData, type DepartureSlot } from "@/services/api";
import { scheduleApi, type TimeSlot } from "@/services/scheduleApi";
import { boatApi, type Boat } from "@/services/boatApi";
import { COUNTRIES } from "@/data/countries";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Safari Bookings & Guest Manifest | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBookingsPage,
});

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dotClass: "bg-amber-400",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dotClass: "bg-emerald-400",
  },
  completed: {
    label: "Completed",
    badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    dotClass: "bg-cyan-400",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    dotClass: "bg-rose-400",
  },
  no_show: {
    label: "No Show",
    badgeClass: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    dotClass: "bg-slate-400",
  },
};

const SOURCE_CONFIG: Record<
  BookingSource,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  website: { label: "Website", icon: Globe },
  phone: { label: "Phone", icon: Phone },
  walk_in: { label: "Walk-in", icon: Users },
  whatsapp: { label: "WhatsApp", icon: MessageSquare },
  hotel: { label: "Hotel Agent", icon: Building },
  other: { label: "Other", icon: TagIcon },
};

function TagIcon({ className }: { className?: string }) {
  return <span className={className}>•</span>;
}

function AdminBookingsPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [metrics, setMetrics] = useState<BookingMetrics>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  });
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedExperience, setSelectedExperience] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Action states & Modals
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // Manifest modal state
  const [manifestTimeSlotId, setManifestTimeSlotId] = useState<number | null>(null);
  const [manifestData, setManifestData] = useState<DepartureManifestData | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);

  // Reschedule modal state
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleSlots, setRescheduleSlots] = useState<DepartureSlot[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleSelectedSlotId, setRescheduleSelectedSlotId] = useState<number | null>(null);
  const [rescheduleNotes, setRescheduleNotes] = useState<string>("");

  // Cancel modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("");

  // Admin New Booking modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: "",
    start_time: "06:30",
    end_time: "08:30",
    boat_id: "",
    full_name: "",
    gender: "prefer_not_to_say",
    country: "Sri Lanka",
    phone: "",
    email: "",
    number_of_guests: 2,
    booking_source: "walk_in",
    internal_notes: "",
    special_request: "",
  });
  const [createSlots, setCreateSlots] = useState<TimeSlot[]>([]);
  const [createSlotsLoading, setCreateSlotsLoading] = useState(false);
  const [boats, setBoats] = useState<Boat[]>([]);

  // Auth Check
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

  // Load Experiences list for filters
  useEffect(() => {
    api.getExperiences()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setExperiences(res.data);
        }
      })
      .catch(() => {});
    boatApi.getBoats()
      .then((list) => {
        if (Array.isArray(list)) setBoats(list);
      })
      .catch(() => {});
  }, []);

  // Fetch Bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      type FetchParams = NonNullable<Parameters<typeof adminBookingApi.getBookings>[0]>;
      const params: FetchParams = {};
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedExperience !== "all") params.experience_id = selectedExperience;
      if (selectedSource !== "all") params.source = selectedSource;
      if (selectedDate) params.date = selectedDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminBookingApi.getBookings(params);

      if (res && res.data) {
        setBookings(res.data);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to load bookings.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedExperience, selectedSource, selectedDate, searchQuery]);

  useEffect(() => {
    if (!authLoading && admin) {
      fetchBookings();
    }
  }, [fetchBookings, authLoading, admin]);

  // Handle Quick State Actions
  const handleConfirm = async (booking: Booking) => {
    setActionLoading(true);
    try {
      const res = await adminBookingApi.confirmBooking(booking.id);
      const updated = res.data;
      setFeedback({
        type: "success",
        message: "Booking " + booking.booking_reference + " confirmed successfully.",
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      if (viewingBooking?.id === updated.id) {
        setViewingBooking(updated);
      }
      fetchBookings();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to confirm booking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (booking: Booking) => {
    setActionLoading(true);
    try {
      const res = await adminBookingApi.completeBooking(booking.id);
      const updated = res.data;
      setFeedback({
        type: "success",
        message: "Booking " + booking.booking_reference + " marked as completed.",
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      if (viewingBooking?.id === updated.id) {
        setViewingBooking(updated);
      }
      fetchBookings();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to complete booking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (booking: Booking) => {
    setActionLoading(true);
    try {
      const res = await adminBookingApi.markNoShow(booking.id);
      const updated = res.data;
      setFeedback({
        type: "success",
        message: "Booking " + booking.booking_reference + " marked as No Show. Seats released.",
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      if (viewingBooking?.id === updated.id) {
        setViewingBooking(updated);
      }
      fetchBookings();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to mark as No Show.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;

    setActionLoading(true);
    try {
      const reason = cancellationReason.trim();
      const res = reason
        ? await adminBookingApi.cancelBooking(cancellingBooking.id, reason)
        : await adminBookingApi.cancelBooking(cancellingBooking.id);
      const updated = res.data;
      setFeedback({
        type: "success",
        message: "Booking " + cancellingBooking.booking_reference + " cancelled. Capacity released.",
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      if (viewingBooking?.id === updated.id) {
        setViewingBooking(updated);
      }
      setCancellingBooking(null);
      setCancellationReason("");
      fetchBookings();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to cancel booking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Manifest View
  const handleOpenManifest = async (timeSlotId: number) => {
    setManifestTimeSlotId(timeSlotId);
    setManifestLoading(true);
    try {
      const res = await adminBookingApi.getManifest(timeSlotId);
      setManifestData(res.data);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to load departure manifest.",
      });
      setManifestTimeSlotId(null);
    } finally {
      setManifestLoading(false);
    }
  };

  // Reschedule workflows
  const handleOpenReschedule = (booking: Booking) => {
    setReschedulingBooking(booking);
    setRescheduleDate(booking.booking_date || (new Date().toISOString().split("T")[0] ?? ""));
    setRescheduleSelectedSlotId(null);
    setRescheduleNotes("");
  };

  useEffect(() => {
    if (!reschedulingBooking || !rescheduleDate) {
      setRescheduleSlots([]);
      return;
    }

    setRescheduleSlotsLoading(true);
    api.getAvailability(reschedulingBooking.experience_id, rescheduleDate)
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data.slots)) {
          setRescheduleSlots(res.data.slots);
        } else {
          setRescheduleSlots([]);
        }
      })
      .catch(() => setRescheduleSlots([]))
      .finally(() => setRescheduleSlotsLoading(false));
  }, [reschedulingBooking, rescheduleDate]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingBooking || !rescheduleSelectedSlotId) return;

    setActionLoading(true);
    try {
      const reason = rescheduleNotes.trim();
      const res = reason
        ? await adminBookingApi.rescheduleBooking(reschedulingBooking.id, rescheduleSelectedSlotId, reason)
        : await adminBookingApi.rescheduleBooking(reschedulingBooking.id, rescheduleSelectedSlotId);
      const updated = res.data;
      setFeedback({
        type: "success",
        message: "Booking " + reschedulingBooking.booking_reference + " rescheduled to " + updated.booking_date + " at " + updated.preferred_time + ".",
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      if (viewingBooking?.id === updated.id) {
        setViewingBooking(updated);
      }
      setReschedulingBooking(null);
      fetchBookings();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to reschedule booking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Create booking scheduled slots fetch (all slots for the date, any experience)
  useEffect(() => {
    if (!createForm.date || !showCreateModal) {
      setCreateSlots([]);
      return;
    }

    setCreateSlotsLoading(true);
    scheduleApi.getTimeSlots({ date: createForm.date })
      .then((slots) => {
        setCreateSlots(Array.isArray(slots) ? slots : []);
      })
      .catch(() => setCreateSlots([]))
      .finally(() => setCreateSlotsLoading(false));
  }, [createForm.date, showCreateModal]);

  // Fleet-wide seat model: 3 boats x 8 seats. Each time window pools all seats;
  // bookings in the same window draw from one pool, next window starts fresh.
  const fleetCapacity = useMemo(() => {
    return boats
      .filter((b) => b.status === "active" || b.status === "available")
      .reduce((sum, b) => sum + (Number(b.capacity) || 0), 0);
  }, [boats]);

  // Group scheduled slots by time: seeded slots repeat per experience,
  // but for walk-ins they are interchangeable departures.
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, TimeSlot[]>();
    for (const s of createSlots) {
      const key = `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`;
      const g = groups.get(key);
      if (g) g.push(s);
      else groups.set(key, [s]);
    }
    return [...groups.values()].map((slots) => {
      const first = slots[0]!;
      const best = [...slots].sort((a, b) => b.available_seats - a.available_seats)[0]!;
      const boatNames = Array.from(
        new Set(slots.map((s) => s.boat?.name).filter((n): n is string => Boolean(n)))
      );
      const boatIds = Array.from(
        new Set(slots.map((s) => s.boat_id).filter((n): n is number => n !== null))
      );
      // Window pool: every booking attached to any row in this window counts.
      const poolBooked = slots.reduce((sum, s) => sum + s.booked_guests, 0);
      const poolAvailable = Math.max(0, fleetCapacity - poolBooked);
      return { key: `${first.date}-${first.start_time}-${first.end_time}`, slots, best, boatNames, boatIds, poolBooked, poolAvailable };
    });
  }, [createSlots, fleetCapacity]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guests = Number(createForm.number_of_guests) || 1;
    if (!createForm.date || !createForm.start_time || !createForm.end_time || !createForm.full_name.trim() || !createForm.phone.trim()) {
      setFeedback({
        type: "error",
        message: "Please fill all required fields (Date, Start/End Time, Name, Phone).",
      });
      return;
    }
    if (createForm.end_time <= createForm.start_time) {
      setFeedback({
        type: "error",
        message: "End time must be after start time.",
      });
      return;
    }

    setActionLoading(true);
    try {
      const boatId = createForm.boat_id ? Number(createForm.boat_id) : null;
      const start = createForm.start_time.slice(0, 5);
      const end = createForm.end_time.slice(0, 5);

      if (fleetCapacity <= 0) {
        throw new Error("No boats are in service. Set at least one boat to Active in Boat Fleet Management first.");
      }
      // Window pool: all rows at these times share one fleet-wide seat pool.
      const windowRows = createSlots.filter(
        (s) =>
          s.date === createForm.date &&
          s.start_time.slice(0, 5) === start &&
          s.end_time.slice(0, 5) === end
      );
      const poolBooked = windowRows.reduce((sum, s) => sum + s.booked_guests, 0);
      const poolFree = Math.max(0, fleetCapacity - poolBooked);
      if (poolFree < guests) {
        throw new Error(
          poolFree <= 0
            ? `This departure is fully booked (${fleetCapacity}/${fleetCapacity} seats taken).`
            : `Only ${poolFree} seat(s) left in this departure for ${guests} guest(s).`
        );
      }

      // Reuse a scheduled slot when the times match, otherwise create a custom one.
      // Same-time slots repeat per experience: prefer the chosen boat, then most seats.
      const candidates = windowRows.filter((s) => s.status === "available");
      const match = [...candidates].sort((a, b) => {
        if (boatId) {
          const boatRank =
            (a.boat_id === boatId ? 1 : 0) - (b.boat_id === boatId ? 1 : 0);
          if (boatRank !== 0) return boatRank;
        }
        return b.available_seats - a.available_seats;
      })[0];
      let slotId: number;
      if (match) {
        slotId = match.id;
        if (boatId && !match.boat_id) {
          await scheduleApi.assignBoat(match.id, boatId);
        }
      } else {
        const created = await scheduleApi.createTimeSlot({
          date: createForm.date,
          start_time: start,
          end_time: end,
          boat_id: boatId,
          capacity: fleetCapacity,
          status: "available",
        });
        slotId = created.id;
      }

      const res = await adminBookingApi.createBooking({
        experience_id: null,
        time_slot_id: slotId,
        full_name: createForm.full_name.trim(),
        gender: createForm.gender,
        country: createForm.country.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || null,
        number_of_guests: guests,
        booking_source: createForm.booking_source as BookingSource,
        internal_notes: createForm.internal_notes.trim() || null,
        special_request: createForm.special_request.trim() || null,
      });
      const created = res.data;

      setFeedback({
        type: "success",
        message: "Booking " + created.booking_reference + " registered successfully.",
      });
      setShowCreateModal(false);
      setCreateForm({
        date: "",
        start_time: "06:30",
        end_time: "08:30",
        boat_id: "",
        full_name: "",
        gender: "prefer_not_to_say",
        country: "Sri Lanka",
        phone: "",
        email: "",
        number_of_guests: 2,
        booking_source: "walk_in",
        internal_notes: "",
        special_request: "",
      });
      fetchBookings();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to create booking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintManifest = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#071318] text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <AdminLayout
      admin={admin}
      pageTitle="Safari Bookings & Guest Manifest"
      badgeCounts={{ bookings: metrics.pending }}
    >
      <div className="space-y-6">
        {/* Top Bar Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-amber-400" />
              <h1 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Safari Bookings & Departure Manifest
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Manage river safari reservations, review guest passenger manifests, enforce boat capacity, and update departure statuses in Bentota.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchBookings()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
              title="Refresh Bookings"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreateForm((prev) => ({
                  ...prev,
                  date: new Date().toISOString().split("T")[0] ?? "",
                }));
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>New Walk-in / Phone Booking</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={
              "flex items-center justify-between gap-3 rounded-lg border p-4 text-xs " +
              (feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300")
            }
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Metrics Ribbon */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => setSelectedStatus("all")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (selectedStatus === "all"
                ? "border-amber-500/50 bg-amber-500/10"
                : "border-white/5 bg-[#0b1b22]/70 hover:border-white/10")
            }
          >
            <span className="text-[11px] font-medium text-slate-400">Total Bookings</span>
            <div className="mt-1 text-2xl font-serif font-bold text-white">
              {metrics.total}
            </div>
            <span className="text-[10px] text-slate-500">All recorded</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("pending")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (selectedStatus === "pending"
                ? "border-amber-500 bg-amber-500/15"
                : "border-white/5 bg-[#0b1b22]/70 hover:border-amber-500/30")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-400">Pending</span>
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="mt-1 text-2xl font-serif font-bold text-amber-400">
              {metrics.pending}
            </div>
            <span className="text-[10px] text-amber-300/60">Awaiting confirmation</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("confirmed")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (selectedStatus === "confirmed"
                ? "border-emerald-500 bg-emerald-500/15"
                : "border-white/5 bg-[#0b1b22]/70 hover:border-emerald-500/30")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-400">Confirmed</span>
              <span className="size-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-1 text-2xl font-serif font-bold text-emerald-400">
              {metrics.confirmed}
            </div>
            <span className="text-[10px] text-emerald-300/60">Ready for safari</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("completed")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (selectedStatus === "completed"
                ? "border-cyan-500 bg-cyan-500/15"
                : "border-white/5 bg-[#0b1b22]/70 hover:border-cyan-500/30")
            }
          >
            <span className="text-[11px] font-medium text-cyan-400">Completed</span>
            <div className="mt-1 text-2xl font-serif font-bold text-cyan-400">
              {metrics.completed}
            </div>
            <span className="text-[10px] text-cyan-300/60">Safaris finished</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("cancelled")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (selectedStatus === "cancelled"
                ? "border-rose-500 bg-rose-500/15"
                : "border-white/5 bg-[#0b1b22]/70 hover:border-rose-500/30")
            }
          >
            <span className="text-[11px] font-medium text-rose-400">Cancelled</span>
            <div className="mt-1 text-2xl font-serif font-bold text-rose-400">
              {metrics.cancelled}
            </div>
            <span className="text-[10px] text-rose-300/60">Seats released</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("no_show")}
            className={
              "rounded-xl border p-3.5 text-left transition " +
              (selectedStatus === "no_show"
                ? "border-slate-500 bg-slate-500/15"
                : "border-white/5 bg-[#0b1b22]/70 hover:border-slate-500/30")
            }
          >
            <span className="text-[11px] font-medium text-slate-400">No Show</span>
            <div className="mt-1 text-2xl font-serif font-bold text-slate-300">
              {metrics.no_show}
            </div>
            <span className="text-[10px] text-slate-500">Guests did not arrive</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-xl border border-white/5 bg-[#0b1b22]/70 p-4 shadow-sm backdrop-blur-sm space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, guest, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Experience Select */}
            <div>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Safari Experiences</option>
                {experiences.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Select */}
            <div>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Booking Sources</option>
                <option value="website">Website Online</option>
                <option value="phone">Phone Reservation</option>
                <option value="walk_in">Walk-in Dock</option>
                <option value="whatsapp">WhatsApp Booking</option>
                <option value="hotel">Hotel Referral</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Reset Filters */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("all");
                  setSelectedExperience("all");
                  setSelectedSource("all");
                  setSelectedDate("");
                  setSearchQuery("");
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0b1b22]/70 shadow-sm backdrop-blur-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <CalendarCheck2 className="h-12 w-12 text-slate-600 mb-3" />
              <p className="font-serif text-lg text-slate-300">No Safari Bookings Found</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                No bookings match your current search filters. Adjust filters or register a new walk-in booking above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Guest & Party</th>
                    <th className="py-3.5 px-4">Experience</th>
                    <th className="py-3.5 px-4">Departure Slot</th>
                    <th className="py-3.5 px-4">Vessel</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-white/5 text-xs text-slate-300">
                  {bookings.map((booking) => {
                    const statusCfg =
                      STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                    const sourceCfg =
                      SOURCE_CONFIG[booking.booking_source] || SOURCE_CONFIG.website;
                    const SourceIcon = sourceCfg.icon;

                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Reference */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                            {booking.booking_reference}
                          </span>
                        </td>

                        {/* Guest & Party */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white">
                            {booking.full_name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="size-3 text-slate-500" />
                              {booking.number_of_guests} {booking.number_of_guests === 1 ? "guest" : "guests"}
                            </span>
                            <span>•</span>
                            <span>{booking.country}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{booking.phone}</span>
                            {booking.email && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{booking.email}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Experience */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white max-w-[180px] truncate">
                            {booking.experience?.title || "Safari Package"}
                          </div>
                          {booking.experience?.duration && (
                            <div className="mt-0.5 text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="size-3 text-slate-500" />
                              {booking.experience.duration}
                            </div>
                          )}
                        </td>

                        {/* Departure Slot */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-200">
                            {booking.booking_date}
                          </div>
                          <div className="mt-0.5 text-[11px] text-amber-400/90 flex items-center gap-1">
                            <Clock className="size-3 text-slate-500" />
                            {booking.preferred_time}
                          </div>
                        </td>

                        {/* Vessel */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {booking.time_slot?.boat ? (
                            <div>
                              <div className="font-medium text-slate-200 flex items-center gap-1">
                                <Sailboat className="size-3.5 text-amber-400 shrink-0" />
                                <span>{booking.time_slot.boat.name}</span>
                              </div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                Cap: {booking.time_slot.boat.capacity} seats
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            <SourceIcon className="size-3 text-slate-400" />
                            {sourceCfg.label}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " + statusCfg.badgeClass}
                          >
                            <span className={"size-1.5 rounded-full " + statusCfg.dotClass} />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setViewingBooking(booking)}
                              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                              title="View Booking Details"
                            >
                              <Eye className="size-4" />
                            </button>

                            {/* View Manifest (if slot assigned) */}
                            {booking.time_slot_id && (
                              <button
                                type="button"
                                onClick={() => handleOpenManifest(booking.time_slot_id!)}
                                className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10 transition"
                                title="View Departure Manifest"
                              >
                                <FileText className="size-4" />
                              </button>
                            )}

                            {/* Quick Confirm */}
                            {booking.status === "pending" && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleConfirm(booking)}
                                className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10 transition"
                                title="Confirm Reservation"
                              >
                                <Check className="size-4" />
                              </button>
                            )}

                            {/* Quick Complete */}
                            {booking.status === "confirmed" && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleComplete(booking)}
                                className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10 transition"
                                title="Mark as Completed"
                              >
                                <CheckCircle2 className="size-4" />
                              </button>
                            )}

                            {/* Quick No Show */}
                            {booking.status === "confirmed" && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleNoShow(booking)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-500/20 hover:text-slate-200 transition"
                                title="Mark as No Show (Releases Capacity)"
                              >
                                <UserX className="size-4" />
                              </button>
                            )}

                            {/* Reschedule */}
                            {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => handleOpenReschedule(booking)}
                                className="rounded p-1 text-amber-400 hover:bg-amber-500/10 transition"
                                title="Reschedule Departure"
                              >
                                <Calendar className="size-4" />
                              </button>
                            )}

                            {/* Cancel */}
                            {booking.status !== "cancelled" && booking.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellingBooking(booking);
                                  setCancellationReason("");
                                }}
                                className="rounded p-1 text-rose-400 hover:bg-rose-500/10 transition"
                                title="Cancel Booking"
                              >
                                <XCircle className="size-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* BOOKING DETAILS MODAL */}
        {viewingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0b1b22] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30">
                    {viewingBooking.booking_reference}
                  </span>
                  <span
                    className={"rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                      STATUS_CONFIG[viewingBooking.status]?.badgeClass}
                  >
                    {STATUS_CONFIG[viewingBooking.status]?.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingBooking(null)}
                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-5 space-y-5 text-xs">
                {/* Guest Details Card */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Guest Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500">Primary Contact:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.full_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Party Size:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.number_of_guests} Passengers
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone / WhatsApp:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.phone}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Email Address:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Country:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.country}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Booking Source:</span>
                      <p className="font-semibold text-white mt-0.5 capitalize">
                        {viewingBooking.booking_source}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safari & Departure Details */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Safari & Vessel Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500">Experience Package:</span>
                      <p className="font-semibold text-amber-400 mt-0.5">
                        {viewingBooking.experience?.title || "Safari Package"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Tour Duration:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.experience?.duration || "Standard Safari"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Departure Date:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.booking_date}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Departure Time:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.preferred_time}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Assigned Vessel:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.time_slot?.boat ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <Sailboat className="size-3.5" />
                            {viewingBooking.time_slot.boat.name} (Max {viewingBooking.time_slot.boat.capacity} pax)
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No vessel assigned yet</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Time Slot Capacity:</span>
                      <p className="font-semibold text-white mt-0.5">
                        {viewingBooking.time_slot ? (
                          <span>
                            {viewingBooking.time_slot.booked_guests} booked / {viewingBooking.time_slot.capacity} total
                          </span>
                        ) : (
                          <span className="text-slate-500">Flexible window</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Request & Notes */}
                {(viewingBooking.special_request || viewingBooking.internal_notes || viewingBooking.cancellation_reason) && (
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
                    {viewingBooking.special_request && (
                      <div>
                        <span className="text-slate-500 font-medium">Customer Special Requests:</span>
                        <p className="mt-1 text-slate-200 italic bg-black/20 p-2.5 rounded border border-white/5">
                          "{viewingBooking.special_request}"
                        </p>
                      </div>
                    )}
                    {viewingBooking.internal_notes && (
                      <div>
                        <span className="text-slate-500 font-medium">Internal Staff Notes:</span>
                        <p className="mt-1 text-slate-300 bg-black/20 p-2.5 rounded border border-white/5 whitespace-pre-wrap">
                          {viewingBooking.internal_notes}
                        </p>
                      </div>
                    )}
                    {viewingBooking.cancellation_reason && (
                      <div>
                        <span className="text-rose-400 font-medium">Cancellation Reason:</span>
                        <p className="mt-1 text-rose-300 bg-rose-500/10 p-2.5 rounded border border-rose-500/20">
                          {viewingBooking.cancellation_reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-white/5 pt-3">
                  <div>Created: {new Date(viewingBooking.created_at).toLocaleString()}</div>
                  {viewingBooking.confirmed_at && (
                    <div>Confirmed: {new Date(viewingBooking.confirmed_at).toLocaleString()}</div>
                  )}
                  {viewingBooking.completed_at && (
                    <div>Completed: {new Date(viewingBooking.completed_at).toLocaleString()}</div>
                  )}
                  {viewingBooking.cancelled_at && (
                    <div>Cancelled: {new Date(viewingBooking.cancelled_at).toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                <div>
                  {viewingBooking.time_slot_id && (
                    <button
                      type="button"
                      onClick={() => handleOpenManifest(viewingBooking.time_slot_id!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                    >
                      <FileText className="size-3.5" />
                      View Passenger Manifest
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {viewingBooking.status === "pending" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleConfirm(viewingBooking)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                    >
                      Confirm Booking
                    </button>
                  )}

                  {viewingBooking.status === "confirmed" && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleComplete(viewingBooking)}
                        className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition"
                      >
                        Complete Safari
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleNoShow(viewingBooking)}
                        className="rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                      >
                        No Show
                      </button>
                    </>
                  )}

                  {viewingBooking.status !== "cancelled" && viewingBooking.status !== "completed" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenReschedule(viewingBooking)}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingBooking(viewingBooking);
                          setCancellationReason("");
                        }}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewingBooking(null)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEPARTURE MANIFEST MODAL (PRINTABLE) */}
        {manifestTimeSlotId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/10 bg-[#0b1b22] p-6 shadow-2xl print:max-h-none print:w-full print:border-none print:bg-white print:text-black print:p-8">
              {manifestLoading || !manifestData ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div>
                  {/* Manifest Header */}
                  <div className="flex items-start justify-between border-b border-white/10 pb-4 print:border-slate-300">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="size-5 text-amber-400 print:text-black" />
                        <h2 className="font-serif text-xl font-bold text-white print:text-black">
                          Sunset Lagoon Boat House — Passenger Manifest
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                        Official Safari Departure Manifest · Bentota River Dock
                      </p>
                    </div>

                    <div className="flex items-center gap-2 print:hidden">
                      <button
                        type="button"
                        onClick={handlePrintManifest}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                      >
                        <Printer className="size-3.5" />
                        Print Manifest
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManifestTimeSlotId(null);
                          setManifestData(null);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                  </div>

                  {/* Departure & Vessel Details */}
                  <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs print:border-slate-200 print:bg-slate-50 print:text-black sm:grid-cols-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 print:text-slate-600">
                        Date & Departure
                      </span>
                      <p className="font-bold text-white mt-1 print:text-black">
                        {manifestData.departure.date}
                      </p>
                      <p className="text-amber-400 text-[11px] print:text-slate-800">
                        {manifestData.departure.formatted_time}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 print:text-slate-600">
                        Experience Tour
                      </span>
                      <p className="font-bold text-white mt-1 truncate print:text-black">
                        {manifestData.departure.experience?.title || "River Safari"}
                      </p>
                      <p className="text-slate-400 text-[11px] print:text-slate-600">
                        {manifestData.departure.duration}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 print:text-slate-600">
                        Assigned Vessel
                      </span>
                      <p className="font-bold text-emerald-400 mt-1 print:text-black">
                        {manifestData.departure.boat?.name || "Vessel Unassigned"}
                      </p>
                      {manifestData.departure.boat?.registration_number && (
                        <p className="text-slate-400 text-[11px] print:text-slate-600">
                          Reg: {manifestData.departure.boat.registration_number}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 print:text-slate-600">
                        Capacity & Load
                      </span>
                      <p className="font-bold text-white mt-1 print:text-black">
                        {manifestData.summary.total_guests} / {manifestData.departure.capacity} Guests
                      </p>
                      <p className="text-emerald-400 text-[11px] print:text-slate-800">
                        {manifestData.summary.remaining_seats} seats remaining
                      </p>
                    </div>
                  </div>

                  {/* Passengers Table */}
                  <div className="mt-5 overflow-hidden rounded-lg border border-white/5 print:border-slate-300">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 print:border-slate-300 print:bg-slate-100 print:text-slate-700">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Passenger / Party Lead</th>
                          <th className="py-2.5 px-3">Country</th>
                          <th className="py-2.5 px-3">Contact</th>
                          <th className="py-2.5 px-3 text-center">Pax</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 print:hidden">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-white/5 text-slate-300 print:divide-slate-200 print:text-black">
                        {manifestData.passengers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              No passengers currently checked in on this departure slot.
                            </td>
                          </tr>
                        ) : (
                          manifestData.passengers.map((p, idx) => (
                            <tr key={p.id} className="print:text-xs">
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-400 print:text-black">
                                {p.booking_reference}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-white print:text-black">
                                {p.full_name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 print:text-black">
                                {p.country}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 print:text-black">
                                {p.phone}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-white print:text-black">
                                {p.number_of_guests}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={"inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider " +
                                    (STATUS_CONFIG[p.status]?.badgeClass || "") +
                                    " print:border print:border-black print:text-black"}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 print:hidden truncate max-w-[150px]">
                                {p.special_request || p.internal_notes || "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Manifest Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
                    <div>
                      Total Checked-In Manifest Passengers:{" "}
                      <span className="font-bold text-white print:text-black">
                        {manifestData.summary.total_guests}
                      </span>
                    </div>
                    <div>
                      Generated: {new Date().toLocaleString()} · Captain Signature: __________________
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESCHEDULE MODAL */}
        {reschedulingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0b1b22] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-5 text-amber-400" />
                  <h3 className="font-serif text-lg font-bold text-white">
                    Reschedule Safari Booking
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReschedulingBooking(null)}
                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-4 text-xs">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-slate-300">
                  <span className="font-semibold text-white">
                    {reschedulingBooking.booking_reference}
                  </span>{" "}
                  · {reschedulingBooking.full_name} ({reschedulingBooking.number_of_guests} guests)
                  <div className="mt-1 text-[11px] text-slate-400">
                    Current Departure: {reschedulingBooking.booking_date} at {reschedulingBooking.preferred_time}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Select New Departure Date <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={rescheduleDate}
                    onChange={(e) => {
                      setRescheduleDate(e.target.value);
                      setRescheduleSelectedSlotId(null);
                    }}
                    required
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Available Departure Slot <span className="text-amber-400">*</span>
                  </label>
                  {rescheduleSlotsLoading ? (
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-slate-400">
                      <Loader2 className="size-4 animate-spin text-amber-500" />
                      Checking boat availability for {rescheduleDate}...
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-slate-400">
                      No scheduled slots found for this date. Please pick another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {rescheduleSlots.map((slot) => {
                        const isSelected = rescheduleSelectedSlotId === slot.id;
                        const hasEnoughSeats =
                          slot.available >= reschedulingBooking.number_of_guests;
                        const isUnavailable =
                          slot.status !== "available" || !hasEnoughSeats;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isUnavailable}
                            onClick={() => setRescheduleSelectedSlotId(slot.id)}
                            className={
                              "flex items-center justify-between rounded-lg border p-2.5 text-left transition " +
                              (isSelected
                                ? "border-amber-500 bg-amber-500/15 text-white"
                                : isUnavailable
                                ? "border-white/5 bg-white/[0.01] text-slate-600 opacity-50 cursor-not-allowed"
                                : "border-white/10 bg-white/5 text-slate-300 hover:border-amber-500/30 hover:bg-white/10")
                            }
                          >
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <Clock className="size-3 text-amber-400" />
                                {slot.time_display}
                              </div>
                              {slot.boat_name && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Sailboat className="size-3 text-slate-500" />
                                  {slot.boat_name}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span
                                className={
                                  "text-[10px] font-bold rounded px-1.5 py-0.5 " +
                                  (hasEnoughSeats
                                    ? "text-emerald-400 bg-emerald-500/10"
                                    : "text-rose-400 bg-rose-500/10")
                                }
                              >
                                {slot.available} seats left
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Reason / Staff Notes
                  </label>
                  <textarea
                    rows={2}
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    placeholder="e.g. Customer requested afternoon departure due to morning rain..."
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setReschedulingBooking(null)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!rescheduleSelectedSlotId || actionLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="size-3.5 animate-spin" />}
                    Confirm Reschedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CANCEL MODAL */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-xl border border-rose-500/20 bg-[#0b1b22] p-6 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3 text-rose-400">
                <AlertTriangle className="size-5 shrink-0" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Cancel Booking Confirmation
                </h3>
              </div>

              <form onSubmit={handleCancelSubmit} className="mt-4 space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Are you sure you want to cancel booking{" "}
                  <span className="font-mono font-bold text-amber-400">
                    {cancellingBooking.booking_reference}
                  </span>{" "}
                  for {cancellingBooking.full_name}?
                </p>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-300">
                  Notice: Cancelling will instantly release the {cancellingBooking.number_of_guests} seat(s) back into the departure slot and boat capacity.
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Cancellation Reason (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="e.g. Customer cancelled due to flight changes..."
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] p-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCancellingBooking(null)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="size-3.5 animate-spin" />}
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN CREATE BOOKING MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#0b1b22] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="size-5 text-amber-400" />
                  <h3 className="font-serif text-lg font-bold text-white">
                    Register Walk-in / Phone Reservation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
                {/* Booking Source */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Booking Source <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={createForm.booking_source}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        booking_source: e.target.value,
                      }))
                    }
                    required
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="walk_in">Walk-in (Bentota Dock)</option>
                    <option value="phone">Phone Reservation</option>
                    <option value="whatsapp">WhatsApp Inbound</option>
                    <option value="hotel">Hotel Desk / Partner</option>
                    <option value="website">Direct Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date & Departure Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Safari Date <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={createForm.date}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                          time_slot_id: "",
                        }))
                      }
                      required
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Number of Guests <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={createForm.number_of_guests}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          number_of_guests: parseInt(e.target.value, 10) || 1,
                        }))
                      }
                      required
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Departure Slot & Boat (custom adjustable) */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Departure Slot & Boat <span className="text-amber-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        Start Time
                      </span>
                      <input
                        type="time"
                        value={createForm.start_time}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            start_time: e.target.value,
                          }))
                        }
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        End Time
                      </span>
                      <input
                        type="time"
                        value={createForm.end_time}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            end_time: e.target.value,
                          }))
                        }
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        Boat (Optional)
                      </span>
                      <select
                        value={createForm.boat_id}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            boat_id: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">-- Any Boat --</option>
                        {boats.map((boat) => (
                          <option key={boat.id} value={boat.id}>
                            {boat.name} ({boat.capacity} seats)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {createSlotsLoading ? (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-slate-400">
                      <Loader2 className="size-4 animate-spin text-amber-500" />
                      Checking scheduled departures...
                    </div>
                  ) : (
                    createSlots.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                          Scheduled departures this date — tap to fill, or adjust times above for a custom departure
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {groupedSlots.map((group) => {
                            const slot = group.best;
                            const isSelected =
                              slot.date === createForm.date &&
                              slot.start_time.slice(0, 5) === createForm.start_time.slice(0, 5) &&
                              slot.end_time.slice(0, 5) === createForm.end_time.slice(0, 5);
                            const hasCapacity = group.poolAvailable >= createForm.number_of_guests;
                            const isAvailable = slot.status === "available" && hasCapacity;
                            const boatLabel =
                              group.boatNames.length === 0
                                ? "No boat assigned"
                                : group.boatNames.length === 1
                                  ? group.boatNames[0]
                                  : `${group.boatNames.length} boats`;

                            return (
                              <button
                                key={group.key}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() =>
                                  setCreateForm((prev) => ({
                                    ...prev,
                                    start_time: slot.start_time.slice(0, 5),
                                    end_time: slot.end_time.slice(0, 5),
                                    boat_id:
                                      group.boatIds.length === 1 && group.boatIds[0] !== undefined
                                        ? String(group.boatIds[0])
                                        : prev.boat_id,
                                  }))
                                }
                                className={
                                  "rounded-lg border px-3 py-2 text-left transition " +
                                  (isSelected
                                    ? "border-amber-500 bg-amber-500/15"
                                    : !isAvailable
                                    ? "border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed"
                                    : "border-white/10 bg-white/5 hover:border-amber-500/30")
                                }
                              >
                                <span className="block font-semibold text-white">
                                  {slot.formatted_time}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-slate-400">
                                  {boatLabel} ·{" "}
                                  <span className={hasCapacity ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                                    {group.poolAvailable} of {fleetCapacity} seats left
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Guest Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Full Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={createForm.full_name}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))
                      }
                      required
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Phone Number <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+94 77 123 4567"
                      value={createForm.phone}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      required
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Country
                    </label>
                    <select
                      value={createForm.country}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, country: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Internal Staff Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paid in cash at dock, requested front seating..."
                    value={createForm.internal_notes}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, internal_notes: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1f28] p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!createForm.date || !createForm.start_time || !createForm.end_time || actionLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="size-3.5 animate-spin" />}
                    Create & Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
