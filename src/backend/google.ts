import { db, ensureSchema } from "./db";

export interface GooglePlaceReview {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
  profile_photo_url?: string | null;
}

interface GoogleTextSearchResponse {
  status?: string;
  candidates?: Array<{ place_id?: string; name?: string }>;
}

interface GooglePlaceDetailsResponse {
  status?: string;
  error_message?: string;
  result?: { reviews?: GooglePlaceReview[] };
}

type Row = Record<string, unknown>;

export function getGoogleApiKey(): string {
  return process.env["GOOGLE_PLACES_API_KEY"] ?? "";
}

export function getConfiguredPlaceId(): string | null {
  const v = (process.env["GOOGLE_PLACE_ID"] ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Resolve the business Place ID: explicit GOOGLE_PLACE_ID wins,
 * otherwise locate "Sunset Lagoon Boat House Bentota" via Text Search
 * (with a name guard so we never sync a stranger's reviews).
 */
export async function resolvePlaceId(apiKey: string, configured: string | null): Promise<string> {
  if (configured) return configured;
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent("Sunset Lagoon Boat House Bentota Sri Lanka")}` +
    `&inputtype=textquery&fields=place_id,name,formatted_address&key=${encodeURIComponent(apiKey)}`;
  let json: GoogleTextSearchResponse | null = null;
  try {
    const res = await fetch(url);
    json = (await res.json()) as GoogleTextSearchResponse;
  } catch {
    throw new Error("Could not reach Google Places. Check your connection and API key.");
  }
  const candidate = json?.candidates?.[0];
  if (json?.status !== "OK" || !candidate?.place_id) {
    throw new Error("Could not find Sunset Lagoon on Google automatically. Set GOOGLE_PLACE_ID in your .env file.");
  }
  if (!/sunset\s*lagoon/i.test(candidate.name || "")) {
    throw new Error(
      `Google matched "${candidate.name || "another business"}" instead — set GOOGLE_PLACE_ID explicitly in .env.`
    );
  }
  return candidate.place_id;
}

export async function fetchGooglePlaceReviews(apiKey: string, placeId: string): Promise<GooglePlaceReview[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}` +
    `&fields=name,rating,reviews,url&key=${encodeURIComponent(apiKey)}`;
  let payload: GooglePlaceDetailsResponse | null = null;
  try {
    const res = await fetch(url);
    payload = (await res.json()) as GooglePlaceDetailsResponse;
  } catch {
    throw new Error("Could not reach Google Places. Check your connection and API key.");
  }
  if (!payload || payload.status !== "OK") {
    throw new Error(
      payload?.error_message ||
        `Google Places error (${payload?.status || "unknown"}). Check your API key and Place ID.`
    );
  }
  const reviews = payload.result?.reviews;
  return Array.isArray(reviews) ? reviews : [];
}

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Store Google reviews as approved site reviews (they are already public on
 * Google). Repeats are skipped via the (source, source_id) unique index.
 */
export async function importGoogleReviews(incoming: GooglePlaceReview[]): Promise<{ imported: number; skipped: number }> {
  await ensureSchema();
  const sql = db();
  let imported = 0;
  let skipped = 0;
  for (const g of incoming) {
    const name = (g.author_name || "").trim();
    const text = (g.text || "").trim();
    if (!name || !text) {
      skipped++;
      continue;
    }
    const sourceId = `google:${name.toLowerCase()}:${Number(g.time) || 0}`;
    const rating = Math.min(5, Math.max(1, Math.round(Number(g.rating) || 5)));
    try {
      const inserted = await sql`
        INSERT INTO reviews (customer_name, country, rating, review, image, status, source, source_id)
        VALUES (${name}, NULL, ${rating}, ${text.slice(0, 2000)}, ${g.profile_photo_url || null}, 'approved', 'google', ${sourceId})
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (inserted.length > 0) imported++;
      else skipped++;
    } catch {
      skipped++;
    }
  }
  await sql`UPDATE site_settings SET google_last_sync = NOW(), updated_at = NOW() WHERE id = 1`;
  return { imported, skipped };
}

const STALE_MS = 60 * 60 * 1000; // refresh at most once an hour on page views

/** Best-effort background refresh for public pages. Never throws. */
export async function refreshGoogleReviewsIfStale(): Promise<void> {
  try {
    const apiKey = getGoogleApiKey();
    if (!apiKey) return;
    await ensureSchema();
    const sql = db();
    const rows = await sql`SELECT google_last_sync FROM site_settings WHERE id = 1 LIMIT 1`;
    const last = (rows[0] as unknown as Row | undefined)?.["google_last_sync"];
    const lastMs = last ? new Date(String(last)).getTime() : 0;
    if (Date.now() - lastMs < STALE_MS) return;
    const placeId = await resolvePlaceId(apiKey, getConfiguredPlaceId());
    const incoming = await fetchGooglePlaceReviews(apiKey, placeId);
    await importGoogleReviews(incoming);
  } catch (err) {
    console.error("Google reviews background refresh failed:", err);
  }
}
