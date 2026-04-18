"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@takeaseat/ui";
import { useAuth } from "@/lib/auth/mock-auth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  function handleContinue() {
    signIn();
    router.push("/search");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CalendarCheck2 className="size-6" />
          </div>
          <CardTitle className="text-xl">Welcome to Take A Seat</CardTitle>
          <CardDescription>
            Reserve desks, rooms, and parking across your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={handleContinue} size="lg" className="w-full">
            Continue as demo user
            <ArrowRight />
          </Button>
          <p className="text-center text-xs text-fg-muted">
            Real Zitadel SSO sign-in arrives in a later iteration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
