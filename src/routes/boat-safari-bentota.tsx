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
  LandingBusinessJsonLd,
  LandingServiceJsonLd,
} from "@/components/landing";
import { images } from "@/data/siteConfig";
import { optimizedImage, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/boat-safari-bentota")({
  head: () =>
    pageMeta({
      title: "Bentota Boat Safari | Prices, Tickets & River Tour Booking",
      description:
        "Book a Bentota boat safari with Sunset Lagoon Boat House. Ask for a price, reserve your tickets and choose a 1–4 hour river, mangrove or wildlife tour at sunrise or sunset near Bentota, Sri Lanka.",
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
  {
    question: "How much does a Bentota boat safari cost?",
    answer:
      "The price depends on the route you choose — 1-hour highlights, 2-hour mangrove and temple, 3-hour wildlife or 4-hour grand safari — plus your group size and whether you travel at sunrise or sunset. Message us on WhatsApp at +94 776 838 289 with your date and group size and we will confirm the exact cost before you commit.",
  },
  {
    question: "Do I need to buy boat safari tickets in advance?",
    answer:
      "Reserving ahead is recommended, especially for sunrise and sunset departures when boats fill first. Tickets are not timed entry passes: a reservation holds your boat and crew for that slot. No online payment is taken on this site — you book, we confirm personally, and you pay on the day.",
  },
  {
    question: "Is there a boat safari near me in Bentota?",
    answer:
      "If you are staying in Bentota, Aluthgama, Beruwala, Kosgoda or Ahungalla, yes. Our dock is on the Bentota River a short drive from the south-coast resorts, and every safari starts there. Send us your hotel and we will share the meeting point and a realistic pick-up time.",
  },
  {
    question: "Where can I read boat safari reviews from past guests?",
    answer:
      "Guest reviews appear on our homepage under Guest stories, and every one is matched to a real booking before it is published. We do not write or edit them, and we do not display a rating until genuine reviews exist.",
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
          <LandingBusinessJsonLd />
          <LandingServiceJsonLd
            name="Bentota Boat Safari"
            description="Guided boat safaris on the Bentota River through mangroves, lagoons and riverside villages in Sri Lanka."
            path="/boat-safari-bentota"
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
          <p>
            Staying near Bentota in Aluthgama, Beruwala, Kosgoda or Ahungalla? Our dock is a
            short drive from the south-coast resorts, and every safari starts on the Bentota
            River itself.
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

        <LandingSection eyebrow="Prices & tickets" title="Bentota boat safari price, tickets and booking">
          <p>
            Looking for the Bentota boat safari price? Every trip is quoted for the route you
            choose — a 1-hour highlights cruise, a 2-hour mangrove and temple route, a 3-hour
            wildlife journey or a 4-hour grand safari — so the cost depends on duration, your
            group size and whether you travel at sunrise or sunset. Message us on WhatsApp at{" "}
            <a
              href="https://wa.me/94776838289"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-strong hover:underline"
            >
              +94 776 838 289
            </a>{" "}
            with your date and group size and we will confirm the exact price before you commit.
          </p>
          <p>
            Boat safari tickets in Bentota are not timed entry passes. Reserving a departure
            simply holds your boat and crew for that slot, which is why we ask for your date,
            preferred time and group size. There are no online ticket fees and no card payment
            on this site: you book, we confirm personally, and you pay on the day.
          </p>
          <p>
            Staying in Aluthgama, Beruwala, Kosgoda, Ahungalla or anywhere near Bentota? A boat
            ride on the Bentota River is a short drive from most south-coast hotels, so a boat
            safari near you is easier than you might expect — tell us where you are staying and
            we will share the meeting point and a realistic pick-up time.
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
