"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@takeaseat/ui";
import { useAuth } from "@/lib/auth/mock-auth";
import { useLocale } from "@/lib/i18n/context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useLocale();

  function handleContinue() {
    signIn();
    router.push("/search");
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
          <Button onClick={handleContinue} size="lg" className="w-full">
            {t.login.cta}
            <ArrowRight />
          </Button>
          <p className="text-center text-xs text-fg-muted">{t.login.ssoNote}</p>
        </CardContent>
      </Card>
    </div>
  );
}
