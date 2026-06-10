"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated && !loading && !user) router.replace("/login");
  }, [hydrated, loading, user, router]);

  if (!hydrated || loading || !user) return null;
  return <>{children}</>;
}
