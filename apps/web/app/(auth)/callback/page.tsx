"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleOAuthCallback } from "@/lib/auth/zitadel-auth";

export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  React.useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      router.replace("/login?error=auth_failed");
      return;
    }

    handleOAuthCallback(code, state)
      .then(() => {
        router.replace("/search");
      })
      .catch((err: unknown) => {
        console.error("OAuth callback failed:", err);
        router.replace("/login?error=auth_failed");
      });
  }, [params, router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-fg-muted text-sm">Signing you in…</p>
    </div>
  );
}
