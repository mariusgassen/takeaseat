import type { ResourceSearchFilters } from "./types";

// Default to the built-in mock route so the app works without a real backend.
// Point NEXT_PUBLIC_API_URL at your real API base (e.g. "http://localhost:8000/api/v1").
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/mock";

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildUrl(
  endpoint: string,
  params: Record<string, string | undefined> = {}
): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const qs = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => e[1] != null)
  ).toString();
  return qs ? `${base}${endpoint}?${qs}` : `${base}${endpoint}`;
}

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { headers: authHeaders(), ...init });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("auth_token", token);
}

export function clearAuthToken() {
  if (typeof window !== "undefined") localStorage.removeItem("auth_token");
}

export async function apiListResources(
  params?: ResourceSearchFilters,
  options?: RequestInit
) {
  const p: Record<string, string | undefined> = {
    type: params?.type,
    capacity_min: params?.capacity_min != null ? String(params.capacity_min) : undefined,
    floor: params?.floor != null ? String(params.floor) : undefined,
    available_from: params?.available_from,
    available_until: params?.available_until,
    amenities: params?.amenities?.length ? params.amenities.join(",") : undefined,
    q: params?.q,
  };
  return apiFetch(buildUrl("/resources", p), options);
}

export async function apiCreateReservation(
  body: Record<string, unknown>,
  options?: RequestInit
) {
  return apiFetch(buildUrl("/reservations"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
    ...options,
  });
}

export async function apiGetMe(options?: RequestInit) {
  return apiFetch(buildUrl("/me"), options);
}
