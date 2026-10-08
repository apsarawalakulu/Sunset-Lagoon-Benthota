import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/BookingModal";
import { Reveal } from "@/components/Reveal";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { LOGO_URL, siteConfig } from "@/data/siteConfig";
import type { Faq } from "@/components/FaqSection";

export function LandingCrumbs({ trail }: { trail: Array<{ name: string; path: string }> }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(trail)) }}
      />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl px-5 pt-28 sm:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground/60">
          {trail.map((item, i) => (
            <li key={item.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < trail.length - 1 ? (
                <Link to={item.path} className="transition-colors hover:text-primary-foreground">
                  {item.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-accent">
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function LandingHero({
  eyebrow,
  title,
  intro,
  image,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image: { src: string; alt: string };
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-10 pt-8 text-center sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-accent">{eyebrow}</p>
      <h1 className="mx-auto mt-6 max-w-4xl font-serif text-5xl font-light leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
        {title}
      </h1>
      <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-primary-foreground/75 sm:text-lg">
        {intro}
      </p>
      <div className="mx-auto mt-10 aspect-[21/9] max-w-4xl overflow-hidden rounded-xl">
        <img src={image.src} alt={image.alt} loading="eager" className="size-full object-cover" />
      </div>
    </div>
  );
}

export function LandingSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <Reveal>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-accent-strong">{eyebrow}</p>
        <h2 className="max-w-3xl font-serif text-3xl font-light tracking-tight sm:text-4xl">{title}</h2>
        <div className="mt-6 max-w-3xl space-y-5 text-base leading-8 text-muted-foreground">{children}</div>
      </Reveal>
    </div>
  );
}

export function LandingList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check className="mt-1.5 size-4 shrink-0 text-accent-strong" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LandingFaq({ faqs }: { faqs: Faq[] }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <Reveal>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-accent-strong">
            Good to know
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-light tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-5">
              <h3 className="font-serif text-xl font-light tracking-tight sm:text-2xl">{faq.question}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function LandingCta({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-accent px-5 py-16 text-accent-foreground sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]">Your river journey</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl font-light tracking-tight sm:text-5xl">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="forest" size="lg" onClick={() => setOpen(true)}>
            Book your safari <ArrowRight className="size-4" />
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://wa.me/94776838289" target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </a>
          </Button>
        </div>
      </div>
      <BookingModal open={open} onOpenChange={setOpen} />
    </div>
  );
}

export function RelatedSafaris({ links }: { links: Array<{ to: string; label: string; text: string }> }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <Reveal>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-accent-strong">
          Keep exploring
        </p>
        <h2 className="max-w-3xl font-serif text-3xl font-light tracking-tight sm:text-4xl">
          Related Bentota safaris
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group rounded-xl border border-border p-6 transition-colors hover:border-accent-strong/50"
            >
              <span className="font-serif text-xl font-light tracking-tight group-hover:underline">
                {link.label}
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{link.text}</span>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-strong">
                Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-primary-foreground/10 bg-foreground px-5 py-12 text-primary-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <img src={LOGO_URL} alt="Sunset Lagoon Boat House logo" width={96} height={96} loading="lazy" className="mb-5 size-20 object-contain" />
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
              <a key={item.href} href={`/${item.href}`} className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60 hover:text-primary-foreground">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Popular safaris">
          <Link to="/boat-safari-bentota" className="text-[10px] uppercase tracking-widest text-primary-foreground/40 hover:text-primary-foreground">Bentota Boat Safari</Link>
          <Link to="/river-safari-bentota" className="text-[10px] uppercase tracking-widest text-primary-foreground/40 hover:text-primary-foreground">River Safari</Link>
          <Link to="/mangrove-safari-bentota" className="text-[10px] uppercase tracking-widest text-primary-foreground/40 hover:text-primary-foreground">Mangrove Safari</Link>
        </nav>
        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-primary-foreground/10 pt-6 text-[10px] uppercase tracking-widest text-primary-foreground/40 sm:flex-row">
          <p>© 2026 Sunset Lagoon Boat House. All rights reserved.</p>
          <p>Bentota · Sri Lanka</p>
        </div>
      </div>
    </footer>
  );
}
