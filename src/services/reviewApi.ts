import { adminAuth, handleSessionError } from "./adminAuth";
import {
  adminReviewCreateFn,
  adminReviewDeleteFn,
  adminReviewStatusFn,
  adminReviewsFn,
  syncGoogleReviewsFn,
} from "../backend/admin";
import { listApprovedReviewsFn, submitCustomerReviewFn } from "../backend/public";
import { formFile, formToRecord, uploadToCloudinary } from "./uploads";

export interface ReviewItem {
  id: number;
  customer_name: string;
  country: string | null;
  rating: number;
  review: string;
  image: string | null;
  image_url: string | null;
  status: "pending" | "approved" | "hidden";
  created_at: string;
  created_at_date?: string;
  created_at_formatted?: string;
  booking_reference?: string | null;
  source?: string | null;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  hidden: number;
  average_rating: number;
}

export interface ReviewListResponse {
  success: boolean;
  stats?: ReviewStats;
  data: ReviewItem[];
}

export interface SingleReviewResponse {
  success: boolean;
  message?: string;
  data: ReviewItem;
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) throw new Error("No active admin session found.");
  return token;
}

export const reviewApi = {
  /**
   * Fetch approved reviews for the public website.
   */
  getPublicReviews: async (): Promise<ReviewItem[]> => {
    try {
      const res = await listApprovedReviewsFn();
      return res.data.map((r) => ({
        id: r.id,
        customer_name: r.customer_name,
        country: r.country,
        rating: r.rating,
        review: r.review,
        image: r.image,
        image_url: r.image,
        status: "approved" as const,
        created_at: r.created_at ?? "",
      }));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to load customer reviews.");
    }
  },

  /**
   * Fetch reviews for Admin moderation panel with live statistics and filters.
   */
  getAdminReviews: async (params?: {
    status?: string;
    rating?: number | string;
    search?: string;
  }): Promise<ReviewListResponse> => {
    const token = requireToken();
    try {
      return await adminReviewsFn({
        data: { token, status: params?.status, rating: params?.rating, search: params?.search },
      });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Approve a review so it immediately appears on the public website.
   */
  approveReview: async (id: number): Promise<SingleReviewResponse> => {
    const token = requireToken();
    try {
      return await adminReviewStatusFn({ data: { token, id, status: "approved" } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Hide an approved review from public display.
   */
  hideReview: async (id: number): Promise<SingleReviewResponse> => {
    const token = requireToken();
    try {
      return await adminReviewStatusFn({ data: { token, id, status: "hidden" } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Update the status of a review (pending, approved, hidden).
   */
  updateStatus: async (
    id: number,
    status: "pending" | "approved" | "hidden"
  ): Promise<SingleReviewResponse> => {
    const token = requireToken();
    try {
      return await adminReviewStatusFn({ data: { token, id, status } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Create a new review from admin.
   */
  createReview: async (formData: FormData): Promise<SingleReviewResponse> => {
    const token = requireToken();
    const fields = formToRecord(formData);
    const file = formFile(formData, "image");
    let image: string | null = null;
    if (file) {
      const uploaded = await uploadToCloudinary(file);
      image = uploaded.url;
    }
    try {
      return await adminReviewCreateFn({
        data: {
          token,
          customer_name: fields["customer_name"] ?? "",
          country: fields["country"] || null,
          rating: Number(fields["rating"]) || 5,
          review: fields["review"] ?? "",
          status: fields["status"] || "approved",
          source: fields["source"] || "website",
          image,
        },
      });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Delete a review permanently.
   */
  deleteReview: async (id: number): Promise<{ success: boolean; message: string }> => {
    const token = requireToken();
    try {
      return await adminReviewDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Pull the latest Google reviews into the site (admin, one click).
   */
  syncFromGoogle: async (): Promise<{ success: boolean; imported: number; skipped: number; message: string }> => {
    const token = requireToken();
    try {
      return await syncGoogleReviewsFn({ data: { token } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Submit a verified customer review (booking reference required).
   * Goes to the pending moderation queue; appears publicly once approved.
   */
  submitCustomerReview: async (input: {
    booking_reference: string;
    name: string;
    rating: number;
    review: string;
    image?: string | null;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await submitCustomerReviewFn({ data: input });
      return { success: true, message: res.message || "Thank you! Your review was received." };
    } catch (err) {
      throw err instanceof Error ? err : new Error("Could not submit your review. Please try again.");
    }
  },
};