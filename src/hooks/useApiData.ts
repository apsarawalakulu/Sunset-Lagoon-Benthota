import { useQuery } from "@tanstack/react-query";
import {
  api,
  type ExperienceData,
  type GalleryData,
  type ReviewData,
  type SiteSettingsData,
} from "@/services/api";

export function useExperiences() {
  return useQuery<ExperienceData[]>({
    queryKey: ["experiences"],
    queryFn: async () => {
      const res = await api.getExperiences();
      return res.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useExperience(id: string | number | undefined) {
  return useQuery<ExperienceData | null>({
    queryKey: ["experience", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.getExperience(id);
      return res.data ?? null;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useGallery() {
  return useQuery<GalleryData[]>({
    queryKey: ["gallery"],
    queryFn: async () => {
      const res = await api.getGallery();
      return res.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useReviews() {
  return useQuery<ReviewData[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await api.getReviews();
      return res.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useSiteSettings() {
  return useQuery<SiteSettingsData | null>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await api.getSettings();
      return res.data ?? null;
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
