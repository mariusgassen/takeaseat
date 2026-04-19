export type ResourceType = "room" | "desk" | "parking" | "equipment";

export interface Resource {
  id: string;
  tenant_id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  floor: number | null;
  amenities: string[];
  is_active: boolean;
  created_at: string;
}

export interface CursorPage {
  next_cursor: string | null;
  has_more: boolean;
}

export interface ResourceListResponse extends CursorPage {
  data: Resource[];
}

export interface ResourceWithAvailability extends Resource {
  next_available_at: string | null;
  is_available_now: boolean;
}

export interface ResourceSearchFilters {
  type?: ResourceType;
  capacity_min?: number;
  floor?: number;
  available_from?: string;
  available_until?: string;
  amenities?: string[];
  q?: string;
}