import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { ArrowDown, ArrowRight, Bird, Compass, Leaf, MapPin, MessageCircle, Sailboat, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlipFadeText } from "@/components/ui/flip-fade-text";
import TextAnimation from "@/components/ui/staggerText";
import { experiences } from "@/data/experiences";
import { getWhatsAppUrl, heroSlides, images, LOGO_URL, siteConfig } from "@/data/siteConfig";

import { Gallery } from "./Gallery";
import { Reveal } from "./Reveal";
import { SiteNavbar } from "./SiteNavbar";

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`mb-5 text-[11px] font-bold uppercase tracking-[0.28em] ${light ? "text-accent" : "text-accent-strong"}`}>{children}</p>;
}

function SectionTitle({ eyebrow, title, intro, light = false }: { eyebrow: string; title: string; intro?: string; light?: boolean }) {
  return <div className="max-w-3xl"><Eyebrow light={light}>{eyebrow}</Eyebrow><h2 className={`font-serif text-4xl font-light leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl ${light ? "text-primary-foreground" : "text-foreground"}`}><TextAnimation>{title}</TextAnimation></h2>{intro && <Reveal delay={0.15}><p className={`mt-6 max-w-2xl text-base leading-8 ${light ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{intro}</p></Reveal>}</div>;
}

function HeroSlideshow() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setActiveSlide((activeSlide + 1) % heroSlides.length), 4500);
    return () => window.clearTimeout(timeout);
  }, [activeSlide]);

  return <div className="absolute inset-0" aria-hidden="true">
    {heroSlides.map((media, index) => (
      <img key={media.src} src={media.src} alt="" width={media.width} height={media.height} fetchPriority={index === 0 ? "high" : "auto"} className={`hero-slide absolute inset-0 size-full object-cover object-center ${index === activeSlide ? "is-active" : ""}`} />
    ))}
  </div>;
}

export function HomePage() {
  return <MotionConfig reducedMotion="user"><div className="overflow-x-clip bg-background">
    <SiteNavbar />
    <main>
      <section id="home" className="relative flex min-h-[min(920px,100svh)] items-center justify-center overflow-hidden bg-foreground text-primary-foreground">
        <HeroSlideshow />
        <div className="hero-overlay absolute inset-0" />
        <div className="hero-copy relative mx-auto max-w-5xl px-6 pb-24 pt-36 text-center sm:px-8">
          <p className="flex flex-wrap items-center justify-center gap-x-3 text-[11px] font-bold uppercase tracking-[0.5em] text-accent"><span>Bentota · Sri Lanka</span><span aria-hidden="true" className="hidden h-px w-6 bg-accent/60 sm:block" /><FlipFadeText textClassName="text-[11px] font-bold uppercase tracking-[0.5em] text-accent" /></p>
          <h1 className="mt-8 font-serif text-5xl font-light leading-[0.92] tracking-tight sm:text-7xl lg:text-[6.6rem]">Discover the Hidden <span className="italic">Beauty</span> of Bentota</h1>
          <p className="mx-auto mt-10 max-w-md text-sm font-light leading-relaxed text-primary-foreground/80 sm:text-base">Cruise through tranquil waters, mangrove forests and the wild beauty of Bentota with Sunset Lagoon Boat House.</p>
          <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="gold" size="lg" className="px-12 tracking-[0.3em]"><a href="#experience">Begin the journey</a></Button>
            <Button asChild variant="heroOutline" size="lg" className="px-10 tracking-[0.3em]"><a href="#gallery">View the river</a></Button>
          </div>
        </div>
        <a href="#about" aria-label="Scroll to our story" className="absolute inset-x-0 bottom-8 z-10 mx-auto flex w-fit flex-col items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] text-primary-foreground/60"><span>Follow the river</span><span className="hairline-down block h-10 w-px text-primary-foreground/70" /><ArrowDown className="size-3.5 animate-bounce" /></a>
      </section>

      <section id="about" className="section-pad scroll-mt-20 bg-sand">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-24">
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden"><img src={images.introduction.src} alt={images.introduction.alt} width={images.introduction.width} height={images.introduction.height} loading="lazy" className="size-full object-cover transition-transform duration-1000 hover:scale-[1.03]" /></div>
            <div className="mt-10 flex items-center gap-4"><span className="h-px w-8 bg-accent-strong" /><span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent-strong">The Sunset Lagoon experience</span></div>
          </div>
          <div className="lg:col-span-7">
            <h2 className="font-serif text-4xl font-light leading-tight tracking-tight sm:text-5xl lg:text-6xl">An intimate escape into the <span className="italic text-primary">untamed beauty</span> of the river.</h2>
            <div className="mt-12 grid gap-10 sm:grid-cols-2">
              <p className="text-sm leading-8 text-muted-foreground sm:text-base">Sunset Lagoon offers a local way to experience Bentota—following the river through mangroves, tropical greenery and peaceful natural surroundings.</p>
              <p className="text-sm leading-8 text-muted-foreground sm:text-base">Every journey is an invitation to slow down, watch the light shift across the water and see this landscape the way the river reveals it.</p>
            </div>
            <div className="mt-16 flex flex-wrap gap-x-14 gap-y-8">
              {experiences.map((experience, index) => <div key={experience.id} className="flex flex-col">
                <span className="font-serif text-4xl font-light">0{index + 1}.</span>
                <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{experience.title}</span>
              </div>)}
            </div>
            <a href="#story" className="mt-14 inline-flex items-center gap-5 group"><span className="h-px w-12 bg-foreground transition-all duration-500 group-hover:w-20 group-hover:bg-accent-strong" /><span className="text-[10px] font-bold uppercase tracking-[0.35em] transition-colors group-hover:text-accent-strong">Discover our story</span></a>
          </div>
        </div>
      </section>


      <section id="experience" className="section-pad scroll-mt-20 bg-background">
        <div className="mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between gap-6"><SectionTitle eyebrow="On the water" title="Choose Your Experience" /><p className="hidden max-w-xs text-sm leading-7 text-muted-foreground lg:block">Each route reveals a different rhythm of the river, from open water to intimate green passages.</p></div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {experiences.map((experience, index) => <Reveal key={experience.id} delay={index * 0.12}><article className={`group ${index === 1 ? "md:mt-14" : ""}`}>
              <div className={`overflow-hidden bg-muted ${index === 1 ? "aspect-[4/5]" : "aspect-[4/5] md:aspect-[3/4]"}`}><img src={experience.image.src} alt={experience.image.alt} width={experience.image.width} height={experience.image.height} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
              <div className="border-b border-border py-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-strong">0{index + 1} · {experience.category}</p><h3 className="mt-3 font-serif text-3xl font-light tracking-tight">{experience.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{experience.description}</p><a href="#contact" className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest">Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a></div>
            </article></Reveal>)}
          </div>
        </div>
      </section>

      <section id="story" className="relative min-h-[70vh] overflow-hidden py-28 text-primary-foreground sm:py-40">
        <img src={images.story.src} alt={images.story.alt} width={images.story.width} height={images.story.height} loading="lazy" className="absolute inset-0 size-full object-cover" /><div className="story-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-12"><div className="max-w-3xl"><Eyebrow light>Beyond the shoreline</Eyebrow><h2 className="font-serif text-5xl font-light leading-[1.02] tracking-tight sm:text-7xl"><TextAnimation>A Different Side of Bentota</TextAnimation></h2><Reveal delay={0.15}><p className="mt-7 max-w-xl text-lg leading-8 text-primary-foreground/75">Slow down. Breathe in the tropical air. Follow the river and discover a side of Bentota that can only be experienced from the water.</p></Reveal></div></div>
        <svg className="absolute -bottom-1 left-0 w-full text-background" viewBox="0 0 1440 90" fill="currentColor" aria-hidden="true"><path d="M0 56C240 8 410 92 720 48c310-44 480 25 720-24v66H0Z" /></svg>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-5 sm:px-8"><SectionTitle eyebrow="Travel with intention" title="Why Explore With Sunset Lagoon?" />
          <div className="mt-14 grid border-y border-border sm:grid-cols-2 lg:grid-cols-4">{[
            [Compass, "Local Experience", "Discover Bentota through a local perspective."], [Leaf, "Nature First", "Experience the river, mangroves and surrounding ecosystem."], [Waves, "Relaxed Journey", "Enjoy a peaceful and memorable boat experience."], [Sailboat, "Personal Service", "A friendly, welcoming experience from start to finish."],
          ].map(([Icon, title, text], index) => { const FeatureIcon = Icon as typeof Compass; return <Reveal key={title as string} delay={index * 0.1} className={`py-8 sm:p-8 ${index > 0 ? "sm:border-l sm:border-border" : ""}`}><FeatureIcon className="size-6 text-accent-strong" strokeWidth={1.5} /><h3 className="mt-8 font-serif text-2xl font-light tracking-tight">{title as string}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text as string}</p></Reveal>; })}</div>
        </div>
      </section>

      <section id="wildlife" className="section-pad scroll-mt-20 bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-24">
          <div className="relative"><div className="aspect-[4/5] overflow-hidden"><img src={images.wildlife.src} alt={images.wildlife.alt} width={images.wildlife.width} height={images.wildlife.height} loading="lazy" className="size-full object-cover" /></div><div className="absolute -bottom-6 -right-3 grid size-28 place-items-center rounded-full bg-accent text-accent-foreground sm:-right-8"><Bird className="size-7" strokeWidth={1.4} /></div></div>
          <div><SectionTitle eyebrow="Wildlife & nature" title="Life Along the Bentota River" light /><p className="mt-8 text-base leading-8 text-primary-foreground/70">Mangroves, tropical vegetation, shifting river landscapes and aquatic habitats create a living corridor along the water. Depending on the season and conditions, visitors may encounter a variety of birds and wildlife along the river.</p><div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground/60"><span>Birdlife</span><span>Mangroves</span><span>River landscapes</span></div><a href="#gallery" className="mt-10 inline-flex items-center gap-2 border-b border-accent pb-1 text-xs font-bold uppercase tracking-widest text-accent">Explore the river <ArrowRight className="size-4" /></a></div>
        </div>
      </section>

      <section id="gallery" className="section-pad scroll-mt-20"><div className="mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-12"><SectionTitle eyebrow="Field notes" title="Moments From the River" intro="A glimpse of the water, light and living landscape that make every journey feel different." /><div className="mt-12"><Gallery /></div></div></section>

      <section className="section-pad bg-sand"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-24"><SectionTitle eyebrow="Our story" title="Rooted in Bentota" /><div><p className="font-serif text-2xl font-light leading-relaxed text-foreground sm:text-3xl">A love for this river shapes the way we welcome people onto the water.</p><p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">Sunset Lagoon is grounded in a local connection to Bentota and a respect for its natural setting. We invite visitors to explore thoughtfully, enjoy the changing river landscape and leave with a closer feeling for this corner of Sri Lanka.</p></div></div></section>

      <section id="location" className="scroll-mt-20 bg-background"><div className="grid min-h-[580px] lg:grid-cols-2"><div className="section-pad flex items-center px-5 sm:px-12 lg:px-[max(3rem,calc((100vw-80rem)/2))]"><div><SectionTitle eyebrow="Come to the river" title="Find Us in Bentota" /><div className="mt-8 flex items-start gap-3"><MapPin className="mt-1 size-5 text-accent-strong" /><div><p className="font-semibold">{siteConfig.location}</p><p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">Exact meeting-point details will be confirmed when the business location is added.</p></div></div><Button variant="forest" size="lg" className="mt-8" disabled>Get directions · coming soon</Button></div></div><div className="map-pattern flex min-h-96 items-center justify-center border-l border-border"><div className="max-w-xs text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-background shadow-lg"><MapPin className="size-6 text-accent-strong" /></span><p className="mt-5 font-serif text-2xl font-light">Bentota, Sri Lanka</p><p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Map connection ready</p></div></div></div></section>

      <section className="bg-accent px-5 py-20 text-accent-foreground sm:px-8 sm:py-24"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em]">Your river journey</p><h2 className="mt-4 max-w-3xl font-serif text-5xl font-light leading-none tracking-tight sm:text-6xl">Ready to Explore Bentota?</h2><p className="mt-5 text-base opacity-75">Make your time in Bentota unforgettable with a journey along the river.</p></div><div className="flex flex-wrap gap-3"><Button asChild variant="forest" size="lg"><a href="#contact">Book your safari</a></Button><Button asChild variant="outline" size="lg"><a href="#contact">Contact us</a></Button></div></div></section>

      <section id="contact" className="section-pad scroll-mt-20 bg-foreground text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-24"><div><SectionTitle eyebrow="Plan your visit" title="Begin the Conversation" light /><p className="mt-6 max-w-lg text-base leading-8 text-primary-foreground/60">Tell us when you’re visiting Bentota and what kind of river experience you have in mind. Contact details will appear here once confirmed.</p><Button asChild variant="gold" size="lg" className="mt-9 px-10 tracking-[0.3em]"><a href={getWhatsAppUrl()}><MessageCircle /> Chat on WhatsApp</a></Button></div><dl className="grid content-start gap-px bg-primary-foreground/15 sm:grid-cols-2">{[
          ["Phone", siteConfig.contact.phone], ["WhatsApp", siteConfig.contact.whatsapp || "To be confirmed"], ["Email", siteConfig.contact.email], ["Location", siteConfig.location], ["Opening hours", siteConfig.contact.hours],
        ].map(([label, value]) => <div key={label} className="bg-foreground p-6"><dt className="text-[9px] font-bold uppercase tracking-[0.22em] text-accent">{label}</dt><dd className="mt-3 text-sm text-primary-foreground/75">{value}</dd></div>)}</dl></div></section>
    </main>
    <footer className="border-t border-primary-foreground/10 bg-foreground px-5 py-12 text-primary-foreground sm:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[1fr_2fr]"><div><img src={LOGO_URL} alt="Sunset Lagoon Boat House logo" width={96} height={96} loading="lazy" className="mb-5 size-24 object-contain" /><p className="flex items-baseline gap-2"><span className="font-brand text-4xl leading-[1.15]">Sunset</span><span className="text-3xl font-bold uppercase tracking-[0.06em]">Lagoon</span></p><p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-primary-foreground/50">Boat House · Bentota</p><p className="mt-5 max-w-xs text-sm text-primary-foreground/60">Discover the beauty of Bentota from the water.</p></div><nav className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end sm:gap-6" aria-label="Footer navigation">{siteConfig.navigation.map((item) => <a key={item.href} href={item.href} className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60 hover:text-primary-foreground">{item.label}</a>)}</nav></div><div className="mt-12 flex flex-col justify-between gap-4 border-t border-primary-foreground/10 pt-6 text-[10px] uppercase tracking-widest text-primary-foreground/40 sm:flex-row"><p>© 2026 Sunset Lagoon Boat House. All rights reserved.</p><p>Bentota · Sri Lanka</p></div></div></footer>
  </div>;
}