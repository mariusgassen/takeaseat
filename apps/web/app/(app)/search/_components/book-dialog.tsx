"use client";
import * as React from "react";
import { CalendarCheck2, RefreshCw } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@takeaseat/ui";
import type { ResourceWithAvailability, RecurringSeries } from "@/lib/api/types";
import { apiCreateReservation, apiCreateRecurringSeries } from "@/lib/api/client";
import { TYPE_META } from "./type-meta";
import { useLocale, formatFloor } from "@/lib/i18n/context";

export interface BookDialogProps {
  resource: ResourceWithAvailability | null;
  onClose: () => void;
}

function defaultStart(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  return d.toISOString().slice(0, 16);
}

function plusOneHour(value: string): string {
  const d = new Date(value);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

function toDateString(value: string): string {
  return value.slice(0, 10);
}

function toTimeString(value: string): string {
  return value.slice(11, 16);
}

function defaultRepeatUntil(start: string): string {
  const d = new Date(start);
  d.setDate(d.getDate() + 28);
  return toDateString(d.toISOString());
}

type ConfirmedResult =
  | { kind: "single" }
  | { kind: "recurring"; series: RecurringSeries };

export function BookDialog({ resource, onClose }: BookDialogProps) {
  const { t } = useLocale();
  const [start, setStart] = React.useState(() => defaultStart());
  const [end, setEnd] = React.useState(() => plusOneHour(defaultStart()));
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [frequency, setFrequency] = React.useState<"daily" | "weekly">("weekly");
  const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [repeatUntil, setRepeatUntil] = React.useState(() => defaultRepeatUntil(defaultStart()));
  const [confirmed, setConfirmed] = React.useState<ConfirmedResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (resource) {
      const s = defaultStart();
      setStart(s);
      setEnd(plusOneHour(s));
      setRepeatUntil(defaultRepeatUntil(s));
      setIsRecurring(false);
      setFrequency("weekly");
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setConfirmed(null);
      setError(null);
    }
  }, [resource]);

  if (!resource) return null;

  const meta = TYPE_META[resource.type];
  const floorLabel = formatFloor(resource.floor, t.floors);
  const capacityLabel =
    resource.capacity === 1
      ? t.resourceCard.seat
      : t.resourceCard.seats.replace("{{n}}", String(resource.capacity));

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleConfirm() {
    if (!resource) return;
    setLoading(true);
    setError(null);
    try {
      if (isRecurring) {
        const result = await apiCreateRecurringSeries({
          resource_id: resource.id,
          frequency,
          days_of_week: frequency === "weekly" ? daysOfWeek : [],
          time_start: toTimeString(start),
          time_end: toTimeString(end),
          date_start: toDateString(start),
          date_end: repeatUntil,
        });
        if (result.status >= 400) {
          setError("Booking failed. The slot may be taken.");
          return;
        }
        setConfirmed({ kind: "recurring", series: result.data as RecurringSeries });
      } else {
        const result = await apiCreateReservation({
          resource_id: resource.id,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
        });
        if (result.status >= 400) {
          setError("Booking failed. The slot may be taken.");
          return;
        }
        setConfirmed({ kind: "single" });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

  return (
    <Dialog open={resource !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {confirmed ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CalendarCheck2 className="size-6" />
            </span>
            <DialogTitle>{t.bookDialog.confirmedTitle}</DialogTitle>
            <DialogDescription>
              {t.bookDialog.confirmedDescription.replace("{{name}}", resource.name)}
              {confirmed.kind === "recurring" && (
                <span className="mt-1 block text-xs text-fg-muted">
                  {t.bookDialog.occurrencesCreated.replace(
                    "{{n}}",
                    String(confirmed.series.occurrences_created)
                  )}
                  {confirmed.series.occurrences_skipped > 0 && (
                    <>
                      {" · "}
                      {t.bookDialog.occurrencesSkipped.replace(
                        "{{n}}",
                        String(confirmed.series.occurrences_skipped)
                      )}
                    </>
                  )}
                </span>
              )}
            </DialogDescription>
            <DialogClose asChild>
              <Button onClick={onClose} className="mt-2">
                {t.bookDialog.done}
              </Button>
            </DialogClose>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {t.bookDialog.title.replace("{{name}}", resource.name)}
              </DialogTitle>
              <DialogDescription>
                {t.types[resource.type].label} · {floorLabel} · {capacityLabel}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="book-start">{t.bookDialog.starts}</Label>
                <Input
                  id="book-start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => {
                    setStart(e.target.value);
                    if (e.target.value >= end) setEnd(plusOneHour(e.target.value));
                    setRepeatUntil(defaultRepeatUntil(e.target.value));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="book-end">{t.bookDialog.ends}</Label>
                <Input
                  id="book-end"
                  type="datetime-local"
                  value={end}
                  min={start}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="book-recurring"
                type="checkbox"
                className="size-4 accent-primary"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <Label htmlFor="book-recurring" className="flex cursor-pointer items-center gap-1.5">
                <RefreshCw className="size-3.5 text-fg-muted" />
                {t.bookDialog.repeatToggle}
              </Label>
            </div>

            {isRecurring && (
              <div className="space-y-3 rounded-lg border border-border bg-surface-subtle p-3">
                <div className="flex items-center gap-3">
                  <Label className="w-24 shrink-0 text-sm">{t.bookDialog.frequency}</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={frequency === "daily" ? "default" : "outline"}
                      onClick={() => setFrequency("daily")}
                    >
                      {t.bookDialog.daily}
                    </Button>
                    <Button
                      size="sm"
                      variant={frequency === "weekly" ? "default" : "outline"}
                      onClick={() => setFrequency("weekly")}
                    >
                      {t.bookDialog.weekly}
                    </Button>
                  </div>
                </div>

                {frequency === "weekly" && (
                  <div className="flex items-center gap-3">
                    <Label className="w-24 shrink-0 text-sm">{t.bookDialog.daysOfWeek}</Label>
                    <div className="flex gap-1">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          aria-label={t.bookDialog.days[String(day) as keyof typeof t.bookDialog.days]}
                          aria-pressed={daysOfWeek.includes(day)}
                          onClick={() => toggleDay(day)}
                          className={[
                            "flex size-8 items-center justify-center rounded text-xs font-medium transition-colors",
                            daysOfWeek.includes(day)
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface text-fg-muted hover:bg-surface-hover",
                          ].join(" ")}
                        >
                          {t.bookDialog.days[String(day) as keyof typeof t.bookDialog.days]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Label htmlFor="book-repeat-until" className="w-24 shrink-0 text-sm">
                    {t.bookDialog.repeatUntil}
                  </Label>
                  <Input
                    id="book-repeat-until"
                    type="date"
                    value={repeatUntil}
                    min={toDateString(start)}
                    onChange={(e) => setRepeatUntil(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">{t.bookDialog.cancel}</Button>
              </DialogClose>
              <Button
                onClick={handleConfirm}
                disabled={loading || (frequency === "weekly" && isRecurring && daysOfWeek.length === 0)}
              >
                {loading ? "…" : t.bookDialog.confirm}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
