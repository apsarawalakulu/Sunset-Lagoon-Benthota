import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";
import { listApprovedReviewsFn } from "../backend/public";
import {
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
      return { reviewCount, ratingValue };
    } catch {
      return { reviewCount: 0, ratingValue: 0 };
    }
  },
  head: () =>
    pageMeta({
      title: "Sunset Lagoon Boat Safari Bentota | River & Mangrove Tours",
      description:
        "Explore the Bentota River with Sunset Lagoon Boat House. Discover mangroves, wildlife and peaceful waterways on an unforgettable boat safari in Sri Lanka.",
      path: "/",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomePage />
    </>
  );
}
