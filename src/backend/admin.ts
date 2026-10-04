import { createServerFn } from "@tanstack/react-start";
import { db, ensureSchema, toDateOnly, toIso } from "./db";
import { fleetCapacity, poolAvailable, poolBooked, windowPools } from "./fleet";
import { requireAdmin } from "./auth";
import { DEFAULT_SETTINGS } from "./seed";
import type { Booking, BookingMetrics, DepartureManifestData } from "../services/adminBookingApi";
import type { ContactMessageItem, ContactMessageStats } from "../services/adminMessages";
import type { SiteSettingsPayload } from "../services/adminSettings";
import type { Boat } from "../services/boatApi";
import type { ReviewItem, ReviewStats } from "../services/reviewApi";
import type { AvailableBoatItem, AvailableBoatsResponse, Schedule, TimeSlot } from "../services/scheduleApi";

type Row = Record<string, unknown>;
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const strOr = (v: unknown, fallback: string): string => (v === null || v === undefined ? fallback : String(v));

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "experience";
}

function to12h(t: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim());
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2] ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${min} ${ampm}`;
}

function fmtTimeRange(start: string, end: string): string {
  return `${to12h(start)} - ${to12h(end)}`;
}

const authed = async (token: string) => {
  await ensureSchema();
  return await requireAdmin(token);
};

/* ---------------- bookings ---------------- */

function mapBooking(r: Row): Booking {
  const status = strOr(r["status"], "pending") as Booking["status"];
  return {
    id: num(r["id"]),
    booking_reference: strOr(r["booking_ref"], ""),
    experience_id: num(r["experience_id"]),
    experience: r["exp_id"] === null || r["exp_id"] === undefined ? null : {
      id: num(r["exp_id"]),
      title: strOr(r["exp_title"], ""),
      slug: strOr(r["exp_slug"], ""),
      duration: str(r["exp_duration"]),
      price: r["exp_price"] === null || r["exp_price"] === undefined ? undefined : num(r["exp_price"]),
    },
    time_slot_id: r["time_slot_id"] === null || r["time_slot_id"] === undefined ? null : num(r["time_slot_id"]),
    time_slot: r["slot_id"] === null || r["slot_id"] === undefined ? null : {
      id: num(r["slot_id"]),
      date: toDateOnly(r["slot_date"]),
      start_time: strOr(r["slot_start"], ""),
      end_time: strOr(r["slot_end"], ""),
      formatted_time: fmtTimeRange(strOr(r["slot_start"], ""), strOr(r["slot_end"], "")),
      duration: strOr(r["slot_duration"], ""),
      capacity: num(r["slot_capacity"]),
      booked_guests: num(r["slot_booked"]),
      available_seats: Math.max(0, num(r["slot_capacity"]) - num(r["slot_booked"])),
      status: strOr(r["slot_status"], "available"),
      boat: r["boat_id"] === null || r["boat_id"] === undefined ? null : {
        id: num(r["boat_id"]),
        name: strOr(r["boat_name"], ""),
        registration_number: strOr(r["boat_reg"], ""),
        capacity: num(r["boat_capacity"]),
        status: strOr(r["boat_status"], ""),
        image_url: str(r["boat_image"]),
      },
    },
    full_name: strOr(r["full_name"], ""),
    gender: strOr(r["gender"], "prefer_not_to_say"),
    country: strOr(r["country"], ""),
    phone: strOr(r["phone"], ""),
    email: str(r["email"]),
    number_of_guests: num(r["number_of_guests"], 1),
    booking_date: toDateOnly(r["booking_date"]),
    preferred_time: strOr(r["preferred_time"], ""),
    special_request: str(r["special_request"]),
    status,
    booking_status: status,
    booking_source: strOr(r["source"], "website") as Booking["booking_source"],
    internal_notes: str(r["internal_notes"]),
    cancellation_reason: str(r["cancellation_reason"]),
    confirmed_at: toIso(r["confirmed_at"]),
    completed_at: toIso(r["completed_at"]),
    cancelled_at: toIso(r["cancelled_at"]),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

const BOOKING_SELECT = `
  SELECT b.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug, e.duration AS exp_duration, e.price AS exp_price,
    ts.id AS slot_id, ts.date AS slot_date, ts.start_time AS slot_start, ts.end_time AS slot_end,
    ts.duration AS slot_duration, ts.capacity AS slot_capacity, ts.status AS slot_status,
    COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS slot_booked,
    bo.id AS boat_id, bo.name AS boat_name, bo.registration_number AS boat_reg, bo.capacity AS boat_capacity,
    bo.status AS boat_status, bo.image AS boat_image
  FROM bookings b
  LEFT JOIN experiences e ON e.id = b.experience_id
  LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
  LEFT JOIN boats bo ON bo.id = ts.boat_id
`;

export const adminBookingsFn = createServerFn({ method: "GET" })
  .inputValidator((d: {
    token: string; status?: string | undefined; experience_id?: string | number | undefined; source?: string | undefined;
    date?: string | undefined; search?: string | undefined; page?: number | undefined; per_page?: number | undefined; sort_by?: string | undefined; sort_order?: string | undefined;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const perPage = Math.min(Math.max(num(data.per_page, 15), 1), 100);
    const page = Math.max(num(data.page, 1), 1);
    const offset = (page - 1) * perPage;
    const status = data.status && data.status !== "all" ? data.status : null;
    const expId = data.experience_id && data.experience_id !== "all" ? Number(data.experience_id) : null;
    const source = data.source && data.source !== "all" ? data.source : null;
    const date = data.date || null;
    const search = data.search?.trim() ? `%${data.search.trim()}%` : null;
    const sortCol = ["created_at", "booking_date", "full_name"].includes(data.sort_by ?? "") ? data.sort_by! : "created_at";
    const sortDir = data.sort_order === "asc" ? "ASC" : "DESC";
    const orderCol = sortCol === "booking_date" ? "b.booking_date" : sortCol === "full_name" ? "b.full_name" : "b.created_at";

    const rows = await sql`
      SELECT b.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug, e.duration AS exp_duration, e.price AS exp_price,
        ts.id AS slot_id, ts.date AS slot_date, ts.start_time AS slot_start, ts.end_time AS slot_end,
        ts.duration AS slot_duration, ts.capacity AS slot_capacity, ts.status AS slot_status,
        COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS slot_booked,
        bo.id AS boat_id, bo.name AS boat_name, bo.registration_number AS boat_reg, bo.capacity AS boat_capacity,
        bo.status AS boat_status, bo.image AS boat_image
      FROM bookings b
      LEFT JOIN experiences e ON e.id = b.experience_id
      LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
      LEFT JOIN boats bo ON bo.id = ts.boat_id
      WHERE (${status}::text IS NULL OR b.status = ${status})
        AND (${expId}::int IS NULL OR b.experience_id = ${expId})
        AND (${source}::text IS NULL OR b.source = ${source})
        AND (${date}::date IS NULL OR b.booking_date = ${date}::date)
        AND (${search}::text IS NULL OR b.full_name ILIKE ${search} OR b.booking_ref ILIKE ${search} OR b.phone ILIKE ${search})
      ORDER BY ${sql.unsafe(orderCol)} ${sql.unsafe(sortDir)}
      LIMIT ${perPage} OFFSET ${offset}
    `;
    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM bookings b
      WHERE (${status}::text IS NULL OR b.status = ${status})
        AND (${expId}::int IS NULL OR b.experience_id = ${expId})
        AND (${source}::text IS NULL OR b.source = ${source})
        AND (${date}::date IS NULL OR b.booking_date = ${date}::date)
        AND (${search}::text IS NULL OR b.full_name ILIKE ${search} OR b.booking_ref ILIKE ${search} OR b.phone ILIKE ${search})
    `;
    const metricRows = await sql`
      SELECT status, COUNT(*)::int AS c FROM bookings GROUP BY status
    `;
    const metrics: BookingMetrics = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    for (const m of metricRows as unknown as Row[]) {
      const s = String(m["status"]);
      const c = num(m["c"]);
      metrics.total += c;
      if (s === "pending") metrics.pending = c;
      else if (s === "confirmed") metrics.confirmed = c;
      else if (s === "completed") metrics.completed = c;
      else if (s === "cancelled") metrics.cancelled = c;
      else if (s === "no_show") metrics.no_show = c;
    }
    const total = num((countRows[0] as unknown as Row)["total"]);
    return {
      success: true,
      metrics,
      data: (rows as unknown as Row[]).map(mapBooking),
      pagination: { current_page: page, last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total },
    };
  });

async function getBookingById(id: number): Promise<Booking> {
  const sql = db();
  const rows = await sql`
    SELECT b.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug, e.duration AS exp_duration, e.price AS exp_price,
      ts.id AS slot_id, ts.date AS slot_date, ts.start_time AS slot_start, ts.end_time AS slot_end,
      ts.duration AS slot_duration, ts.capacity AS slot_capacity, ts.status AS slot_status,
      COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS slot_booked,
      bo.id AS boat_id, bo.name AS boat_name, bo.registration_number AS boat_reg, bo.capacity AS boat_capacity,
      bo.status AS boat_status, bo.image AS boat_image
    FROM bookings b
    LEFT JOIN experiences e ON e.id = b.experience_id
    LEFT JOIN time_slots ts ON ts.id = b.time_slot_id
    LEFT JOIN boats bo ON bo.id = ts.boat_id
    WHERE b.id = ${id} LIMIT 1
  `;
  const row = rows[0] as unknown as Row | undefined;
  if (!row) throw new Error("Booking not found.");
  return mapBooking(row);
}

