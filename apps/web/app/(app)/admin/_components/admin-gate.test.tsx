import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AdminGate } from "./admin-gate";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/auth/context", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/lib/auth/context";

function mockUser(role: string) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: { id: "u1", name: "Alice", email: "a@b.com", role, tenantId: "t1", tenantSlug: "acme", tenantName: "Acme" },
    signIn: vi.fn(),
    signOut: vi.fn(),
    loading: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminGate", () => {
  it("renders children for admin role", () => {
    mockUser("admin");
    render(<AdminGate><span>Admin content</span></AdminGate>);
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("renders children for manager role", () => {
    mockUser("manager");
    render(<AdminGate><span>Admin content</span></AdminGate>);
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("redirects member to /search", async () => {
    mockUser("member");
    render(<AdminGate><span>Admin content</span></AdminGate>);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/search");
    });
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("redirects guest to /search", async () => {
    mockUser("guest");
    render(<AdminGate><span>Admin content</span></AdminGate>);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/search");
    });
  });

  it("renders nothing while user is null (still loading)", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null, signIn: vi.fn(), signOut: vi.fn(), loading: true,
    });
    render(<AdminGate><span>Admin content</span></AdminGate>);
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });
});
