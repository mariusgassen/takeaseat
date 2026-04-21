import { NextResponse } from "next/server";
import type { Reservation } from "@/lib/api/types";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const TENANT_ID = "00000000-0000-0000-0000-0000000000aa";

function uuid(seed: number): string {
  const hex = seed.toString(16).padStart(12, "0");
  return `00000000-0000-0000-0000-${hex}`;
}

function tstzrange(start: string, end: string): string {
  return `[${start},${end})`;
}

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: uuid(101),
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    resource_id: uuid(1),
    during: tstzrange("2026-04-22T09:00:00Z", "2026-04-22T10:00:00Z"),
    status: "confirmed",
    notes: "",
    created_at: "2026-04-21T08:00:00Z",
    updated_at: "2026-04-21T08:00:00Z",
    recurring_series_id: null,
  },
  {
    id: uuid(102),
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    resource_id: uuid(3),
    during: tstzrange("2026-04-23T14:00:00Z", "2026-04-23T15:30:00Z"),
    status: "confirmed",
    notes: "Team standup",
    created_at: "2026-04-20T12:00:00Z",
    updated_at: "2026-04-20T12:00:00Z",
    recurring_series_id: uuid(201),
  },
  {
    id: uuid(103),
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    resource_id: uuid(5),
    during: tstzrange("2026-04-18T10:00:00Z", "2026-04-18T11:00:00Z"),
    status: "checked_out",
    notes: "",
    created_at: "2026-04-17T09:00:00Z",
    updated_at: "2026-04-18T11:05:00Z",
    recurring_series_id: null,
  },
];

export async function GET() {
  await new Promise((r) => setTimeout(r, 150));
  return NextResponse.json({ reservations: MOCK_RESERVATIONS });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: uuid(Math.floor(Math.random() * 1e9)),
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    resource_id: body.resource_id ?? uuid(1),
    during: tstzrange(
      body.start ?? now,
      body.end ?? new Date(Date.now() + 3600000).toISOString()
    ),
    status: "confirmed",
    notes: body.notes ?? "",
    created_at: now,
    updated_at: now,
    recurring_series_id: null,
  };
  await new Promise((r) => setTimeout(r, 150));
  return NextResponse.json(reservation, { status: 201 });
}
