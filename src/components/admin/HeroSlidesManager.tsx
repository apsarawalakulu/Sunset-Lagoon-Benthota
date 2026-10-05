import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { adminAuth } from "@/services/adminAuth";
import { heroApi, type HeroSlide } from "@/services/heroApi";
import { uploadToCloudinary } from "@/services/uploads";

type Device = "desktop" | "mobile";

function Simulator({
  device,
  slide,
}: {
  device: Device;
  slide: HeroSlide | null;
}) {
  const isDesktop = device === "desktop";
  return (
    <div className={isDesktop ? "w-full" : "mx-auto w-[200px]"}>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {isDesktop ? <Monitor className="size-3.5" /> : <Smartphone className="size-3.5" />}
        {isDesktop ? "Desktop preview" : "Mobile preview"}
      </p>
      <div
        className={
          isDesktop
            ? "overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
            : "overflow-hidden rounded-[2rem] border-[6px] border-slate-700 bg-slate-950 shadow-2xl"
        }
      >
        {isDesktop && (
          <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-900 px-3 py-2">
            <span className="size-2 rounded-full bg-rose-500/70" />
            <span className="size-2 rounded-full bg-amber-500/70" />
            <span className="size-2 rounded-full bg-emerald-500/70" />
            <span className="ml-2 flex-1 truncate rounded-md bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-500">
              sunsetlagoon.boats
            </span>
          </div>
        )}
        {!isDesktop && (
          <div className="flex justify-center bg-slate-900 py-1.5">
            <span className="h-3.5 w-16 rounded-full bg-slate-950" />
          </div>
        )}
        <div className={`relative w-full overflow-hidden ${isDesktop ? "aspect-video" : "aspect-[9/19]"}`}>
          {slide ? (
            <img src={slide.src} alt={slide.alt || "Hero preview"} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-slate-900 p-4 text-center text-xs text-slate-500">
              No active slide — add one below to preview it here.
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,18,16,.45) 0%, rgba(10,18,16,.08) 35%, rgba(10,18,16,.18) 65%, rgba(10,18,16,.55) 100%)",
            }}
          />
          {slide && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <p
                className={`font-bold uppercase text-amber-400/90 ${
                  isDesktop ? "text-[9px] tracking-[0.5em]" : "text-[7px] tracking-[0.3em]"
                }`}
              >
                Bentota · Sri Lanka
              </p>
              <p
                className={`mt-2 font-serif font-light text-white ${
                  isDesktop ? "text-3xl" : "text-lg leading-tight"
                }`}
              >
                Discover the Hidden Beauty of Bentota
              </p>
              <div className={`mt-3 flex gap-2 ${isDesktop ? "" : "flex-col items-center"}`}>
                <span
                  className={`rounded-sm border border-amber-400/80 font-bold uppercase text-amber-300 ${
                    isDesktop ? "px-4 py-1.5 text-[8px] tracking-[0.3em]" : "px-3 py-1 text-[7px] tracking-[0.2em]"
                  }`}
                >
                  Begin the journey
                </span>
                {isDesktop && (
                  <span className="rounded-sm border border-white/50 px-4 py-1.5 text-[8px] font-bold uppercase tracking-[0.3em] text-white">
                    View the river
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function verifyImageUrl(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(
      () => reject(new Error("Upload finished, but the image could not be verified. Please try again.")),
      20000
    );
    img.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Upload finished, but the image could not be verified. Please try again."));
    };
    img.src = src;
  });
}

