import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Button, EmptyState } from "@takeaseat/ui";

export default function ReservationsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
        <p className="text-sm text-fg-muted">
          Your upcoming and past bookings will appear here.
        </p>
      </header>
      <EmptyState
        icon={<CalendarPlus className="size-5" />}
        title="No reservations yet"
        description="Find an available room or desk and book it in a couple of clicks."
        action={
          <Button asChild>
            <Link href="/search">Browse resources</Link>
          </Button>
        }
      />
    </div>
  );
}
