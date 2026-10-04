// Fleet-wide seat model.
//
// The operation runs 3 boats x 8 seats = 24 seats total. Availability is pooled
// per time window (date + start_time + end_time): every window opens with the
// full fleet capacity, each non-cancelled booking in that window reduces the
// same pool no matter which slot row or experience it sits on, and the next
// window starts fresh automatically because it is a different pool.
//
// Only boats with status 'active' or 'available' count as in service.

type Row = Record<string, unknown>;
type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Total seats across all in-service boats. */
export async function fleetCapacity(sql: Sql): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(capacity), 0)::int AS total
    FROM boats WHERE status IN ('active', 'available')
  `;
  return num((rows[0] as Row | undefined)?.["total"]);
}

export interface WindowPool {
  start: string;
  end: string;
  booked: number;
}

/** Booked guest totals per time window for a date (all experiences pooled). */
export async function windowPools(sql: Sql, date: string): Promise<WindowPool[]> {
  const rows = await sql`
    SELECT ts.start_time AS st, ts.end_time AS en,
      COALESCE(SUM(b.number_of_guests), 0)::int AS booked
    FROM time_slots ts
    LEFT JOIN bookings b ON b.time_slot_id = ts.id AND b.status NOT IN ('cancelled')
    WHERE ts.date = ${date}::date
    GROUP BY ts.start_time, ts.end_time
  `;
  return (rows as Row[]).map((r) => ({
    start: String(r["st"] ?? ""),
    end: String(r["en"] ?? ""),
    booked: num(r["booked"]),
  }));
}

export function poolBooked(pools: WindowPool[], start: string, end: string): number {
  const s = start.slice(0, 5);
  const e = end.slice(0, 5);
  const hit = pools.find((p) => p.start.slice(0, 5) === s && p.end.slice(0, 5) === e);
  return hit ? hit.booked : 0;
}

/** Seats left in a window: fleet capacity minus pooled bookings. */
export function poolAvailable(fleet: number, booked: number): number {
  return Math.max(0, fleet - booked);
}
