import type { ResourceWithAvailability } from "@/lib/api/types";

const TENANT = "00000000-0000-0000-0000-0000000000aa";

function uuid(seed: number): string {
  const hex = seed.toString(16).padStart(12, "0");
  return `00000000-0000-0000-0000-${hex}`;
}

function inHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const RESOURCES: ResourceWithAvailability[] = [
  // Meeting rooms
  { id: uuid(1), tenant_id: TENANT, name: "Aurora", type: "room", capacity: 12, floor: 3, amenities: ["whiteboard", "tv_screen", "video_conf"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(2), tenant_id: TENANT, name: "Borealis", type: "room", capacity: 8, floor: 3, amenities: ["whiteboard", "video_conf"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(2), is_available_now: false },
  { id: uuid(3), tenant_id: TENANT, name: "Cumulus", type: "room", capacity: 4, floor: 2, amenities: ["tv_screen"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(4), tenant_id: TENANT, name: "Drift", type: "room", capacity: 20, floor: 4, amenities: ["video_conf", "stage_mic", "whiteboard"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(5), is_available_now: false },
  { id: uuid(5), tenant_id: TENANT, name: "Echo", type: "room", capacity: 2, floor: 1, amenities: ["video_conf"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(6), tenant_id: TENANT, name: "Forge", type: "room", capacity: 6, floor: 2, amenities: ["whiteboard"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(7), tenant_id: TENANT, name: "Glacier", type: "room", capacity: 16, floor: 4, amenities: ["video_conf", "tv_screen"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(1), is_available_now: false },

  // Desks
  { id: uuid(20), tenant_id: TENANT, name: "Desk 2A-12 (Window)", type: "desk", capacity: 1, floor: 2, amenities: ["dual_monitor", "standing"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(21), tenant_id: TENANT, name: "Desk 2A-13", type: "desk", capacity: 1, floor: 2, amenities: ["dual_monitor"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(22), tenant_id: TENANT, name: "Desk 2A-14", type: "desk", capacity: 1, floor: 2, amenities: ["single_monitor"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(3), is_available_now: false },
  { id: uuid(23), tenant_id: TENANT, name: "Desk 3B-04", type: "desk", capacity: 1, floor: 3, amenities: ["dual_monitor", "standing"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(24), tenant_id: TENANT, name: "Desk 3B-05", type: "desk", capacity: 1, floor: 3, amenities: ["dual_monitor"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(25), tenant_id: TENANT, name: "Desk 3B-06 (Quiet zone)", type: "desk", capacity: 1, floor: 3, amenities: ["single_monitor", "quiet_zone"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(26), tenant_id: TENANT, name: "Desk 4C-01", type: "desk", capacity: 1, floor: 4, amenities: ["dual_monitor", "standing", "window"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(8), is_available_now: false },
  { id: uuid(27), tenant_id: TENANT, name: "Desk 4C-02", type: "desk", capacity: 1, floor: 4, amenities: ["dual_monitor"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(28), tenant_id: TENANT, name: "Desk 4C-03", type: "desk", capacity: 1, floor: 4, amenities: ["single_monitor"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(29), tenant_id: TENANT, name: "Hot desk 1F-22", type: "desk", capacity: 1, floor: 1, amenities: ["dual_monitor"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(30), tenant_id: TENANT, name: "Hot desk 1F-23", type: "desk", capacity: 1, floor: 1, amenities: ["single_monitor"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(2), is_available_now: false },

  // Parking
  { id: uuid(50), tenant_id: TENANT, name: "Parking P1-08", type: "parking", capacity: 1, floor: -1, amenities: ["covered"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(51), tenant_id: TENANT, name: "Parking P1-09 (EV charger)", type: "parking", capacity: 1, floor: -1, amenities: ["covered", "ev_charger"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(52), tenant_id: TENANT, name: "Parking P1-10 (EV charger)", type: "parking", capacity: 1, floor: -1, amenities: ["covered", "ev_charger"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(4), is_available_now: false },
  { id: uuid(53), tenant_id: TENANT, name: "Parking P2-04", type: "parking", capacity: 1, floor: -2, amenities: ["covered"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(54), tenant_id: TENANT, name: "Visitor spot V-1", type: "parking", capacity: 1, floor: 0, amenities: [], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(55), tenant_id: TENANT, name: "Bike rack B-04", type: "parking", capacity: 4, floor: 0, amenities: ["covered", "bike"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },

  // Equipment
  { id: uuid(70), tenant_id: TENANT, name: "Polycom video kit", type: "equipment", capacity: 1, floor: null, amenities: ["video_conf"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(71), tenant_id: TENANT, name: "Wacom tablet", type: "equipment", capacity: 1, floor: null, amenities: ["design"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: inHours(6), is_available_now: false },
  { id: uuid(72), tenant_id: TENANT, name: "Mobile podium", type: "equipment", capacity: 1, floor: null, amenities: ["stage_mic"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(73), tenant_id: TENANT, name: "Projector cart", type: "equipment", capacity: 1, floor: null, amenities: ["projector"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
  { id: uuid(74), tenant_id: TENANT, name: "Mirrorless camera kit", type: "equipment", capacity: 1, floor: null, amenities: ["camera"], is_active: true, created_at: "2026-01-12T09:00:00Z", next_available_at: null, is_available_now: true },
];

export const ALL_AMENITIES = Array.from(
  new Set(RESOURCES.flatMap((r) => r.amenities))
).sort();

export const ALL_FLOORS = Array.from(
  new Set(RESOURCES.map((r) => r.floor).filter((f): f is number => f !== null))
).sort((a, b) => a - b);
