import { createServerFn } from "@tanstack/react-start";
import { db, ensureSchema } from "./db";
import { requireAdmin } from "./auth";

type Row = Record<string, unknown>;
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

export interface HeroSlide {
  id: number;
  device: "desktop" | "mobile";
  src: string;
  alt: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface PublicHeroSlide {
  id: number;
  src: string;
  alt: string;
}

function mapSlide(r: Row): HeroSlide {
  return {
    id: num(r["id"]),
    device: r["device"] === "mobile" ? "mobile" : "desktop",
    src: String(r["src"] ?? ""),
    alt: String(r["alt"] ?? ""),
    sort_order: num(r["sort_order"]),
    is_active: r["is_active"] !== false,
    created_at: r["created_at"] ? String(r["created_at"]) : undefined,
    updated_at: r["updated_at"] ? String(r["updated_at"]) : undefined,
  };
}

/** Public hero slides, grouped by device. Empty arrays = use built-in fallback. */
export const listHeroSlidesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT id, device, src, alt, sort_order, is_active, created_at, updated_at
    FROM hero_slides WHERE is_active = TRUE ORDER BY device ASC, sort_order ASC, id ASC
  `;
  const desktop: PublicHeroSlide[] = [];
  const mobile: PublicHeroSlide[] = [];
  for (const r of rows as unknown as Row[]) {
    const s = mapSlide(r);
    (s.device === "mobile" ? mobile : desktop).push({ id: s.id, src: s.src, alt: s.alt });
  }
  return { desktop, mobile };
});

export const adminHeroSlidesFn = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await ensureSchema();
    const sql = db();
    const rows = await sql`
      SELECT id, device, src, alt, sort_order, is_active, created_at, updated_at
      FROM hero_slides ORDER BY device ASC, sort_order ASC, id ASC
    `;
    return { success: true, data: (rows as unknown as Row[]).map(mapSlide) };
  });

export const adminHeroSlideSaveFn = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    id?: number | null | undefined;
    device: string;
    src: string;
    alt?: string | null | undefined;
    is_active?: boolean | undefined;
  }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    if (data.device !== "desktop" && data.device !== "mobile") throw new Error("Invalid slide device.");
    if (!data.src?.trim()) throw new Error("An image is required.");
    await ensureSchema();
    const sql = db();
    if (data.id) {
      const rows = await sql`
        UPDATE hero_slides SET device = ${data.device}, src = ${data.src.trim()},
          alt = ${data.alt?.trim() || null},
          is_active = ${data.is_active ?? true}, updated_at = NOW()
        WHERE id = ${Number(data.id)} RETURNING *
      `;
      if (rows.length === 0) throw new Error("Slide not found.");
      return { success: true, message: "Slide updated.", data: mapSlide(rows[0] as unknown as Row) };
    }
    const order = await sql`
      SELECT COALESCE(MAX(sort_order), -1)::int + 1 AS next FROM hero_slides WHERE device = ${data.device}
    `;
    const next = num((order[0] as unknown as Row)?.["next"], 0);
    const rows = await sql`
      INSERT INTO hero_slides (device, src, alt, sort_order, is_active)
      VALUES (${data.device}, ${data.src.trim()}, ${data.alt?.trim() || null}, ${next}, ${data.is_active ?? true})
      RETURNING *
    `;
    return { success: true, message: "Slide added.", data: mapSlide(rows[0] as unknown as Row) };
  });

export const adminHeroSlideDeleteFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: number | string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await ensureSchema();
    const sql = db();
    await sql`DELETE FROM hero_slides WHERE id = ${Number(data.id)}`;
    return { success: true, message: "Slide deleted." };
  });

export const adminHeroSlidesReorderFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; device: string; ids: number[] }) => d)
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    if (data.device !== "desktop" && data.device !== "mobile") throw new Error("Invalid slide device.");
    await ensureSchema();
    const sql = db();
    for (let i = 0; i < data.ids.length; i++) {
      await sql`UPDATE hero_slides SET sort_order = ${i}, updated_at = NOW() WHERE id = ${Number(data.ids[i])} AND device = ${data.device}`;
    }
    return { success: true, message: "Order saved." };
  });
