import { createServerFn } from "@tanstack/react-start";
import { db, ensureSchema } from "./db";
import { seedDemoContent } from "./seed";

export interface AdminUserShape {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string | undefined;
}

async function getCrypto() {
  return await import("node:crypto");
}

function getSecret(): string {
  const configured = process.env["ADMIN_SECRET"];
  if (configured) return configured;
  // Stable per-deployment fallback derived from the DB url (never shipped to clients).
  return `sunset-lagoon:${process.env["DATABASE_URL"] ?? "unconfigured"}`;
}

export async function hashPassword(password: string): Promise<string> {
  const crypto = await getCrypto();
  const salt = crypto.randomBytes(16).toString("hex");
  const derived: Buffer = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const crypto = await getCrypto();
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !parts[1] || !parts[2]) return false;
  const salt = parts[1];
  const expected = parts[2];
  const derived: Buffer = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });
  const a = Buffer.from(derived.toString("hex"), "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function signToken(userId: number): Promise<string> {
  const crypto = await getCrypto();
  const expiry = Date.now() + TOKEN_TTL_MS;
  const body = `${userId}.${expiry}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("hex");
  return Buffer.from(`${body}.${sig}`, "utf8").toString("base64url");
}

export async function verifyToken(token: string): Promise<number | null> {
  try {
    const crypto = await getCrypto();
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [idRaw, expRaw, sig] = decoded.split(".");
    const userId = Number(idRaw);
    const expiry = Number(expRaw);
    if (!Number.isFinite(userId) || !Number.isFinite(expiry) || !sig) return null;
    if (Date.now() > expiry) return null;
    const expected = crypto.createHmac("sha256", getSecret()).update(`${userId}.${expiry}`).digest("hex");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireAdmin(token: string | null | undefined): Promise<AdminUserShape> {
  if (!token) throw new AuthError("No active admin session found.", 401);
  await ensureSchema();
  const userId = await verifyToken(token);
  if (!userId) throw new AuthError("Session expired. Please log in again.", 401);
  const sql = db();
  const rows = await sql`SELECT id, name, email, role, created_at FROM users WHERE id = ${userId} LIMIT 1`;
  const user = rows[0] as unknown as AdminUserShape | undefined;
  if (!user) throw new AuthError("Session expired. Please log in again.", 401);
  if (user.role !== "admin") throw new AuthError("Access denied. Only administrators are allowed.", 403);
  return user;
}

function toAdminShape(row: Record<string, unknown>): AdminUserShape {
  return {
    id: Number(row["id"]),
    name: String(row["name"] ?? ""),
    email: String(row["email"] ?? ""),
    role: String(row["role"] ?? "admin"),
    created_at: row["created_at"] ? String(row["created_at"]) : undefined,
  };
}

export const dbStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["DATABASE_URL"] ?? "";
  if (!url) return { configured: false, needsSetup: false as boolean };
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM users`;
  const count = Number((rows[0] as unknown as { count: number }).count ?? 0);
  return { configured: true, needsSetup: count === 0 };
});

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const users = await sql`SELECT COUNT(*)::int AS count FROM users`;
    if (Number((users[0] as unknown as { count: number }).count ?? 0) === 0) {
      throw new AuthError("No admin account exists yet. Please run first-time setup.", 404);
    }
    const rows = await sql`SELECT id, name, email, role, password, created_at FROM users WHERE email = ${data.email.trim().toLowerCase()} LIMIT 1`;
    const row = rows[0] as unknown as Record<string, unknown> | undefined;
    if (!row || !(await verifyPassword(data.password, String(row["password"] ?? "")))) {
      throw new AuthError("Invalid email or password.", 401);
    }
    if (String(row["role"]) !== "admin") {
      throw new AuthError("Access denied. Only administrators are allowed.", 403);
    }
    const admin = toAdminShape(row);
    const token = await signToken(admin.id);
    return { success: true, token, admin };
  });

export const meFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    return { success: true, admin };
  });

export const setupFn = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; password: string }) => d)
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const users = await sql`SELECT COUNT(*)::int AS count FROM users`;
    if (Number((users[0] as unknown as { count: number }).count ?? 0) > 0) {
      throw new AuthError("Setup has already been completed.", 400);
    }
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    if (!name || !email || !email.includes("@")) throw new AuthError("Please provide a valid name and email.", 422);
    if (data.password.length < 8) throw new AuthError("Password must be at least 8 characters.", 422);
    const password = await hashPassword(data.password);
    const inserted = await sql`
      INSERT INTO users (name, email, password, role) VALUES (${name}, ${email}, ${password}, 'admin')
      RETURNING id, name, email, role, created_at
    `;
    const admin = toAdminShape(inserted[0] as unknown as Record<string, unknown>);
    await seedDemoContent();
    const token = await signToken(admin.id);
    return { success: true, token, admin };
  });
