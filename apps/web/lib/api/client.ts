import { listResources, createResource, getResource, updateResource, deleteResource, listReservations, createReservation, getReservation, deleteReservation, patchReservationStatus, getMe, listUsers, createUser, getUser, patchUser, getTenant, patchTenant, listSSOProviders, createSSOProvider, deleteSSOProvider, getHealth } from "@takeaseat/types/generated";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function baseFetchOptions(): RequestInit {
  return {
    headers: getAuthHeaders(),
  };
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiListResources(params?: Parameters<typeof listResources>[0], options?: RequestInit) {
  return listResources(params, { ...baseFetchOptions(), ...options });
}

export async function apiCreateResource(body: Parameters<typeof createResource>[0], options?: RequestInit) {
  return createResource(body, baseFetchOptions());
}

export async function apiGetResource(id: string, options?: RequestInit) {
  return getResource(id, baseFetchOptions());
}

export async function apiUpdateResource(id: string, body: Parameters<typeof updateResource>[1], options?: RequestInit) {
  return updateResource(id, body, baseFetchOptions());
}

export async function apiDeleteResource(id: string, options?: RequestInit) {
  return deleteResource(id, baseFetchOptions());
}

export async function apiListReservations(params?: Parameters<typeof listReservations>[0], options?: RequestInit) {
  return listReservations(params, baseFetchOptions());
}

export async function apiCreateReservation(body: Parameters<typeof createReservation>[0], options?: RequestInit) {
  return createReservation(body, baseFetchOptions());
}

export async function apiGetReservation(id: string, options?: RequestInit) {
  return getReservation(id, baseFetchOptions());
}

export async function apiDeleteReservation(id: string, options?: RequestInit) {
  return deleteReservation(id, baseFetchOptions());
}

export async function apiPatchReservationStatus(id: string, body: Parameters<typeof patchReservationStatus>[1], options?: RequestInit) {
  return patchReservationStatus(id, body, baseFetchOptions());
}

export async function apiGetMe(options?: RequestInit) {
  return getMe(baseFetchOptions());
}

export async function apiListUsers(params?: Parameters<typeof listUsers>[0], options?: RequestInit) {
  return listUsers(params, baseFetchOptions());
}

export async function apiCreateUser(body: Parameters<typeof createUser>[0], options?: RequestInit) {
  return createUser(body, baseFetchOptions());
}

export async function apiGetUser(id: string, options?: RequestInit) {
  return getUser(id, baseFetchOptions());
}

export async function apiPatchUser(id: string, body: Parameters<typeof patchUser>[1], options?: RequestInit) {
  return patchUser(id, body, baseFetchOptions());
}

export async function apiGetTenant(id: string, options?: RequestInit) {
  return getTenant(id, baseFetchOptions());
}

export async function apiPatchTenant(id: string, body: Parameters<typeof patchTenant>[1], options?: RequestInit) {
  return patchTenant(id, body, baseFetchOptions());
}

export async function apiListSSOProviders(params?: Parameters<typeof listSSOProviders>[0], options?: RequestInit) {
  return listSSOProviders(params, baseFetchOptions());
}

export async function apiCreateSSOProvider(body: Parameters<typeof createSSOProvider>[0], options?: RequestInit) {
  return createSSOProvider(body, baseFetchOptions());
}

export async function apiDeleteSSOProvider(id: string, options?: RequestInit) {
  return deleteSSOProvider(id, baseFetchOptions());
}

export async function apiGetHealth(options?: RequestInit) {
  return getHealth(baseFetchOptions());
}