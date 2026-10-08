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
import { optimizedImage, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/river-safari-bentota")({
  head: () =>
    pageMeta({
      title: "Bentota River Safari | Wildlife Boat Tour in Sri Lanka",
      description:
        "Join a Bentota river safari with Sunset Lagoon Boat House. Cruise open lagoon waters, riverside villages and temples, with sunrise and sunset departures daily.",
      path: "/river-safari-bentota",
    }),
  component: RiverSafariPage,
});

const FAQS = [
  {
    question: "Where does the Bentota river safari start?",
    answer:
      "All safaris depart from the Sunset Lagoon dock on the Bentota River. Use the Get Directions button in the Find Us section of our homepage for turn-by-turn navigation, or message us on WhatsApp and we will guide you in.",
  },
  {
    question: "How long is the river safari?",
    answer:
      "The classic river route takes around 2 hours, covering open water, riverside villages and the temple reach. Shorter 1-hour highlights cruises and longer 3 to 4-hour journeys are available on request.",
  },
  {
    question: "What will we see on the river?",
    answer:
      "Wide lagoon waters, stilt fishermen's territory, village river life, a riverside temple, and birdlife along the banks — herons, cormorants and kingfishers are regulars. Larger wildlife appears only by luck, never on demand.",
  },
  {
    question: "Can children join the river safari?",
    answer:
      "Yes. The river is calm and the boats are stable and covered, so all ages are welcome. Tell us your group size when booking and the crew will look after everyone.",
  },
];

function RiverSafariPage() {
  return (
    <div className="bg-background text-foreground">
      <SiteNavbar />
      <main>
        <div className="bg-foreground text-primary-foreground">
          <LandingCrumbs
            trail={[
              { name: "Home", path: "/" },
              { name: "Bentota River Safari", path: "/river-safari-bentota" },
            ]}
          />
          <LandingHero
            eyebrow="Open water · Villages · Temples"
            title="Bentota River Safari"
            intro="The classic way to meet the river: open lagoon crossings, village waterfronts and a riverside temple, wrapped in golden morning or evening light."
            image={{
              src: "/hero/hero-bentota-safari.jpg",
              alt: "Safari boat crossing the Bentota River at golden hour",
            }}
          />
        </div>

        <LandingSection eyebrow="The journey" title="What a river safari feels like">
          <p>
            The boat pushes off from our Bentota dock into open water, where the river runs
            wide and calm. Past riverside homes and coconut groves, the route reaches a
            Buddhist temple on the bank — a quiet landmark best seen from the water — before
            turning through greener reaches back toward the lagoon. It is the most relaxed
            way to see Bentota beyond the beach.
          </p>
          <LandingList
            items={[
              "Open lagoon crossings with wide river views",
              "Riverside villages and everyday river life",
              "A temple reach, viewed from the water",
              "Calm water suitable for all ages",
            ]}
          />
        </LandingSection>

        <LandingSection eyebrow="When to go" title="Sunrise and sunset departures">
          <p>
            River safaris run daily around sunrise (06:30–08:30) and sunset (17:00–19:00).
            Mornings bring glassy water and feeding birds; evenings bring long light across
            the lagoon. Prefer another hour? Request it when booking and we will confirm
            boat availability. Pair it with the shaded{" "}
            <a href="/mangrove-safari-bentota" className="font-semibold text-accent-strong hover:underline">
              mangrove safari
            </a>{" "}
            on another day for the full river picture, or browse the{" "}
            <a href="/boat-safari-bentota" className="font-semibold text-accent-strong hover:underline">
              complete safari overview
            </a>
            .
          </p>
        </LandingSection>

        <LandingFaq faqs={FAQS} />
        <RelatedSafaris
          links={[
            { to: "/boat-safari-bentota", label: "All Boat Safaris", text: "Compare every Bentota safari in one place." },
            { to: "/mangrove-safari-bentota", label: "Mangrove Safari", text: "Narrow tunnels and forest birdlife." },
            { to: "/gallery", label: "River Gallery", text: "See the river before you sail it." },
          ]}
        />
      </main>
      <LandingCta title="Cruise the Bentota River with us?" />
      <LandingFooter />
    </div>
  );
}
