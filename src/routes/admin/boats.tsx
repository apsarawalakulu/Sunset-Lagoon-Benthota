import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useId, useRef } from "react";
import {
  Ship,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Users,
  Wrench,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlertTriangle,
} from "lucide-react";
import { adminAuth, type AdminUser } from "@/services/adminAuth";
import {
  boatApi,
  type Boat,
  type BoatStatus,
} from "@/services/boatApi";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/boats")({
  head: () => ({
    meta: [
      { title: "Boat Fleet Management | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBoatsPage,
});

function AdminBoatsPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data states
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [deletingBoat, setDeletingBoat] = useState<Boat | null>(null);
  const [viewingBoat, setViewingBoat] = useState<Boat | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Fetch boats from API
  const fetchBoats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boatApi.getBoats({
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
      });
      setBoats(data);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to load boat fleet.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    if (!authLoading) {
      fetchBoats();
    }
  }, [authLoading, fetchBoats]);

  // Delete Boat Handler
  const handleDeleteConfirm = async () => {
    if (!deletingBoat) return;
    setActionLoading(true);
    try {
      await boatApi.deleteBoat(deletingBoat.id);
      setFeedback({
        type: "success",
        message: `Boat "${deletingBoat.name}" and its stored image file were successfully removed.`,
      });
      setDeletingBoat(null);
      fetchBoats();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to delete boat.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Fleet Statistics calculations
  const totalBoats = boats.length;
  const availableBoats = boats.filter((b) => b.status === "available").length;
  const maintenanceBoats = boats.filter((b) => b.status === "maintenance").length;
  const totalCapacity = boats.reduce((sum, b) => sum + (Number(b.capacity) || 0), 0);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071318] text-slate-200">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400 font-sans">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span>Validating Fleet Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout admin={admin} pageTitle="Boat Fleet Management">
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                <Ship className="h-3.5 w-3.5" /> Fleet Management
              </span>
              <span className="text-xs text-slate-400">Step 2 Architecture</span>
            </div>
            <h1 className="mt-1 text-2xl font-serif font-bold text-white tracking-wide">
              Safari Boats & Fleet Capacity
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Manage boat specifications, passenger capacities, operational statuses, and device image uploads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchBoats()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
              title="Refresh Fleet List"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Boat</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center justify-between gap-3 rounded-lg border p-4 text-xs ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
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

        {/* Fleet Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-[#0b1b22]/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Fleet</span>
              <Ship className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-serif font-bold text-white">
              {totalBoats}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">Registered Vessels</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0b1b22]/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Available Now</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-serif font-bold text-emerald-400">
              {availableBoats}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">Ready for River Safaris</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0b1b22]/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Maintenance</span>
              <Wrench className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-serif font-bold text-amber-400">
              {maintenanceBoats}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">Under Service/Tide Pause</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0b1b22]/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Capacity</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-serif font-bold text-cyan-400">
              {totalCapacity}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">Total Guest Seats</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/5 bg-[#0b1b22]/60 p-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boat name or code..."
                className="w-full rounded-lg border border-white/10 bg-[#071318] py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#071318] px-2.5 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 self-end sm:self-auto rounded-lg border border-white/10 bg-[#071318] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded px-2.5 py-1 text-xs transition ${
                viewMode === "grid"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5 inline mr-1" /> Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded px-2.5 py-1 text-xs transition ${
                viewMode === "table"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Compact Table View"
            >
              <List className="h-3.5 w-3.5 inline mr-1" /> Table
            </button>
          </div>
        </div>

        {/* Content Section: Grid or Table */}
        {loading && boats.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-white/5 bg-[#0b1b22]/40">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <span>Loading Boat Fleet...</span>
            </div>
          </div>
        ) : boats.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0b1b22]/30 py-16 text-center">
            <Ship className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">No boats found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {searchQuery || selectedStatus !== "all"
                ? "No vessels match your current search or status filter criteria."
                : "No boats have been added to the fleet yet. Click 'Add New Boat' to add your first vessel."}
            </p>
            {(searchQuery || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("all");
                }}
                className="mt-4 text-xs text-amber-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {boats.map((boat) => (
              <BoatCard
                key={boat.id}
                boat={boat}
                onEdit={() => setEditingBoat(boat)}
                onDelete={() => setDeletingBoat(boat)}
                onView={() => setViewingBoat(boat)}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0b1b22]/60 shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 bg-white/[0.02] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 pl-4 pr-2">Vessel</th>
                    <th className="px-3 py-3.5">Registration Code</th>
                    <th className="px-3 py-3.5">Capacity</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-3 py-3.5">Description</th>
                    <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {boats.map((boat) => (
                    <tr key={boat.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 overflow-hidden rounded bg-[#071318] border border-white/10 shrink-0">
                            {boat.image_url ? (
                              <img
                                src={boat.image_url}
                                alt={boat.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-600">
                                <Ship className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{boat.name}</div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID #{boat.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono font-medium text-amber-300">
                        {boat.registration_number}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-xs text-slate-200">
                          <Users className="h-3 w-3 text-cyan-400" />
                          {boat.capacity} Guests
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={boat.status} />
                      </td>
                      <td className="px-3 py-3 max-w-xs truncate text-slate-400">
                        {boat.description || "—"}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingBoat(boat)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingBoat(boat)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-amber-400 transition"
                            title="Edit Boat"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingBoat(boat)}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                            title="Delete Boat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Boat Modal */}
      {showAddModal && (
        <BoatFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setFeedback({
              type: "success",
              message: "New boat added to fleet successfully.",
            });
            fetchBoats();
          }}
        />
      )}

      {/* Edit Boat Modal */}
      {editingBoat && (
        <BoatFormModal
          isOpen={!!editingBoat}
          boat={editingBoat}
          onClose={() => setEditingBoat(null)}
          onSuccess={() => {
            setEditingBoat(null);
            setFeedback({
              type: "success",
              message: "Boat details and image updated successfully.",
            });
            fetchBoats();
          }}
        />
      )}

      {/* View Boat Details Modal */}
      {viewingBoat && (
        <BoatDetailsModal
          boat={viewingBoat}
          onClose={() => setViewingBoat(null)}
          onEdit={() => {
            const b = viewingBoat;
            setViewingBoat(null);
            setEditingBoat(b);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingBoat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0b1b22] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-500/10 p-2.5 text-rose-400 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">
                  Delete Boat from Fleet
                </h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to remove this vessel?
                </p>
              </div>
            </div>

            {deletingBoat.time_slots_count && deletingBoat.time_slots_count > 0 ? (
              <div className="my-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Deletion Protected</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  This vessel is assigned to <strong>{deletingBoat.time_slots_count} departure slot(s)</strong>. It cannot be deleted because removing it would break schedule records and historical tour tracking.
                </p>
                <p className="text-[11px] text-slate-400">
                  To take this vessel out of active rotation safely, set its status to <strong>Unavailable</strong> or <strong>Maintenance</strong>.
                </p>
              </div>
            ) : (
              <div className="my-5 rounded-lg border border-white/5 bg-[#071318] p-3 text-xs text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-500">Boat Name:</span>{" "}
                  <span className="font-semibold text-white">{deletingBoat.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Registration Code:</span>{" "}
                  <span className="font-mono text-amber-300">
                    {deletingBoat.registration_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Capacity:</span>{" "}
                  <span>{deletingBoat.capacity} Guests</span>
                </div>
                <p className="pt-2 text-[11px] text-rose-400/90 font-sans border-t border-white/5">
                  ⚠️ This will permanently delete the boat record and remove any stored boat image file from the server.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBoat(null)}
                disabled={actionLoading}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              {deletingBoat.time_slots_count && deletingBoat.time_slots_count > 0 ? (
                <button
                  type="button"
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const fd = new FormData();
                      fd.append("name", deletingBoat.name);
                      fd.append("registration_number", deletingBoat.registration_number);
                      fd.append("capacity", String(deletingBoat.capacity));
                      fd.append("status", "unavailable");
                      await boatApi.updateBoat(deletingBoat.id, fd);
                      setFeedback({
                        type: "success",
                        message: `Vessel "${deletingBoat.name}" was set to Unavailable.`,
                      });
                      setDeletingBoat(null);
                      fetchBoats();
                    } catch (err: any) {
                      setFeedback({
                        type: "error",
                        message: err?.message || "Failed to update boat status.",
                      });
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Set to Unavailable</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ==========================================
// Status Badge Component
// ==========================================
function StatusBadge({ status }: { status: BoatStatus }) {
  switch (status) {
    case "available":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Available
        </span>
      );
    case "in_use":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          In Use
        </span>
      );
    case "maintenance":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Maintenance
        </span>
      );
    case "unavailable":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Unavailable
        </span>
      );
  }
}

// ==========================================
// Boat Card Component (Grid View)
// ==========================================
function BoatCard({
  boat,
  onEdit,
  onDelete,
  onView,
}: {
  boat: Boat;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0b1b22]/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/5">
      {/* Image Container with Status Overlay */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#071318]">
        {boat.image_url ? (
          <img
            src={boat.image_url}
            alt={boat.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-600">
            <Ship className="h-12 w-12 stroke-[1.5]" />
            <span className="mt-2 text-[11px] text-slate-500">No image uploaded</span>
          </div>
        )}

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1b22] via-transparent to-black/40" />

        {/* Status Badge on Top Right */}
        <div className="absolute right-3 top-3">
          <StatusBadge status={boat.status} />
        </div>

        {/* Registration Code Badge on Top Left */}
        <div className="absolute left-3 top-3">
          <span className="rounded-md border border-white/20 bg-black/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300 backdrop-blur-md">
            {boat.registration_number}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-300 transition">
            {boat.name}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300 font-medium">
            <Users className="h-3 w-3 text-cyan-400" />
            {boat.capacity} Seats
          </span>
        </div>

        <p className="mt-2.5 flex-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {boat.description || "Safari tour vessel ready for bentota river voyages."}
        </p>

        {/* Card Footer Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3.5 text-xs">
          <button
            onClick={onView}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 transition"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition"
              title="Delete Boat"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Boat Form Modal (Add & Edit)
// Supports Direct Phone/PC File Upload
// ==========================================
function BoatFormModal({
  isOpen,
  boat,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  boat?: Boat | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!boat;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(boat?.name || "");
  const [registrationNumber, setRegistrationNumber] = useState(
    boat?.registration_number || ""
  );
  const [capacity, setCapacity] = useState<number>(boat?.capacity || 8);
  const [status, setStatus] = useState<BoatStatus>(boat?.status || "available");
  const [description, setDescription] = useState(boat?.description || "");

  // Image upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(boat?.image_url || null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection from phone or PC file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: JPG, PNG, WEBP
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    // Validate size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Image file size must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setFileError(null);
    if (isEditing && boat?.image_url) {
      setPreviewUrl(boat.image_url);
    } else {
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("registration_number", registrationNumber.trim());
      formData.append("capacity", String(capacity));
      formData.append("status", status);
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (isEditing && boat) {
        await boatApi.updateBoat(boat.id, formData);
      } else {
        await boatApi.createBoat(formData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to save boat information.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative my-8 w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1b22] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">
                {isEditing ? "Edit Vessel Details" : "Register New Vessel"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? `Updating configuration for ${boat.name}`
                  : "Add a new safari boat to the Bentota lagoon fleet"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Direct Device Image Upload Area */}
          <div>
            <label className="mb-1.5 block font-medium text-slate-300">
              Boat Image (Device Upload: Phone Gallery / PC Picker)
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Preview Thumbnail */}
              <div className="relative h-28 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#071318] shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Boat Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-slate-600">
                    <ImageIcon className="h-8 w-8 stroke-[1.5]" />
                    <span className="mt-1 text-[10px] text-slate-500">No Image</span>
                  </div>
                )}

                {selectedFile && (
                  <span className="absolute bottom-1 right-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">
                    New
                  </span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Choose from Device</span>
                  </button>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Supports JPG, PNG, and WEBP files up to 5MB. Images are stored securely on the local server.
                </p>

                {selectedFile && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                )}

                {fileError && (
                  <div className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name & Registration Number */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-slate-300">
                Boat Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bentota Queen"
                className="w-full rounded-lg border border-white/10 bg-[#071318] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-300">
                Registration / Boat ID <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. SL-BT-001"
                className="w-full rounded-lg border border-white/10 bg-[#071318] px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Capacity & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-slate-300">
                Passenger Capacity (Seats) <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-lg border border-white/10 bg-[#071318] px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Configurable per boat (e.g. 8, 12, etc.)
              </p>
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-300">
                Operational Status <span className="text-amber-400">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BoatStatus)}
                className="w-full rounded-lg border border-white/10 bg-[#071318] px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value="available">Available (Active & Bookable)</option>
                <option value="in_use">In Use (Currently on river safari)</option>
                <option value="maintenance">Maintenance (Servicing or repairs)</option>
                <option value="unavailable">Unavailable (Off-season/standby)</option>
              </select>
            </div>
          </div>

          {/* Description & Operational Notes */}
          <div>
            <label className="mb-1 block font-medium text-slate-300">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Twin 40HP eco outboard, shaded canopy, padded leather seating, safety life jackets included."
              className="w-full rounded-lg border border-white/10 bg-[#071318] p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Vessel...</span>
                </>
              ) : (
                <>
                  <Ship className="h-3.5 w-3.5" />
                  <span>{isEditing ? "Update Vessel" : "Register Vessel"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// Boat Details Modal
// ==========================================
function BoatDetailsModal({
  boat,
  onClose,
  onEdit,
}: {
  boat: Boat;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1b22] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Ship className="h-4 w-4 text-amber-400" />
            <h3 className="font-serif text-base font-bold text-white">{boat.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-[#071318]">
          {boat.image_url ? (
            <img
              src={boat.image_url}
              alt={boat.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-600">
              <Ship className="h-10 w-10" />
              <span className="mt-1 text-xs text-slate-500">No image on file</span>
            </div>
          )}
        </div>

        {/* Specs Table */}
        <div className="mt-4 divide-y divide-white/5 rounded-xl border border-white/5 bg-[#071318] p-3 text-xs">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-400">Registration Code</span>
            <span className="font-mono font-semibold text-amber-300">
              {boat.registration_number}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-400">Passenger Capacity</span>
            <span className="font-semibold text-white">{boat.capacity} Guests</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-400">Status</span>
            <StatusBadge status={boat.status} />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-400">Storage Relative Path</span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
              {boat.image || "None (NULL)"}
            </span>
          </div>
        </div>

        {boat.description && (
          <div className="mt-3 rounded-xl border border-white/5 bg-[#071318] p-3 text-xs">
            <span className="font-medium text-slate-400 block mb-1">Description</span>
            <p className="text-slate-300 leading-relaxed">{boat.description}</p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Vessel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
