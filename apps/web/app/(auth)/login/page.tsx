"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@takeaseat/ui";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";

const IS_REAL_AUTH = process.env.NEXT_PUBLIC_AUTH_MODE === "real";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, user } = useAuth();
  const { t } = useLocale();
  const authError = params.get("error") === "auth_failed";

  React.useEffect(() => {
    if (user) router.push("/search");
  }, [user, router]);

  function handleContinue() {
    void (signIn as () => void | Promise<void>)();
    if (!IS_REAL_AUTH) router.push("/search");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-accent-soft via-bg to-bg px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-fg shadow-md">
          <CalendarCheck2 className="size-7" />
        </span>
        <span className="text-xl font-bold tracking-tight">{t.nav.appName}</span>
      </div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center pb-4 text-center">
          <CardTitle className="text-lg">{t.login.title}</CardTitle>
          <CardDescription className="text-sm">{t.login.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {authError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
              {t.login.authError}
            </p>
          )}
          <Button onClick={handleContinue} size="lg" className="w-full">
            {IS_REAL_AUTH ? t.login.ctaReal : t.login.ctaMock}
            <ArrowRight />
          </Button>
          {!IS_REAL_AUTH && (
            <p className="text-center text-xs text-fg-muted">{t.login.ssoNote}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginContent />
    </React.Suspense>
  );
}
