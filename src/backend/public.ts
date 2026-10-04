import { createServerFn } from "@tanstack/react-start";
import { db, ensureSchema, toDateOnly, toIso } from "./db";
import { fleetCapacity, poolAvailable, poolBooked, windowPools } from "./fleet";
import type {
  ApiResponse,
  AvailabilityResponseData,
  BookingApiResponse,
  BookingPayload,
  BookingResponseData,
  DepartureSlot,
  ExperienceData,
  GalleryData,
  ReviewData,
  SiteSettingsData,
} from "../services/api";
import type { MediaItem, SectionsMediaMap } from "../services/mediaApi";

type Row = Record<string, unknown>;
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const strOr = (v: unknown, fallback: string): string => (v === null || v === undefined ? fallback : String(v));

function to12h(t: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim());
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2] ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${min} ${ampm}`;
}

function formatSize(bytes: unknown): string {
  const n = num(bytes, 0);
  if (n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function mapMedia(r: Row): MediaItem {
  const active = r["is_active"] !== false;
  return {
    id: num(r["id"]),
    title: strOr(r["title"], ""),
    type: r["type"] === "video" ? "video" : "image",
    file_path: strOr(r["file_path"], str(r["url"]) ?? ""),
    url: strOr(r["url"], ""),
    category: strOr(r["category"], "River Safari"),
    description: str(r["description"]),
    status: active ? "visible" : "hidden",
    is_visible: active,
    display_location: strOr(r["section"], "gallery"),
    is_hero: r["is_hero"] === true,
    sort_order: num(r["sort_order"]),
    file_size: r["file_size"] === null || r["file_size"] === undefined ? null : num(r["file_size"]),
    formatted_size: formatSize(r["file_size"]),
    mime_type: str(r["mime_type"]),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

function mapSettings(r: Row): SiteSettingsData {
  let durations: SiteSettingsData["safari_durations"];
  const raw = r["safari_durations"];
  if (Array.isArray(raw)) durations = raw as SiteSettingsData["safari_durations"];
  else if (typeof raw === "string") {
    try {
      durations = JSON.parse(raw) as SiteSettingsData["safari_durations"];
    } catch {
      durations = undefined;
    }
  }
  return {
    business_name: str(r["business_name"]),
    tagline: str(r["tagline"]),
    phone: str(r["phone"]),
    whatsapp: str(r["whatsapp"]),
    email: str(r["email"]),
    address: str(r["address"]),
    city: str(r["city"]),
    country: str(r["country"]),
    google_maps_url: str(r["google_maps_url"]),
    coordinates: {
      latitude: r["latitude"] === null || r["latitude"] === undefined ? null : num(r["latitude"]),
      longitude: r["longitude"] === null || r["longitude"] === undefined ? null : num(r["longitude"]),
    },
    social_links: {
      facebook: str(r["facebook_url"]),
      instagram: str(r["instagram_url"]),
      website: str(r["website_url"]),
    },
    opening_hours: str(r["opening_hours"]),
    logo_url: str(r["logo_url"]),
    hero_title: str(r["hero_title"]),
    hero_subtitle: str(r["hero_subtitle"]),
    about_title: str(r["about_title"]),
    about_description: str(r["about_description"]),
    untamed_beauty_title: str(r["untamed_beauty_title"]),
    experience_section_title: str(r["experience_section_title"]),
    experience_1_title: str(r["experience_1_title"]),
    experience_2_title: str(r["experience_2_title"]),
    experience_3_title: str(r["experience_3_title"]),
    story_eyebrow: str(r["story_eyebrow"]),
    story_title: str(r["story_title"]),
    wildlife_eyebrow: str(r["wildlife_eyebrow"]),
    wildlife_title: str(r["wildlife_title"]),
    gallery_title: str(r["gallery_title"]),
    contact_title: str(r["contact_title"]),
    footer_text: str(r["footer_text"]),
    min_guests: num(r["min_guests"], 1),
    max_guests: num(r["max_guests"], 10),
    min_advance_hours: num(r["min_advance_hours"], 24),
    cancellation_notice_hours: num(r["cancellation_notice_hours"], 24),
    booking_enabled: r["booking_enabled"] !== false,
    sunrise_start_time: str(r["sunrise_start_time"]),
    sunrise_end_time: str(r["sunrise_end_time"]),
    sunset_start_time: str(r["sunset_start_time"]),
    sunset_end_time: str(r["sunset_end_time"]),
    safari_durations: durations,
    timezone: str(r["timezone"]),
    currency: str(r["currency"]),
    date_format: str(r["date_format"]),
    updated_at: toIso(r["updated_at"]) ?? null,
  };
}

export const listExperiencesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT id, title, slug, description, duration, price, max_guests, image, status, sort_order
    FROM experiences WHERE status = 'active' ORDER BY sort_order ASC, id ASC
  `;
  const data: ExperienceData[] = (rows as unknown as Row[]).map((r) => ({
    id: num(r["id"]),
    title: strOr(r["title"], ""),
    slug: strOr(r["slug"], ""),
    short_description: str(r["description"]),
    description: str(r["description"]),
    duration: str(r["duration"]),
    price: r["price"] === null || r["price"] === undefined ? undefined : num(r["price"]),
    max_guests: r["max_guests"] === null || r["max_guests"] === undefined ? null : num(r["max_guests"]),
    image: str(r["image"]),
    status: strOr(r["status"], "active"),
    sort_order: num(r["sort_order"]),
  }));
  const res: ApiResponse<ExperienceData[]> = { success: true, data };
  return res;
});

