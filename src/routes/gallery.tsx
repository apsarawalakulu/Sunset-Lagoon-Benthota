import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Image as ImageIcon, Play, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/BookingModal";
import { SiteNavbar } from "@/components/SiteNavbar";
import { galleryImages } from "@/data/gallery";
import { LOGO_URL, siteConfig } from "@/data/siteConfig";
import { displayMediaTitle } from "@/lib/media";
import { OG_IMAGE, absoluteUrl } from "@/lib/seo";
import { useSiteSettings } from "@/hooks/useApiData";
import { isApiConnected } from "@/services/api";
import { mediaApi, type MediaItem } from "@/services/mediaApi";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery & River Moments | Sunset Lagoon Boat House Bentota" },
      {
        name: "description",
        content:
          "Browse our full photo and video gallery of Bentota River boat safaris, ancient mangrove tunnels, exotic wildlife, and golden lagoon sunsets.",
      },
      { property: "og:title", content: "Gallery & River Moments | Sunset Lagoon Boat House Bentota" },
      {
        property: "og:description",
        content:
          "Browse our full photo and video gallery of Bentota River boat safaris, ancient mangrove tunnels, exotic wildlife, and golden lagoon sunsets.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/gallery") },
      { property: "og:image", content: OG_IMAGE.url },
      { property: "og:image:width", content: String(OG_IMAGE.width) },
      { property: "og:image:height", content: String(OG_IMAGE.height) },
      { property: "og:image:alt", content: OG_IMAGE.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Gallery & River Moments | Sunset Lagoon Boat House Bentota" },
      {
        name: "twitter:description",
        content:
          "Browse our full photo and video gallery of Bentota River boat safaris, ancient mangrove tunnels, exotic wildlife, and golden lagoon sunsets.",
      },
      { name: "twitter:image", content: OG_IMAGE.url },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/gallery") }],
  }),
  component: GalleryPage,
});

// Frontend-only fallback: local gallery data shaped like API media items.
function staticMediaFallback(): MediaItem[] {
  const now = new Date().toISOString();
  return galleryImages.map((img, idx) => ({
    id: `static-${idx}`,
    title: img.caption,
    type: "image" as const,
    file_path: img.src,
    url: img.src,
    category: "River Safari",
    description: img.alt,
    status: "visible" as const,
    is_visible: true,
    display_location: "gallery",
    is_hero: false,
    sort_order: idx,
    file_size: null,
    formatted_size: "",
    mime_type: null,
    created_at: now,
    updated_at: now,
  }));
}

