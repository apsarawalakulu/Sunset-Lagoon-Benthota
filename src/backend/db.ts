import { neon } from "@neondatabase/serverless";

export function getDatabaseUrl(): string {
  return process.env["DATABASE_URL"] ?? "";
}

export function isDbConfigured(): boolean {
  return getDatabaseUrl() !== "";
}

export class DbNotConfiguredError extends Error {
  constructor() {
    super(
      "DATABASE_NOT_CONFIGURED: Set DATABASE_URL (Neon connection string) in your .env file, then restart the server."
    );
    this.name = "DbNotConfiguredError";
  }
}

type DbClient = ReturnType<typeof neon>;

let client: DbClient | null = null;

export type Row = Record<string, unknown>;

export interface TypedDbClient {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
  query: (text: string, params?: unknown[]) => Promise<Row[]>;
  unsafe: (text: string, params?: unknown[]) => Promise<Row[]>;
}

export function db(): TypedDbClient {
  if (!isDbConfigured()) throw new DbNotConfiguredError();
  if (!client) client = neon(getDatabaseUrl());
  return client as unknown as TypedDbClient;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS experiences (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    duration TEXT,
    price NUMERIC(10,2),
    max_guests INTEGER,
    image TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS boats (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    description TEXT,
    image TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    experience_id INTEGER REFERENCES experiences(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    day_of_week INTEGER,
    specific_date DATE,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    default_capacity INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    experience_id INTEGER REFERENCES experiences(id) ON DELETE SET NULL,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
    boat_id INTEGER REFERENCES boats(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration TEXT,
    capacity INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    experience_id INTEGER REFERENCES experiences(id) ON DELETE SET NULL,
    time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE SET NULL,
    booking_ref TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'prefer_not_to_say',
    country TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    number_of_guests INTEGER NOT NULL DEFAULT 1,
    booking_date DATE NOT NULL,
    preferred_time TEXT,
    special_request TEXT,
    internal_notes TEXT,
    cancellation_reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    source TEXT NOT NULL DEFAULT 'website',
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    title TEXT,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    category TEXT NOT NULL DEFAULT 'River Safari',
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    country TEXT,
    rating INTEGER NOT NULL DEFAULT 5,
    review TEXT NOT NULL,
    image TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'image',
    mime_type TEXT,
    file_size BIGINT,
    section TEXT NOT NULL DEFAULT 'gallery',
    category TEXT NOT NULL DEFAULT 'River Safari',
    description TEXT,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_hero BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY,
    business_name TEXT,
    tagline TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    google_maps_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    facebook_url TEXT,
    instagram_url TEXT,
    website_url TEXT,
    opening_hours TEXT,
    logo_url TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    about_title TEXT,
    about_description TEXT,
    untamed_beauty_title TEXT,
    experience_section_title TEXT,
    experience_1_title TEXT,
    experience_2_title TEXT,
    experience_3_title TEXT,
    story_eyebrow TEXT,
    story_title TEXT,
    wildlife_eyebrow TEXT,
    wildlife_title TEXT,
    gallery_title TEXT,
    contact_title TEXT,
    footer_text TEXT,
    min_guests INTEGER NOT NULL DEFAULT 1,
    max_guests INTEGER NOT NULL DEFAULT 10,
    min_advance_hours INTEGER NOT NULL DEFAULT 24,
    cancellation_notice_hours INTEGER NOT NULL DEFAULT 24,
    booking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sunrise_start_time TEXT,
    sunrise_end_time TEXT,
    sunset_start_time TEXT,
    sunset_end_time TEXT,
    safari_durations JSONB,
    timezone TEXT,
    currency TEXT,
    date_format TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  // Customer-review verification: link reviews to the booking they came from.
  // One verified review per booking (partial unique index ignores admin/manual rows).
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_id_unique ON reviews (booking_id) WHERE booking_id IS NOT NULL`,
  // Google review sync: track origin + Google's review identity for dedupe.
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'website'`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source_id TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS reviews_source_unique ON reviews (source, source_id) WHERE source_id IS NOT NULL`,
  // Lightweight first-party analytics (page views for the admin dashboard).
  `CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    referrer TEXT,
    referrer_host TEXT,
    visitor_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS page_views_created_idx ON page_views (created_at)`,
  `CREATE INDEX IF NOT EXISTS page_views_visitor_idx ON page_views (visitor_id)`,
];

let schemaPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!isDbConfigured()) return Promise.reject(new DbNotConfiguredError());
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = db();
      for (const statement of SCHEMA_STATEMENTS) {
        await sql.query(statement);
      }
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

export function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().split("T")[0] ?? "";
  return String(value).split("T")[0] ?? "";
}
