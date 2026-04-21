import {
  Armchair,
  Box,
  Building2,
  CarFront,
  type LucideIcon,
  Users,
} from "lucide-react";
import type { ResourceType } from "@/lib/api/types";

export interface TypeMeta {
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  borderClass: string;
  iconClass: string;
}

export const TYPE_META: Record<ResourceType, TypeMeta> = {
  room: {
    label: "Room",
    pluralLabel: "Meeting rooms",
    icon: Users,
    borderClass: "border-t-blue-500",
    iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  },
  desk: {
    label: "Desk",
    pluralLabel: "Desks",
    icon: Armchair,
    borderClass: "border-t-emerald-500",
    iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  parking: {
    label: "Parking",
    pluralLabel: "Parking",
    icon: CarFront,
    borderClass: "border-t-amber-500",
    iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  },
  equipment: {
    label: "Equipment",
    pluralLabel: "Equipment",
    icon: Box,
    borderClass: "border-t-violet-500",
    iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  },
};

export const TYPE_ORDER: ResourceType[] = ["room", "desk", "parking", "equipment"];

export const FALLBACK_ICON = Building2;

export function formatAmenity(slug: string): string {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatFloor(floor: number | null): string {
  if (floor === null) return "—";
  if (floor === 0) return "Ground";
  if (floor < 0) return `B${Math.abs(floor)}`;
  return `Floor ${floor}`;
}