function AddSlideForm({
  device,
  onAdded,
}: {
  device: Device;
  onAdded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      let src = url.trim();
      if (file) {
        setSaving(true);
        setProgress(0);
        const uploaded = await uploadToCloudinary(file, (pct) => setProgress(pct));
        setProgress(100);
        // First verify the uploaded file actually serves before saving the slide.
        await verifyImageUrl(uploaded.url);
        src = uploaded.url;
      }
      if (!src) {
        setStatus({ kind: "error", text: "Choose a file or paste an image URL." });
        return;
      }
      if (!file) {
        // Pasted URLs are verified too, so broken links never reach the website.
        setSaving(true);
        await verifyImageUrl(src);
      }
      await heroApi.save(null, { device, src, alt: alt.trim() || null, is_active: true });
      setFile(null);
      setUrl("");
      setAlt("");
      setFileKey((k) => k + 1);
      setStatus({ kind: "success", text: "Image uploaded, verified and added to the website." });
      onAdded();
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Could not add slide." });
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  return (
    <form onSubmit={handleAdd} className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-3">
      {status && (
        <p className={`mb-2 text-xs ${status.kind === "success" ? "text-emerald-300" : "text-rose-300"}`}>
          {status.text}
        </p>
      )}
      {progress !== null && (
        <div className="mb-2 space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Uploading image...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-amber-500 transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:border-amber-500/50">
          <Upload className="size-3.5 shrink-0 text-amber-400" />
          <span className="truncate">{file ? file.name : "Upload image..."}</span>
          <input
            type="file"
            accept="image/*"
            key={fileKey}
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="...or paste image URL"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/60"
        />
        <div className="flex gap-2">
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text (optional)"
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/60"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Add
          </button>
        </div>
      </div>
    </form>
  );
}

function SlideList({
  device,
  slides,
  busyId,
  onToggle,
  onDelete,
  onMove,
}: {
  device: Device;
  slides: HeroSlide[];
  busyId: number | null;
  onToggle: (s: HeroSlide) => void;
  onDelete: (s: HeroSlide) => void;
  onMove: (s: HeroSlide, dir: -1 | 1) => void;
}) {
  const list = slides.filter((s) => s.device === device);
  if (list.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">No slides yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {list.map((s, i) => (
        <li
          key={s.id}
          className={`flex items-center gap-3 rounded-lg border p-2 ${
            s.is_active ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-950 opacity-60"
          }`}
        >
          <img src={s.src} alt="" className="size-14 shrink-0 rounded-md object-cover" loading="lazy" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">{s.alt || "Untitled slide"}</p>
            <p className="truncate font-mono text-[10px] text-slate-500">{s.src}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(s, -1)}
              disabled={busyId === s.id || i === 0}
              aria-label="Move up"
              className="rounded p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(s, 1)}
              disabled={busyId === s.id || i === list.length - 1}
              aria-label="Move down"
              className="rounded p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <ChevronDown className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggle(s)}
              disabled={busyId === s.id}
              aria-label={s.is_active ? "Hide slide" : "Show slide"}
              className="rounded p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              {s.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => onDelete(s)}
              disabled={busyId === s.id}
              aria-label="Delete slide"
              className="rounded p-1 text-slate-400 hover:text-rose-300 disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HeroSlidesManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HeroSlide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSlides(await heroApi.adminList());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load hero slides.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) return;
    load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggle = async (s: HeroSlide) => {
    setBusyId(s.id);
    try {
      await heroApi.save(s.id, { device: s.device, src: s.src, alt: s.alt, is_active: !s.is_active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update slide.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setBusyId(id);
    try {
      await heroApi.remove(id);
      flash("Slide deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete slide.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (s: HeroSlide, dir: -1 | 1) => {
    const list = slides.filter((x) => x.device === s.device);
    const idx = list.findIndex((x) => x.id === s.id);
    const other = list[idx + dir];
    if (!other) return;
    const ids = list.map((x) => x.id);
    [ids[idx], ids[idx + dir]] = [ids[idx + dir]!, ids[idx]!];
    setBusyId(s.id);
    try {
      await heroApi.reorder(s.device, ids);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reorder slides.");
    } finally {
      setBusyId(null);
    }
  };

  const firstActive = (device: Device): HeroSlide | null =>
    slides.find((s) => s.device === device && s.is_active) ?? null;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">{error}</div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-200">
          <CheckCircle2 className="size-4" /> {notice}
        </div>
      )}

      <section>
        <h3 className="font-serif text-lg font-medium text-amber-100">Live Banner Preview</h3>
        <p className="mt-1 text-xs text-slate-400">
          Exactly how the first active slide of each set looks on the website right now.
        </p>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="size-4 animate-spin" /> Loading preview...
          </div>
        ) : (
          <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1fr_220px]">
            <Simulator device="desktop" slide={firstActive("desktop")} />
            <Simulator device="mobile" slide={firstActive("mobile")} />
          </div>
        )}
      </section>

      {(["desktop", "mobile"] as const).map((device) => (
        <section key={device}>
          <h3 className="font-serif text-lg font-medium text-amber-100">
            {device === "desktop" ? "Desktop Banner Images" : "Mobile Banner Images"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {device === "desktop"
              ? "Wide landscape images (16:9 works best). Shown on tablets and computers."
              : "Tall portrait images (9:16 works best). Shown on phones."}{" "}
            Changes go live immediately.
          </p>
          <div className="mt-3">
            <SlideList
              device={device}
              slides={slides}
              busyId={busyId}
              onToggle={handleToggle}
              onDelete={(s) => setPendingDelete(s)}
              onMove={handleMove}
            />
          </div>
          <div className="mt-3">
            <AddSlideForm device={device} onAdded={load} />
          </div>
        </section>
      ))}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Delete hero slide"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <img
                src={pendingDelete.src}
                alt=""
                className="size-14 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <h3 className="font-serif text-lg text-slate-100">Delete this slide?</h3>
                <p className="truncate text-xs text-slate-400">
                  {pendingDelete.alt || pendingDelete.src}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              It will disappear from the website rotation immediately. If no
              slides remain, the website falls back to built-in images.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
