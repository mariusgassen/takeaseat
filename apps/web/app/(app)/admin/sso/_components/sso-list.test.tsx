import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SsoList } from "./sso-list";

vi.mock("@/lib/i18n/context", () => ({
  useLocale: () => ({
    t: {
      admin: {
        ssoTitle: "SSO Providers",
        addProvider: "Add provider",
        noProviders: "No SSO providers configured.",
        isActive: "Active",
        delete: "Delete",
        protocol: "Protocol",
        providerName: "Name",
        issuerUrl: "Issuer URL",
        saving: "Saving…",
        saveError: "Failed to save. Please try again.",
      },
    },
  }),
}));

vi.mock("@/lib/api/admin-client", () => ({
  apiListSsoProviders: vi.fn(),
  apiDeleteSsoProvider: vi.fn(),
  apiCreateSsoProvider: vi.fn(),
}));

import { apiListSsoProviders, apiDeleteSsoProvider } from "@/lib/api/admin-client";

const mockProvider = {
  id: "prov-1",
  tenant_id: "tid-1",
  name: "Corporate IdP",
  protocol: "oidc" as const,
  issuer_url: "https://idp.example.com",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SsoList", () => {
  it("shows provider row after loading", async () => {
    (apiListSsoProviders as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sso_providers: [mockProvider],
    });
    render(<SsoList />);
    await waitFor(() => {
      expect(screen.getByText("Corporate IdP")).toBeInTheDocument();
    });
    expect(screen.getByText("OIDC")).toBeInTheDocument();
  });

  it("shows empty state when no providers", async () => {
    (apiListSsoProviders as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sso_providers: [],
    });
    render(<SsoList />);
    await waitFor(() => {
      expect(screen.getByText("No SSO providers configured.")).toBeInTheDocument();
    });
  });

  it("removes provider row after delete", async () => {
    (apiListSsoProviders as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sso_providers: [mockProvider],
    });
    (apiDeleteSsoProvider as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    render(<SsoList />);
    await waitFor(() => screen.getByText("Corporate IdP"));
    await userEvent.click(screen.getByRole("button", { name: /delete corporate idp/i }));

    await waitFor(() => {
      expect(apiDeleteSsoProvider).toHaveBeenCalledWith("prov-1");
      expect(screen.queryByText("Corporate IdP")).not.toBeInTheDocument();
    });
  });

  it("opens add provider dialog when button clicked", async () => {
    (apiListSsoProviders as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      sso_providers: [],
    });
    render(<SsoList />);
    await waitFor(() => screen.getByRole("button", { name: "Add provider" }));
    await userEvent.click(screen.getByRole("button", { name: "Add provider" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