export const adminBookingGetFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    return { success: true, data: await getBookingById(Number(data.id)) };
  });

export const adminBookingCreateFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; experience_id: number | null; time_slot_id?: number | null; full_name: string; gender?: string;
    country: string; phone: string; email?: string | null; number_of_guests: number;
    booking_source?: string; special_request?: string | null; internal_notes?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const guests = Number(data.number_of_guests);
    if (!data.full_name?.trim() || !data.country?.trim() || !data.phone?.trim()) {
      throw new Error("Name, country and phone are required.");
    }
    if (!Number.isFinite(guests) || guests < 1) throw new Error("Guest count must be at least 1.");
    const expId = data.experience_id === null || data.experience_id === undefined ? null : Number(data.experience_id);
    if (expId !== null) {
      const expRows = await sql`SELECT id FROM experiences WHERE id = ${expId} LIMIT 1`;
      if (expRows.length === 0) throw new Error("Experience not found.");
    }
    let slotId: number | null = data.time_slot_id ?? null;
    let bookingDate = new Date().toISOString().split("T")[0]!;
    if (slotId !== null) {
      const slotRows = await sql`
        SELECT id, date, start_time, end_time FROM time_slots WHERE id = ${slotId} LIMIT 1
      `;
      const slot = slotRows[0] as unknown as Row | undefined;
      if (!slot) throw new Error("Time slot not found.");
      // Pool check: the whole window shares one fleet-wide seat pool.
      const fleet = await fleetCapacity(sql);
      if (fleet <= 0) throw new Error("No boats are currently in service. Mark at least one boat Active first.");
      const pools = await windowPools(sql, toDateOnly(slot["date"]));
      const free = poolAvailable(
        fleet,
        poolBooked(pools, strOr(slot["start_time"], ""), strOr(slot["end_time"], ""))
      );
      if (free < guests) {
        throw new Error(
          free <= 0
            ? "This departure is fully booked."
            : `Only ${free} seat(s) left in this departure for ${guests} guest(s).`
        );
      }
      bookingDate = toDateOnly(slot["date"]);
    }
    let ref = "";
    for (let i = 0; i < 10; i++) {
      const c = `SL-${Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("")}`;
      const ex = await sql`SELECT id FROM bookings WHERE booking_ref = ${c} LIMIT 1`;
      if (ex.length === 0) { ref = c; break; }
    }
    if (!ref) throw new Error("Could not generate a booking reference.");
    const inserted = await sql`
      INSERT INTO bookings (experience_id, time_slot_id, booking_ref, full_name, gender, country, phone, email,
        number_of_guests, booking_date, preferred_time, special_request, internal_notes, status, source)
      VALUES (${expId}, ${slotId}, ${ref}, ${data.full_name.trim()}, ${data.gender || "prefer_not_to_say"},
        ${data.country.trim()}, ${data.phone.trim()}, ${data.email?.trim() || null}, ${guests},
        ${bookingDate}::date, ${null}, ${data.special_request || null}, ${data.internal_notes || null}, 'pending', ${data.booking_source || "website"})
      RETURNING id
    `;
    const booking = await getBookingById(num((inserted[0] as unknown as Row)["id"]));
    return { success: true, message: "Booking created.", data: booking };
  });

export const adminBookingUpdateFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const p = data.patch;
    await sql`
      UPDATE bookings SET
        full_name = COALESCE(${p["full_name"] as string ?? null}::text, full_name),
        gender = COALESCE(${p["gender"] as string ?? null}::text, gender),
        country = COALESCE(${p["country"] as string ?? null}::text, country),
        phone = COALESCE(${p["phone"] as string ?? null}::text, phone),
        email = COALESCE(${p["email"] as string ?? null}::text, email),
        number_of_guests = COALESCE(${p["number_of_guests"] as number ?? null}::int, number_of_guests),
        special_request = COALESCE(${p["special_request"] as string ?? null}::text, special_request),
        internal_notes = COALESCE(${p["internal_notes"] as string ?? null}::text, internal_notes),
        updated_at = NOW()
      WHERE id = ${Number(data.id)}
    `;
    return { success: true, message: "Booking updated.", data: await getBookingById(Number(data.id)) };
  });

export const adminBookingTransitionFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string; action: string; time_slot_id?: number | undefined; reason?: string | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const id = Number(data.id);
    if (data.action === "confirm") {
      await sql`UPDATE bookings SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    } else if (data.action === "cancel") {
      await sql`UPDATE bookings SET status = 'cancelled', cancellation_reason = ${data.reason || null}, cancelled_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    } else if (data.action === "complete") {
      await sql`UPDATE bookings SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    } else if (data.action === "no-show") {
      await sql`UPDATE bookings SET status = 'no_show', updated_at = NOW() WHERE id = ${id}`;
    } else if (data.action === "reschedule") {
      if (!data.time_slot_id) throw new Error("A new time slot is required to reschedule.");
      const slotRows = await sql`SELECT id, date FROM time_slots WHERE id = ${Number(data.time_slot_id)} LIMIT 1`;
      if (slotRows.length === 0) throw new Error("Time slot not found.");
      const slot = slotRows[0] as unknown as Row;
      await sql`
        UPDATE bookings SET time_slot_id = ${Number(data.time_slot_id)}, booking_date = ${(toDateOnly(slot["date"]) || "")}::date,
          internal_notes = COALESCE(internal_notes, '') || ${data.reason ? `\nRescheduled: ${data.reason}` : ""},
          updated_at = NOW() WHERE id = ${id}
      `;
    } else {
      throw new Error("Unknown booking action.");
    }
    const messages: Record<string, string> = {
      confirm: "Booking confirmed.", cancel: "Booking cancelled.", complete: "Booking marked as completed.",
      "no-show": "Booking marked as no-show.", reschedule: "Booking rescheduled.",
    };
    const updated = await getBookingById(id);
    let emailSent = false;
    if ((data.action === "confirm" || data.action === "cancel") && updated.email) {
      try {
        const { sendEmail, bookingGuestConfirmedHtml, bookingGuestCancelledHtml, getAdminEmail } = await import("./email");
        await sendEmail({
          to: updated.email,
          replyTo: getAdminEmail(),
          subject: data.action === "confirm"
            ? `Your safari is confirmed — ${updated.booking_reference}`
            : `Booking ${updated.booking_reference} cancelled`,
          html: data.action === "confirm"
            ? bookingGuestConfirmedHtml({
                booking_reference: updated.booking_reference,
                experience: updated.experience?.title || "Bentota River Boat Safari",
                booking_date: updated.booking_date,
                preferred_time: updated.preferred_time,
                duration: updated.time_slot?.duration ?? null,
                number_of_guests: updated.number_of_guests,
                full_name: updated.full_name,
                country: updated.country,
                phone: updated.phone,
                email: updated.email,
                special_request: updated.special_request,
              })
            : bookingGuestCancelledHtml(
                {
                  booking_reference: updated.booking_reference,
                  experience: updated.experience?.title || "Bentota River Boat Safari",
                  booking_date: updated.booking_date,
                  preferred_time: updated.preferred_time,
                  duration: updated.time_slot?.duration ?? null,
                  number_of_guests: updated.number_of_guests,
                  full_name: updated.full_name,
                  country: updated.country,
                  phone: updated.phone,
                  email: updated.email,
                  special_request: updated.special_request,
                },
                data.reason,
              ),
        });
        emailSent = true;
      } catch (err) {
        console.error("Guest notification email failed:", err);
      }
    }
    return { success: true, message: messages[data.action] ?? "Booking updated.", data: updated, email_sent: emailSent };
  });

export const adminBookingDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`DELETE FROM bookings WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Booking deleted." };
  });

