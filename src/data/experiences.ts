import { images } from "./siteConfig";

export const experiences = [
  {
    id: "river-safari",
    category: "The river",
    title: "River Safari",
    description: "Explore the peaceful waters of the Bentota River while surrounded by tropical scenery.",
    image: images.introduction,
  },
  {
    id: "mangrove-adventure",
    category: "Hidden waterways",
    title: "Mangrove Adventure",
    description: "Discover the fascinating mangrove ecosystem and the quiet channels woven through it.",
    image: images.mangroves,
  },
  {
    id: "wildlife-discovery",
    category: "Nature encounters",
    title: "Wildlife Discovery",
    description: "Experience Sri Lanka’s riverside wildlife and natural environment at the river’s own pace.",
    image: images.wildlife,
  },
] as const;