export const listGalleryFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT id, title, image_url, category, alt_text, sort_order
    FROM gallery WHERE status = 'active' ORDER BY sort_order ASC, id ASC
  `;
  const data: GalleryData[] = (rows as unknown as Row[]).map((r) => ({
    id: num(r["id"]),
    title: str(r["title"]),
    image_url: strOr(r["image_url"], ""),
    category: strOr(r["category"], "River Safari"),
    alt_text: str(r["alt_text"]),
    sort_order: num(r["sort_order"]),
  }));
  const res: ApiResponse<GalleryData[]> = { success: true, data };
  return res;
});

export const listApprovedReviewsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  // Keep Google reviews fresh: refresh in the background when stale (hourly).
  // Failures are silent — the site always renders from the local table.
  try {
    const { refreshGoogleReviewsIfStale } = await import("./google");
    await refreshGoogleReviewsIfStale();
  } catch {
    // Fall through to local data.
  }
  const sql = db();
  const rows = await sql`
    SELECT id, customer_name, country, rating, review, image, created_at, source
    FROM reviews WHERE status = 'approved' ORDER BY created_at DESC
  `;
  const data: ReviewData[] = (rows as unknown as Row[]).map((r) => ({
    id: num(r["id"]),
    customer_name: strOr(r["customer_name"], ""),
    country: str(r["country"]),
    rating: num(r["rating"], 5),
    review: strOr(r["review"], ""),
    image: str(r["image"]),
    created_at: toIso(r["created_at"]),
    source: strOr(r["source"], "website"),
  }));
  const res: ApiResponse<ReviewData[]> = { success: true, data };
  return res;
});

export const getPublicSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`;
  const row = rows[0] as unknown as Row | undefined;
  const res: ApiResponse<SiteSettingsData | null> = { success: true, data: row ? mapSettings(row) : null };
  return res;
});

export const listPublicMediaFn = createServerFn({ method: "GET" })
  .inputValidator((d: { type?: string | undefined; category?: string | undefined }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const type = data.type && data.type !== "all" ? data.type : null;
    const category = data.category && data.category !== "all" ? data.category : null;
    const rows = await sql`
      SELECT * FROM media
      WHERE is_active = TRUE
        AND (${type}::text IS NULL OR type = ${type})
        AND (${category}::text IS NULL OR category = ${category})
      ORDER BY sort_order ASC, id ASC
    `;
    return (rows as unknown as Row[]).map(mapMedia);
  });