export const adminManifestFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; slotId: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const slotId = Number(data.slotId);
    const slotRows = await sql`
      SELECT ts.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug, e.duration AS exp_duration,
        b.id AS boat_id, b.name AS boat_name, b.registration_number, b.capacity AS boat_capacity, b.status AS boat_status,
        COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
      FROM time_slots ts
      LEFT JOIN experiences e ON e.id = ts.experience_id
      LEFT JOIN boats b ON b.id = ts.boat_id
      WHERE ts.id = ${slotId} LIMIT 1
    `;
    const s = slotRows[0] as unknown as Row | undefined;
    if (!s) throw new Error("Time slot not found.");
    const cap = num(s["capacity"]);
    const booked = num(s["booked"]);
    const pax = await sql`
      SELECT id, booking_ref, full_name, gender, country, phone, email, number_of_guests, status,
        source, special_request, internal_notes, confirmed_at, created_at
      FROM bookings WHERE time_slot_id = ${slotId} AND status NOT IN ('cancelled') ORDER BY created_at ASC
    `;
    const passengers = (pax as unknown as Row[]).map((r, i) => ({
      manifest_id: i + 1,
      id: num(r["id"]),
      booking_reference: strOr(r["booking_ref"], ""),
      full_name: strOr(r["full_name"], ""),
      gender: strOr(r["gender"], ""),
      country: strOr(r["country"], ""),
      phone: strOr(r["phone"], ""),
      email: str(r["email"]),
      number_of_guests: num(r["number_of_guests"], 1),
      status: strOr(r["status"], "pending") as DepartureManifestData["passengers"][number]["status"],
      booking_source: strOr(r["source"], "website") as DepartureManifestData["passengers"][number]["booking_source"],
      special_request: str(r["special_request"]),
      internal_notes: str(r["internal_notes"]),
      confirmed_at: toIso(r["confirmed_at"]),
      created_at: toIso(r["created_at"]) ?? "",
    }));
    const confirmed = passengers.filter((p) => p.status === "confirmed").reduce((a, p) => a + p.number_of_guests, 0);
    const pending = passengers.filter((p) => p.status === "pending").reduce((a, p) => a + p.number_of_guests, 0);
    const others = await sql`
      SELECT COUNT(*)::int AS c FROM bookings
      WHERE booking_date = ${(toDateOnly(s["date"]) || "")}::date AND (time_slot_id IS NULL OR time_slot_id <> ${slotId})
        AND status NOT IN ('cancelled')
    `;
    const res: { success: boolean; data: DepartureManifestData } = {
      success: true,
      data: {
        departure: {
          id: slotId,
          date: toDateOnly(s["date"]),
          start_time: strOr(s["start_time"], ""),
          end_time: strOr(s["end_time"], ""),
          formatted_time: fmtTimeRange(strOr(s["start_time"], ""), strOr(s["end_time"], "")),
          duration: strOr(s["duration"], ""),
          capacity: cap,
          booked_guests: booked,
          available_seats: Math.max(0, cap - booked),
          status: strOr(s["status"], "available"),
          experience: s["exp_id"] === null || s["exp_id"] === undefined ? null : {
            id: num(s["exp_id"]), title: strOr(s["exp_title"], ""),
            slug: strOr(s["exp_slug"], ""), duration: str(s["exp_duration"]),
          },
          boat: s["boat_id"] === null || s["boat_id"] === undefined ? null : {
            id: num(s["boat_id"]), name: strOr(s["boat_name"], ""),
            registration_number: strOr(s["registration_number"], ""), capacity: num(s["boat_capacity"]),
            status: strOr(s["boat_status"], ""), image_url: null,
          },
        },
        summary: {
          manifest_count: passengers.length,
          total_guests: booked,
          confirmed_guests: confirmed,
          pending_guests: pending,
          remaining_seats: Math.max(0, cap - booked),
        },
        passengers,
        other_bookings_count: num((others[0] as unknown as Row)["c"]),
      },
    };
    return res;
  });

/* ---------------- experiences ---------------- */

function mapExperience(r: Row) {
  return {
    id: num(r["id"]),
    title: strOr(r["title"], ""),
    slug: strOr(r["slug"], ""),
    description: str(r["description"]),
    duration: str(r["duration"]),
    price: r["price"] === null || r["price"] === undefined ? null : num(r["price"]),
    max_guests: r["max_guests"] === null || r["max_guests"] === undefined ? null : num(r["max_guests"]),
    image: str(r["image"]),
    status: strOr(r["status"], "active"),
    sort_order: num(r["sort_order"]),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

export const adminExperiencesFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const rows = await sql`SELECT * FROM experiences ORDER BY sort_order ASC, id ASC`;
    return { success: true, data: (rows as unknown as Row[]).map(mapExperience) };
  });

export const adminExperienceSaveFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; id?: number | null; title: string; description?: string | null; duration?: string | null;
    price?: number | null; max_guests?: number | null; image?: string | null; status?: string; sort_order?: number;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.title?.trim()) throw new Error("Title is required.");
    const sql = db();
    const slug = slugify(data.title);
    if (data.id) {
      const rows = await sql`
        UPDATE experiences SET title = ${data.title.trim()}, description = ${data.description || null},
          duration = ${data.duration || null}, price = ${data.price ?? null},
          max_guests = ${data.max_guests ?? null}, image = ${data.image || null},
          status = ${data.status || "active"}, sort_order = ${data.sort_order ?? 0}, updated_at = NOW()
        WHERE id = ${Number(data.id)} RETURNING *
      `;
      if (rows.length === 0) throw new Error("Experience not found.");
      return { success: true, message: "Experience updated.", data: mapExperience(rows[0] as unknown as Row) };
    }
    let finalSlug = slug;
    for (let i = 2; i < 100; i++) {
      const ex = await sql`SELECT id FROM experiences WHERE slug = ${finalSlug} LIMIT 1`;
      if (ex.length === 0) break;
      finalSlug = `${slug}-${i}`;
    }
    const rows = await sql`
      INSERT INTO experiences (title, slug, description, duration, price, max_guests, image, status, sort_order)
      VALUES (${data.title.trim()}, ${finalSlug}, ${data.description || null}, ${data.duration || null},
        ${data.price ?? null}, ${data.max_guests ?? null}, ${data.image || null}, ${data.status || "active"}, ${data.sort_order ?? 0})
      RETURNING *
    `;
    return { success: true, message: "Experience created.", data: mapExperience(rows[0] as unknown as Row) };
  });

export const adminExperienceDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`DELETE FROM experiences WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Experience deleted." };
  });

/* ---------------- reviews ---------------- */

function mapReview(r: Row): ReviewItem {
  return {
    id: num(r["id"]),
    customer_name: strOr(r["customer_name"], ""),
    country: str(r["country"]),
    rating: num(r["rating"], 5),
    review: strOr(r["review"], ""),
    image: str(r["image"]),
    image_url: str(r["image"]),
    status: (strOr(r["status"], "pending") as ReviewItem["status"]),
    created_at: toIso(r["created_at"]) ?? "",
    booking_reference: str(r["booking_ref"]),
    source: strOr(r["source"], "website"),
  };
}

export const adminReviewsFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; status?: string | undefined; rating?: number | string | undefined; search?: string | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const status = data.status && data.status !== "all" ? data.status : null;
    const rating = data.rating && data.rating !== "all" ? Number(data.rating) : null;
    const search = data.search?.trim() ? `%${data.search.trim()}%` : null;
    const rows = await sql`
      SELECT reviews.*, bookings.booking_ref AS booking_ref
      FROM reviews LEFT JOIN bookings ON bookings.id = reviews.booking_id
      WHERE (${status}::text IS NULL OR reviews.status = ${status})
        AND (${rating}::int IS NULL OR reviews.rating = ${rating})
        AND (${search}::text IS NULL OR reviews.customer_name ILIKE ${search} OR reviews.review ILIKE ${search})
      ORDER BY reviews.created_at DESC
    `;
    const statsRows = await sql`
      SELECT status, COUNT(*)::int AS c, COALESCE(AVG(rating), 0)::float AS avg FROM reviews GROUP BY status
    `;
    const stats: ReviewStats = { total: 0, pending: 0, approved: 0, hidden: 0, average_rating: 0 };
    let sum = 0;
    let rated = 0;
    for (const s of statsRows as unknown as Row[]) {
      const c = num(s["c"]);
      stats.total += c;
      const st = String(s["status"]);
      if (st === "pending") stats.pending = c;
      else if (st === "approved") stats.approved = c;
      else if (st === "hidden") stats.hidden = c;
      sum += num(s["avg"]) * c;
      rated += c;
    }
    stats.average_rating = rated > 0 ? Math.round((sum / rated) * 10) / 10 : 0;
    return { success: true, stats, data: (rows as unknown as Row[]).map(mapReview) };
  });

export const adminReviewStatusFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string; status: "pending" | "approved" | "hidden" }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const rows = await sql`UPDATE reviews SET status = ${data.status}, updated_at = NOW() WHERE id = ${Number(data.id)} RETURNING *`;
    if (rows.length === 0) throw new Error("Review not found.");
    return { success: true, message: "Review updated.", data: mapReview(rows[0] as unknown as Row) };
  });

export const adminReviewCreateFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; customer_name: string; country?: string | null; rating: number;
    review: string; status?: string; image?: string | null; source?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.customer_name?.trim()) throw new Error("Customer name is required.");
    if (!data.review?.trim()) throw new Error("Review text is required.");
    const sql = db();
    const source = data.source === "google" ? "google" : "website";
    const rows = await sql`
      INSERT INTO reviews (customer_name, country, rating, review, image, status, source)
      VALUES (${data.customer_name.trim()}, ${data.country?.trim() || null},
        ${Math.min(5, Math.max(1, Number(data.rating) || 5))}, ${data.review.trim()},
        ${data.image || null}, ${data.status || "approved"}, ${source})
      RETURNING *
    `;
    return { success: true, message: "Review recorded.", data: mapReview(rows[0] as unknown as Row) };
  });

export const adminReviewDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`DELETE FROM reviews WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Review deleted." };
  });

