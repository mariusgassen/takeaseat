"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ResourceSearchFilters, ResourceType } from "@/lib/api/types";

const TYPES = new Set<ResourceType>(["room", "desk", "parking", "equipment"]);

function parseFilters(params: URLSearchParams): ResourceSearchFilters {
  const typeRaw = params.get("type");
  const type = typeRaw && TYPES.has(typeRaw as ResourceType) ? (typeRaw as ResourceType) : undefined;
  const capacity_min = params.get("capacity_min");
  const floor = params.get("floor");
  const amenities = params.get("amenities");
  const q = params.get("q");
  return {
    type,
    capacity_min: capacity_min ? Number.parseInt(capacity_min, 10) : undefined,
    floor: floor ? Number.parseInt(floor, 10) : undefined,
    amenities: amenities ? amenities.split(",").filter(Boolean) : undefined,
    q: q || undefined,
    available_from: params.get("available_from") || undefined,
    available_until: params.get("available_until") || undefined,
  };
}

export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const update = React.useCallback(
    (patch: Partial<ResourceSearchFilters>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length === 0) next.delete(key);
          else next.set(key, value.join(","));
        } else {
          next.set(key, String(value));
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const reset = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { filters, update, reset };
}
