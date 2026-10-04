import { adminAuth, handleSessionError } from "./adminAuth";
import {
  adminExperienceDeleteFn,
  adminExperienceSaveFn,
  adminExperiencesFn,
} from "../backend/admin";
import { uploadToCloudinary } from "./uploads";

export interface AdminExperience {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  price: number | null;
  max_guests: number | null;
  image: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExperienceForm {
  title: string;
  description?: string | null;
  duration?: string | null;
  price?: number | null;
  max_guests?: number | null;
  image?: string | File | null;
  status?: string;
  sort_order?: number;
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) throw new Error("No active admin session found.");
  return token;
}

export const adminExperiencesApi = {
  list: async (): Promise<AdminExperience[]> => {
    const token = requireToken();
    try {
      const res = await adminExperiencesFn({ data: { token } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  save: async (id: number | null, form: ExperienceForm): Promise<AdminExperience> => {
    const token = requireToken();
    let image: string | null = null;
    if (form.image instanceof File) {
      const uploaded = await uploadToCloudinary(form.image);
      image = uploaded.url;
    } else if (typeof form.image === "string") {
      image = form.image;
    }
    try {
      const res = await adminExperienceSaveFn({
        data: {
          token,
          id,
          title: form.title,
          description: form.description ?? null,
          duration: form.duration ?? null,
          price: form.price ?? null,
          max_guests: form.max_guests ?? null,
          image,
          status: form.status || "active",
          sort_order: form.sort_order ?? 0,
        },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  remove: async (id: number | string): Promise<void> => {
    const token = requireToken();
    try {
      await adminExperienceDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },
};