/**
 * Pull the latest Google reviews (Places API returns up to 5) into the
 * reviews table. Already-public Google reviews are stored as approved with
 * source 'google'; repeats are skipped via the (source, source_id) index.
 * Requires GOOGLE_PLACES_API_KEY in .env (Place ID auto-resolves, or set
 * GOOGLE_PLACE_ID explicitly).
 */
export const syncGoogleReviewsFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const { fetchGooglePlaceReviews, getGoogleApiKey, getConfiguredPlaceId, importGoogleReviews, resolvePlaceId } =
      await import("./google");
    const apiKey = getGoogleApiKey();
    if (!apiKey) {
      throw new Error("Google sync is not configured. Set GOOGLE_PLACES_API_KEY in your .env file.");
    }
    const placeId = await resolvePlaceId(apiKey, getConfiguredPlaceId());
    const incoming = await fetchGooglePlaceReviews(apiKey, placeId);
    const { imported, skipped } = await importGoogleReviews(incoming);
    return {
      success: true,
      imported,
      skipped,
      message:
        imported > 0
          ? `Synced ${imported} new review${imported === 1 ? "" : "s"} from Google.`
          : "Already up to date — no new Google reviews.",
    };
  });

/* ---------------- messages ---------------- */

function mapMessage(r: Row): ContactMessageItem {
  const phone = str(r["phone"]) ?? "";
  const clean = phone.replace(/\D/g, "");
  const created = toIso(r["created_at"]) ?? "";
  return {
    id: num(r["id"]),
    name: strOr(r["name"], ""),
    email: strOr(r["email"], ""),
    phone: str(r["phone"]),
    clean_phone: clean || null,
    subject: str(r["subject"]),
    message: strOr(r["message"], ""),
    status: strOr(r["status"], "unread") as ContactMessageItem["status"],
    created_at: created,
    created_at_formatted: created ? new Date(created).toLocaleString() : "",
    created_at_diff: created ? relTime(created) : "",
    updated_at: toIso(r["updated_at"]) ?? "",
    quick_actions: {
      email_url: `mailto:${strOr(r["email"], "")}`,
      tel_url: clean ? `tel:+${clean}` : null,
      whatsapp_url: clean ? `https://wa.me/${clean}` : null,
    },
  };
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const adminMessagesFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; status?: string | undefined; search?: string | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const status = data.status && data.status !== "all" ? data.status : null;
    const search = data.search?.trim() ? `%${data.search.trim()}%` : null;
    const rows = await sql`
      SELECT * FROM contact_messages
      WHERE (${status}::text IS NULL OR status = ${status})
        AND (${search}::text IS NULL OR name ILIKE ${search} OR email ILIKE ${search} OR message ILIKE ${search})
      ORDER BY created_at DESC
    `;
    const statsRows = await sql`SELECT status, COUNT(*)::int AS c FROM contact_messages GROUP BY status`;
    const stats: ContactMessageStats = { total: 0, unread: 0, read: 0, replied: 0, archived: 0 };
    for (const s of statsRows as unknown as Row[]) {
      const c = num(s["c"]);
      stats.total += c;
      const st = String(s["status"]);
      if (st === "unread") stats.unread = c;
      else if (st === "read") stats.read = c;
      else if (st === "replied") stats.replied = c;
      else if (st === "archived") stats.archived = c;
    }
    return { success: true, stats, data: (rows as unknown as Row[]).map(mapMessage) };
  });

export const adminMessageGetFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const rows = await sql`SELECT * FROM contact_messages WHERE id = ${Number(data.id)} LIMIT 1`;
    const row = rows[0] as unknown as Row | undefined;
    if (!row) throw new Error("Message not found.");
    if (String(row["status"]) === "unread") {
      await sql`UPDATE contact_messages SET status = 'read', updated_at = NOW() WHERE id = ${Number(data.id)}`;
      row["status"] = "read";
    }
    return { success: true, data: mapMessage(row) };
  });

export const adminMessageStatusFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string; status: string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const allowed = ["unread", "read", "replied", "archived"];
    const status = data.status === "new" ? "unread" : data.status;
    if (!allowed.includes(status)) throw new Error("Invalid status.");
    const sql = db();
    const rows = await sql`UPDATE contact_messages SET status = ${status}, updated_at = NOW() WHERE id = ${Number(data.id)} RETURNING *`;
    if (rows.length === 0) throw new Error("Message not found.");
    return { success: true, message: "Message updated.", data: mapMessage(rows[0] as unknown as Row) };
  });

