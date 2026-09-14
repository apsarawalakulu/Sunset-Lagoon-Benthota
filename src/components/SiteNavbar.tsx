import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/siteConfig";
import logo from "@/assets/sunset-lagoon-logo.png.asset.json";

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || open ? "border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur" : "text-primary-foreground"}`}>
      <nav className="mx-auto grid h-20 max-w-screen-2xl grid-cols-[minmax(0,1fr)_auto] items-center px-5 sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:px-12" aria-label="Main navigation">
        <a href="#home" className="flex min-w-0 items-center gap-3" aria-label="Sunset Lagoon home">
          <img src={logo.url} alt="Sunset Lagoon Boat House logo" width={40} height={40} className="size-11 shrink-0 rounded-full object-contain" />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-serif text-xl">Sunset Lagoon</span>
            <span className="mt-1 block truncate text-[9px] font-semibold uppercase tracking-[0.24em] opacity-70">Boat House · Bentota</span>
          </span>
        </a>
        <div className="hidden items-center justify-center gap-6 lg:flex">
          {siteConfig.navigation.map((item) => <a key={item.href} href={item.href} className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80 transition-opacity hover:opacity-100">{item.label}</a>)}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant={scrolled || open ? "forest" : "hero"} size="lg" className="hidden sm:inline-flex"><a href="#contact">Book a safari</a></Button>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</Button>
        </div>
      </nav>
      <div className={`grid transition-[grid-template-rows] duration-300 lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden"><div className="border-t border-border px-5 py-5">
          {siteConfig.navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="block border-b border-border py-3 font-serif text-2xl">{item.label}</a>)}
          <Button asChild variant="forest" size="lg" className="mt-5 w-full"><a href="#contact" onClick={() => setOpen(false)}>Book a safari</a></Button>
        </div></div>
      </div>
    </header>
  );
}