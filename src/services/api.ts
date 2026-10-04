import {
  createBookingFn,
  getAvailabilityFn,
  getBookingFn,
  getExperienceFn,
  getPublicSettingsFn,
  getReviewFn,
  listApprovedReviewsFn,
  listExperiencesFn,
  listGalleryFn,
  listPublicMediaFn,
  sendContactFn,
} from "../backend/public";

// The backend is built in: TanStack Start server functions backed by Neon Postgres.
// API_BASE_URL is kept for compatibility and is only used for legacy external URLs.
export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] ?? "";

export function isApiConnected(): boolean {
  return true;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ExperienceData {
  id: number | string;
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  duration?: string | null;
  price?: number | undefined;
  max_guests?: number | null;
  image?: string | null;
  status?: string;
  sort_order?: number;
}

export interface GalleryData {
  id: number;
  title: string | null;
  image_url: string;
  category: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ReviewData {
  id: number;
  customer_name: string;
  country: string | null;
  rating: number;
  review: string;
  image: string | null;
  created_at: string | null;
  source?: string | null;
}

export interface SiteSettingsData {
  business_name: string | null;
  tagline: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  google_maps_url?: string | null;
  coordinates?: {
    latitude: number | null;
    longitude: number | null;
  };
  social_links?: {
    facebook: string | null;
    instagram: string | null;
    website: string | null;
  };
  opening_hours: string | null;
  logo_url?: string | null;

  // Website Content
  hero_title?: string | null;
  hero_subtitle?: string | null;
  about_title?: string | null;
  about_description?: string | null;
  untamed_beauty_title?: string | null;
  experience_section_title?: string | null;
  experience_1_title?: string | null;
  experience_2_title?: string | null;
  experience_3_title?: string | null;
  story_eyebrow?: string | null;
  story_title?: string | null;
  wildlife_eyebrow?: string | null;
  wildlife_title?: string | null;
  gallery_title?: string | null;
  contact_title?: string | null;
  footer_text?: string | null;

  // Booking Settings
  min_guests?: number;
  max_guests?: number;
  min_advance_hours?: number;
  cancellation_notice_hours?: number;
  booking_enabled?: boolean;

  // Safari & Schedule Settings
  sunrise_start_time?: string | null;
  sunrise_end_time?: string | null;
  sunset_start_time?: string | null;
  sunset_end_time?: string | null;
  safari_durations?: Array<{
    value: string;
    label: string;
    description: string;
  }> | undefined;

  // System Settings
  timezone?: string | null;
  currency?: string | null;
  date_format?: string | null;
  updated_at?: string | null;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]> | undefined;
  data?: unknown;

  constructor(message: string, status: number, errors?: Record<string, string[]> | undefined, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

export interface DepartureSlot {
  id: number;
  start_time: string;
  end_time: string;
  time_display: string;
  duration: string;
  capacity: number;
  booked: number;
  available: number;
  boat_name?: string | null;
  status: string;
}

export interface AvailabilityResponseData {
  experience_id: number;
  experience_title: string;
  date: string;
  slots: DepartureSlot[];
}

export interface BookingPayload {
  experience_id: number;
  time_slot_id?: number | null;
  full_name: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  country: string;
  phone: string;
  email?: string | null;
  number_of_guests: number;
  booking_date?: string;
  preferred_time?: string;
  special_request?: string | null;
}

export interface BookingResponseData {
  id: number;
  booking_reference: string;
  experience_id?: number;
  experience?: {
    id: number;
    title: string;
    slug: string;
    duration?: string | null;
    price?: number | undefined;
  } | null;
  time_slot_id?: number | null;
  time_slot?: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    formatted_time: string;
    duration: string;
    capacity: number;
    booked_guests: number;
    available_seats: number;
    status: string;
    boat?: {
      id: number;
      name: string;
      registration_number: string;
      capacity: number;
      status: string;
      image_url: string | null;
    } | null;
  } | null;
  full_name: string;
  gender?: string;
  country: string;
  phone: string;
  email: string | null;
  number_of_guests: number;
  booking_date: string;
  preferred_time: string;
  special_request: string | null;
  status: string;
  booking_status?: string;
  booking_source?: string;
  created_at?: string | undefined;
}

export interface BookingApiResponse extends ApiResponse<BookingResponseData> {
  booking_reference: string;
  booking_status?: string;
}

export const api = {
  getExperiences: () => listExperiencesFn(),
  getExperience: (id: string | number) => getExperienceFn({ data: { id } }),
  getGallery: () => listGalleryFn(),
  getReviews: () => listApprovedReviewsFn(),
  getReview: (id: number) => getReviewFn({ data: { id } }),
  getSettings: () => getPublicSettingsFn(),
  sendContact: (data: unknown) =>
    sendContactFn({ data: data as { name: string; email: string; phone?: string | null; subject?: string | null; message: string } }),
  createBooking: (data: BookingPayload) => createBookingFn({ data }),
  getBooking: (idOrRef: string | number) => getBookingFn({ data: { idOrRef } }),
  getAvailability: (
    experienceIdOrParams: number | string | { experience_id?: number | string; date: string },
    dateParam?: string
  ) => {
    let expId: number | string = 1;
    let d = "";
    if (typeof experienceIdOrParams === "object" && experienceIdOrParams !== null) {
      expId = experienceIdOrParams.experience_id ?? 1;
      d = experienceIdOrParams.date;
    } else {
      expId = experienceIdOrParams;
      d = dateParam ?? "";
    }
    return getAvailabilityFn({ data: { experience_id: expId, date: d } });
  },
  getMedia: (params?: { type?: string; category?: string }) =>
    listPublicMediaFn({ data: { type: params?.type, category: params?.category } }).then((items) => ({
      success: true as boolean,
      data: items,
    })),
};