export const adminMessageDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`DELETE FROM contact_messages WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Message deleted." };
  });

/* ---------------- settings ---------------- */

function mapSettingsRow(r: Row): SiteSettingsPayload {
  let durations: SiteSettingsPayload["safari_durations"];
  const raw = r["safari_durations"];
  if (Array.isArray(raw)) durations = raw as SiteSettingsPayload["safari_durations"];
  else if (typeof raw === "string") {
    try { durations = JSON.parse(raw) as SiteSettingsPayload["safari_durations"]; } catch { durations = undefined; }
  }
  return {
    business_name: str(r["business_name"]), tagline: str(r["tagline"]), phone: str(r["phone"]),
    whatsapp: str(r["whatsapp"]), email: str(r["email"]), address: str(r["address"]),
    city: str(r["city"]), country: str(r["country"]), google_maps_url: str(r["google_maps_url"]),
    facebook_url: str(r["facebook_url"]), instagram_url: str(r["instagram_url"]), website_url: str(r["website_url"]),
    opening_hours: str(r["opening_hours"]), logo_url: str(r["logo_url"]),
    hero_title: str(r["hero_title"]), hero_subtitle: str(r["hero_subtitle"]),
    about_title: str(r["about_title"]), about_description: str(r["about_description"]),
    untamed_beauty_title: str(r["untamed_beauty_title"]),
    experience_section_title: str(r["experience_section_title"]),
    experience_1_title: str(r["experience_1_title"]), experience_2_title: str(r["experience_2_title"]),
    experience_3_title: str(r["experience_3_title"]),
    story_eyebrow: str(r["story_eyebrow"]), story_title: str(r["story_title"]),
    wildlife_eyebrow: str(r["wildlife_eyebrow"]), wildlife_title: str(r["wildlife_title"]),
    gallery_title: str(r["gallery_title"]), contact_title: str(r["contact_title"]),
    footer_text: str(r["footer_text"]),
    min_guests: num(r["min_guests"], 1), max_guests: num(r["max_guests"], 10),
    min_advance_hours: num(r["min_advance_hours"], 24),
    cancellation_notice_hours: num(r["cancellation_notice_hours"], 24),
    booking_enabled: r["booking_enabled"] !== false,
    sunrise_start_time: str(r["sunrise_start_time"]), sunrise_end_time: str(r["sunrise_end_time"]),
    sunset_start_time: str(r["sunset_start_time"]), sunset_end_time: str(r["sunset_end_time"]),
    safari_durations: durations,
    timezone: str(r["timezone"]), currency: str(r["currency"]), date_format: str(r["date_format"]),
    updated_at: toIso(r["updated_at"]) ?? null,
  };
}

const SETTING_COLUMNS = [
  "business_name", "tagline", "phone", "whatsapp", "email", "address", "city", "country",
  "google_maps_url", "latitude", "longitude", "facebook_url", "instagram_url", "website_url",
  "opening_hours", "logo_url", "hero_title", "hero_subtitle", "about_title", "about_description",
  "untamed_beauty_title", "experience_section_title", "experience_1_title", "experience_2_title",
  "experience_3_title", "story_eyebrow", "story_title", "wildlife_eyebrow", "wildlife_title",
  "gallery_title", "contact_title", "footer_text", "min_guests", "max_guests", "min_advance_hours",
  "cancellation_notice_hours", "booking_enabled", "sunrise_start_time", "sunrise_end_time",
  "sunset_start_time", "sunset_end_time", "safari_durations", "timezone", "currency", "date_format",
] as const;

const SECTION_COLUMNS: Record<string, string[]> = {
  business: ["business_name", "tagline", "phone", "whatsapp", "email", "address", "city", "country",
    "google_maps_url", "latitude", "longitude", "facebook_url", "instagram_url", "website_url",
    "opening_hours", "logo_url"],
  content: ["hero_title", "hero_subtitle", "about_title", "about_description", "untamed_beauty_title",
    "experience_section_title", "experience_1_title", "experience_2_title", "experience_3_title",
    "story_eyebrow", "story_title", "wildlife_eyebrow", "wildlife_title", "gallery_title",
    "contact_title", "footer_text"],
  booking: ["min_guests", "max_guests", "min_advance_hours", "cancellation_notice_hours", "booking_enabled"],
  safari: ["sunrise_start_time", "sunrise_end_time", "sunset_start_time", "sunset_end_time", "safari_durations"],
  system: ["timezone", "currency", "date_format"],
};

export const adminSettingsGetFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const rows = await sql`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`;
    const row = rows[0] as unknown as Row | undefined;
    return {
      success: true,
      data: row ? mapSettingsRow(row) : mapSettingsRow({}),
      defaults: mapSettingsRow({ ...DEFAULT_SETTINGS } as unknown as Row),
    };
  });

export const adminSettingsUpdateFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const patch = data.patch;
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const col of SETTING_COLUMNS) {
      if (patch[col] === undefined) continue;
      let v = patch[col];
      if (col === "safari_durations" && v !== null) v = JSON.stringify(v);
      values.push(v);
      sets.push(`${col} = $${values.length}`);
    }
    if (sets.length === 0) throw new Error("Nothing to update.");
    values.push(1);
    // neon http client doesn't support dynamic raw SQL with $ params via template... use sql.unsafe
    await sql.unsafe(
      `INSERT INTO site_settings (id) VALUES ($${values.length}) ON CONFLICT (id) DO UPDATE SET ${sets.join(", ")}, updated_at = NOW()`,
      values
    );
    const rows = await sql`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`;
    return { success: true, message: "Settings saved.", data: mapSettingsRow(rows[0] as unknown as Row) };
  });

export const adminSettingsResetFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; section?: string | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const section = data.section && data.section !== "all" ? data.section : null;
    const cols = section ? SECTION_COLUMNS[section] ?? [] : [...SETTING_COLUMNS];
    if (cols.length === 0) throw new Error("Unknown settings section.");
    const defaults = DEFAULT_SETTINGS as unknown as Record<string, unknown>;
    const values: unknown[] = [1];
    const sets = cols.map((col) => {
      let v = defaults[col] ?? null;
      if (col === "safari_durations" && v !== null) v = JSON.stringify(v);
      values.push(v);
      return `${col} = $${values.length}`;
    });
    const insertCols = ["id", ...cols];
    const insertVals = insertCols.map((_, i) => `$${i + 1}`);
    await sql.unsafe(
      `INSERT INTO site_settings (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")})
       ON CONFLICT (id) DO UPDATE SET ${sets.join(", ")}, updated_at = NOW()`,
      values
    );
    const rows = await sql`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`;
    return { success: true, message: "Settings restored to defaults.", data: mapSettingsRow(rows[0] as unknown as Row) };
  });

export const adminLogoFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; logo_url: string | null }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`
      INSERT INTO site_settings (id, logo_url) VALUES (1, ${data.logo_url})
      ON CONFLICT (id) DO UPDATE SET logo_url = ${data.logo_url}, updated_at = NOW()
    `;
    const rows = await sql`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`;
    return {
      success: true,
      message: data.logo_url ? "Logo updated." : "Logo reset to default.",
      logo_url: data.logo_url,
      data: mapSettingsRow(rows[0] as unknown as Row),
    };
  });

/* ---------------- boats ---------------- */

function mapBoat(r: Row): Boat {
  return {
    id: num(r["id"]),
    name: strOr(r["name"], ""),
    registration_number: strOr(r["registration_number"], ""),
    capacity: num(r["capacity"], 10),
    image: str(r["image"]),
    image_url: str(r["image"]),
    status: strOr(r["status"], "active") as Boat["status"],
    description: str(r["description"]),
    time_slots_count: r["slot_count"] === undefined ? undefined : num(r["slot_count"]),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

export const adminBoatsFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; status?: string | undefined; search?: string | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const status = data.status && data.status !== "all" ? data.status : null;
    const search = data.search?.trim() ? `%${data.search.trim()}%` : null;
    const rows = await sql`
      SELECT b.*, (SELECT COUNT(*)::int FROM time_slots WHERE boat_id = b.id) AS slot_count
      FROM boats b
      WHERE (${status}::text IS NULL OR b.status = ${status})
        AND (${search}::text IS NULL OR b.name ILIKE ${search} OR b.registration_number ILIKE ${search})
      ORDER BY b.id ASC
    `;
    return { success: true, data: (rows as unknown as Row[]).map(mapBoat) };
  });

export const adminBoatGetFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const rows = await sql`SELECT * FROM boats WHERE id = ${Number(data.id)} LIMIT 1`;
    const row = rows[0] as unknown as Row | undefined;
    if (!row) throw new Error("Boat not found.");
    return { success: true, data: mapBoat(row) };
  });

export const adminBoatSaveFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; id?: number | null; name: string; registration_number: string;
    capacity: number; description?: string | null; image?: string | null; status?: string;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.name?.trim()) throw new Error("Boat name is required.");
    if (!data.registration_number?.trim()) throw new Error("Registration number is required.");
    const sql = db();
    if (data.id) {
      const rows = await sql`
        UPDATE boats SET name = ${data.name.trim()}, registration_number = ${data.registration_number.trim()},
          capacity = ${Number(data.capacity) || 10}, description = ${data.description || null},
          image = ${data.image || null}, status = ${data.status || "active"}, updated_at = NOW()
        WHERE id = ${Number(data.id)} RETURNING *
      `;
      if (rows.length === 0) throw new Error("Boat not found.");
      return { success: true, message: "Boat updated.", data: mapBoat(rows[0] as unknown as Row) };
    }
    const rows = await sql`
      INSERT INTO boats (name, registration_number, capacity, description, image, status)
      VALUES (${data.name.trim()}, ${data.registration_number.trim()}, ${Number(data.capacity) || 10},
        ${data.description || null}, ${data.image || null}, ${data.status || "active"})
      RETURNING *
    `;
    return { success: true, message: "Boat added to the fleet.", data: mapBoat(rows[0] as unknown as Row) };
  });

export const adminBoatDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`UPDATE time_slots SET boat_id = NULL WHERE boat_id = ${Number(data.id)}`;
    await sql`DELETE FROM boats WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Boat deleted." };
  });

/* ---------------- schedules & slots ---------------- */

function mapSchedule(r: Row): Schedule {
  return {
    id: num(r["id"]),
    experience_id: num(r["experience_id"]),
    experience: r["exp_id"] === null || r["exp_id"] === undefined ? undefined : {
      id: num(r["exp_id"]), title: strOr(r["exp_title"], ""), slug: strOr(r["exp_slug"], ""),
    },
    name: strOr(r["name"], ""),
    is_recurring: r["is_recurring"] !== false,
    day_of_week: r["day_of_week"] === null || r["day_of_week"] === undefined ? null : num(r["day_of_week"]),
    specific_date: r["specific_date"] === null || r["specific_date"] === undefined ? null : toDateOnly(r["specific_date"]),
    start_time: strOr(r["start_time"], ""),
    end_time: strOr(r["end_time"], ""),
    default_capacity: num(r["default_capacity"], 10),
    status: (strOr(r["status"], "active") as Schedule["status"]),
    notes: str(r["notes"]),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

function mapSlot(r: Row): TimeSlot {
  const cap = num(r["capacity"]);
  const booked = num(r["booked"]);
  const status = strOr(r["status"], "available") as TimeSlot["status"];
  const effective = (status !== "available" ? status : booked >= cap ? "full" : "available") as TimeSlot["effective_status"];
  return {
    id: num(r["id"]),
    experience_id: num(r["experience_id"]),
    experience: r["exp_id"] === null || r["exp_id"] === undefined ? undefined : {
      id: num(r["exp_id"]), title: strOr(r["exp_title"], ""), slug: strOr(r["exp_slug"], ""),
    },
    schedule_id: r["schedule_id"] === null || r["schedule_id"] === undefined ? null : num(r["schedule_id"]),
    schedule: r["sched_id"] === null || r["sched_id"] === undefined ? undefined : {
      id: num(r["sched_id"]), name: strOr(r["sched_name"], ""),
    },
    boat_id: r["boat_id"] === null || r["boat_id"] === undefined ? null : num(r["boat_id"]),
    boat: r["boat_id"] === null || r["boat_id"] === undefined ? null : {
      id: num(r["boat_id"]), name: strOr(r["boat_name"], ""),
      registration_number: strOr(r["boat_reg"], ""), capacity: num(r["boat_capacity"]),
      status: strOr(r["boat_status"], ""), image_url: str(r["boat_image"]),
    },
    date: toDateOnly(r["date"]),
    start_time: strOr(r["start_time"], ""),
    end_time: strOr(r["end_time"], ""),
    formatted_time: fmtTimeRange(strOr(r["start_time"], ""), strOr(r["end_time"], "")),
    duration: str(r["duration"]) ?? "",
    capacity: cap,
    booked_guests: booked,
    available_seats: Math.max(0, cap - booked),
    is_full: booked >= cap,
    status,
    effective_status: effective,
    notes: str(r["notes"]),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

const SLOT_SELECT = `
  SELECT ts.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug,
    sc.id AS sched_id, sc.name AS sched_name,
    b.name AS boat_name, b.registration_number AS boat_reg, b.capacity AS boat_capacity,
    b.status AS boat_status, b.image AS boat_image,
    COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
  FROM time_slots ts
  LEFT JOIN experiences e ON e.id = ts.experience_id
  LEFT JOIN schedules sc ON sc.id = ts.schedule_id
  LEFT JOIN boats b ON b.id = ts.boat_id
`;

export const adminSchedulesFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; experience_id?: number | undefined; status?: string | undefined; is_recurring?: boolean | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const expId = data.experience_id ?? null;
    const status = data.status && data.status !== "all" ? data.status : null;
    const rec = typeof data.is_recurring === "boolean" ? data.is_recurring : null;
    const rows = await sql`
      SELECT s.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug
      FROM schedules s LEFT JOIN experiences e ON e.id = s.experience_id
      WHERE (${expId}::int IS NULL OR s.experience_id = ${expId})
        AND (${status}::text IS NULL OR s.status = ${status})
        AND (${rec}::boolean IS NULL OR s.is_recurring = ${rec})
      ORDER BY s.id ASC
    `;
    return { success: true, data: (rows as unknown as Row[]).map(mapSchedule) };
  });

export const adminScheduleSaveFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; id?: number | null | undefined; experience_id?: number | null | undefined; name: string; is_recurring?: boolean | undefined;
    day_of_week?: number | null | undefined; specific_date?: string | null | undefined; start_time: string; end_time: string;
    default_capacity?: number | undefined; status?: string | undefined; notes?: string | null | undefined;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.name?.trim()) throw new Error("Schedule name is required.");
    if (!data.start_time || !data.end_time) throw new Error("Start and end time are required.");
    const sql = db();
    if (data.id) {
      const rows = await sql`
        UPDATE schedules SET experience_id = ${data.experience_id ?? null}, name = ${data.name.trim()},
          is_recurring = ${data.is_recurring ?? true}, day_of_week = ${data.day_of_week ?? null},
          specific_date = ${data.specific_date ? data.specific_date : null},
          start_time = ${data.start_time}, end_time = ${data.end_time},
          default_capacity = ${Number(data.default_capacity) || 10}, status = ${data.status || "active"},
          notes = ${data.notes || null}, updated_at = NOW()
        WHERE id = ${Number(data.id)} RETURNING *
      `;
      if (rows.length === 0) throw new Error("Schedule not found.");
      return { success: true, data: mapSchedule(rows[0] as unknown as Row) };
    }
    const rows = await sql`
      INSERT INTO schedules (experience_id, name, is_recurring, day_of_week, specific_date, start_time, end_time, default_capacity, status, notes)
      VALUES (${data.experience_id ?? null}, ${data.name.trim()}, ${data.is_recurring ?? true},
        ${data.day_of_week ?? null}, ${data.specific_date ? data.specific_date : null},
        ${data.start_time}, ${data.end_time}, ${Number(data.default_capacity) || 10},
        ${data.status || "active"}, ${data.notes || null})
      RETURNING *
    `;
    return { success: true, data: mapSchedule(rows[0] as unknown as Row) };
  });

