"use client";
import * as React from "react";
import { CalendarCheck2 } from "lucide-react";
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
import type { ResourceWithAvailability } from "@/lib/api/types";
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

export function BookDialog({ resource, onClose }: BookDialogProps) {
  const { t } = useLocale();
  const [start, setStart] = React.useState(() => defaultStart());
  const [end, setEnd] = React.useState(() => plusOneHour(defaultStart()));
  const [confirmed, setConfirmed] = React.useState(false);

  React.useEffect(() => {
    if (resource) {
      const s = defaultStart();
      setStart(s);
      setEnd(plusOneHour(s));
      setConfirmed(false);
    }
  }, [resource]);

  if (!resource) return null;
  const meta = TYPE_META[resource.type];
  const floorLabel = formatFloor(resource.floor, t.floors);
  const capacityLabel =
    resource.capacity === 1
      ? t.resourceCard.seat
      : t.resourceCard.seats.replace("{{n}}", String(resource.capacity));

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

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">{t.bookDialog.cancel}</Button>
              </DialogClose>
              <Button onClick={() => setConfirmed(true)}>{t.bookDialog.confirm}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
