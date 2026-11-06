import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";
import { listApprovedReviewsFn } from "../backend/public";
import type { ReviewData } from "@/services/api";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  businessJsonLd,
  organizationJsonLd,
  pageMeta,
  websiteJsonLd,
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
      // The section shows six reviews; render them on the server so the HTML
      // contains real guest text instead of an empty "be the first" state.
      return {
        reviewCount,
        ratingValue,
        reviews: list.slice(0, 6) as ReviewData[],
      };
    } catch {
      return { reviewCount: 0, ratingValue: 0, reviews: [] as ReviewData[] };
    }
  },
  head: () =>
    pageMeta({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: "/",
    }),
  component: IndexPage,
});

function IndexPage() {
  const { reviewCount, ratingValue, reviews } = Route.useLoaderData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessJsonLd({ reviewCount, ratingValue })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomePage initialReviews={reviews} />
    </>
  );
}