export const getSectionsMediaFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT DISTINCT ON (section) * FROM media
    WHERE is_active = TRUE AND section IN ('hero','about','story','wildlife','experience_1','experience_2','experience_3')
    ORDER BY section ASC, sort_order ASC, id DESC
  `;
  const map: SectionsMediaMap = {
    hero: null, about: null, story: null, wildlife: null,
    experience_1: null, experience_2: null, experience_3: null,
  };
  for (const r of rows as unknown as Row[]) {
    const item = mapMedia(r);
    const key = String(item.display_location);
    if (key in map) map[key] = item;
  }
  return map;
});

export const getHeroMediaFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT * FROM media WHERE is_active = TRUE AND is_hero = TRUE
    ORDER BY sort_order ASC, id DESC LIMIT 1
  `;
  const row = rows[0] as unknown as Row | undefined;
  return row ? mapMedia(row) : null;
});

async function slotsForDate(experienceId: number, date: string) {
  const sql = db();
  return await sql`
    SELECT ts.id, ts.experience_id, ts.date, ts.start_time, ts.end_time, ts.duration,
           ts.capacity, ts.status, b.name AS boat_name,
           COALESCE((SELECT SUM(number_of_guests) FROM bookings
                      WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
    FROM time_slots ts
    LEFT JOIN boats b ON b.id = ts.boat_id
    WHERE ts.experience_id = ${experienceId} AND ts.date = ${date}::date
    ORDER BY ts.start_time ASC
  `;
}

export const getAvailabilityFn = createServerFn({ method: "GET" })
  .inputValidator((d: { experience_id: number | string; date: string }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const expId = Number(data.experience_id);
    const expRows = await sql`SELECT id, title FROM experiences WHERE id = ${expId} LIMIT 1`;
    const exp = expRows[0] as unknown as Row | undefined;
    // Fleet-wide pool: every window opens with full fleet capacity and all
    // bookings in that window (any experience) draw from the same pool.
    const fleet = await fleetCapacity(sql);
    const pools = await windowPools(sql, data.date);
    const slotRows = await slotsForDate(expId, data.date);
    const slots: DepartureSlot[] = (slotRows as unknown as Row[]).map((r) => {
      const start = strOr(r["start_time"], "");
      const end = strOr(r["end_time"], "");
      const booked = poolBooked(pools, start, end);
      const available = poolAvailable(fleet, booked);
      const status = String(r["status"] ?? "available");
      return {
        id: num(r["id"]),
        start_time: start,
        end_time: end,
        time_display: `${to12h(start)} - ${to12h(end)}`,
        duration: strOr(r["duration"], ""),
        capacity: fleet,
        booked,
        available,
        boat_name: str(r["boat_name"]),
        status: available <= 0 && status === "available" ? "full" : status,
      };
    });
    const res: ApiResponse<AvailabilityResponseData> = {
      success: true,
      data: {
        experience_id: expId,
        experience_title: exp ? strOr(exp["title"], "") : "",
        date: data.date,
        slots,
      },
    };
    return res;
  });

function validationError(message: string): Error {
  const err = new Error(message) as Error & { status?: number };
  err.status = 422;
  return err;
}

