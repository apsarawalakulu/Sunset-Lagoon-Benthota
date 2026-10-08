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

export const Route = createFileRoute("/mangrove-safari-bentota")({
  head: () =>
    pageMeta({
      title: "Bentota Mangrove Safari | Explore Sri Lanka's River Wildlife",
      description:
        "Paddle into Bentota's mangrove forest with Sunset Lagoon Boat House. Glide through shaded tunnels, spot kingfishers and monkeys, and learn how the mangrove ecosystem works.",
      path: "/mangrove-safari-bentota",
    }),
  component: MangroveSafariPage,
});

const FAQS = [
  {
    question: "What is a mangrove safari?",
    answer:
      "A slow boat journey into the mangrove forest that fringes the Bentota River — a maze of shaded waterways between arched roots and dense canopy, home to birds, monkeys and aquatic life.",
  },
  {
    question: "What wildlife lives in the Bentota mangroves?",
    answer:
      "Kingfishers, herons and cormorants hunt in the channels, monkeys cross the canopy, and monitor lizards rest on exposed roots. Every trip is different and sightings are never guaranteed.",
  },
  {
    question: "How long should a mangrove safari be?",
    answer:
      "Two hours covers the temple reach and the main tunnels comfortably; three hours allows the quieter wildlife channels too. Tell us your pace and we will match the route.",
  },
  {
    question: "Is the mangrove safari good for photography?",
    answer:
      "Yes — the tunnels filter the light beautifully and the boats move slowly enough for steady shots. Mornings around sunrise give the softest light and the most active birds.",
  },
];

function MangroveSafariPage() {
  return (
    <div className="bg-background text-foreground">
      <SiteNavbar />
      <main>
        <div className="bg-foreground text-primary-foreground">
          <LandingCrumbs
            trail={[
              { name: "Home", path: "/" },
              { name: "Bentota Mangrove Safari", path: "/mangrove-safari-bentota" },
            ]}
          />
          <LandingHero
            eyebrow="Tunnels · Roots · Birdlife"
            title="Bentota Mangrove Safari"
            intro="Leave the open river behind and slip into green shade — a slow journey through tunnels of mangrove roots where the loudest sound is birdsong."
            image={{
              src: optimizedImage(images.mangroves.src, 1600),
              alt: "Dense mangrove canopy above a shaded waterway in Bentota",
            }}
          />
        </div>

        <LandingSection eyebrow="The ecosystem" title="Why the mangroves matter">
          <p>
            Mangroves are nurseries for river and sea life, natural storm barriers, and
            some of the most efficient carbon stores on earth. Our crew introduces the
            forest as we move through it — the arching roots, the crabs in the mud, the
            birds that fish the channels — so the safari is as much a nature walk by boat
            as a ride. We keep engines low and voices lower inside the tunnels.
          </p>
          <LandingList
            items={[
              "Shaded mangrove tunnels navigated slowly",
              "Kingfishers, herons, cormorants and monkeys when they show",
              "Local crew who read the water and the canopy",
              "Quiet, small-group boats — up to 8 guests",
            ]}
          />
        </LandingSection>

        <LandingSection eyebrow="When to go" title="Mornings belong to the mangroves">
          <p>
            The 06:30–08:30 window is prime time: cool air, low light under the canopy and
            birds at their busiest. Late afternoons toward sunset run a close second. If
            open water calls too, combine this with a{" "}
            <a href="/river-safari-bentota" className="font-semibold text-accent-strong hover:underline">
              river safari
            </a>{" "}
            — or compare everything on the{" "}
            <a href="/boat-safari-bentota" className="font-semibold text-accent-strong hover:underline">
              Bentota boat safari overview
            </a>
            .
          </p>
        </LandingSection>

        <LandingFaq faqs={FAQS} />
        <RelatedSafaris
          links={[
            { to: "/boat-safari-bentota", label: "All Boat Safaris", text: "Compare every Bentota safari in one place." },
            { to: "/river-safari-bentota", label: "River Safari", text: "Open water, villages and temples." },
            { to: "/gallery", label: "River Gallery", text: "Mangrove tunnels in pictures." },
          ]}
        />
      </main>
      <LandingCta title="Drift into the mangroves?" />
      <LandingFooter />
    </div>
  );
}
