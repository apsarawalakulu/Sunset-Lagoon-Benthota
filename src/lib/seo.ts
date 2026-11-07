export const SITE_URL = "https://www.sunsetlagoon.boats";
export const SITE_NAME = "Sunset Lagoon Boat House";
export const SITE_TAGLINE = "Bentota Boat Safari";

/** Verified public profiles, used for entity reconciliation via schema.org sameAs. */
export const SOCIAL_PROFILES = [
  "https://www.facebook.com/people/Sunset-Lagoon-Boat-House-Bentota/61594817414251/",
  "https://x.com/Sunsetlagoon97",
];

export const NAP = {
  name: "Sunset Lagoon Boat House",
  locality: "Bentota",
  region: "Southern Province",
  country: "Sri Lanka",
  countryCode: "LK",
  phone: "+94 767 498 169",
  whatsapp: "+94 776 838 289",
  email: "sunsetlagoon.boats@gmail.com",
  hours: "Open daily · 06:00 – 19:00",
  latitude: 6.4247778,
  longitude: 79.9996111,
  mapsUrl:
    "https://www.google.com/maps/place/Sunset+Lagoon+Boat+House/@6.4248125,79.9995625,865m/data=!3m1!1e3!4m16!1m9!3m8!1s0x3ae22f8a90d97809:0xb5ca1a9240ec597a!2sSunset+Lagoon+Boat+House!8m2!3d6.4248125!4d79.9995625!9m1!1b1!16s%2Fg%2F11zxxddqfb!3m5!1s0x3ae22f8a90d97809:0xb5ca1a9240ec597a!8m2!3d6.4248125!4d79.9995625!16s%2Fg%2F11zxxddqfb?hl=en&entry=ttu",
} as const;

export const DEFAULT_TITLE = "Boat Safari in Sri Lanka | Bentota River & Mangrove Tours";
export const DEFAULT_DESCRIPTION =
  "Book a boat safari in Sri Lanka with Sunset Lagoon Boat House, Bentota. Cruise the Bentota River through mangroves and lagoons and spot river wildlife at sunrise or sunset.";

/**
 * Open Graph card at the exact 1200×630 size recommended by Facebook, X and
 * LinkedIn. Cloudinary does the resize, so the social crawler never has to
 * download the original 2.4 MB PNG.
 */
export const OG_IMAGE = {
  url: "https://res.cloudinary.com/qegkbvkj/image/upload/c_fill,w_1200,h_630,g_auto,q_auto:good,f_jpg/v1789443140/ChatGPT_Image_Sep_15_2026_09_01_33_AM.png",
  width: 1200,
  height: 630,
  alt: "Sunset Lagoon boat moored on the Bentota River at sunset",
};

export const LOGO_URL = `${SITE_URL}/logo.png`;

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
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
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
      { name: "twitter:image:alt", content: img.alt },
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
  return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

/**
 * Build a responsive `srcset` for Cloudinary-hosted images. Returns undefined
 * for local assets, which are served as single files.
 */
export function cloudinarySrcSet(src: string, widths: number[] = [480, 768, 1024, 1440]) {
  if (!src.includes("res.cloudinary.com/") || !/\/upload\/v\d+\//.test(src)) return undefined;
  return widths
    .map((w) => `${src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${w}/`)} ${w}w`)
    .join(", ");
}

function baseBusiness(): Record<string, unknown> {
  return {
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#business`,
    name: NAP.name,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: OG_IMAGE.url,
    logo: LOGO_URL,
    sameAs: SOCIAL_PROFILES,
    telephone: NAP.phone,
    email: NAP.email,
    hasMap: NAP.mapsUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: NAP.locality,
      addressRegion: NAP.region,
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
      { "@type": "City", name: "Aluthgama" },
      { "@type": "City", name: "Beruwala" },
      { "@type": "City", name: "Kosgoda" },
      { "@type": "City", name: "Ahungalla" },
      { "@type": "Country", name: "Sri Lanka" },
    ],
    knowsAbout: [
      "Boat safaris",
      "Bentota River",
      "Mangrove forests",
      "River wildlife",
      "Sri Lanka boat tours",
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
    logo: LOGO_URL,
    sameAs: SOCIAL_PROFILES,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: NAP.phone,
      email: NAP.email,
      contactType: "reservations",
      areaServed: "LK",
      availableLanguage: "English",
    },
    areaServed: [
      { "@type": "City", name: "Bentota" },
      { "@type": "Country", name: "Sri Lanka" },
    ],
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en",
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

/**
 * Service schema for the three safari landing pages. Ties each trip to the
 * business entity so search engines understand these are the same operator.
 */
export function serviceJsonLd(args: { name: string; description: string; path: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: args.name,
    description: args.description,
    url: absoluteUrl(args.path),
    serviceType: "Boat safari",
    provider: { "@id": `${SITE_URL}/#business`, name: NAP.name, url: SITE_URL },
    areaServed: [
      { "@type": "City", name: "Bentota" },
      { "@type": "Country", name: "Sri Lanka" },
    ],
  };
}
