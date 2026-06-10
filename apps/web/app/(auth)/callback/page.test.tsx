import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CallbackPage from "./page";

const mockReplace = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({ get: mockGet }),
}));

vi.mock("@/lib/auth/zitadel-auth", () => ({
  handleOAuthCallback: vi.fn(),
}));

import { handleOAuthCallback } from "@/lib/auth/zitadel-auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CallbackPage", () => {
  it("redirects to /search on successful callback", async () => {
    mockGet.mockImplementation((key: string) =>
      key === "code" ? "auth-code-123" : "state-abc"
    );
    (handleOAuthCallback as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "u1",
      name: "Alice",
      email: "a@b.com",
      role: "member",
      tenantId: "t1",
      tenantSlug: "acme",
      tenantName: "Acme",
    });

    render(<CallbackPage />);
    expect(screen.getByText("Signing you in…")).toBeInTheDocument();
    await waitFor(() => {
      expect(handleOAuthCallback).toHaveBeenCalledWith("auth-code-123", "state-abc");
      expect(mockReplace).toHaveBeenCalledWith("/search");
    });
  });

  it("redirects to /login?error=auth_failed when code is missing", async () => {
    mockGet.mockReturnValue(null);
    render(<CallbackPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?error=auth_failed");
    });
  });

  it("redirects to /login on handleOAuthCallback failure", async () => {
    mockGet.mockImplementation((key: string) =>
      key === "code" ? "bad-code" : "bad-state"
    );
    (handleOAuthCallback as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Invalid OAuth state")
    );

    render(<CallbackPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?error=auth_failed");
    });
  });
});
