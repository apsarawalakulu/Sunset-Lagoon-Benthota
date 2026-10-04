import { adminAuth, handleSessionError } from "./adminAuth";
import { ApiError } from "./api";
import {
  adminBookingCreateFn,
  adminBookingDeleteFn,
  adminBookingGetFn,
  adminBookingTransitionFn,
  adminBookingUpdateFn,
  adminBookingsFn,
  adminManifestFn,
} from "../backend/admin";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type BookingSource =
  | "website"
  | "phone"
  | "walk_in"
  | "whatsapp"
  | "hotel"
  | "other";

export interface Booking {
  id: number;
  booking_reference: string;
  experience_id: number;
  experience?: {
    id: number;
    title: string;
    slug: string;
    duration?: string | null;
    price?: number | undefined;
  } | null;
  time_slot_id: number | null;
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
  gender: string;
  country: string;
  phone: string;
  email: string | null;
  number_of_guests: number;
  booking_date: string;
  preferred_time: string;
  special_request: string | null;
  status: BookingStatus;
  booking_status: BookingStatus;
  booking_source: BookingSource;
  internal_notes: string | null;
  cancellation_reason: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingMetrics {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

export interface ManifestPassenger {
  manifest_id: number;
  id: number;
  booking_reference: string;
  full_name: string;
  gender: string;
  country: string;
  phone: string;
  email: string | null;
  number_of_guests: number;
  status: BookingStatus;
  booking_source: BookingSource;
  special_request: string | null;
  internal_notes: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface DepartureManifestData {
  departure: {
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
    experience?: {
      id: number;
      title: string;
      slug: string;
      duration?: string | null;
    } | null;
    boat?: {
      id: number;
      name: string;
      registration_number: string;
      capacity: number;
      status: string;
      image_url: string | null;
    } | null;
  };
  summary: {
    manifest_count: number;
    total_guests: number;
    confirmed_guests: number;
    pending_guests: number;
    remaining_seats: number;
  };
  passengers: ManifestPassenger[];
  other_bookings_count: number;
}

export interface BookingsResponse {
  success: boolean;
  metrics: BookingMetrics;
  data: Booking[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) {
    throw new ApiError("No active admin session found.", 401);
  }
  return token;
}

export const adminBookingApi = {
  getBookings: async (params?: {
    status?: string;
    experience_id?: string | number;
    source?: string;
    date?: string;
    search?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<BookingsResponse> => {
    const token = requireToken();
    try {
      return await adminBookingsFn({
        data: {
          token,
          status: params?.status,
          experience_id: params?.experience_id,
          source: params?.source,
          date: params?.date,
          search: params?.search,
          page: params?.page,
          per_page: params?.per_page,
          sort_by: params?.sort_by,
          sort_order: params?.sort_order,
        },
      });
    } catch (err) {
      handleSessionError(err);
    }
  },

  getBooking: async (id: number | string) => {
    const token = requireToken();
    try {
      return await adminBookingGetFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  createBooking: async (payload: {
    experience_id: number | null;
    time_slot_id: number;
    full_name: string;
    gender: string;
    country: string;
    phone: string;
    email?: string | null;
    number_of_guests: number;
    booking_source: BookingSource;
    special_request?: string | null;
    internal_notes?: string | null;
  }) => {
    const token = requireToken();
    try {
      return await adminBookingCreateFn({
        data: {
          token,
          experience_id: payload.experience_id,
          time_slot_id: payload.time_slot_id ?? null,
          full_name: payload.full_name,
          gender: payload.gender,
          country: payload.country,
          phone: payload.phone,
          email: payload.email ?? null,
          number_of_guests: payload.number_of_guests,
          booking_source: payload.booking_source,
          special_request: payload.special_request ?? null,
          internal_notes: payload.internal_notes ?? null,
        },
      });
    } catch (err) {
      handleSessionError(err);
    }
  },

  updateBooking: async (
    id: number | string,
    payload: Partial<{
      full_name: string;
      gender: string;
      country: string;
      phone: string;
      email: string | null;
      number_of_guests: number;
      booking_source: BookingSource;
      special_request: string | null;
      internal_notes: string | null;
    }>
  ) => {
    const token = requireToken();
    try {
      return await adminBookingUpdateFn({
        data: { token, id, patch: payload as Record<string, unknown> },
      });
    } catch (err) {
      handleSessionError(err);
    }
  },

  confirmBooking: async (id: number | string) => {
    const token = requireToken();
    try {
      return await adminBookingTransitionFn({ data: { token, id, action: "confirm" } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  cancelBooking: async (id: number | string, cancellation_reason?: string) => {
    const token = requireToken();
    try {
      return await adminBookingTransitionFn({ data: { token, id, action: "cancel", reason: cancellation_reason } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  completeBooking: async (id: number | string) => {
    const token = requireToken();
    try {
      return await adminBookingTransitionFn({ data: { token, id, action: "complete" } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  markNoShow: async (id: number | string) => {
    const token = requireToken();
    try {
      return await adminBookingTransitionFn({ data: { token, id, action: "no-show" } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  rescheduleBooking: async (id: number | string, time_slot_id: number, reason?: string) => {
    const token = requireToken();
    try {
      return await adminBookingTransitionFn({ data: { token, id, action: "reschedule", time_slot_id, reason } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  getManifest: async (timeSlotId: number | string) => {
    const token = requireToken();
    try {
      return await adminManifestFn({ data: { token, slotId: timeSlotId } });
    } catch (err) {
      handleSessionError(err);
    }
  },
};
