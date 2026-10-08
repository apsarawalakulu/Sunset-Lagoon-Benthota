import { createFileRoute } from "@tanstack/react-router";
import { SiteNavbar } from "@/components/SiteNavbar";
import {
  LandingCrumbs,
  LandingCta,
  LandingFaq,
  LandingHero,
  LandingList,
  LandingSection,
  LandingFooter,
  RelatedSafaris,
} from "@/components/landing";
import { images } from "@/data/siteConfig";
import { optimizedImage, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/boat-safari-bentota")({
  head: () =>
    pageMeta({
      title: "Bentota Boat Safari | River Wildlife & Mangrove Tour",
      description:
        "Book a Bentota boat safari with Sunset Lagoon Boat House. Cruise the Bentota River through mangroves and lagoons, spot river wildlife, and choose sunrise or sunset departures.",
      path: "/boat-safari-bentota",
    }),
  component: BoatSafariPage,
});

const FAQS = [
  {
    question: "How do I book a Bentota boat safari?",
    answer:
      "Book through our website form, WhatsApp us at +94 776 838 289, call +94 767 498 169, or walk in at our Bentota dock. No online payment is taken — every booking is confirmed personally.",
  },
  {
    question: "How long does a Bentota boat safari take?",
    answer:
      "From a 1-hour river and lagoon highlights cruise to a 4-hour grand safari. The most popular choices are the 2-hour mangrove and temple route and the 3-hour wildlife and mangrove tunnels journey.",
  },
  {
    question: "What is the best time of day for a boat safari in Bentota?",
    answer:
      "Sunrise (06:30–08:30) and sunset (17:00–19:00) departures offer the calmest water, the softest light and the most active birdlife. Midday preferred times can also be arranged subject to boat availability.",
  },
  {
    question: "Is a Bentota boat safari suitable for families with children?",
    answer:
      "Yes. The river is calm, boats are stable and covered, and up to 8 guests travel per booking. Tell us your group size and ages when booking so the crew can look after everyone.",
  },
];

function BoatSafariPage() {
  return (
    <div className="bg-background text-foreground">
      <SiteNavbar />
      <main>
        <div className="bg-foreground text-primary-foreground">
          <LandingCrumbs
            trail={[
              { name: "Home", path: "/" },
              { name: "Bentota Boat Safari", path: "/boat-safari-bentota" },
            ]}
          />
          <LandingHero
            eyebrow="Bentota · Sri Lanka"
            title="Bentota Boat Safari with Sunset Lagoon"
            intro="Glide past mangrove tunnels, riverside villages and quiet lagoons on a guided boat safari through the Bentota River — the calm, wild side of Sri Lanka's south coast."
            image={{
              src: optimizedImage(images.story.src, 1600),
              alt: "Safari boats on the Bentota River at sunset",
            }}
          />
        </div>

        <LandingSection eyebrow="Three ways to explore" title="Choose your Bentota river experience">
          <p>
            Every Sunset Lagoon journey follows the water, but each route has its own rhythm.
            Open-water cruising and village life on the{" "}
            <a href="/river-safari-bentota" className="font-semibold text-accent-strong hover:underline">
              Bentota river safari
            </a>
            , shaded tunnels and root systems on the{" "}
            <a href="/mangrove-safari-bentota" className="font-semibold text-accent-strong hover:underline">
              Bentota mangrove safari
            </a>
            , and slow wildlife watching wherever the river decides. All departures leave from
            our Bentota dock with a local crew.
          </p>
          <LandingList
            items={[
              "River Safari — peaceful open waters, riverside temples and village life",
              "Mangrove Adventure — narrow tunnels and dense mangrove forest",
              "Wildlife Discovery — birdlife, monkeys and river habitats at the river's pace",
              "Sunrise 06:30–08:30 and sunset 17:00–19:00 departures, daily",
            ]}
          />
        </LandingSection>

        <LandingSection eyebrow="Durations & groups" title="Safaris from one hour to half a day">
          <p>
            Pick a 1-hour highlights cruise, a 2-hour mangrove and temple route, a 3-hour
            wildlife and tunnels journey, or a 4-hour grand safari. Up to 8 guests travel per
            booking across our three 8-seat boats, and larger parties can be split across
            boats — just mention it when you{" "}
            <a href="/#contact" className="font-semibold text-accent-strong hover:underline">
              contact us
            </a>
            .
          </p>
        </LandingSection>

        <LandingSection eyebrow="Wildlife" title="What you may encounter">
          <p>
            Kingfishers, herons and cormorants fish the shallows, monkeys move through the
            riverside canopy, and monitor lizards and crocodiles are occasionally seen.
            Sightings depend on season and conditions and are never guaranteed — see our{" "}
            <a href="/#wildlife" className="font-semibold text-accent-strong hover:underline">
              wildlife notes
            </a>{" "}
            and <a href="/gallery" className="font-semibold text-accent-strong hover:underline">gallery</a>{" "}
            for an honest picture of river life.
          </p>
        </LandingSection>

        <LandingFaq faqs={FAQS} />
        <RelatedSafaris
          links={[
            { to: "/river-safari-bentota", label: "River Safari", text: "Open water, villages and temples along the Bentota River." },
            { to: "/mangrove-safari-bentota", label: "Mangrove Safari", text: "Shaded tunnels and birdlife inside the mangrove forest." },
            { to: "/gallery", label: "River Gallery", text: "Photos and moments from the water in Bentota." },
          ]}
        />
      </main>
      <LandingCta title="Ready for your Bentota boat safari?" />
      <LandingFooter />
    </div>
  );
}
