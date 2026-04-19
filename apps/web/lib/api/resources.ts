import type { ResourceSearchFilters, ResourceWithAvailability } from "./types";
import { apiListResources } from "./client";

export function buildSearchQuery(filters: ResourceSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.capacity_min !== undefined) params.set("capacity_min", String(filters.capacity_min));
  if (filters.floor !== undefined) params.set("floor", String(filters.floor));
  if (filters.available_from) params.set("available_from", filters.available_from);
  if (filters.available_until) params.set("available_until", filters.available_until);
  if (filters.amenities && filters.amenities.length > 0) {
    params.set("amenities", filters.amenities.join(","));
  }
  if (filters.q) params.set("q", filters.q);
  return params.toString();
}

export async function searchResources(
  filters: ResourceSearchFilters,
  signal?: AbortSignal
): Promise<ResourceWithAvailability[]> {
  const result = await apiListResources(filters, { signal });
  if (result.status === 401) {
    throw new Error("Unauthorized");
  }
  if (result.status >= 400) {
    throw new Error(`Failed to load resources: ${result.status}`);
  }
  return result.data.data as unknown as ResourceWithAvailability[];
}