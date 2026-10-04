import { db } from "./db";

const CLOUDINARY_BASE = "https://res.cloudinary.com/qegkbvkj/image/upload";

export const DEFAULT_DURATIONS = [
  { value: "1 Hour", label: "1 Hour", description: "River & Lagoon Highlights" },
  { value: "2 Hours", label: "2 Hours", description: "Mangrove Caves & Temple" },
  { value: "3 Hours", label: "3 Hours", description: "Wildlife & Mangrove Tunnels" },
  { value: "4 Hours", label: "4 Hours", description: "Grand Safari Comprehensive" },
];

export const DEFAULT_SETTINGS = {
  business_name: "Sunset Lagoon Boat House",
  tagline: "Bentota Boat Safari",
  phone: "To be confirmed",
  whatsapp: "",
  email: "To be confirmed",
  address: "Bentota",
  city: "Bentota",
  country: "Sri Lanka",
  google_maps_url: null as string | null,
  latitude: null as number | null,
  longitude: null as number | null,
  facebook_url: "",
  instagram_url: "",
  website_url: "",
  opening_hours: "To be confirmed",
  logo_url: null as string | null,
  hero_title: "Discover the Hidden Beauty of Bentota",
  hero_subtitle:
    "Cruise through tranquil waters, mangrove forests and the wild beauty of Bentota with Sunset Lagoon Boat House.",
  about_title: "Rooted in Bentota",
  about_description:
    "A love for this river shapes the way we welcome people onto the water. Sunset Lagoon is grounded in a local connection to Bentota and a respect for its natural setting. We invite visitors to explore thoughtfully, enjoy the changing river landscape and leave with a closer feeling for this corner of Sri Lanka.",
  untamed_beauty_title: "An intimate escape into the untamed beauty of the river.",
  experience_section_title: "Choose Your Experience",
  experience_1_title: "River Safari",
  experience_2_title: "Mangrove Adventure",
  experience_3_title: "Wildlife Discovery",
  story_eyebrow: "Beyond the shoreline",
  story_title: "A Different Side of Bentota",
  wildlife_eyebrow: "Wildlife & nature",
  wildlife_title: "Life Along the Bentota River",
  gallery_title: "Moments on the River",
  contact_title: "Begin the Conversation",
  footer_text: "Discover the beauty of Bentota from the water.",
  min_guests: 1,
  max_guests: 8,
  min_advance_hours: 24,
  cancellation_notice_hours: 24,
  booking_enabled: true,
  sunrise_start_time: "06:30",
  sunrise_end_time: "08:30",
  sunset_start_time: "16:30",
  sunset_end_time: "18:30",
  safari_durations: DEFAULT_DURATIONS,
  timezone: "Asia/Colombo",
  currency: "LKR",
  date_format: "YYYY-MM-DD",
};

const SEED_EXPERIENCES = [
  {
    title: "River Safari",
    slug: "river-safari",
    description: "Explore the peaceful waters of the Bentota River while surrounded by tropical scenery.",
    duration: "2 Hours",
    max_guests: 15,
    image: `${CLOUDINARY_BASE}/v1789443976/images_1.jpg`,
  },
  {
    title: "Mangrove Adventure",
    slug: "mangrove-adventure",
    description: "Discover the fascinating mangrove ecosystem and the quiet channels woven through it.",
    duration: "2 Hours",
    max_guests: 10,
    image: `${CLOUDINARY_BASE}/v1789443980/WhatsApp_Image_2026-09-14_at_23.58.09.jpg`,
  },
  {
    title: "Wildlife Discovery",
    slug: "wildlife-discovery",
    description: "Experience Sri Lanka's riverside wildlife and natural environment at the river's own pace.",
    duration: "3 Hours",
    max_guests: 8,
    image: `${CLOUDINARY_BASE}/v1789443977/sri-lanka-national-bird-watching-month.webp`,
  },
];

const SEED_GALLERY = [
  { title: "Wildlife among the tropical greenery", url: `${CLOUDINARY_BASE}/v1789443976/images_1.jpg`, category: "River Safari" },
  { title: "Life within the mangrove forest", url: `${CLOUDINARY_BASE}/v1789443981/WhatsApp_Image_2026-09-14_at_23.58.09_1.jpg`, category: "Mangroves" },
  { title: "Beneath the mangrove canopy", url: `${CLOUDINARY_BASE}/v1789443980/WhatsApp_Image_2026-09-14_at_23.58.09.jpg`, category: "Mangroves" },
  { title: "A quiet wildlife encounter", url: `${CLOUDINARY_BASE}/v1789443979/xm0cg6mvkcu7fjigebbj.webp`, category: "Wildlife" },
  { title: "Through Bentota's hidden waterways", url: `${CLOUDINARY_BASE}/v1789443978/Places-to-Visit-in-Bentota-1.webp`, category: "River Safari" },
  { title: "Safari boats at sunset", url: `${CLOUDINARY_BASE}/v1789443978/uovpp573cg7cj0z3kxhv.webp`, category: "Boats" },
  { title: "Kingfisher along the riverbank", url: `${CLOUDINARY_BASE}/v1789443977/sri-lanka-national-bird-watching-month.webp`, category: "Wildlife" },
  { title: "A young crocodile seen up close", url: `${CLOUDINARY_BASE}/v1789443977/images_6.jpg`, category: "Wildlife" },
  { title: "Sunset Lagoon boat at golden hour", url: `${CLOUDINARY_BASE}/v1789443140/ChatGPT_Image_Sep_15_2026_09_01_33_AM.png`, category: "Boats" },
  { title: "Riverside temple from the water", url: `${CLOUDINARY_BASE}/v1789316022/d9f312e0-f7cf-40a3-b312-8745e9792c38_bentota-river-boat-safari-with-private-boat-beruwalabentotakosgodaahungalla.png`, category: "River Safari" },
];

