import { API_BASE_URL } from "./client";

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  if (res.status === 204) return undefined;
  return res.json();
}

function url(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  sso_enforced: boolean;
  created_at: string;
}

export interface TenantPatchBody {
  name: string;
  slug: string;
  sso_enforced: boolean;
}

export interface SsoProviderResponse {
  id: string;
  tenant_id: string;
  name: string;
  protocol: "saml" | "oidc" | "oauth2";
  issuer_url: string;
  is_active: boolean;
  created_at: string;
}

export interface SsoProviderCreateBody {
  name: string;
  protocol: "saml" | "oidc" | "oauth2";
  issuer_url: string;
  is_active: boolean;
}

export interface UserResponse {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface UserPatchBody {
  name: string;
  role: string;
}

export async function apiGetTenant(id: string): Promise<TenantResponse> {
  return adminFetch(url(`/tenants/${id}`));
}

export async function apiPatchTenant(
  id: string,
  body: TenantPatchBody
): Promise<TenantResponse> {
  return adminFetch(url(`/tenants/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiListSsoProviders(): Promise<{
  sso_providers: SsoProviderResponse[];
}> {
  return adminFetch(url("/sso-providers"));
}

export async function apiCreateSsoProvider(
  body: SsoProviderCreateBody
): Promise<SsoProviderResponse> {
  return adminFetch(url("/sso-providers"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDeleteSsoProvider(id: string): Promise<void> {
  await adminFetch(url(`/sso-providers/${id}`), { method: "DELETE" });
}

export async function apiListUsers(): Promise<{ users: UserResponse[] }> {
  return adminFetch(url("/users"));
}

export async function apiPatchUser(
  id: string,
  body: UserPatchBody
): Promise<UserResponse> {
  return adminFetch(url(`/users/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDeleteUser(id: string): Promise<void> {
  await adminFetch(url(`/users/${id}`), { method: "DELETE" });
}
