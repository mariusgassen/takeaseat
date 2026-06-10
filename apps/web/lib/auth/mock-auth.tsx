"use client";
import * as React from "react";
import { AuthContext } from "./context";
import type { AuthUser, AuthContextValue } from "./types";

export type { Role } from "./types";
export type { AuthUser };

const DEFAULT_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Alex Morgan",
  email: "alex@northwind.test",
  role: "manager",
  tenantId: "00000000-0000-0000-0000-0000000000aa",
  tenantSlug: "northwind",
  tenantName: "Northwind Labs",
};

const COOKIE_KEY = "takeaseat_mock_session";

function readCookie(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_KEY}=`));
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw.split("=")[1] ?? "")) as AuthUser;
  } catch {
    return null;
  }
}

function writeCookie(user: AuthUser | null) {
  if (typeof document === "undefined") return;
  if (user === null) {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
    return;
  }
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    setUser(readCookie());
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading: false,
      signIn: () => {
        writeCookie(DEFAULT_USER);
        setUser(DEFAULT_USER);
      },
      signOut: () => {
        writeCookie(null);
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { useAuth } from "./context";
