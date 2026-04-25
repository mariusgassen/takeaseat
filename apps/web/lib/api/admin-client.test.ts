import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  apiGetTenant,
  apiPatchTenant,
  apiListSsoProviders,
  apiCreateSsoProvider,
  apiDeleteSsoProvider,
  apiListUsers,
  apiPatchUser,
  apiDeleteUser,
} from "./admin-client";

const mockTenant = {
  id: "tid-1",
  name: "Acme",
  slug: "acme",
  sso_enforced: false,
  created_at: "2026-01-01T00:00:00Z",
};

const mockProvider = {
  id: "prov-1",
  tenant_id: "tid-1",
  name: "Corporate IdP",
  protocol: "oidc" as const,
  issuer_url: "https://idp.example.com",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

const mockUser = {
  id: "user-1",
  tenant_id: "tid-1",
  email: "user@example.com",
  name: "User One",
  role: "member",
  created_at: "2026-01-01T00:00:00Z",
};

function okJson(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

function okNoContent() {
  return Promise.resolve({ ok: true, status: 204 });
}

function errorResponse(status: number) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiGetTenant", () => {
  it("GETs /tenants/:id and returns tenant", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okJson(mockTenant));
    const result = await apiGetTenant("tid-1");
    expect(result).toEqual(mockTenant);
    const [calledUrl] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(calledUrl).toContain("/tenants/tid-1");
  });

  it("throws on non-OK response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(errorResponse(403));
    await expect(apiGetTenant("tid-1")).rejects.toThrow("Admin API error: 403");
  });
});

describe("apiPatchTenant", () => {
  it("PATCHes /tenants/:id with body", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okJson(mockTenant));
    const body = { name: "Acme Corp", slug: "acme", sso_enforced: true };
    await apiPatchTenant("tid-1", body);
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual(body);
  });
});

describe("apiListSsoProviders", () => {
  it("GETs /sso-providers", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      okJson({ sso_providers: [mockProvider] })
    );
    const result = await apiListSsoProviders();
    expect(result.sso_providers).toHaveLength(1);
    expect(result.sso_providers[0]!.name).toBe("Corporate IdP");
  });
});

describe("apiCreateSsoProvider", () => {
  it("POSTs to /sso-providers with body", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okJson(mockProvider));
    const body = { name: "IdP", protocol: "oidc" as const, issuer_url: "https://x.com", is_active: true };
    const result = await apiCreateSsoProvider(body);
    expect(result.id).toBe("prov-1");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
  });
});

describe("apiDeleteSsoProvider", () => {
  it("DELETEs /sso-providers/:id and returns void on 204", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okNoContent());
    await expect(apiDeleteSsoProvider("prov-1")).resolves.toBeUndefined();
    const [calledUrl, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/sso-providers/prov-1");
    expect(init.method).toBe("DELETE");
  });
});

describe("apiListUsers", () => {
  it("GETs /users", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okJson({ users: [mockUser] }));
    const result = await apiListUsers();
    expect(result.users).toHaveLength(1);
  });
});

describe("apiPatchUser", () => {
  it("PATCHes /users/:id", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okJson(mockUser));
    await apiPatchUser("user-1", { name: "User One", role: "admin" });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string).role).toBe("admin");
  });
});

describe("apiDeleteUser", () => {
  it("DELETEs /users/:id", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okNoContent());
    await expect(apiDeleteUser("user-1")).resolves.toBeUndefined();
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
  });
});
