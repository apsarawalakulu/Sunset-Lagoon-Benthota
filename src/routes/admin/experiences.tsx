import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminAuth } from "@/services/adminAuth";
import { adminExperiencesApi, type AdminExperience } from "@/services/adminExperiences";

export const Route = createFileRoute("/admin/experiences")({
  head: () => ({
    meta: [
      { title: "Experiences | Admin | Sunset Lagoon Boat House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminExperiencesPage,
});

const EMPTY_FORM = {
  title: "",
  description: "",
  duration: "",
  price: "",
  max_guests: "",
  status: "active",
  sort_order: "0",
};

function AdminExperiencesPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(adminAuth.getStoredUser());
  const [items, setItems] = useState<AdminExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminExperience | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await adminAuth.getMe();
      setAdmin(me);
      const list = await adminExperiencesApi.list();
      setItems(list);
    } catch (err: any) {
      if (err?.message?.includes("session") || err?.message?.includes("Unauthorized")) {
        navigate({ to: "/admin/login" });
        return;
      }
      setError(err?.message || "Failed to load experiences.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      navigate({ to: "/admin/login" });
      return;
    }
    load();
  }, [load, navigate]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (item: AdminExperience) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      duration: item.duration ?? "",
      price: item.price !== null && item.price !== undefined ? String(item.price) : "",
      max_guests: item.max_guests !== null && item.max_guests !== undefined ? String(item.max_guests) : "",
      status: item.status,
      sort_order: String(item.sort_order ?? 0),
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      await adminExperiencesApi.save(editing?.id ?? null, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        duration: form.duration.trim() || null,
        price: form.price.trim() === "" ? null : Number(form.price),
        max_guests: form.max_guests.trim() === "" ? null : Number(form.max_guests),
        image: imageFile ?? editing?.image ?? null,
        status: form.status,
        sort_order: Number(form.sort_order) || 0,
      });
      setSuccess(editing ? "Experience updated." : "Experience created.");
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save experience.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this experience? Bookings linked to it will be kept but unlinked.")) return;
    setDeletingId(id);
    try {
      await adminExperiencesApi.remove(id);
      setSuccess("Experience deleted.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to delete experience.");
    } finally {
      setDeletingId(null);
    }
  };

  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminLayout admin={admin} pageTitle="Experiences">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-light text-slate-100">Safari Experiences</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage the experience cards shown on the public website.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-600/20 transition hover:bg-amber-400"
          >
            <Plus className="size-4" /> New Experience
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-800/60" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center">
            <Compass className="mx-auto size-10 text-slate-600" />
            <p className="mt-4 font-serif text-xl text-slate-300">No experiences yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first safari experience to show it on the website.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
                <div className="aspect-[16/9] bg-slate-800">
                  {item.image ? (
                    <img src={item.image} alt={item.title} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-slate-600">
                      <Compass className="size-10" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-xl text-slate-100">{item.title}</h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-slate-500/15 text-slate-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                    {item.duration && <span>{item.duration}</span>}
                    {item.max_guests !== null && <span>Max {item.max_guests} guests</span>}
                    {item.price !== null && <span>LKR {item.price}</span>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-amber-400/60 hover:text-amber-300"
                    >
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-label="Experience editor">
          <form onSubmit={handleSave} className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-slate-100">{editing ? "Edit Experience" : "New Experience"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:text-slate-200">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="exp-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Title *</label>
                <input
                  id="exp-title"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. River Safari"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400/70"
                />
              </div>
              <div>
                <label htmlFor="exp-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Description</label>
                <textarea
                  id="exp-desc"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={3}
                  placeholder="Short marketing description shown on the experience card."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400/70"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="exp-duration" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Duration</label>
                  <input
                    id="exp-duration"
                    value={form.duration}
                    onChange={(e) => setField("duration", e.target.value)}
                    placeholder="e.g. 2 Hours"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label htmlFor="exp-price" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Price (LKR)</label>
                  <input
                    id="exp-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="Leave empty if not set"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="exp-guests" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Max Guests</label>
                  <input
                    id="exp-guests"
                    type="number"
                    min="1"
                    value={form.max_guests}
                    onChange={(e) => setField("max_guests", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label htmlFor="exp-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Status</label>
                  <select
                    id="exp-status"
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/70"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="exp-order" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Sort Order</label>
                  <input
                    id="exp-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setField("sort_order", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Card Image</span>
                <div className="mt-1 flex items-center gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                    {imagePreview || editing?.image ? (
                      <img src={imagePreview ?? editing?.image ?? ""} alt="" className="size-full object-cover" />
                    ) : (
                      <Compass className="size-6 text-slate-600" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="text-xs text-slate-400 file:mr-3 file:rounded-lg file:border file:border-slate-700 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:border-amber-400/60"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Uploads to Cloudinary (requires upload preset).</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Experience"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