const SEED_BOATS = [
  { name: "Lagoon Star", registration_number: "SL-BT-001", capacity: 8, description: "Covered safari boat for larger groups.", status: "active" },
  { name: "River Explorer", registration_number: "SL-BT-002", capacity: 8, description: "Comfortable mid-size safari boat.", status: "active" },
  { name: "Mangrove Scout", registration_number: "SL-BT-003", capacity: 8, description: "Small boat for narrow mangrove channels.", status: "active" },
];

function dateOnly(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

export async function seedDemoContent(): Promise<void> {
  const sql = db();

  const expCount = await sql`SELECT COUNT(*)::int AS count FROM experiences`;
  if (Number((expCount[0] as unknown as { count: number }).count ?? 0) > 0) return;

  const expIds: number[] = [];
  for (let i = 0; i < SEED_EXPERIENCES.length; i++) {
    const e = SEED_EXPERIENCES[i]!;
    const rows = await sql`
      INSERT INTO experiences (title, slug, description, duration, max_guests, image, status, sort_order)
      VALUES (${e.title}, ${e.slug}, ${e.description}, ${e.duration}, ${e.max_guests}, ${e.image}, 'active', ${i})
      RETURNING id
    `;
    expIds.push(Number((rows[0] as unknown as { id: number }).id));
  }

  for (let i = 0; i < SEED_GALLERY.length; i++) {
    const g = SEED_GALLERY[i]!;
    await sql`
      INSERT INTO gallery (title, image_url, alt_text, category, sort_order, status)
      VALUES (${g.title}, ${g.url}, ${g.title}, ${g.category}, ${i}, 'active')
    `;
  }

  for (const b of SEED_BOATS) {
    await sql`
      INSERT INTO boats (name, registration_number, capacity, description, status)
      VALUES (${b.name}, ${b.registration_number}, ${b.capacity}, ${b.description}, ${b.status})
    `;
  }

  const s = DEFAULT_SETTINGS;
  await sql`
    INSERT INTO site_settings (
      id, business_name, tagline, phone, whatsapp, email, address, city, country,
      opening_hours, hero_title, hero_subtitle, about_title, about_description,
      untamed_beauty_title, experience_section_title, experience_1_title, experience_2_title,
      experience_3_title, story_eyebrow, story_title, wildlife_eyebrow, wildlife_title,
      gallery_title, contact_title, footer_text, min_guests, max_guests, min_advance_hours,
      cancellation_notice_hours, booking_enabled, sunrise_start_time, sunrise_end_time,
      sunset_start_time, sunset_end_time, safari_durations, timezone, currency, date_format
    ) VALUES (
      1, ${s.business_name}, ${s.tagline}, ${s.phone}, ${s.whatsapp}, ${s.email}, ${s.address},
      ${s.city}, ${s.country}, ${s.opening_hours}, ${s.hero_title}, ${s.hero_subtitle},
      ${s.about_title}, ${s.about_description}, ${s.untamed_beauty_title}, ${s.experience_section_title},
      ${s.experience_1_title}, ${s.experience_2_title}, ${s.experience_3_title}, ${s.story_eyebrow},
      ${s.story_title}, ${s.wildlife_eyebrow}, ${s.wildlife_title}, ${s.gallery_title},
      ${s.contact_title}, ${s.footer_text}, ${s.min_guests}, ${s.max_guests}, ${s.min_advance_hours},
      ${s.cancellation_notice_hours}, ${s.booking_enabled}, ${s.sunrise_start_time}, ${s.sunrise_end_time},
      ${s.sunset_start_time}, ${s.sunset_end_time}, ${JSON.stringify(s.safari_durations)},
      ${s.timezone}, ${s.currency}, ${s.date_format}
    )
    ON CONFLICT (id) DO NOTHING
  `;

  const today = new Date();
  // Each window opens with the full fleet capacity (3 boats x 8 seats = 24).
  const fleetRows = await sql`SELECT COALESCE(SUM(capacity), 0)::int AS total FROM boats WHERE status IN ('active', 'available')`;
  const fleetTotal = Number((fleetRows[0] as unknown as { total: number }).total ?? 0) || 24;
  for (let day = 0; day < 14; day++) {
    const d = new Date(today.getTime() + day * 86400000);
    const dateStr = dateOnly(d);
    for (const expId of expIds) {
      await sql`
        INSERT INTO time_slots (experience_id, date, start_time, end_time, duration, capacity, status)
        VALUES (${expId}, ${dateStr}, '06:30', '08:30', '2 Hours', ${fleetTotal}, 'available')
      `;
      await sql`
        INSERT INTO time_slots (experience_id, date, start_time, end_time, duration, capacity, status)
        VALUES (${expId}, ${dateStr}, '17:00', '19:00', '2 Hours', ${fleetTotal}, 'available')
      `;
    }
  }
}
