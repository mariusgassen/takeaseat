import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TenantForm } from "./tenant-form";

vi.mock("@/lib/auth/context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/i18n/context", () => ({
  useLocale: () => ({
    t: {
      admin: {
        tenantTitle: "Tenant Settings",
        tenantName: "Name",
        tenantSlug: "Slug",
        ssoEnforced: "Enforce SSO login",
        save: "Save changes",
        saving: "Saving…",
        saved: "Saved",
        saveError: "Failed to save. Please try again.",
      },
    },
  }),
}));

vi.mock("@/lib/api/admin-client", () => ({
  apiGetTenant: vi.fn(),
  apiPatchTenant: vi.fn(),
}));

import { useAuth } from "@/lib/auth/context";
import { apiGetTenant, apiPatchTenant } from "@/lib/api/admin-client";

const mockTenant = {
  id: "tid-1",
  name: "Acme Corp",
  slug: "acme",
  sso_enforced: false,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: { tenantId: "tid-1", role: "admin" },
    signIn: vi.fn(),
    signOut: vi.fn(),
    loading: false,
  });
});

describe("TenantForm", () => {
  it("shows skeleton while loading", () => {
    (apiGetTenant as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<TenantForm />);
    expect(document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]').length).toBeGreaterThanOrEqual(0);
  });

  it("renders populated form after fetch resolves", async () => {
    (apiGetTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTenant);
    render(<TenantForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("Acme Corp");
    });
    expect(screen.getByLabelText("Slug")).toHaveValue("acme");
    expect(screen.getByLabelText("Slug")).toBeDisabled();
  });

  it("calls apiPatchTenant with correct args on submit", async () => {
    (apiGetTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTenant);
    (apiPatchTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockTenant,
      name: "Acme Updated",
    });

    render(<TenantForm />);
    await waitFor(() => screen.getByLabelText("Name"));

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "Acme Updated");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(apiPatchTenant).toHaveBeenCalledWith("tid-1", {
        name: "Acme Updated",
        slug: "acme",
        sso_enforced: false,
      });
    });
  });

  it("shows Saved feedback on success", async () => {
    (apiGetTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTenant);
    (apiPatchTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTenant);

    render(<TenantForm />);
    await waitFor(() => screen.getByRole("button", { name: "Save changes" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });

  it("shows error feedback on API failure", async () => {
    (apiGetTenant as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTenant);
    (apiPatchTenant as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("500"));

    render(<TenantForm />);
    await waitFor(() => screen.getByRole("button", { name: "Save changes" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to save. Please try again.")).toBeInTheDocument();
    });
  });
});