export const createBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d: BookingPayload) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const settingsRows = await sql`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`;
    const settings = settingsRows[0] as unknown as Row | undefined;
    const minGuests = settings ? num(settings["min_guests"], 1) : 1;
    const maxGuests = settings ? num(settings["max_guests"], 10) : 10;
    if (settings && settings["booking_enabled"] === false) {
      throw validationError("Online bookings are currently paused. Please contact us directly.");
    }
    if (!data.full_name?.trim()) throw validationError("Full name is required.");
    if (!data.country?.trim()) throw validationError("Please select your country.");
    if (!data.phone?.trim()) throw validationError("Phone / WhatsApp number is required.");
    if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      throw validationError("Please enter a valid email address.");
    }
    const guests = Number(data.number_of_guests);
    if (!Number.isFinite(guests) || guests < minGuests) {
      throw validationError(`At least ${minGuests} guest${minGuests > 1 ? "s are" : " is"} required.`);
    }
    if (guests > maxGuests) {
      throw validationError(`Maximum allowed guests per booking is ${maxGuests}.`);
    }
    const expId = Number(data.experience_id);
    const expRows = await sql`SELECT id, title, slug, duration, price FROM experiences WHERE id = ${expId} LIMIT 1`;
    const exp = expRows[0] as unknown as Row | undefined;
    if (!exp) throw validationError("The selected experience is no longer available.");

    let slotId: number | null = null;
    if (data.time_slot_id !== null && data.time_slot_id !== undefined) {
      const slotRows = await sql`
        SELECT ts.id, ts.date, ts.start_time, ts.end_time, ts.status
        FROM time_slots ts WHERE ts.id = ${Number(data.time_slot_id)} LIMIT 1
      `;
      const slot = slotRows[0] as unknown as Row | undefined;
      if (!slot) throw validationError("The selected time slot is no longer available.");
      if (String(slot["status"]) !== "available") {
        throw validationError("The selected time slot is no longer available. Please choose another time.");
      }
      // Pool check: the whole window shares one fleet-wide seat pool.
      const fleet = await fleetCapacity(sql);
      if (fleet <= 0) throw validationError("No boats are currently in service. Please contact us directly.");
      const pools = await windowPools(sql, toDateOnly(slot["date"]));
      const free = poolAvailable(
        fleet,
        poolBooked(pools, strOr(slot["start_time"], ""), strOr(slot["end_time"], ""))
      );
      if (free < guests) {
        throw validationError(
          free <= 0
            ? "This departure is fully booked. Please choose another time."
            : `Only ${free} seat(s) left in this departure for ${guests} guest(s).`
        );
      }
      slotId = num(slot["id"]);
    }

    const bookingDate = data.booking_date || new Date().toISOString().split("T")[0]!;
    let ref = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `SL-${Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("")}`;
      const existing = await sql`SELECT id FROM bookings WHERE booking_ref = ${candidate} LIMIT 1`;
      if (existing.length === 0) {
        ref = candidate;
        break;
      }
    }
    if (!ref) throw new Error("Could not generate a booking reference. Please try again.");

    const inserted = await sql`
      INSERT INTO bookings (experience_id, time_slot_id, booking_ref, full_name, gender, country, phone, email,
        number_of_guests, booking_date, preferred_time, special_request, status, source)
      VALUES (${expId}, ${slotId}, ${ref}, ${data.full_name.trim()}, ${data.gender ?? "prefer_not_to_say"},
        ${data.country.trim()}, ${data.phone.trim()}, ${data.email?.trim() || null}, ${guests},
        ${bookingDate}::date, ${data.preferred_time || null}, ${data.special_request || null}, 'pending', 'website')
      RETURNING id, booking_ref, experience_id, time_slot_id, full_name, gender, country, phone, email,
        number_of_guests, booking_date, preferred_time, special_request, status, source, created_at
    `;
    const b = inserted[0] as unknown as Row;

    let slotDetail: BookingResponseData["time_slot"] = null;
    if (slotId !== null) {
      const slotRows = await sql`
        SELECT ts.id, ts.date, ts.start_time, ts.end_time, ts.duration, ts.capacity, ts.status,
               b.id AS boat_id, b.name AS boat_name, b.registration_number, b.status AS boat_status,
               COALESCE((SELECT SUM(number_of_guests) FROM bookings
                          WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
        FROM time_slots ts LEFT JOIN boats b ON b.id = ts.boat_id WHERE ts.id = ${slotId} LIMIT 1
      `;
      const s = slotRows[0] as unknown as Row | undefined;
      if (s) {
        const cap = num(s["capacity"], 0);
        const booked = num(s["booked"], 0);
        slotDetail = {
          id: num(s["id"]),
          date: toDateOnly(s["date"]),
          start_time: strOr(s["start_time"], ""),
          end_time: strOr(s["end_time"], ""),
          formatted_time: `${to12h(strOr(s["start_time"], ""))} - ${to12h(strOr(s["end_time"], ""))}`,
          duration: strOr(s["duration"], ""),
          capacity: cap,
          booked_guests: booked,
          available_seats: Math.max(0, cap - booked),
          status: strOr(s["status"], "available"),
          boat: s["boat_id"] === null || s["boat_id"] === undefined ? null : {
            id: num(s["boat_id"]),
            name: strOr(s["boat_name"], ""),
            registration_number: strOr(s["registration_number"], ""),
            capacity: cap,
            status: strOr(s["boat_status"], ""),
            image_url: null,
          },
        };
      }
    }

    const payload: BookingResponseData = {
      id: num(b["id"]),
      booking_reference: strOr(b["booking_ref"], ref),
      experience_id: expId,
      experience: {
        id: expId,
        title: strOr(exp["title"], ""),
        slug: strOr(exp["slug"], ""),
        duration: str(exp["duration"]),
        price: exp["price"] === null || exp["price"] === undefined ? undefined : num(exp["price"]),
      },
      time_slot_id: slotId,
      time_slot: slotDetail,
      full_name: strOr(b["full_name"], ""),
      gender: strOr(b["gender"], "prefer_not_to_say"),
      country: strOr(b["country"], ""),
      phone: strOr(b["phone"], ""),
      email: str(b["email"]),
      number_of_guests: num(b["number_of_guests"], guests),
      booking_date: toDateOnly(b["booking_date"]),
      preferred_time: strOr(b["preferred_time"], ""),
      special_request: str(b["special_request"]),
      status: "pending",
      booking_status: "pending",
      booking_source: "website",
      created_at: toIso(b["created_at"]) ?? undefined,
    };
    const res: BookingApiResponse = { success: true, data: payload, booking_reference: payload.booking_reference, booking_status: "pending" };

    try {
      const { sendEmail, bookingAdminAlertHtml, getAdminEmail } = await import("./email");
      await sendEmail({
        to: getAdminEmail(),
        replyTo: data.email?.trim() || undefined,
        subject: `New booking ${payload.booking_reference} — ${payload.full_name}`,
        html: bookingAdminAlertHtml({
          booking_reference: payload.booking_reference,
          experience: payload.experience?.title || "",
          booking_date: payload.booking_date,
          preferred_time: payload.preferred_time,
          duration: payload.time_slot?.duration ?? null,
          number_of_guests: payload.number_of_guests,
          full_name: payload.full_name,
          country: payload.country,
          phone: payload.phone,
          email: payload.email,
          special_request: payload.special_request,
        }),
      });
    } catch (err) {
      console.error("Booking admin email failed:", err);
    }

    return res;
  });

