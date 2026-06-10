"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = user?.role === "admin" || user?.role === "manager";

  React.useEffect(() => {
    if (user && !allowed) router.replace("/search");
  }, [user, allowed, router]);

  if (!user || !allowed) return null;
  return <>{children}</>;
}
