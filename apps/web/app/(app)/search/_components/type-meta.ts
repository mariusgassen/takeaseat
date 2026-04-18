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
}

export const TYPE_META: Record<ResourceType, TypeMeta> = {
  room: { label: "Room", pluralLabel: "Meeting rooms", icon: Users },
  desk: { label: "Desk", pluralLabel: "Desks", icon: Armchair },
  parking: { label: "Parking", pluralLabel: "Parking", icon: CarFront },
  equipment: { label: "Equipment", pluralLabel: "Equipment", icon: Box },
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
