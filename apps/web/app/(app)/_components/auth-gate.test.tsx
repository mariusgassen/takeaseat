import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGate } from "./auth-gate";
import { AuthProvider, useAuth } from "@/lib/auth/mock-auth";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  }
}

beforeEach(() => {
  replace.mockReset();
  clearCookies();
});

function SignInButton() {
  const { signIn } = useAuth();
  return (
    <button type="button" onClick={signIn}>
      Sign in
    </button>
  );
}

describe("AuthGate", () => {
  it("redirects to /login when no user is authenticated", async () => {
    render(
      <AuthProvider>
        <AuthGate>
          <p>secret</p>
        </AuthGate>
      </AuthProvider>
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders children once a user is present", async () => {
    render(
      <AuthProvider>
        <SignInButton />
        <AuthGate>
          <p>secret</p>
        </AuthGate>
      </AuthProvider>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    replace.mockReset();
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
