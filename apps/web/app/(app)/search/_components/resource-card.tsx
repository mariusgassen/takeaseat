"use client";
import * as React from "react";
import { CalendarClock, MapPin, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from "@takeaseat/ui";
import type { ResourceWithAvailability } from "@/lib/api/types";
import { TYPE_META } from "./type-meta";
import { useLocale, formatFloor, localizeAmenity } from "@/lib/i18n/context";

export interface ResourceCardProps {
  resource: ResourceWithAvailability;
  onBook: (resource: ResourceWithAvailability) => void;
}

export function ResourceCard({ resource, onBook }: ResourceCardProps) {
  const { t } = useLocale();
  const meta = TYPE_META[resource.type];
  const Icon = meta.icon;

  const floorLabel = formatFloor(resource.floor, t.floors);
  const capacityLabel =
    resource.capacity === 1
      ? t.resourceCard.seat
      : t.resourceCard.seats.replace("{{n}}", String(resource.capacity));

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-t-[3px] transition-shadow hover:shadow-md",
        meta.borderClass
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                meta.iconClass
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate">{resource.name}</CardTitle>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
                {t.types[resource.type].label}
              </p>
            </div>
          </div>
          <AvailabilityBadge resource={resource} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {capacityLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {floorLabel}
          </span>
        </div>

        {resource.amenities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {resource.amenities.slice(0, 4).map((a) => (
              <Badge key={a}>{localizeAmenity(a, t.amenities)}</Badge>
            ))}
            {resource.amenities.length > 4 ? (
              <Badge>+{resource.amenities.length - 4}</Badge>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="border-t border-border pt-3">
        <NextSlotHint resource={resource} />
        <Button
          size="sm"
          variant={resource.is_available_now ? "default" : "outline"}
          onClick={() => onBook(resource)}
          className="shrink-0"
        >
          {resource.is_available_now ? t.resourceCard.bookNow : t.resourceCard.viewSlots}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AvailabilityBadge({ resource }: { resource: ResourceWithAvailability }) {
  const { t } = useLocale();
  if (resource.is_available_now) {
    return <Badge variant="success">{t.resourceCard.available}</Badge>;
  }
  return <Badge variant="warning">{t.resourceCard.busy}</Badge>;
}

function NextSlotHint({ resource }: { resource: ResourceWithAvailability }) {
  const { t } = useLocale();
  if (resource.is_available_now) {
    return <span className="text-xs text-fg-muted">{t.resourceCard.openNow}</span>;
  }
  if (!resource.next_available_at) {
    return <span className="text-xs text-fg-muted">{t.resourceCard.noSlots}</span>;
  }
  const when = new Date(resource.next_available_at);
  const time = when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
      <CalendarClock className="size-3.5" />
      {t.resourceCard.freeAt.replace("{{time}}", time)}
    </span>
  );
}
