import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "./mock-auth";

function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  }
}

function Probe() {
  const { user, signIn, signOut } = useAuth();
  return (
    <div>
      <p data-testid="user">{user ? user.email : "anon"}</p>
      <button type="button" onClick={signIn}>Sign in</button>
      <button type="button" onClick={signOut}>Sign out</button>
    </div>
  );
}

describe("mock-auth", () => {
  afterEach(() => {
    clearCookies();
  });

  it("starts with no user", () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId("user")).toHaveTextContent("anon");
  });

  it("signs the demo user in and writes a cookie", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByTestId("user")).toHaveTextContent("alex@northwind.test");
    expect(document.cookie).toContain("takeaseat_mock_session=");
  });

  it("signs the user back out and clears the cookie", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByTestId("user")).toHaveTextContent("anon");
    expect(document.cookie).not.toContain("takeaseat_mock_session=ey");
  });

  it("throws when useAuth is called outside the provider", () => {
    function BadConsumer() {
      useAuth();
      return null;
    }
    expect(() =>
      act(() => {
        render(<BadConsumer />);
      })
    ).toThrow(/useAuth must be used within AuthProvider/);
  });
});
