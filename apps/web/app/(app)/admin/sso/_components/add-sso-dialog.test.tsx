import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AddSsoDialog } from "./add-sso-dialog";

vi.mock("@/lib/i18n/context", () => ({
  useLocale: () => ({
    t: {
      admin: {
        addProvider: "Add provider",
        providerName: "Name",
        protocol: "Protocol",
        issuerUrl: "Issuer URL",
        isActive: "Active",
        saving: "Saving…",
        saveError: "Failed to save. Please try again.",
      },
    },
  }),
}));

vi.mock("@/lib/api/admin-client", () => ({
  apiCreateSsoProvider: vi.fn(),
}));

import { apiCreateSsoProvider } from "@/lib/api/admin-client";

const newProvider = {
  id: "prov-new",
  tenant_id: "tid-1",
  name: "New IdP",
  protocol: "oidc" as const,
  issuer_url: "https://new-idp.example.com",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AddSsoDialog", () => {
  it("renders all form fields", () => {
    render(<AddSsoDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Protocol")).toBeInTheDocument();
    expect(screen.getByLabelText("Issuer URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Active")).toBeInTheDocument();
  });

  it("calls apiCreateSsoProvider with form values and fires onCreated", async () => {
    (apiCreateSsoProvider as ReturnType<typeof vi.fn>).mockResolvedValueOnce(newProvider);
    const onCreated = vi.fn();

    render(<AddSsoDialog open onClose={vi.fn()} onCreated={onCreated} />);
    await userEvent.type(screen.getByLabelText("Name"), "New IdP");
    await userEvent.type(screen.getByLabelText("Issuer URL"), "https://new-idp.example.com");
    await userEvent.click(screen.getByRole("button", { name: "Add provider" }));

    await waitFor(() => {
      expect(apiCreateSsoProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New IdP",
          issuer_url: "https://new-idp.example.com",
        })
      );
      expect(onCreated).toHaveBeenCalledWith(newProvider);
    });
  });

  it("shows validation error when name is missing", async () => {
    render(<AddSsoDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Issuer URL"), "https://idp.example.com");
    await userEvent.click(screen.getByRole("button", { name: "Add provider" }));

    expect(screen.getByText("Name and Issuer URL are required.")).toBeInTheDocument();
    expect(apiCreateSsoProvider).not.toHaveBeenCalled();
  });
});
