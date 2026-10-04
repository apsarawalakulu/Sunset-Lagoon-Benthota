import { ApiError } from "./api";
import { adminAuth, handleSessionError } from "./adminAuth";
import {
  adminAssignBoatFn,
  adminAvailableBoatsFn,
  adminGenerateSlotsFn,
  adminScheduleDeleteFn,
  adminScheduleSaveFn,
  adminSchedulesFn,
  adminSlotDeleteFn,
  adminSlotSaveFn,
  adminSlotStatusFn,
  adminSlotsFn,
} from "../backend/admin";
import { getAvailabilityFn } from "../backend/public";

export interface Schedule {
  id: number;
  experience_id: number;
  experience?: {
    id: number;
    title: string;
    slug: string;
  } | undefined;
  name: string;
  is_recurring: boolean;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  default_capacity: number;
  status: "active" | "inactive";
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSlot {
  id: number;
  experience_id: number;
  experience?: {
    id: number;
    title: string;
    slug: string;
  } | undefined;
  schedule_id: number | null;
  schedule?: {
    id: number;
    name: string;
  } | undefined;
  boat_id?: number | null;
  boat?: {
    id: number;
    name: string;
    registration_number: string;
    capacity: number;
    status: string;
    image_url: string | null;
  } | null;
  date: string;
  start_time: string;
  end_time: string;
  formatted_time: string;
  duration?: string;
  duration_minutes?: number;
  capacity: number;
  booked_guests: number;
  available_seats: number;
  is_full: boolean;
  status: "available" | "blocked" | "closed";
  effective_status: "available" | "full" | "blocked" | "closed";
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AvailabilitySlot {
  id: number;
  start_time: string;
  end_time: string;
  time_display: string;
  capacity: number;
  booked: number;
  available: number;
  status: string;
}

export interface PublicAvailabilityResponse {
  experience_id: number;
  experience_title: string;
  date: string;
  slots: AvailabilitySlot[];
}

export interface AvailableBoatItem {
  id: number;
  name: string;
  registration_number: string;
  capacity: number;
  status: string;
  image_url: string | null;
  is_available: boolean;
  reason: string | null;
  is_currently_assigned: boolean;
}

export interface AvailableBoatsResponse {
  time_slot: {
    id: number;
    experience_id: number;
    experience_title?: string;
    date: string;
    start_time: string;
    end_time: string;
    formatted_time: string;
    duration?: string;
    capacity: number;
    booked_guests: number;
    available_seats: number;
    current_boat_id: number | null;
    current_boat?: any;
  };
  data: AvailableBoatItem[];
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) {
    throw new ApiError("No active admin session found.", 401);
  }
  return token;
}

export const scheduleApi = {
  // Schedules CRUD
  async getSchedules(params?: {
    experience_id?: number;
    status?: string;
    is_recurring?: boolean;
  }): Promise<Schedule[]> {
    const token = requireToken();
    try {
      const res = await adminSchedulesFn({
        data: {
          token,
          experience_id: params?.experience_id,
          status: params?.status,
          is_recurring: params?.is_recurring,
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async createSchedule(payload: Partial<Schedule>): Promise<Schedule> {
    const token = requireToken();
    try {
      const res = await adminScheduleSaveFn({
        data: {
          token,
          experience_id: payload.experience_id ?? null,
          name: payload.name ?? "",
          is_recurring: payload.is_recurring,
          day_of_week: payload.day_of_week ?? null,
          specific_date: payload.specific_date ?? null,
          start_time: payload.start_time ?? "",
          end_time: payload.end_time ?? "",
          default_capacity: payload.default_capacity,
          status: payload.status,
          notes: payload.notes ?? null,
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async updateSchedule(id: number, payload: Partial<Schedule>): Promise<Schedule> {
    const token = requireToken();
    try {
      const res = await adminScheduleSaveFn({
        data: {
          token,
          id,
          experience_id: payload.experience_id ?? null,
          name: payload.name ?? "",
          is_recurring: payload.is_recurring,
          day_of_week: payload.day_of_week ?? null,
          specific_date: payload.specific_date ?? null,
          start_time: payload.start_time ?? "",
          end_time: payload.end_time ?? "",
          default_capacity: payload.default_capacity,
          status: payload.status,
          notes: payload.notes ?? null,
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async deleteSchedule(id: number): Promise<void> {
    const token = requireToken();
    try {
      await adminScheduleDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  // Time Slots CRUD
  async getTimeSlots(params?: {
    date?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    experience_id?: number | undefined;
    status?: string | undefined;
  }): Promise<TimeSlot[]> {
    const token = requireToken();
    try {
      const res = await adminSlotsFn({
        data: {
          token,
          date: params?.date,
          start_date: params?.start_date,
          end_date: params?.end_date,
          experience_id: params?.experience_id,
          status: params?.status,
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async createTimeSlot(payload: Partial<TimeSlot>): Promise<TimeSlot> {
    const token = requireToken();
    try {
      const res = await adminSlotSaveFn({
        data: {
          token,
          experience_id: payload.experience_id ?? null,
          schedule_id: payload.schedule_id ?? null,
          boat_id: payload.boat_id ?? null,
          date: payload.date ?? "",
          start_time: payload.start_time ?? "",
          end_time: payload.end_time ?? "",
          duration: payload.duration ?? null,
          capacity: payload.capacity,
          status: payload.status,
          notes: payload.notes ?? null,
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async updateTimeSlot(id: number, payload: Partial<TimeSlot>): Promise<TimeSlot> {
    const token = requireToken();
    try {
      const res = await adminSlotSaveFn({
        data: {
          token,
          id,
          experience_id: payload.experience_id ?? null,
          schedule_id: payload.schedule_id ?? null,
          boat_id: payload.boat_id ?? null,
          date: payload.date ?? "",
          start_time: payload.start_time ?? "",
          end_time: payload.end_time ?? "",
          duration: payload.duration ?? null,
          capacity: payload.capacity,
          status: payload.status,
          notes: payload.notes ?? null,
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async deleteTimeSlot(id: number): Promise<void> {
    const token = requireToken();
    try {
      await adminSlotDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  async updateSlotStatus(
    id: number,
    status: "available" | "blocked" | "closed",
    notes?: string | null
  ): Promise<TimeSlot> {
    const token = requireToken();
    try {
      const res = await adminSlotStatusFn({ data: { token, id, status, notes: notes ?? null } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async generateSlots(payload: {
    start_date: string;
    end_date: string;
    experience_id?: number | undefined;
  }): Promise<{ generated_count: number; message: string }> {
    const token = requireToken();
    try {
      const res = await adminGenerateSlotsFn({
        data: {
          token,
          start_date: payload.start_date,
          end_date: payload.end_date,
          experience_id: payload.experience_id,
        },
      });
      return { generated_count: res.generated_count, message: res.message };
    } catch (err) {
      handleSessionError(err);
    }
  },

  // Boat Assignment & Availability
  async getAvailableBoats(slotId: number): Promise<AvailableBoatsResponse> {
    const token = requireToken();
    try {
      return await adminAvailableBoatsFn({ data: { token, slotId } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  async assignBoat(slotId: number, boatId: number): Promise<TimeSlot> {
    const token = requireToken();
    try {
      const res = await adminAssignBoatFn({ data: { token, slotId, boatId } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  async unassignBoat(slotId: number): Promise<TimeSlot> {
    const token = requireToken();
    try {
      const res = await adminAssignBoatFn({ data: { token, slotId, unassign: true } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  // Public availability lookup
  async getPublicAvailability(
    experienceId: number,
    date: string
  ): Promise<PublicAvailabilityResponse> {
    try {
      const res = await getAvailabilityFn({ data: { experience_id: experienceId, date } });
      return res.data;
    } catch (err) {
      throw err instanceof ApiError ? err : new ApiError("Failed to fetch availability", 503);
    }
  },
};
