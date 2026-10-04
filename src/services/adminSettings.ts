import { adminAuth, handleSessionError } from "./adminAuth";
import {
  adminLogoFn,
  adminSettingsGetFn,
  adminSettingsResetFn,
  adminSettingsUpdateFn,
} from "../backend/admin";
import { uploadToCloudinary } from "./uploads";

export interface SafariDurationOption {
  value: string;
  label: string;
  description: string;
}

export interface SiteSettingsPayload {
  // 1. Business Info
  business_name?: string | null;
  tagline?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  google_maps_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  opening_hours?: string | null;
  logo_url?: string | null;

  // 2. Website Content
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

  // 3. Booking Settings
  min_guests?: number;
  max_guests?: number;
  min_advance_hours?: number;
  cancellation_notice_hours?: number;
  booking_enabled?: boolean;

  // 4. Safari & Schedule Settings
  sunrise_start_time?: string | null;
  sunrise_end_time?: string | null;
  sunset_start_time?: string | null;
  sunset_end_time?: string | null;
  safari_durations?: SafariDurationOption[] | undefined;

  // 5. System Settings
  timezone?: string | null;
  currency?: string | null;
  date_format?: string | null;

  updated_at?: string | null;
}

export interface SettingsApiResponse {
  success: boolean;
  message?: string;
  data: SiteSettingsPayload;
  defaults?: SiteSettingsPayload;
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 });
    throw err;
  }
  return token;
}

export const adminSettingsApi = {
  /**
   * Fetch current site settings and system defaults.
   */
  getSettings: async (): Promise<SettingsApiResponse> => {
    const token = requireToken();
    try {
      return await adminSettingsGetFn({ data: { token } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Save / update site settings.
   */
  updateSettings: async (payload: Partial<SiteSettingsPayload>): Promise<SettingsApiResponse> => {
    const token = requireToken();
    try {
      return await adminSettingsUpdateFn({ data: { token, patch: payload as Record<string, unknown> } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Restore settings to system defaults (all or specific section).
   */
  resetSettings: async (section?: string): Promise<SettingsApiResponse> => {
    const token = requireToken();
    try {
      return await adminSettingsResetFn({ data: { token, section } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Upload custom logo image file.
   */
  uploadLogo: async (file: File): Promise<{ success: boolean; message: string; logo_url: string; data: SiteSettingsPayload }> => {
    const token = requireToken();
    const uploaded = await uploadToCloudinary(file);
    try {
      const res = await adminLogoFn({ data: { token, logo_url: uploaded.url } });
      return { success: true, message: res.message, logo_url: uploaded.url, data: res.data };
    } catch (err) {
      handleSessionError(err);
    }
  },

  /**
   * Reset website logo to default.
   */
  removeLogo: async (): Promise<{ success: boolean; message: string; logo_url: null; data: SiteSettingsPayload }> => {
    const token = requireToken();
    try {
      const res = await adminLogoFn({ data: { token, logo_url: null } });
      return { success: true, message: res.message, logo_url: null, data: res.data };
    } catch (err) {
      handleSessionError(err);
    }
  },
};
