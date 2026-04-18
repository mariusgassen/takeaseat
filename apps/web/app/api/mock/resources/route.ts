import { NextResponse } from "next/server";
import { RESOURCES } from "@/lib/mocks/resources";
import type { ResourceType } from "@/lib/api/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ResourceType | null;
  const capacityMin = parseIntOrNull(searchParams.get("capacity_min"));
  const floor = parseIntOrNull(searchParams.get("floor"));
  const amenities = (searchParams.get("amenities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const availableFrom = searchParams.get("available_from");

  let data = RESOURCES.slice();
  if (type) data = data.filter((r) => r.type === type);
  if (capacityMin !== null) data = data.filter((r) => r.capacity >= capacityMin);
  if (floor !== null) data = data.filter((r) => r.floor === floor);
  if (amenities.length > 0) {
    data = data.filter((r) => amenities.every((a) => r.amenities.includes(a)));
  }
  if (q) {
    data = data.filter(
      (r) => r.name.toLowerCase().includes(q) || r.amenities.some((a) => a.includes(q))
    );
  }
  if (availableFrom) data = data.filter((r) => r.is_available_now);

  await new Promise((r) => setTimeout(r, 200));

  return NextResponse.json({
    data,
    has_more: false,
    next_cursor: null,
  });
}

function parseIntOrNull(value: string | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