export const sendContactFn = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; phone?: string | null; subject?: string | null; message: string }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    if (!data.name?.trim()) throw validationError("Please provide your name.");
    if (!data.email?.trim() || !data.email.includes("@")) throw validationError("Please provide a valid email address.");
    if (!data.message?.trim()) throw validationError("Please enter your message or inquiry.");
    const sql = db();
    await sql`
      INSERT INTO contact_messages (name, email, phone, subject, message, status)
      VALUES (${data.name.trim()}, ${data.email.trim()}, ${data.phone?.trim() || null},
        ${data.subject?.trim() || null}, ${data.message.trim()}, 'unread')
    `;

    try {
      const { sendEmail, contactAdminAlertHtml, getAdminEmail } = await import("./email");
      await sendEmail({
        to: getAdminEmail(),
        replyTo: data.email.trim(),
        subject: `New message from ${data.name.trim()}${data.subject?.trim() ? ` — ${data.subject.trim()}` : ""}`,
        html: contactAdminAlertHtml({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone?.trim() || null,
          subject: data.subject?.trim() || null,
          message: data.message.trim(),
        }),
      });
    } catch (err) {
      console.error("Contact admin email failed:", err);
    }

    return { success: true as boolean };
  });

export const submitCustomerReviewFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    booking_reference: string;
    name: string;
    rating: number;
    review: string;
    image?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const ref = data.booking_reference.trim().toUpperCase();
    if (!ref) throw validationError("Please enter your booking reference.");
    const name = data.name?.trim() || "";
    if (!name) throw validationError("Please enter your name.");

    const rows = await sql`
      SELECT id, booking_ref, full_name, country, phone, email, status
      FROM bookings WHERE booking_ref = ${ref} LIMIT 1
    `;
    const booking = rows[0] as unknown as Row | undefined;
    if (!booking) {
      throw validationError("We couldn't find that booking reference. Please check it and try again.");
    }
    if (!["confirmed", "completed"].includes(String(booking["status"] ?? ""))) {
      throw validationError("Reviews open up once your safari is confirmed. Please try again then.");
    }

    const existing = await sql`SELECT id FROM reviews WHERE booking_id = ${num(booking["id"])} LIMIT 1`;
    if (existing.length > 0) {
      throw validationError("You've already shared a review for this booking. Thank you!");
    }

    const rating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5)));
    const text = data.review.trim();
    if (!text) throw validationError("Please write a few words about your experience.");
    if (text.length > 2000) throw validationError("Please keep your review under 2000 characters.");

    await sql`
      INSERT INTO reviews (booking_id, customer_name, country, rating, review, image, status)
      VALUES (${num(booking["id"])}, ${name}, ${str(booking["country"])}, ${rating}, ${text}, ${data.image || null}, 'pending')
    `;
    return { success: true, message: "Thank you! Your review will appear on the site once approved." };
  });

