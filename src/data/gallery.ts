import { images } from "./siteConfig";

export const galleryImages = [
  { ...images.introduction, caption: "Wildlife among the tropical greenery" },
  { ...images.forest, caption: "Life within the mangrove forest" },
  { ...images.mangroves, caption: "Beneath the mangrove canopy" },
  { ...images.monkey, caption: "A quiet wildlife encounter" },
  { ...images.mangroveBoat, caption: "Through Bentota’s hidden waterways" },
  { ...images.story, caption: "Safari boats at sunset" },
  { ...images.wildlife, caption: "Kingfisher along the riverbank" },
  { ...images.babyCrocodile, caption: "A young crocodile seen up close" },
] as const;