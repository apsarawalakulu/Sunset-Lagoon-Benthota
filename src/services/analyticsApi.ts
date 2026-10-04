import { adminAuth, handleSessionError } from "./adminAuth";
import {
  analyticsOverviewFn,
  trackPageViewFn,
  type AnalyticsSummary,
} from "../backend/analytics";

export type { AnalyticsSummary };

export const analyticsApi = {
  /** Fire-and-forget page view beacon. Never throws. */
  track: async (input: { path: string; referrer?: string | null; visitorId: string }): Promise<void> => {
    try {
      await trackPageViewFn({
        data: { path: input.path, referrer: input.referrer ?? null, visitorId: input.visitorId },
      });
    } catch {
      // Analytics must never break the site.
    }
  },

  overview: async (days = 7): Promise<AnalyticsSummary> => {
    const token = adminAuth.getToken();
    if (!token) throw new Error("No active admin session found.");
    try {
      const res = await analyticsOverviewFn({ data: { token, days } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },
};
