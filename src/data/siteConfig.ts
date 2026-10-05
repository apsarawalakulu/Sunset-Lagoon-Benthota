import crocodileImage from "@/assets/bentota-crocodile.jpg";
import boatImage from "@/assets/bentota-boat.jpg";
import logoImage from "@/assets/sunset-lagoon-cloudinary-logo.png";

export const LOGO_URL = logoImage;

const cloudinaryBase = "https://res.cloudinary.com/qegkbvkj/image/upload";

export const images = {
  logo: { src: LOGO_URL, alt: "Sunset Lagoon Boat House logo", width: 922, height: 920 },
  hero: { src: `${cloudinaryBase}/v1789443140/ChatGPT_Image_Sep_15_2026_09_01_33_AM.png`, alt: "Sunset Lagoon boat moored on the Bentota River at sunset", width: 1678, height: 937 },
  heroLogo: { src: `${cloudinaryBase}/v1789442959/ChatGPT_Image_Sep_15_2026_08_56_42_AM_2.png`, alt: "Sunset Lagoon Boat House emblem over a warm sunset", width: 1679, height: 937 },
  heroTemple: { src: `${cloudinaryBase}/v1789316022/d9f312e0-f7cf-40a3-b312-8745e9792c38_bentota-river-boat-safari-with-private-boat-beruwalabentotakosgodaahungalla.png`, alt: "Riverside Buddhist temple seen from the Bentota River", width: 720, height: 480 },
  introduction: { src: `${cloudinaryBase}/v1789443976/images_1.jpg`, alt: "Tranquil stretch of the Bentota river surrounded by tropical greenery", width: 1280, height: 853 },
  story: { src: `${cloudinaryBase}/v1789443978/uovpp573cg7cj0z3kxhv.webp`, alt: "Safari boats on the Bentota River at sunset", width: 900, height: 507 },
  wildlife: { src: "https://res.cloudinary.com/qegkbvkj/image/upload/v1791211954/Spiny_Green_Lizard_on_Branch.webp", alt: "Spiny green lizard perched on a branch along the Bentota River", width: 1448, height: 1086 },
  mangroves: { src: `${cloudinaryBase}/v1789443980/WhatsApp_Image_2026-09-14_at_23.58.09.jpg`, alt: "Dense mangrove canopy above a shaded waterway", width: 1280, height: 960 },
  crocodile: { src: crocodileImage, alt: "Crocodile gliding through the Bentota River mangroves", width: 1200, height: 1500 },
  boat: { src: boatImage, alt: "Sunset Lagoon safari boat on the Bentota River at golden hour", width: 1600, height: 1100 },
  forest: { src: `${cloudinaryBase}/v1789443981/WhatsApp_Image_2026-09-14_at_23.58.09_1.jpg`, alt: "Lush mangrove vegetation beside the Bentota River", width: 1280, height: 960 },
  monkey: { src: `${cloudinaryBase}/v1789443979/xm0cg6mvkcu7fjigebbj.webp`, alt: "Visitors observing monkeys in the riverside forest", width: 900, height: 507 },
  mangroveBoat: { src: `${cloudinaryBase}/v1789443978/Places-to-Visit-in-Bentota-1.webp`, alt: "A small safari boat passing through a mangrove channel", width: 1000, height: 731 },
  babyCrocodile: { src: `${cloudinaryBase}/v1789443977/images_6.jpg`, alt: "A young crocodile observed during a guided wildlife encounter", width: 404, height: 758 },
} as const;

export const heroSlidesMobile = [
  {
    src: "/hero/mobile/mangrove-boat-adventure.webp",
    alt: "Guests cruising past dense mangrove forest on a Bentota river safari",
    width: 940,
    height: 1672,
  },
  {
    src: "/hero/mobile/lakeside-sunset-buddha.webp",
    alt: "Sunset over the Bentota lagoon with the riverside Buddha statue",
    width: 940,
    height: 1672,
  },
] as const;

export const heroSlides = [
  {
    src: "/hero/mangrove-waterway-adventure.webp",
    alt: "Guests cruising past dense mangrove forest on a Bentota river safari",
    width: 2056,
    height: 765,
  },
  {
    src: "/hero/hero-bentota-safari.jpg",
    alt: "A covered safari boat carrying visitors across the Bentota River at golden hour",
    width: 1536,
    height: 1024,
  },
  {
    src: "/hero/hero-mangrove-journey.jpg",
    alt: "A boat safari journey through lush tropical mangroves in Bentota",
    width: 1536,
    height: 1024,
  },
] as const;

export const LOCATION_ADDRESS = "Bentota, Sri Lanka";

export const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Sunset+Lagoon+Boat+House/@6.4248125,79.9995625,865m/data=!3m1!1e3!4m16!1m9!3m8!1s0x3ae22f8a90d97809:0xb5ca1a9240ec597a!2sSunset+Lagoon+Boat+House!8m2!3d6.4248125!4d79.9995625!9m1!1b1!16s%2Fg%2F11zxxddqfb!3m5!1s0x3ae22f8a90d97809:0xb5ca1a9240ec597a!8m2!3d6.4248125!4d79.9995625!16s%2Fg%2F11zxxddqfb?hl=en&entry=ttu";

export const GOOGLE_MAPS_EMBED_URL =
  "https://maps.google.com/maps?q=6.4247778,79.9996111&z=16&output=embed";

type SiteConfig = {
  name: string;
  fullName: string;
  descriptor: string;
  location: string;
  contact: { phone: string; whatsapp: string; email: string; hours: string };
  social: { facebook: string; instagram: string; whatsapp: string };
  navigation: ReadonlyArray<{ label: string; href: string }>;
};

export const siteConfig: SiteConfig = {
  name: "Sunset Lagoon",
  fullName: "Sunset Lagoon Boat House",
  descriptor: "Bentota Boat Safari",
  location: LOCATION_ADDRESS,
  contact: {
    phone: "+94 767 498 169",
    whatsapp: "+94 776 838 289",
    email: "sunsetlagoon.boats@gmail.com",
    hours: "Open daily · 06:00 – 19:00",
  },
  social: { facebook: "", instagram: "", whatsapp: "" },
  navigation: [
    { label: "Home", href: "#home" },
    { label: "Experience", href: "#experience" },
    { label: "About", href: "#about" },
    { label: "Gallery", href: "#gallery" },
    { label: "Reviews", href: "#reviews" },
    { label: "Wildlife", href: "#wildlife" },
    { label: "Location", href: "#location" },
    { label: "Contact", href: "#contact" },
  ],
};

export function getWhatsAppUrl() {
  return siteConfig.contact.whatsapp
    ? `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`
    : "#contact";
}