export const getExperienceFn = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string | number }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const rows = await sql`
      SELECT id, title, slug, description, duration, price, max_guests, image, status, sort_order
      FROM experiences WHERE id = ${Number(data.id)} LIMIT 1
    `;
    const r = rows[0] as unknown as Row | undefined;
    if (!r || String(r["status"]) !== "active") {
      const res: ApiResponse<ExperienceData> = { success: false, data: null as unknown as ExperienceData, message: "Experience not found." };
      return res;
    }
    const res: ApiResponse<ExperienceData> = {
      success: true,
      data: {
        id: num(r["id"]), title: strOr(r["title"], ""), slug: strOr(r["slug"], ""),
        short_description: str(r["description"]), description: str(r["description"]),
        duration: str(r["duration"]),
        price: r["price"] === null || r["price"] === undefined ? undefined : num(r["price"]),
        max_guests: r["max_guests"] === null || r["max_guests"] === undefined ? null : num(r["max_guests"]),
        image: str(r["image"]), status: strOr(r["status"], "active"), sort_order: num(r["sort_order"]),
      },
    };
    return res;
  });

export const getReviewFn = createServerFn({ method: "GET" })
  .inputValidator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const rows = await sql`
      SELECT id, customer_name, country, rating, review, image, created_at
      FROM reviews WHERE id = ${Number(data.id)} AND status = 'approved' LIMIT 1
    `;
    const r = rows[0] as unknown as Row | undefined;
    if (!r) {
      const res: ApiResponse<ReviewData> = { success: false, data: null as unknown as ReviewData, message: "Review not found." };
      return res;
    }
    const res: ApiResponse<ReviewData> = {
      success: true,
      data: {
        id: num(r["id"]), customer_name: strOr(r["customer_name"], ""), country: str(r["country"]),
        rating: num(r["rating"], 5), review: strOr(r["review"], ""), image: str(r["image"]),
        created_at: toIso(r["created_at"]),
      },
    };
    return res;
  });

