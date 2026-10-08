export const SITE_URL = "https://sunsetlagoon.boats";
export const SITE_NAME = "Sunset Lagoon Boat House";
export const SITE_TAGLINE = "Bentota Boat Safari";

export const NAP = {
  name: "Sunset Lagoon Boat House",
  locality: "Bentota",
  country: "Sri Lanka",
  countryCode: "LK",
  phone: "+94 767 498 169",
  whatsapp: "+94 776 838 289",
  email: "sunsetlagoon.boats@gmail.com",
  hours: "Open daily · 06:00 – 19:00",
  latitude: 6.4247778,
  longitude: 79.9996111,
} as const;

export const DEFAULT_TITLE = "Sunset Lagoon Boat Safari Bentota | River & Mangrove Tours";
export const DEFAULT_DESCRIPTION =
  "Explore the Bentota River with Sunset Lagoon Boat House. Discover mangroves, wildlife and peaceful waterways on an unforgettable boat safari in Sri Lanka.";

export const OG_IMAGE = {
  url: "https://res.cloudinary.com/qegkbvkj/image/upload/v1789443140/ChatGPT_Image_Sep_15_2026_09_01_33_AM.png",
  width: 1678,
  height: 937,
  alt: "Sunset Lagoon boat moored on the Bentota River at sunset",
};

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMeta(args: {
  title: string;
  description: string;
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
}) {
  const img = args.image ?? OG_IMAGE;
  const url = absoluteUrl(args.path);
  return {
    meta: [
      { title: args.title },
      { name: "description", content: args.description },
      { property: "og:title", content: args.title },
      { property: "og:description", content: args.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: img.url },
      { property: "og:image:width", content: String(img.width) },
      { property: "og:image:height", content: String(img.height) },
      { property: "og:image:alt", content: img.alt },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: args.title },
      { name: "twitter:description", content: args.description },
      { name: "twitter:image", content: img.url },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/**
 * Inject Cloudinary delivery transforms (auto format/quality + width cap)
 * into a res.cloudinary.com URL. Local paths pass through untouched.
 */
export function optimizedImage(src: string, width = 1600): string {
  if (!src.includes("res.cloudinary.com/")) return src;
  // Only inject when the URL has no transforms yet (plain /upload/v1234/ form).
  if (!/\/upload\/v\d+\//.test(src)) return src;
  return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}

function baseBusiness(): Record<string, unknown> {
  return {
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#business`,
    name: NAP.name,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: OG_IMAGE.url,
    logo: `${SITE_URL}/favicon.png`,
    telephone: NAP.phone,
    email: NAP.email,
    priceRange: "LKR",
    address: {
      "@type": "PostalAddress",
      addressLocality: NAP.locality,
      addressCountry: NAP.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: NAP.latitude,
      longitude: NAP.longitude,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "06:00",
      closes: "19:00",
    },
    areaServed: [
      { "@type": "City", name: "Bentota" },
      { "@type": "Country", name: "Sri Lanka" },
    ],
  };
}

export function businessJsonLd(args: { reviewCount: number; ratingValue: number }): Record<string, unknown> {
  const base = baseBusiness();
  if (args.reviewCount > 0) {
    base["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: args.ratingValue,
      reviewCount: args.reviewCount,
    };
  }
  return { "@context": "https://schema.org", ...base };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: NAP.name,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: NAP.phone,
      email: NAP.email,
      contactType: "reservations",
      areaServed: "LK",
      availableLanguage: "English",
    },
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
