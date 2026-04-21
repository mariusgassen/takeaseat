"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarPlus, RefreshCw } from "lucide-react";
import { Badge, Button, EmptyState, Skeleton } from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";
import { apiListReservations } from "@/lib/api/client";
import type { Reservation, ReservationStatus } from "@/lib/api/types";

function parseDuring(during: string): { start: Date; end: Date } | null {
  // format: [2024-01-15T09:00:00Z,2024-01-15T10:00:00Z)
  const inner = during.slice(1, -1);
  const comma = inner.indexOf(",");
  if (comma === -1) return null;
  return { start: new Date(inner.slice(0, comma)), end: new Date(inner.slice(comma + 1)) };
}

function formatDateRange(during: string, locale: string): string {
  const parsed = parseDuring(during);
  if (!parsed) return during;
  const dateStr = parsed.start.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = parsed.start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const endTime = parsed.end.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

const STATUS_VARIANT: Record<ReservationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  checked_in: "default",
  checked_out: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const { t, locale } = useLocale();
  const statusLabel =
    t.reservations.status[reservation.status] ?? reservation.status;
  const range = formatDateRange(reservation.during, locale);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-fg">{range}</span>
        <span className="text-xs text-fg-muted">{reservation.resource_id}</span>
        {reservation.notes && (
          <span className="text-xs text-fg-muted italic">{reservation.notes}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {reservation.recurring_series_id && (
          <Badge variant="outline" className="gap-1 text-xs">
            <RefreshCw className="size-3" />
            {t.reservations.recurring}
          </Badge>
        )}
        <Badge variant={STATUS_VARIANT[reservation.status]}>{statusLabel}</Badge>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const { t } = useLocale();
  const [reservations, setReservations] = React.useState<Reservation[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    apiListReservations()
      .then((result) => {
        if (cancelled) return;
        if (result.status >= 400) {
          setError(true);
          return;
        }
        const data = result.data?.reservations ?? result.data?.data ?? [];
        setReservations(Array.isArray(data) ? (data as Reservation[]) : []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t.reservations.title}</h1>
        <p className="text-sm text-fg-muted">{t.reservations.subtitle}</p>
      </header>

      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive">{t.resultsGrid.error}</p>
      )}

      {!loading && !error && reservations !== null && reservations.length === 0 && (
        <EmptyState
          icon={<CalendarPlus className="size-5" />}
          title={t.reservations.emptyTitle}
          description={t.reservations.emptyDescription}
          action={
            <Button asChild>
              <Link href="/search">{t.reservations.browse}</Link>
            </Button>
          }
        />
      )}

      {!loading && !error && reservations && reservations.length > 0 && (
        <div className="flex flex-col gap-3">
          {reservations.map((r: Reservation) => (
            <ReservationCard key={r.id} reservation={r} />
          ))}
        </div>
      )}
    </div>
  );
}
