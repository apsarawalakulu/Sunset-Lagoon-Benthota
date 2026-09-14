import { images } from "./siteConfig";

export const galleryImages = [
  { ...images.hero, caption: "Golden hour on the Bentota River" },
  { ...images.mangroves, caption: "Through the mangroves" },
  { ...images.crocodile, caption: "A crocodile in the mangroves" },
  { ...images.boat, caption: "The Sunset Lagoon safari boat" },
  { ...images.introduction, caption: "A quiet morning journey" },
  { ...images.wildlife, caption: "Life along the riverbank" },
  { ...images.story, caption: "Bentota at sunset" },
] as const;