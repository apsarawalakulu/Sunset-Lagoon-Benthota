import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sunset Lagoon Boat House | Bentota River Safari" },
      { name: "description", content: "Discover Bentota River, mangroves and tropical nature with Sunset Lagoon Boat House in Sri Lanka." },
      { property: "og:title", content: "Sunset Lagoon Boat House | Bentota River Safari" },
      { property: "og:description", content: "Discover Bentota River, mangroves and tropical nature with Sunset Lagoon Boat House in Sri Lanka." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});