export const listPublicBoatsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT id, name, registration_number, capacity, description, image, status, created_at, updated_at
    FROM boats WHERE status = 'active' ORDER BY id ASC
  `;
  const data = (rows as unknown as Row[]).map((r) => ({
    id: num(r["id"]),
    name: strOr(r["name"], ""),
    registration_number: strOr(r["registration_number"], ""),
    capacity: num(r["capacity"], 10),
    image: str(r["image"]),
    image_url: str(r["image"]),
    status: strOr(r["status"], "active") as "available" | "in_use" | "maintenance" | "unavailable",
    description: str(r["description"]),
    created_at: toIso(r["created_at"]) ?? undefined,
    updated_at: toIso(r["updated_at"]) ?? undefined,
  }));
  return { success: true as boolean, data };
});

export const getBookingFn = createServerFn({ method: "GET" })
  .inputValidator((d: { idOrRef: string | number }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const key = String(data.idOrRef);
    const rows = await sql`
      SELECT b.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug, e.duration AS exp_duration, e.price AS exp_price,
        ts.id AS slot_id, ts.date AS slot_date, ts.start_time AS slot_start, ts.end_time AS slot_end,
        ts.duration AS slot_duration, ts.capacity AS slot_capacity, ts.status AS slot_status,
        COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS slot_booked
      FROM bookings b
      LEFT JOIN experiences e ON e.id = b.experience_id
      LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
      WHERE b.booking_ref = ${key} OR b.id::text = ${key}
      LIMIT 1
    `;
    const b = rows[0] as unknown as Row | undefined;
    if (!b) {
      const res: ApiResponse<BookingResponseData> = { success: false, data: null as unknown as BookingResponseData, message: "Booking not found." };
      return res;
    }
    const res: ApiResponse<BookingResponseData> = {
      success: true,
      data: {
        id: num(b["id"]), booking_reference: strOr(b["booking_ref"], ""),
        experience_id: num(b["experience_id"]),
        experience: b["exp_id"] === null || b["exp_id"] === undefined ? null : {
          id: num(b["exp_id"]), title: strOr(b["exp_title"], ""), slug: strOr(b["exp_slug"], ""),
          duration: str(b["exp_duration"]),
          price: b["exp_price"] === null || b["exp_price"] === undefined ? undefined : num(b["exp_price"]),
        },
        time_slot_id: b["time_slot_id"] === null || b["time_slot_id"] === undefined ? null : num(b["time_slot_id"]),
        time_slot: b["slot_id"] === null || b["slot_id"] === undefined ? null : {
          id: num(b["slot_id"]), date: toDateOnly(b["slot_date"]),
          start_time: strOr(b["slot_start"], ""), end_time: strOr(b["slot_end"], ""),
          formatted_time: `${to12h(strOr(b["slot_start"], ""))} - ${to12h(strOr(b["slot_end"], ""))}`,
          duration: strOr(b["slot_duration"], ""), capacity: num(b["slot_capacity"]),
          booked_guests: num(b["slot_booked"]),
          available_seats: Math.max(0, num(b["slot_capacity"]) - num(b["slot_booked"])),
          status: strOr(b["slot_status"], "available"), boat: null,
        },
        full_name: strOr(b["full_name"], ""), gender: strOr(b["gender"], "prefer_not_to_say"),
        country: strOr(b["country"], ""), phone: strOr(b["phone"], ""), email: str(b["email"]),
        number_of_guests: num(b["number_of_guests"], 1), booking_date: toDateOnly(b["booking_date"]),
        preferred_time: strOr(b["preferred_time"], ""), special_request: str(b["special_request"]),
        status: strOr(b["status"], "pending"),
        booking_status: strOr(b["status"], "pending"), booking_source: strOr(b["source"], "website"),
        created_at: toIso(b["created_at"]) ?? undefined,
      },
    };
    return res;
  });
