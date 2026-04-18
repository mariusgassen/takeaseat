"use client";
import * as React from "react";

export type Role = "admin" | "manager" | "member" | "guest";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantSlug: string;
  tenantName: string;
}

const DEFAULT_USER: MockUser = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Alex Morgan",
  email: "alex@northwind.test",
  role: "manager",
  tenantSlug: "northwind",
  tenantName: "Northwind Labs",
};

interface AuthContextValue {
  user: MockUser | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);
const COOKIE_KEY = "takeaseat_mock_session";

function readCookie(): MockUser | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_KEY}=`));
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw.split("=")[1] ?? "")) as MockUser;
  } catch {
    return null;
  }
}

function writeCookie(user: MockUser | null) {
  if (typeof document === "undefined") return;
  if (user === null) {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
    return;
  }
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<MockUser | null>(null);

  React.useEffect(() => {
    setUser(readCookie());
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
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

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
