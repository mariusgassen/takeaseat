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
} from "@takeaseat/ui";
import type { ResourceWithAvailability } from "@/lib/api/types";
import { TYPE_META, formatAmenity, formatFloor } from "./type-meta";

export interface ResourceCardProps {
  resource: ResourceWithAvailability;
  onBook: (resource: ResourceWithAvailability) => void;
}

export function ResourceCard({ resource, onBook }: ResourceCardProps) {
  const meta = TYPE_META[resource.type];
  const Icon = meta.icon;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Icon className="size-5" />
          </span>
          <div className="space-y-1">
            <CardTitle>{resource.name}</CardTitle>
            <p className="text-xs uppercase tracking-wide text-fg-muted">{meta.label}</p>
          </div>
        </div>
        <AvailabilityBadge resource={resource} />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {resource.capacity === 1 ? "1 seat" : `${resource.capacity} seats`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {formatFloor(resource.floor)}
          </span>
        </div>

        {resource.amenities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {resource.amenities.slice(0, 4).map((a) => (
              <Badge key={a}>{formatAmenity(a)}</Badge>
            ))}
            {resource.amenities.length > 4 ? (
              <Badge>+{resource.amenities.length - 4}</Badge>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <CardFooter>
        <NextSlotHint resource={resource} />
        <Button
          size="sm"
          variant={resource.is_available_now ? "default" : "outline"}
          onClick={() => onBook(resource)}
        >
          {resource.is_available_now ? "Book now" : "View slots"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AvailabilityBadge({ resource }: { resource: ResourceWithAvailability }) {
  if (resource.is_available_now) {
    return <Badge variant="success">Available</Badge>;
  }
  return <Badge variant="warning">Busy</Badge>;
}

function NextSlotHint({ resource }: { resource: ResourceWithAvailability }) {
  if (resource.is_available_now) {
    return <span className="text-xs text-fg-muted">Open right now</span>;
  }
  if (!resource.next_available_at) {
    return <span className="text-xs text-fg-muted">No upcoming slots</span>;
  }
  const when = new Date(resource.next_available_at);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
      <CalendarClock className="size-3.5" />
      Free at{" "}
      {when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}
