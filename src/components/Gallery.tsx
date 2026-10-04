import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Play, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { galleryImages } from "@/data/gallery";
import { mediaApi, type MediaItem } from "@/services/mediaApi";

export interface DisplayMedia {
  id: number | string;
  src: string;
  alt: string;
  caption: string;
  type: "image" | "video";
  category?: string;
  width?: number;
  height?: number;
}

export interface GalleryProps {
  limit?: number;
  showViewAll?: boolean;
  category?: string;
  type?: "all" | "image" | "video";
  className?: string;
}

export function Gallery({
  limit,
  showViewAll = false,
  category,
  type = "all",
  className,
}: GalleryProps = {}) {
  const [dynamicMedia, setDynamicMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Fetch publicly visible media from backend
  useEffect(() => {
    let isMounted = true;
    mediaApi
      .getPublicMedia({
        type: type !== "all" ? type : undefined,
        category: category !== "all" ? category : undefined,
      })
      .then((items) => {
        if (isMounted && Array.isArray(items)) {
          setDynamicMedia(items);
        }
      })
      .catch(() => {
        // Fallback silently to static images if API is unreachable
      });

    return () => {
      isMounted = false;
    };
  }, [type, category]);

  // Format display media: prioritize visible dynamic media from backend, fallback to static gallery images
  const allMediaList: DisplayMedia[] = dynamicMedia.length > 0
    ? dynamicMedia.map((item) => ({
        id: item.id,
        src: item.url,
        alt: item.title,
        caption: item.title,
        type: item.type,
        category: item.category,
      }))
    : galleryImages.map((img, idx) => ({
        id: `static-${idx}`,
        src: img.src,
        alt: img.alt,
        caption: img.caption,
        type: "image" as const,
        category: "River Safari",
        width: img.width,
        height: img.height,
      }));

  // Limit items for homepage preview if limit prop is provided
  const mediaList = typeof limit === "number" && limit > 0
    ? allMediaList.slice(0, limit)
    : allMediaList;

  const count = mediaList.length;
  const activeMedia = selected === null ? undefined : mediaList[selected];

  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft")
        setSelected((value) => (value === null ? 0 : (value - 1 + count) % count));
      if (event.key === "ArrowRight")
        setSelected((value) => (value === null ? 0 : (value + 1) % count));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected, count]);

  return (
    <div className={className}>
      <div className="gallery-grid">
        {mediaList.map((item, index) => {
          const isVideo = item.type === "video";
          return (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => setSelected(index)}
              className={`group relative min-h-72 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                index === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
              aria-label={`Open media: ${item.caption}`}
            >
              {isVideo ? (
                <div className="relative size-full bg-black/80 flex items-center justify-center overflow-hidden">
                  <video
                    src={item.src}
                    preload="metadata"
                    muted
                    playsInline
                    className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Video Play Indicator Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/15">
                    <div className="flex size-14 items-center justify-center rounded-full bg-accent-strong/90 text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-accent-strong">
                      <Play className="size-6 ml-1 fill-white" />
                    </div>
                  </div>
                  {/* Video Badge */}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow">
                    <Video className="size-3 text-accent" /> Video
                  </span>
                </div>
              ) : (
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              {/* Hover Caption Overlay */}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-transparent px-5 pb-5 pt-16 text-left text-sm font-medium text-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-between">
                <span className="truncate pr-2">{item.caption}</span>
                {item.category && (
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-accent font-bold">
                    {item.category}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* View All Button at bottom */}
      {showViewAll && (
        <div className="mt-14 flex items-center justify-center">
          <Link
            to="/gallery"
            className="group inline-flex items-center gap-3 rounded-full border border-accent/40 bg-accent/10 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-accent transition-all duration-300 hover:border-accent hover:bg-accent hover:text-accent-foreground hover:shadow-xl hover:shadow-accent/10"
          >
            <span>View All</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {selected !== null && activeMedia && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-foreground/95 p-4 sm:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="River gallery lightbox"
          onClick={() => setSelected(null)}
        >
          <Button
            ref={closeRef}
            variant="heroOutline"
            size="icon"
            className="absolute right-5 top-5 cursor-pointer text-white hover:bg-white/20"
            onClick={() => setSelected(null)}
            aria-label="Close gallery"
          >
            <X className="size-5" />
          </Button>

          <Button
            variant="heroOutline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer text-white hover:bg-white/20"
            onClick={(event) => {
              event.stopPropagation();
              setSelected((selected - 1 + count) % count);
            }}
            aria-label="Previous media"
          >
            <ChevronLeft className="size-6" />
          </Button>

          <figure className="max-h-[85vh] max-w-6xl" onClick={(event) => event.stopPropagation()}>
            {activeMedia.type === "video" ? (
              <video
                src={activeMedia.src}
                controls
                autoPlay
                playsInline
                className="max-h-[78vh] max-w-full rounded-lg shadow-2xl bg-black"
              />
            ) : (
              <img
                src={activeMedia.src}
                alt={activeMedia.alt}
                width={activeMedia.width}
                height={activeMedia.height}
                className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            )}
            <figcaption className="mt-4 text-center text-sm text-primary-foreground/90 font-medium">
              {activeMedia.caption}
              {activeMedia.category && (
                <span className="ml-2 text-xs text-accent uppercase tracking-wider font-semibold">
                  · {activeMedia.category}
                </span>
              )}
              <span className="ml-3 text-xs opacity-60">
                ({selected + 1} of {count})
              </span>
            </figcaption>
          </figure>

          <Button
            variant="heroOutline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-white hover:bg-white/20"
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
    </div>
  );
}
