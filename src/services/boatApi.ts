import { adminAuth, handleSessionError } from "./adminAuth";
import { ApiError } from "./api";
import {
  adminBoatDeleteFn,
  adminBoatGetFn,
  adminBoatSaveFn,
  adminBoatsFn,
} from "../backend/admin";
import { listPublicBoatsFn } from "../backend/public";
import { formFile, formToRecord, uploadToCloudinary } from "./uploads";

export type BoatStatus = "active" | "available" | "in_use" | "maintenance" | "unavailable" | "retired";

export interface Boat {
  id: number;
  name: string;
  registration_number: string;
  capacity: number;
  image: string | null;
  image_url: string | null;
  status: BoatStatus;
  description: string | null;
  time_slots_count?: number | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) {
    throw new ApiError("No active admin session found.", 401);
  }
  return token;
}

async function imageFromForm(formData: FormData, fallback: string | null): Promise<string | null> {
  const file = formFile(formData, "image");
  if (file) {
    const uploaded = await uploadToCloudinary(file);
    return uploaded.url;
  }
  return fallback;
}

export const boatApi = {
  /**
   * Fetch all boats in the fleet (supports filtering by status or search).
   */
  async getBoats(params?: {
    status?: string | undefined;
    search?: string | undefined;
  }): Promise<Boat[]> {
    const token = requireToken();
    try {
      const res = await adminBoatsFn({ data: { token, status: params?.status, search: params?.search } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Fetch details for a specific boat.
   */
  async getBoat(id: number): Promise<Boat> {
    const token = requireToken();
    try {
      const res = await adminBoatGetFn({ data: { token, id } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Create a new boat with optional file upload (multipart/form-data).
   */
  async createBoat(formData: FormData): Promise<Boat> {
    const token = requireToken();
    const fields = formToRecord(formData);
    const image = await imageFromForm(formData, null);
    try {
      const res = await adminBoatSaveFn({
        data: {
          token,
          name: fields["name"] ?? "",
          registration_number: fields["registration_number"] ?? "",
          capacity: Number(fields["capacity"]) || 10,
          description: fields["description"] || null,
          image,
          status: fields["status"] || "active",
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Update an existing boat with optional replacement file upload.
   */
  async updateBoat(id: number, formData: FormData): Promise<Boat> {
    const token = requireToken();
    const fields = formToRecord(formData);
    let fallback: string | null = null;
    try {
      const current = await adminBoatGetFn({ data: { token, id } });
      fallback = current.data.image;
    } catch (err) {
      handleSessionError(err);
    }
    const image = await imageFromForm(formData, fallback);
    try {
      const res = await adminBoatSaveFn({
        data: {
          token,
          id,
          name: fields["name"] ?? "",
          registration_number: fields["registration_number"] ?? "",
          capacity: Number(fields["capacity"]) || 10,
          description: fields["description"] || null,
          image,
          status: fields["status"] || "active",
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Delete a boat and purge its stored image from storage.
   */
  async deleteBoat(id: number): Promise<void> {
    const token = requireToken();
    try {
      await adminBoatDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Public endpoint to get available fleet boats.
   */
  async getPublicBoats(): Promise<Boat[]> {
    try {
      const res = await listPublicBoatsFn();
      return res.data;
    } catch (err) {
      throw err instanceof ApiError ? err : new ApiError("Failed to fetch public boats", 503);
    }
  },
};
