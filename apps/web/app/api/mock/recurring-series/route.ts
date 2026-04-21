import { NextResponse } from "next/server";
import type { RecurringSeries } from "@/lib/api/types";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const TENANT_ID = "00000000-0000-0000-0000-0000000000aa";

function uuid(seed: number): string {
  const hex = seed.toString(16).padStart(12, "0");
  return `00000000-0000-0000-0000-${hex}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const frequency: string = body.frequency ?? "weekly";
  const daysOfWeek: number[] = Array.isArray(body.days_of_week) ? body.days_of_week : [];
  const dateStart: string = body.date_start ?? new Date().toISOString().slice(0, 10);
  const dateEnd: string = body.date_end ?? dateStart;

  // Simulate occurrence count
  let occurrencesCreated = 0;
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const daysSet = new Set(daysOfWeek);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (frequency === "daily" || daysSet.has(d.getDay())) {
      occurrencesCreated++;
    }
    if (occurrencesCreated >= 365) break;
  }

  const series: RecurringSeries = {
    id: uuid(Math.floor(Math.random() * 1e9)),
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    resource_id: body.resource_id ?? uuid(1),
    frequency: frequency as "daily" | "weekly",
    days_of_week: daysOfWeek,
    time_start: body.time_start ?? "09:00",
    time_end: body.time_end ?? "10:00",
    date_start: dateStart,
    date_end: dateEnd,
    notes: body.notes ?? "",
    created_at: new Date().toISOString(),
    occurrences_created: occurrencesCreated,
    occurrences_skipped: 0,
  };

  await new Promise((r) => setTimeout(r, 200));
  return NextResponse.json(series, { status: 201 });
}