export const adminScheduleDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`UPDATE time_slots SET schedule_id = NULL WHERE schedule_id = ${Number(data.id)}`;
    await sql`DELETE FROM schedules WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Schedule deleted." };
  });

export const adminSlotsFn = createServerFn({ method: "GET" })
  .inputValidator((d: {
    token: string; date?: string | undefined; start_date?: string | undefined; end_date?: string | undefined;
    experience_id?: number | undefined; status?: string | undefined;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const date = data.date || null;
    const start = data.start_date || null;
    const end = data.end_date || null;
    const expId = data.experience_id ?? null;
    const status = data.status && data.status !== "all" ? data.status : null;
    const rows = await sql`
      SELECT ts.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug,
        sc.id AS sched_id, sc.name AS sched_name,
        b.name AS boat_name, b.registration_number AS boat_reg, b.capacity AS boat_capacity,
        b.status AS boat_status, b.image AS boat_image,
        COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
      FROM time_slots ts
      LEFT JOIN experiences e ON e.id = ts.experience_id
      LEFT JOIN schedules sc ON sc.id = ts.schedule_id
      LEFT JOIN boats b ON b.id = ts.boat_id
      WHERE (${date}::date IS NULL OR ts.date = ${date}::date)
        AND (${start}::date IS NULL OR ts.date >= ${start}::date)
        AND (${end}::date IS NULL OR ts.date <= ${end}::date)
        AND (${expId}::int IS NULL OR ts.experience_id = ${expId})
        AND (${status}::text IS NULL OR ts.status = ${status})
      ORDER BY ts.date ASC, ts.start_time ASC
    `;
    return { success: true, data: (rows as unknown as Row[]).map(mapSlot) };
  });

export const adminSlotSaveFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; id?: number | null | undefined; experience_id?: number | null | undefined; schedule_id?: number | null | undefined;
    boat_id?: number | null | undefined; date: string; start_time: string; end_time: string; duration?: string | null | undefined;
    capacity?: number | undefined; status?: string | undefined; notes?: string | null | undefined;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.date || !data.start_time || !data.end_time) throw new Error("Date, start and end time are required.");
    const sql = db();
    if (data.id) {
      const rows = await sql`
        UPDATE time_slots SET experience_id = ${data.experience_id ?? null}, schedule_id = ${data.schedule_id ?? null},
          boat_id = ${data.boat_id ?? null}, date = ${data.date}::date, start_time = ${data.start_time},
          end_time = ${data.end_time}, duration = ${data.duration || null},
          capacity = ${Number(data.capacity) || 10}, status = ${data.status || "available"},
          notes = ${data.notes || null}, updated_at = NOW()
        WHERE id = ${Number(data.id)} RETURNING *
      `;
      if (rows.length === 0) throw new Error("Time slot not found.");
      const full = await sql`
        SELECT ts.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug,
          sc.id AS sched_id, sc.name AS sched_name,
          b.name AS boat_name, b.registration_number AS boat_reg, b.capacity AS boat_capacity,
          b.status AS boat_status, b.image AS boat_image,
          COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
        FROM time_slots ts
        LEFT JOIN experiences e ON e.id = ts.experience_id
        LEFT JOIN schedules sc ON sc.id = ts.schedule_id
        LEFT JOIN boats b ON b.id = ts.boat_id
        WHERE ts.id = ${Number(data.id)} LIMIT 1
      `;
      return { success: true, data: mapSlot(full[0] as unknown as Row) };
    }
    const rows = await sql`
      INSERT INTO time_slots (experience_id, schedule_id, boat_id, date, start_time, end_time, duration, capacity, status, notes)
      VALUES (${data.experience_id ?? null}, ${data.schedule_id ?? null}, ${data.boat_id ?? null},
        ${data.date}::date, ${data.start_time}, ${data.end_time}, ${data.duration || null},
        ${Number(data.capacity) || 10}, ${data.status || "available"}, ${data.notes || null})
      RETURNING *
    `;
    const created = rows[0] as unknown as Row;
    return {
      success: true,
      data: mapSlot({
        ...created, exp_id: null, exp_title: null, exp_slug: null, sched_id: null, sched_name: null,
        boat_name: null, boat_reg: null, boat_capacity: null, boat_status: null, boat_image: null, booked: 0,
      }),
    };
  });

export const adminSlotDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`UPDATE bookings SET time_slot_id = NULL WHERE time_slot_id = ${Number(data.id)}`;
    await sql`DELETE FROM time_slots WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Time slot deleted." };
  });

export const adminSlotStatusFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string; status: string; notes?: string | null | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!["available", "blocked", "closed", "cancelled", "full"].includes(data.status)) {
      throw new Error("Invalid slot status.");
    }
    const sql = db();
    await sql`
      UPDATE time_slots SET status = ${data.status},
        notes = COALESCE(${data.notes ?? null}::text, notes), updated_at = NOW()
      WHERE id = ${Number(data.id)}
    `;
    const rows = await sql`
      SELECT ts.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug,
        sc.id AS sched_id, sc.name AS sched_name,
        b.name AS boat_name, b.registration_number AS boat_reg, b.capacity AS boat_capacity,
        b.status AS boat_status, b.image AS boat_image,
        COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
      FROM time_slots ts
      LEFT JOIN experiences e ON e.id = ts.experience_id
      LEFT JOIN schedules sc ON sc.id = ts.schedule_id
      LEFT JOIN boats b ON b.id = ts.boat_id
      WHERE ts.id = ${Number(data.id)} LIMIT 1
    `;
    if (rows.length === 0) throw new Error("Time slot not found.");
    return { success: true, data: mapSlot(rows[0] as unknown as Row) };
  });

