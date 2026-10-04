import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const SLIDES = Array.from({ length: 8 }).map((_, i) => ({
  src: `/animals/animal-${i + 1}.jpeg`,
  alt: `Wildlife spotted along the Bentota River (${i + 1} of 8)`,
}));

const AUTOPLAY_MS = 4000;

export function AnimalsSlideshow() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const count = SLIDES.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((prev) => (prev + dir + count) % count),
    [count]
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [playing, count]);

  useEffect(() => {
    if (!playing) frameRef.current?.focus({ preventScroll: true });
  }, [playing]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-accent-strong">
        Wildlife encounters
      </p>

      <div
        ref={frameRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="River wildlife slideshow"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            loading={i === 0 ? "eager" : "lazy"}
            aria-hidden={i === index ? undefined : true}
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "Click to pause" : "Click to play"}
            className={`absolute inset-0 size-full cursor-pointer object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent px-5 pb-4 pt-12 text-left text-sm text-primary-foreground">
          Wildlife along the Bentota River · {index + 1} / {count}
          {!playing && <span className="ml-2 text-xs uppercase tracking-widest opacity-70">· Paused</span>}
        </span>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-foreground/60 text-primary-foreground backdrop-blur transition hover:bg-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-foreground/60 text-primary-foreground backdrop-blur transition hover:bg-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause slideshow" : "Play slideshow"}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-foreground/60 text-primary-foreground backdrop-blur transition hover:bg-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Choose photo">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Photo ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              i === index ? "w-8 bg-accent-strong" : "w-3 bg-border hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
