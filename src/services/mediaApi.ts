import { adminAuth, handleSessionError } from "./adminAuth";
import { getHeroMediaFn, getSectionsMediaFn, listPublicMediaFn } from "../backend/public";
import {
  adminMediaDeleteFn,
  adminMediaGetFn,
  adminMediaListFn,
  adminMediaSaveFn,
  adminMediaToggleFn,
} from "../backend/admin";
import { formFile, formToRecord, uploadToCloudinary } from "./uploads";

export type MediaDisplayLocation =
  | "gallery"
  | "hero"
  | "both"
  | "about"
  | "story"
  | "wildlife"
  | "experience_1"
  | "experience_2"
  | "experience_3"
  | string;

export interface MediaItem {
  id: number | string;
  title: string;
  type: "image" | "video";
  file_path: string;
  url: string;
  category: string;
  description: string | null;
  status: "visible" | "hidden";
  is_visible: boolean;
  display_location: MediaDisplayLocation;
  is_hero: boolean;
  sort_order: number;
  file_size: number | null;
  formatted_size: string;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface SectionsMediaMap {
  hero: MediaItem | null;
  about: MediaItem | null;
  story: MediaItem | null;
  wildlife: MediaItem | null;
  experience_1: MediaItem | null;
  experience_2: MediaItem | null;
  experience_3: MediaItem | null;
  [key: string]: MediaItem | null;
}

export interface SectionsMediaResponse {
  success: boolean;
  data: SectionsMediaMap;
}

export interface MediaStats {
  total: number;
  images: number;
  videos: number;
  visible: number;
  hidden: number;
  heroes?: number;
  categories: string[];
}

export interface MediaListResponse {
  success: boolean;
  stats?: MediaStats;
  data: MediaItem[];
}

export interface SingleMediaResponse {
  success: boolean;
  message?: string;
  data: MediaItem;
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) throw new Error("No active admin session found.");
  return token;
}

export const mediaApi = {
  /**
   * Fetch currently active Hero media item for the website header.
   */
  getPublicHeroMedia: async (): Promise<MediaItem | null> => {
    try {
      return await getHeroMediaFn();
    } catch {
      return null;
    }
  },

  /**
   * Fetch currently active media items for each homepage section.
   */
  getPublicSectionsMedia: async (): Promise<SectionsMediaMap> => {
    try {
      return await getSectionsMediaFn();
    } catch {
      return {
        hero: null,
        about: null,
        story: null,
        wildlife: null,
        experience_1: null,
        experience_2: null,
        experience_3: null,
      };
    }
  },
  /**
   * Fetch publicly visible media items for the website.
   */
  getPublicMedia: async (params?: { type?: string | undefined; category?: string | undefined }): Promise<MediaItem[]> => {
    try {
      return await listPublicMediaFn({ data: { type: params?.type, category: params?.category } });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to load media items.");
    }
  },

  /**
   * Fetch all media items for the Admin panel.
   */
  getAdminMedia: async (params?: {
    type?: string | undefined;
    category?: string | undefined;
    status?: string | undefined;
    display_location?: string | undefined;
    is_hero?: boolean | string | undefined;
    search?: string | undefined;
  }): Promise<MediaListResponse> => {
    const token = requireToken();
    try {
      return await adminMediaListFn({
        data: {
          token,
          type: params?.type,
          category: params?.category,
          status: params?.status,
          display_location: params?.display_location,
          is_hero: params?.is_hero,
          search: params?.search,
        },
      });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Upload an image or video with optional upload progress tracking.
   */
  uploadMedia: async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<SingleMediaResponse> => {
    const token = requireToken();
    const fields = formToRecord(formData);
    const file = formFile(formData, "file");
    if (!file) throw new Error("Please choose a file to upload.");
    onProgress?.(10);
    let uploaded = { url: "", mimeType: file.type || "", size: file.size || 0 };
    try {
      uploaded = await uploadToCloudinary(file);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Upload failed.");
    }
    onProgress?.(80);
    try {
      const res = await adminMediaSaveFn({
        data: {
          token,
          title: fields["title"] || file.name,
          url: uploaded.url,
          file_path: uploaded.url,
          type: fields["type"] || (file.type.startsWith("video") ? "video" : "image"),
          mime_type: uploaded.mimeType,
          file_size: uploaded.size,
          category: fields["category"] || "River Safari",
          description: fields["description"] || null,
          status: fields["status"] || "visible",
          display_location: fields["display_location"] || "gallery",
          is_hero: fields["is_hero"] === "1" || fields["is_hero"] === "true",
        },
      });
      onProgress?.(100);
      return res;
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Update media metadata (and optional replacement file).
   */
  updateMedia: async (id: number | string, formData: FormData): Promise<SingleMediaResponse> => {
    const token = requireToken();
    const fields = formToRecord(formData);
    const file = formFile(formData, "file");
    let url: string | null = null;
    let mimeType: string | null = null;
    let size: number | null = null;
    if (file) {
      const uploaded = await uploadToCloudinary(file);
      url = uploaded.url;
      mimeType = uploaded.mimeType;
      size = uploaded.size;
    } else {
      try {
        const current = await adminMediaGetFn({ data: { token, id } });
        url = current.data.url;
        mimeType = current.data.mime_type;
        size = current.data.file_size;
      } catch (err) {
        handleSessionError(err);
      }
    }
    try {
      return await adminMediaSaveFn({
        data: {
          token,
          id,
          title: fields["title"] || "Untitled",
          url: url ?? "",
          file_path: url ?? "",
          type: fields["type"] || "image",
          mime_type: mimeType,
          file_size: size,
          category: fields["category"] || "River Safari",
          description: fields["description"] || null,
          status: fields["status"] || "visible",
          display_location: fields["display_location"] || "gallery",
          is_hero: fields["is_hero"] === "1" || fields["is_hero"] === "true",
        },
      });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Toggle visibility (Show / Hide) quickly.
   */
  toggleVisibility: async (id: number | string): Promise<SingleMediaResponse> => {
    const token = requireToken();
    try {
      return await adminMediaToggleFn({ data: { token, id, field: "visibility" } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Set or remove media item as active Hero media.
   */
  setHeroMedia: async (id: number | string, isHero?: boolean): Promise<SingleMediaResponse> => {
    const token = requireToken();
    try {
      return await adminMediaToggleFn({ data: { token, id, field: "hero", value: isHero } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Delete media record and remove physical file from server storage.
   */
  deleteMedia: async (id: number | string): Promise<{ success: boolean; message: string }> => {
    const token = requireToken();
    try {
      return await adminMediaDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },
};