export const adminGenerateSlotsFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; start_date: string; end_date: string; experience_id?: number | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.start_date || !data.end_date) throw new Error("Start and end date are required.");
    if (data.start_date > data.end_date) throw new Error("End date must be after start date.");
    const sql = db();
    const settingsRows = await sql`SELECT sunrise_start_time, sunrise_end_time, sunset_start_time, sunset_end_time FROM site_settings WHERE id = 1 LIMIT 1`;
    const s = (settingsRows[0] as unknown as Row | undefined) ?? {};
    const windows = [
      { start: strOr(s["sunrise_start_time"], "06:30"), end: strOr(s["sunrise_end_time"], "08:30") },
      { start: strOr(s["sunset_start_time"], "16:30"), end: strOr(s["sunset_end_time"], "18:30") },
    ];
    let expIds: number[];
    if (data.experience_id) {
      expIds = [Number(data.experience_id)];
    } else {
      const exps = await sql`SELECT id FROM experiences WHERE status = 'active' ORDER BY id ASC`;
      expIds = (exps as unknown as Row[]).map((r) => num(r["id"]));
    }
    // New slots open with the full fleet capacity; live availability is pooled per window.
    const fleet = await fleetCapacity(sql);
    if (fleet <= 0) {
      throw new Error("No boats are in service. Set at least one boat to Active in Boat Fleet Management first.");
    }
    let generated = 0;
    const day = new Date(`${data.start_date}T00:00:00Z`);
    const last = new Date(`${data.end_date}T00:00:00Z`);
    while (day <= last) {
      const dateStr = day.toISOString().split("T")[0]!;
      for (const expId of expIds) {
        for (const w of windows) {
          const existing = await sql`
            SELECT id FROM time_slots
            WHERE experience_id = ${expId} AND date = ${dateStr}::date AND start_time = ${w.start} LIMIT 1
          `;
          if (existing.length === 0) {
            await sql`
              INSERT INTO time_slots (experience_id, date, start_time, end_time, duration, capacity, status)
              VALUES (${expId}, ${dateStr}::date, ${w.start}, ${w.end}, '2 Hours', ${fleet}, 'available')
            `;
            generated++;
          }
        }
      }
      day.setUTCDate(day.getUTCDate() + 1);
    }
    return { success: true, generated_count: generated, message: `Generated ${generated} time slot${generated === 1 ? "" : "s"}.` };
  });

export const adminAvailableBoatsFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; slotId: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const slotId = Number(data.slotId);
    const slotRows = await sql`
      SELECT ts.*, e.title AS exp_title,
        COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
      FROM time_slots ts LEFT JOIN experiences e ON e.id = ts.experience_id WHERE ts.id = ${slotId} LIMIT 1
    `;
    const slot = slotRows[0] as unknown as Row | undefined;
    if (!slot) throw new Error("Time slot not found.");
    const boats = await sql`SELECT * FROM boats ORDER BY id ASC`;
    const others = await sql`
      SELECT boat_id, COUNT(*)::int AS c FROM time_slots
      WHERE boat_id IS NOT NULL AND id <> ${slotId} AND date = ${(toDateOnly(slot["date"]) || "")}::date
        AND NOT (end_time <= ${strOr(slot["start_time"], "")} OR start_time >= ${strOr(slot["end_time"], "")})
      GROUP BY boat_id
    `;
    const clashing = new Set((others as unknown as Row[]).map((r) => num(r["boat_id"])));
    const items: AvailableBoatItem[] = (boats as unknown as Row[]).map((b) => {
      const id = num(b["id"]);
      const status = String(b["status"] ?? "active");
      const isCurrent = num(slot["boat_id"]) === id;
      let reason: string | null = null;
      let available = true;
      if (status !== "active") {
        available = false;
        reason = `Boat is ${status}`;
      } else if (clashing.has(id) && !isCurrent) {
        available = false;
        reason = "Assigned to an overlapping slot";
      } else if (num(b["capacity"]) < num(slot["capacity"])) {
        reason = "Smaller than slot capacity";
      }
      return {
        id,
        name: strOr(b["name"], ""),
        registration_number: strOr(b["registration_number"], ""),
        capacity: num(b["capacity"]),
        status,
        image_url: str(b["image"]),
        is_available: available,
        reason,
        is_currently_assigned: isCurrent,
      };
    });
    const cap = num(slot["capacity"]);
    const booked = num(slot["booked"]);
    const res: AvailableBoatsResponse = {
      time_slot: {
        id: slotId,
        experience_id: num(slot["experience_id"]),
        experience_title: strOr(slot["exp_title"], undefined as unknown as string),
        date: toDateOnly(slot["date"]),
        start_time: strOr(slot["start_time"], ""),
        end_time: strOr(slot["end_time"], ""),
        formatted_time: fmtTimeRange(strOr(slot["start_time"], ""), strOr(slot["end_time"], "")),
        duration: strOr(slot["duration"], undefined as unknown as string),
        capacity: cap,
        booked_guests: booked,
        available_seats: Math.max(0, cap - booked),
        current_boat_id: slot["boat_id"] === null || slot["boat_id"] === undefined ? null : num(slot["boat_id"]),
        current_boat: null,
      },
      data: items,
    };
    return res;
  });

export const adminAssignBoatFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; slotId: number | string; boatId?: number | null | undefined; unassign?: boolean | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const slotId = Number(data.slotId);
    if (data.unassign || data.boatId === null || data.boatId === undefined) {
      await sql`UPDATE time_slots SET boat_id = NULL, updated_at = NOW() WHERE id = ${slotId}`;
    } else {
      const boats = await sql`SELECT id FROM boats WHERE id = ${Number(data.boatId)} LIMIT 1`;
      if (boats.length === 0) throw new Error("Boat not found.");
      await sql`UPDATE time_slots SET boat_id = ${Number(data.boatId)}, updated_at = NOW() WHERE id = ${slotId}`;
    }
    const rows = await sql`
      SELECT ts.*, e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug,
        sc.id AS sched_id, sc.name AS sched_name,
        b.name AS boat_name, b.registration_number AS boat_reg, b.capacity AS boat_capacity,
        b.status AS boat_status, b.image AS boat_image,
        COALESCE((SELECT SUM(number_of_guests) FROM bookings WHERE time_slot_id = ts.id AND status NOT IN ('cancelled')), 0)::int AS booked
      FROM time_slots ts
      LEFT JOIN experiences e ON e.id = ts.experience_id
      LEFT JOIN schedules sc ON sc.id = ts.schedule_id
      LEFT JOIN boats b ON b.id = ts.boat_id
      WHERE ts.id = ${slotId} LIMIT 1
    `;
    if (rows.length === 0) throw new Error("Time slot not found.");
    return { success: true, message: "Boat assignment updated.", data: mapSlot(rows[0] as unknown as Row) };
  });

/* ---------------- media (admin) ---------------- */

function mapMediaAdmin(r: Row) {
  const active = r["is_active"] !== false;
  return {
    id: num(r["id"]),
    title: strOr(r["title"], ""),
    type: (r["type"] === "video" ? "video" : "image") as "image" | "video",
    file_path: strOr(r["file_path"], ""),
    url: strOr(r["url"], ""),
    category: strOr(r["category"], "River Safari"),
    description: str(r["description"]),
    status: (active ? "visible" : "hidden") as "visible" | "hidden",
    is_visible: active,
    display_location: strOr(r["section"], "gallery"),
    is_hero: r["is_hero"] === true,
    sort_order: num(r["sort_order"]),
    file_size: r["file_size"] === null || r["file_size"] === undefined ? null : num(r["file_size"]),
    formatted_size: "",
    mime_type: str(r["mime_type"]),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

export const adminMediaListFn = createServerFn({ method: "GET" })
  .inputValidator((d: {
    token: string; type?: string | undefined; category?: string | undefined; status?: string | undefined;
    display_location?: string | undefined; is_hero?: boolean | string | undefined; search?: string | undefined;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const type = data.type && data.type !== "all" ? data.type : null;
    const category = data.category && data.category !== "all" ? data.category : null;
    const status = data.status && data.status !== "all" ? data.status : null;
    const loc = data.display_location && data.display_location !== "all" ? data.display_location : null;
    const hero = data.is_hero === undefined || data.is_hero === "all" ? null : data.is_hero === true || data.is_hero === "true";
    const search = data.search?.trim() ? `%${data.search.trim()}%` : null;
    const rows = await sql`
      SELECT * FROM media
      WHERE (${type}::text IS NULL OR type = ${type})
        AND (${category}::text IS NULL OR category = ${category})
        AND (${status}::text IS NULL OR (CASE WHEN is_active THEN 'visible' ELSE 'hidden' END) = ${status})
        AND (${loc}::text IS NULL OR section = ${loc})
        AND (${hero}::boolean IS NULL OR is_hero = ${hero})
        AND (${search}::text IS NULL OR title ILIKE ${search} OR category ILIKE ${search})
      ORDER BY sort_order ASC, id DESC
    `;
    const items = (rows as unknown as Row[]).map(mapMediaAdmin);
    const images = items.filter((i) => i.type === "image").length;
    const videos = items.filter((i) => i.type === "video").length;
    const visible = items.filter((i) => i.is_visible).length;
    return {
      success: true,
      stats: {
        total: items.length, images, videos, visible, hidden: items.length - visible,
        heroes: items.filter((i) => i.is_hero).length,
        categories: Array.from(new Set(items.map((i) => i.category))),
      },
      data: items,
    };
  });

export const adminMediaSaveFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; id?: number | string | null | undefined; title: string; url: string; file_path?: string | null | undefined;
    type?: string; mime_type?: string | null; file_size?: number | null; category?: string;
    description?: string | null; status?: string; display_location?: string; sort_order?: number; is_hero?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.title?.trim()) throw new Error("Title is required.");
    if (!data.url) throw new Error("Media file URL is required.");
    const sql = db();
    const active = (data.status || "visible") !== "hidden";
    const section = data.display_location || "gallery";
    if (data.is_hero && (section === "hero" || section === "both")) {
      await sql`UPDATE media SET is_hero = FALSE WHERE is_hero = TRUE`;
    }
    if (data.id) {
      const rows = await sql`
        UPDATE media SET title = ${data.title.trim()}, url = ${data.url}, file_path = ${data.file_path || data.url},
          type = ${data.type || "image"}, mime_type = ${data.mime_type || null},
          file_size = ${data.file_size ?? null}, category = ${data.category || "River Safari"},
          description = ${data.description || null}, is_active = ${active}, section = ${section},
          sort_order = ${data.sort_order ?? 0}, is_hero = ${Boolean(data.is_hero)}, updated_at = NOW()
        WHERE id = ${Number(data.id)} RETURNING *
      `;
      if (rows.length === 0) throw new Error("Media not found.");
      return { success: true, message: "Media updated.", data: mapMediaAdmin(rows[0] as unknown as Row) };
    }
    const rows = await sql`
      INSERT INTO media (title, url, file_path, type, mime_type, file_size, category, description, is_active, section, sort_order, is_hero)
      VALUES (${data.title.trim()}, ${data.url}, ${data.file_path || data.url}, ${data.type || "image"},
        ${data.mime_type || null}, ${data.file_size ?? null}, ${data.category || "River Safari"},
        ${data.description || null}, ${active}, ${section}, ${data.sort_order ?? 0}, ${Boolean(data.is_hero)})
      RETURNING *
    `;
    return { success: true, message: "Media uploaded.", data: mapMediaAdmin(rows[0] as unknown as Row) };
  });

