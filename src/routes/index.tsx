import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";
import { listApprovedReviewsFn } from "../backend/public";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE,
  SITE_URL,
  absoluteUrl,
  businessJsonLd,
} from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const res = await listApprovedReviewsFn();
      const list = res.data ?? [];
      const reviewCount = list.length;
      const ratingValue =
        reviewCount > 0
          ? Math.round((list.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
          : 0;
      return { reviewCount, ratingValue };
    } catch {
      return { reviewCount: 0, ratingValue: 0 };
    }
  },
  head: () => ({
    meta: [
      { title: DEFAULT_TITLE },
      { name: "description", content: DEFAULT_DESCRIPTION },
      { property: "og:title", content: DEFAULT_TITLE },
      { property: "og:description", content: DEFAULT_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE.url },
      { property: "og:image:width", content: String(OG_IMAGE.width) },
      { property: "og:image:height", content: String(OG_IMAGE.height) },
      { property: "og:image:alt", content: OG_IMAGE.alt },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: DEFAULT_TITLE },
      { name: "twitter:description", content: DEFAULT_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE.url },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { reviewCount, ratingValue } = Route.useLoaderData();
  return (
    <>
      {reviewCount > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessJsonLd({ reviewCount, ratingValue })),
          }}
        />
      )}
      <HomePage />
    </>
  );
}
