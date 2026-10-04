import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { analyticsApi } from "@/services/analyticsApi";

const VISITOR_KEY = "sl_visitor";

/**
 * First-party page-view beacon. Cookieless (localStorage id only),
 * skips admin pages and Do-Not-Track visitors, never throws.
 */
export function AnalyticsTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return;
    if (navigator.doNotTrack === "1") return;
    try {
      let visitorId = window.localStorage.getItem(VISITOR_KEY);
      if (!visitorId) {
        visitorId =
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem(VISITOR_KEY, visitorId);
      }
      void analyticsApi.track({
        path: pathname,
        referrer: document.referrer || null,
        visitorId,
      });
    } catch {
      // Never break the site for analytics.
    }
  }, [pathname]);

  return null;
}
