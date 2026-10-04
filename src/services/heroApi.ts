import { adminAuth, handleSessionError } from "./adminAuth";
import {
  adminHeroSlideDeleteFn,
  adminHeroSlideSaveFn,
  adminHeroSlidesFn,
  adminHeroSlidesReorderFn,
  listHeroSlidesFn,
  type HeroSlide,
  type PublicHeroSlide,
} from "../backend/hero";

export type { HeroSlide, PublicHeroSlide };

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) throw new Error("No active admin session found.");
  return token;
}

export const heroApi = {
  /** Public slides grouped by device (empty arrays = use built-in fallback). */
  list: async (): Promise<{ desktop: PublicHeroSlide[]; mobile: PublicHeroSlide[] }> => {
    try {
      return await listHeroSlidesFn();
    } catch {
      return { desktop: [], mobile: [] };
    }
  },

  adminList: async (): Promise<HeroSlide[]> => {
    const token = requireToken();
    try {
      const res = await adminHeroSlidesFn({ data: { token } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  save: async (
    id: number | null,
    input: { device: "desktop" | "mobile"; src: string; alt?: string | null; is_active?: boolean }
  ): Promise<HeroSlide> => {
    const token = requireToken();
    try {
      const res = await adminHeroSlideSaveFn({
        data: { token, id, device: input.device, src: input.src, alt: input.alt ?? null, is_active: input.is_active },
      });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  },

  remove: async (id: number | string): Promise<void> => {
    const token = requireToken();
    try {
      await adminHeroSlideDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },

  reorder: async (device: "desktop" | "mobile", ids: number[]): Promise<void> => {
    const token = requireToken();
    try {
      await adminHeroSlidesReorderFn({ data: { token, device, ids } });
    } catch (err) {
      handleSessionError(err);
    }
  },
};
