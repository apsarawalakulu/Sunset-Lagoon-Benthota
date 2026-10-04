export const SITE_URL = "https://sunsetlagoon.boats";
export const SITE_NAME = "Sunset Lagoon Boat House";
export const SITE_TAGLINE = "Bentota Boat Safari";

export const DEFAULT_TITLE = "Sunset Lagoon Boat House | Bentota River Safari";
export const DEFAULT_DESCRIPTION =
  "Discover Bentota River, mangroves and tropical nature with Sunset Lagoon Boat House in Sri Lanka.";

export const OG_IMAGE = {
  url: "https://res.cloudinary.com/qegkbvkj/image/upload/v1789443140/ChatGPT_Image_Sep_15_2026_09_01_33_AM.png",
  width: 1678,
  height: 937,
  alt: "Sunset Lagoon boat moored on the Bentota River at sunset",
};

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function businessJsonLd(args: { reviewCount: number; ratingValue: number }): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: OG_IMAGE.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bentota",
      addressCountry: "LK",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 6.4247778,
      longitude: 79.9996111,
    },
    priceRange: "LKR",
  };
  if (args.reviewCount > 0) {
    base["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: args.ratingValue,
      reviewCount: args.reviewCount,
    };
  }
  return base;
}