function GalleryPage() {
  const { data: liveSettings } = useSiteSettings();
  const logoUrl = liveSettings?.logo_url || LOGO_URL;
  const businessName = liveSettings?.business_name || siteConfig.fullName;

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Fetch all visible media items
  const loadMedia = async () => {
    setIsLoading(true);
    try {
      if (!isApiConnected()) {
        setMediaItems(staticMediaFallback());
        return;
      }
      const items = await mediaApi.getPublicMedia({
        type: typeFilter !== "all" ? typeFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
      });
      setMediaItems(items && items.length > 0 ? items : staticMediaFallback());
    } catch {
      setMediaItems(staticMediaFallback());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [typeFilter, categoryFilter]);

  // Derive unique categories from media
  const categories = ["all", ...Array.from(new Set(mediaItems.map((m) => m.category).filter(Boolean)))];

  const count = mediaItems.length;
  const activeItem = selected !== null ? mediaItems[selected] : undefined;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft")
        setSelected((prev) => (prev === null ? 0 : (prev - 1 + count) % count));
      if (event.key === "ArrowRight")
        setSelected((prev) => (prev === null ? 0 : (prev + 1) % count));
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected, count]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteNavbar onOpenBooking={() => setIsBookingModalOpen(true)} />

      {/* Hero Header */}
      <section className="relative bg-foreground text-primary-foreground pt-32 pb-20 px-5 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-accent/10 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-screen-2xl relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent hover:text-accent-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" /> Back to Home
          </Link>

          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent mb-3">
            Visual Field Notes
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight">
            Moments From The River
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-primary-foreground/75 font-light">
            A visual chronicle of the waters, hidden mangrove tunnels, tropical river wildlife, and serene golden sunsets in Bentota, Sri Lanka.
          </p>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="border-b border-border bg-card/60 sticky top-20 z-30 backdrop-blur-md">
        <div className="mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-12 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-full border border-border shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                typeFilter === "all"
                  ? "bg-foreground text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Moments
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("image")}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                typeFilter === "image"
                  ? "bg-foreground text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="size-3.5" /> Photos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("video")}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                typeFilter === "video"
                  ? "bg-foreground text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="size-3.5" /> Videos
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Filter className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Gallery Grid */}
      <main className="flex-1 mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-12 py-12 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl font-light">No media moments found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try changing your type or category filter above to see more moments.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6"
              onClick={() => {
                setTypeFilter("all");
                setCategoryFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mediaItems.map((item, index) => {
              const isVideo = item.type === "video";
              return (
                <button
                  key={`${item.id}-${index}`}
                  type="button"
                  onClick={() => setSelected(index)}
                  className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
                  aria-label={`Open media: ${displayMediaTitle(item.title, item.category)}`}
                >
                  {isVideo ? (
                    <div className="relative size-full bg-black/90 flex items-center justify-center overflow-hidden">
                      <video
                        src={item.url}
                        preload="metadata"
                        muted
                        playsInline
                        className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/15">
                        <div className="flex size-14 items-center justify-center rounded-full bg-accent-strong/90 text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-accent-strong">
                          <Play className="size-6 ml-1 fill-white" />
                        </div>
                      </div>
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow">
                        <Video className="size-3 text-accent" /> Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={displayMediaTitle(item.title, item.category)}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  {/* Category Pill */}
                  {item.category && (
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
                      {item.category}
                    </span>
                  )}

                  {/* Caption Gradient */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/95 via-foreground/60 to-transparent px-4 pb-4 pt-16 transition-opacity duration-300">
                    <p className="text-sm font-semibold text-primary-foreground line-clamp-1">
                      {displayMediaTitle(item.title, item.category)}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-xs text-primary-foreground/70 line-clamp-1 font-light">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selected !== null && activeItem && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-foreground/95 p-4 sm:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery lightbox"
          onClick={() => setSelected(null)}
        >
          <Button
            ref={closeRef}
            variant="heroOutline"
            size="icon"
            className="absolute right-5 top-5 cursor-pointer text-white hover:bg-white/20 z-10"
            onClick={() => setSelected(null)}
            aria-label="Close gallery"
          >
            <X className="size-5" />
          </Button>

          <Button
            variant="heroOutline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer text-white hover:bg-white/20 z-10"
            onClick={(event) => {
              event.stopPropagation();
              setSelected((selected - 1 + count) % count);
            }}
            aria-label="Previous media"
          >
            <ChevronLeft className="size-6" />
          </Button>

          <figure className="max-h-[85vh] max-w-6xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {activeItem.type === "video" ? (
              <video
                src={activeItem.url}
                controls
                autoPlay
                playsInline
                className="max-h-[75vh] max-w-full rounded-lg shadow-2xl bg-black"
              />
            ) : (
              <img
                src={activeItem.url}
                alt={displayMediaTitle(activeItem.title, activeItem.category)}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            )}
            <figcaption className="mt-4 text-center text-sm text-primary-foreground/90 font-medium">
              <span>{displayMediaTitle(activeItem.title, activeItem.category)}</span>
              {activeItem.category && (
                <span className="ml-2 text-xs text-accent uppercase tracking-wider font-semibold">
                  · {activeItem.category}
                </span>
              )}
              {activeItem.description && (
                <span className="block text-xs text-primary-foreground/70 mt-1 font-light max-w-2xl mx-auto">
                  {activeItem.description}
                </span>
              )}
              <span className="block mt-1 text-xs opacity-50">
                {selected + 1} of {count}
              </span>
            </figcaption>
          </figure>

          <Button
            variant="heroOutline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-white hover:bg-white/20 z-10"
            onClick={(event) => {
              event.stopPropagation();
              setSelected((selected + 1) % count);
            }}
            aria-label="Next media"
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>
      )}

      {/* Booking CTA */}
      <section className="bg-sand py-16 px-5 sm:px-8 border-t border-border">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent-strong">
            Experience It Yourself
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-light">
            Ready to Cruise the Bentota River?
          </h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Book your safari today to discover ancient mangrove caves, diverse wildlife, and peaceful lagoon waters.
          </p>
          <Button
            variant="forest"
            size="lg"
            className="mt-8 px-10"
            onClick={() => setIsBookingModalOpen(true)}
          >
            Book your safari
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary-foreground/10 bg-foreground px-5 py-12 text-primary-foreground sm:px-8 mt-auto">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <img
                src={logoUrl}
                alt={`${businessName} logo`}
                width={80}
                height={80}
                loading="lazy"
                className="mb-4 size-20 object-contain"
              />
              <p className="flex items-baseline gap-2">
                <span className="font-brand text-3xl leading-[1.15]">Sunset</span>
                <span className="text-2xl font-bold uppercase tracking-[0.06em]">Lagoon</span>
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-primary-foreground/50">
                Boat House · Bentota
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end sm:gap-6" aria-label="Footer navigation">
              {siteConfig.navigation.map((item) => (
                <a
                  key={item.href}
                  href={`/${item.href}`}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60 hover:text-primary-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-primary-foreground/10 pt-6 text-[10px] uppercase tracking-widest text-primary-foreground/40 sm:flex-row">
            <p>© 2026 Sunset Lagoon Boat House. All rights reserved.</p>
            <p>Bentota · Sri Lanka · <a href="/admin/login" className="underline-offset-4 hover:text-primary-foreground hover:underline">Admin Login</a></p>
          </div>
        </div>
      </footer>

      <BookingModal
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
      />
    </div>
  );
}
