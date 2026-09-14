import heroImage from "@/assets/bentota-hero.jpg";
import mangroveImage from "@/assets/bentota-mangrove.jpg";
import riverImage from "@/assets/bentota-river.jpg";
import sunsetImage from "@/assets/bentota-sunset.jpg";
import wildlifeImage from "@/assets/bentota-wildlife.jpg";
import crocodileImage from "@/assets/bentota-crocodile.jpg";
import boatImage from "@/assets/bentota-boat.jpg";
import logoImage from "@/assets/sunset-lagoon-cloudinary-logo.png";

export const LOGO_URL = logoImage;

export const images = {
  logo: { src: LOGO_URL, alt: "Sunset Lagoon Boat House logo", width: 922, height: 920 },
  hero: { src: heroImage, alt: "Safari boat crossing the Bentota River at sunset", width: 1920, height: 1088 },
  introduction: { src: riverImage, alt: "A peaceful guided journey along the Bentota River", width: 1600, height: 1104 },
  story: { src: sunsetImage, alt: "Sun setting over tropical forest beside the Bentota River", width: 1920, height: 1088 },
  wildlife: { src: wildlifeImage, alt: "Kingfisher among mangroves along a tropical river", width: 1200, height: 1504 },
  mangroves: { src: mangroveImage, alt: "Boat travelling beneath a green mangrove canopy", width: 1200, height: 1504 },
  crocodile: { src: crocodileImage, alt: "Crocodile gliding through the Bentota River mangroves", width: 1200, height: 1500 },
  boat: { src: boatImage, alt: "Sunset Lagoon safari boat on the Bentota River at golden hour", width: 1600, height: 1100 },
} as const;

export const LOCATION_ADDRESS = "Bentota, Sri Lanka";

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
    phone: "To be confirmed",
    whatsapp: "",
    email: "To be confirmed",
    hours: "To be confirmed",
  },
  social: { facebook: "", instagram: "", whatsapp: "" },
  navigation: [
    { label: "Home", href: "#home" },
    { label: "Experience", href: "#experience" },
    { label: "About", href: "#about" },
    { label: "Gallery", href: "#gallery" },
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