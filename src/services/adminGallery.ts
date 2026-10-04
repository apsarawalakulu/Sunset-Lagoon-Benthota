import { adminAuth, handleSessionError } from "./adminAuth";
import {
  adminGalleryDeleteFn,
  adminGalleryFn,
  adminGallerySaveFn,
} from "../backend/admin";
import { uploadToCloudinary } from "./uploads";

export interface AdminGalleryItem {
  id: number;
  title: string | null;
  image_url: string;
  alt_text: string | null;
  category: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryForm {
  title?: string | null;
  image: string | File;
  alt_text?: string | null;
  category?: string;
  sort_order?: number;
  status?: string;
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) throw new Error("No active admin session found.");
  return token;
}

export const adminGalleryApi = {
  list: async (): Promise<AdminGalleryItem[]> => {
    const token = requireToken();
    try {
      const res = await adminGalleryFn({ data: { token } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  save: async (id: number | null, form: GalleryForm): Promise<AdminGalleryItem> => {
    const token = requireToken();
    let imageUrl: string;
    if (form.image instanceof File) {
      const uploaded = await uploadToCloudinary(form.image);
      imageUrl = uploaded.url;
    } else {
      imageUrl = form.image;
    }
    try {
      const res = await adminGallerySaveFn({
        data: {
          token,
          id,
          title: form.title ?? null,
          image_url: imageUrl,
          alt_text: form.alt_text ?? null,
          category: form.category || "River Safari",
          sort_order: form.sort_order ?? 0,
          status: form.status || "active",
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
      await adminGalleryDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },
};
