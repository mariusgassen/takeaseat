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

export type ReservationStatus =
  | "confirmed"
  | "cancelled"
  | "checked_in"
  | "checked_out"
  | "no_show";

export interface Reservation {
  id: string;
  tenant_id: string;
  user_id: string;
  resource_id: string;
  during: string;
  status: ReservationStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  recurring_series_id?: string | null;
}

export type RecurrenceFrequency = "daily" | "weekly";

export interface RecurringSeriesInput {
  resource_id: string;
  frequency: RecurrenceFrequency;
  days_of_week: number[];
  time_start: string;
  time_end: string;
  date_start: string;
  date_end: string;
  notes?: string;
}

export interface RecurringSeries {
  id: string;
  tenant_id: string;
  user_id: string;
  resource_id: string;
  frequency: RecurrenceFrequency;
  days_of_week: number[];
  time_start: string;
  time_end: string;
  date_start: string;
  date_end: string;
  notes: string;
  created_at: string;
  occurrences_created: number;
  occurrences_skipped: number;
}