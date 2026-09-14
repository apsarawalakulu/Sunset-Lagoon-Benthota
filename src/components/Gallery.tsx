import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { galleryImages } from "@/data/gallery";

export function Gallery() {
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = galleryImages.length;
  const activeImage = selected === null ? undefined : galleryImages[selected];

  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") setSelected((value) => value === null ? 0 : (value - 1 + count) % count);
      if (event.key === "ArrowRight") setSelected((value) => value === null ? 0 : (value + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); };
  }, [selected, count]);

  return <>
    <div className="gallery-grid">
      {galleryImages.map((image, index) => (
        <button key={`${image.caption}-${index}`} type="button" onClick={() => setSelected(index)} className={`group relative min-h-72 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`} aria-label={`Open image: ${image.caption}`}>
          <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent px-5 pb-5 pt-16 text-left text-sm text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">{image.caption}</span>
        </button>
      ))}
    </div>
    {selected !== null && activeImage && <div className="fixed inset-0 z-[70] grid place-items-center bg-foreground/95 p-4 sm:p-10" role="dialog" aria-modal="true" aria-label="River gallery lightbox" onClick={() => setSelected(null)}>
      <Button ref={closeRef} variant="heroOutline" size="icon" className="absolute right-5 top-5" onClick={() => setSelected(null)} aria-label="Close gallery"><X /></Button>
      <Button variant="heroOutline" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2" onClick={(event) => { event.stopPropagation(); setSelected((selected - 1 + count) % count); }} aria-label="Previous image"><ChevronLeft /></Button>
      <figure className="max-h-[85vh] max-w-6xl" onClick={(event) => event.stopPropagation()}>
        <img src={activeImage.src} alt={activeImage.alt} width={activeImage.width} height={activeImage.height} className="max-h-[78vh] max-w-full object-contain" />
        <figcaption className="mt-4 text-center text-sm text-primary-foreground/80">{activeImage.caption} · {selected + 1}/{count}</figcaption>
      </figure>
      <Button variant="heroOutline" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2" onClick={(event) => { event.stopPropagation(); setSelected((selected + 1) % count); }} aria-label="Next image"><ChevronRight /></Button>
    </div>}
  </>;
}