export const adminMediaDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`DELETE FROM media WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Media deleted." };
  });

export const adminMediaToggleFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string; field: "visibility" | "hero"; value?: boolean | undefined }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    if (data.field === "hero") {
      const cur = await sql`SELECT is_hero, section FROM media WHERE id = ${Number(data.id)} LIMIT 1`;
      const row = cur[0] as unknown as Row | undefined;
      if (!row) throw new Error("Media not found.");
      const next = data.value ?? !(row["is_hero"] === true);
      if (next) await sql`UPDATE media SET is_hero = FALSE WHERE is_hero = TRUE`;
      await sql`UPDATE media SET is_hero = ${next}, updated_at = NOW() WHERE id = ${Number(data.id)}`;
      const rows = await sql`SELECT * FROM media WHERE id = ${Number(data.id)} LIMIT 1`;
      return { success: true, message: "Hero status updated.", data: mapMediaAdmin(rows[0] as unknown as Row) };
    }
    const cur = await sql`SELECT is_active FROM media WHERE id = ${Number(data.id)} LIMIT 1`;
    const row = cur[0] as unknown as Row | undefined;
    if (!row) throw new Error("Media not found.");
    const next = data.value ?? !(row["is_active"] !== false);
    const rows = await sql`UPDATE media SET is_active = ${next}, updated_at = NOW() WHERE id = ${Number(data.id)} RETURNING *`;
    return { success: true, message: "Visibility updated.", data: mapMediaAdmin(rows[0] as unknown as Row) };
  });

/* ---------------- dashboard ---------------- */

export const adminDashboardFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const [bookingStats, reviewStats, expStats, unread, galleryCount, galleryActive, recent] = await Promise.all([
      sql`SELECT status, COUNT(*)::int AS c FROM bookings GROUP BY status`,
      sql`SELECT status, COUNT(*)::int AS c FROM reviews GROUP BY status`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM experiences`,
      sql`SELECT COUNT(*)::int AS c FROM contact_messages WHERE status = 'unread'`,
      sql`SELECT COUNT(*)::int AS c FROM gallery`,
      sql`SELECT COUNT(*)::int AS c FROM gallery WHERE status = 'active'`,
      sql`
        SELECT b.id, b.booking_ref, b.full_name, b.booking_date, b.preferred_time, b.number_of_guests, b.status, b.created_at,
          e.id AS exp_id, e.title AS exp_title, e.slug AS exp_slug
        FROM bookings b LEFT JOIN experiences e ON e.id = b.experience_id
        ORDER BY b.created_at DESC LIMIT 5
      `,
    ]);
    const bStats = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const r of bookingStats as unknown as Row[]) {
      const c = num(r["c"]);
      bStats.total += c;
      const s = String(r["status"]);
      if (s in bStats) (bStats as unknown as Record<string, number>)[s] = c;
    }
    const rStats = { total: 0, pending: 0, approved: 0 };
    for (const r of reviewStats as unknown as Row[]) {
      const c = num(r["c"]);
      rStats.total += c;
      const s = String(r["status"]);
      if (s === "pending") rStats.pending = c;
      else if (s === "approved") rStats.approved = c;
    }
    const exp = (expStats[0] as unknown as Row) ?? {};
    const today = new Date().toISOString().split("T")[0]!;
    const todayRows = await sql`SELECT COUNT(*)::int AS c FROM bookings WHERE booking_date = ${today}::date AND status NOT IN ('cancelled')`;
    return {
      success: true,
      data: {
        statistics: {
          today_bookings: num((todayRows[0] as unknown as Row)["c"]),
          total_bookings: bStats.total,
          pending_bookings: bStats.pending,
          confirmed_bookings: bStats.confirmed,
          completed_bookings: bStats.completed,
          cancelled_bookings: bStats.cancelled,
          total_reviews: rStats.total,
          pending_reviews: rStats.pending,
          approved_reviews: rStats.approved,
          total_experiences: num(exp["total"]),
          active_experiences: num(exp["active"]),
          unread_contact_messages: num((unread[0] as unknown as Row)["c"]),
          total_gallery_items: num((galleryCount[0] as unknown as Row)["c"]),
          active_gallery_items: num((galleryActive[0] as unknown as Row)["c"]),
        },
        recent_bookings: (recent as unknown as Row[]).map((r) => ({
          id: num(r["id"]),
          booking_reference: strOr(r["booking_ref"], ""),
          full_name: strOr(r["full_name"], ""),
          experience: r["exp_id"] === null || r["exp_id"] === undefined ? null : {
            id: num(r["exp_id"]), title: strOr(r["exp_title"], ""), slug: strOr(r["exp_slug"], ""),
          },
          booking_date: toDateOnly(r["booking_date"]),
          preferred_time: strOr(r["preferred_time"], ""),
          number_of_guests: num(r["number_of_guests"], 1),
          status: strOr(r["status"], ""),
          created_at: toIso(r["created_at"]) ?? undefined,
        })),
      },
    };
  });

/* ---------------- gallery (admin) ---------------- */

function mapGalleryAdmin(r: Row) {
  return {
    id: num(r["id"]),
    title: str(r["title"]),
    image_url: strOr(r["image_url"], ""),
    alt_text: str(r["alt_text"]),
    category: strOr(r["category"], "River Safari"),
    sort_order: num(r["sort_order"]),
    status: strOr(r["status"], "active"),
    created_at: toIso(r["created_at"]) ?? "",
    updated_at: toIso(r["updated_at"]) ?? "",
  };
}

export const adminGalleryFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const rows = await sql`SELECT * FROM gallery ORDER BY sort_order ASC, id ASC`;
    return { success: true, data: (rows as unknown as Row[]).map(mapGalleryAdmin) };
  });

export const adminGallerySaveFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string; id?: number | null; title?: string | null; image_url: string;
    alt_text?: string | null; category?: string; sort_order?: number; status?: string;
  }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    if (!data.image_url) throw new Error("Image URL is required.");
    const sql = db();
    if (data.id) {
      const rows = await sql`
        UPDATE gallery SET title = ${data.title || null}, image_url = ${data.image_url},
          alt_text = ${data.alt_text || null}, category = ${data.category || "River Safari"},
          sort_order = ${data.sort_order ?? 0}, status = ${data.status || "active"}, updated_at = NOW()
        WHERE id = ${Number(data.id)} RETURNING *
      `;
      if (rows.length === 0) throw new Error("Gallery item not found.");
      return { success: true, message: "Gallery item updated.", data: mapGalleryAdmin(rows[0] as unknown as Row) };
    }
    const rows = await sql`
      INSERT INTO gallery (title, image_url, alt_text, category, sort_order, status)
      VALUES (${data.title || null}, ${data.image_url}, ${data.alt_text || null},
        ${data.category || "River Safari"}, ${data.sort_order ?? 0}, ${data.status || "active"})
      RETURNING *
    `;
    return { success: true, message: "Gallery item added.", data: mapGalleryAdmin(rows[0] as unknown as Row) };
  });

export const adminGalleryDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    await sql`DELETE FROM gallery WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Gallery item deleted." };
  });

export const adminMediaGetFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await authed(data.token);
    const sql = db();
    const rows = await sql`SELECT * FROM media WHERE id = ${Number(data.id)} LIMIT 1`;
    const row = rows[0] as unknown as Row | undefined;
    if (!row) throw new Error("Media not found.");
    return { success: true, data: mapMediaAdmin(row) };
  });
