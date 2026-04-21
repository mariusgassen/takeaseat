"use client";
import * as React from "react";
import { Filter, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import {
  Badge,
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SelectNative,
  Separator,
  ToggleGroup,
  ToggleGroupItem,
} from "@takeaseat/ui";
import { useSearchFilters } from "@/lib/hooks/use-search-filters";
import { ALL_AMENITIES, ALL_FLOORS } from "@/lib/mocks/resources";
import type { ResourceType } from "@/lib/api/types";
import { TYPE_META, TYPE_ORDER } from "./type-meta";
import { useLocale, localizeAmenity } from "@/lib/i18n/context";

export function FilterBar() {
  const { filters, update, reset } = useSearchFilters();
  const { t } = useLocale();
  const [qLocal, setQLocal] = React.useState(filters.q ?? "");

  React.useEffect(() => {
    setQLocal(filters.q ?? "");
  }, [filters.q]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      if ((filters.q ?? "") !== qLocal) update({ q: qLocal || undefined });
    }, 250);
    return () => window.clearTimeout(id);
  }, [qLocal, filters.q, update]);

  const activeAmenities = filters.amenities ?? [];

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    (filters.capacity_min ? 1 : 0) +
    (filters.floor !== undefined ? 1 : 0) +
    activeAmenities.length;

  return (
    <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-bg/85 px-4 py-4 backdrop-blur md:-mx-8 md:px-8 supports-[padding:max(0px)]:pl-[max(1rem,env(safe-area-inset-left))] supports-[padding:max(0px)]:pr-[max(1rem,env(safe-area-inset-right))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <Input
              aria-label="Search resources"
              placeholder={t.search.placeholder}
              className="pl-9"
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="md" className="gap-2">
                  <SlidersHorizontal className="size-4" />
                  {t.search.filters}
                  {activeFilterCount > 0 ? (
                    <Badge variant="accent" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <FilterPopover />
              </PopoverContent>
            </Popover>

            {activeFilterCount > 0 ? (
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <X className="size-3.5" /> {t.search.clear}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Horizontally scrollable type toggle — prevents wrapping on mobile */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:-mx-8 md:px-8">
          <ToggleGroup
            type="single"
            value={filters.type ?? ""}
            onValueChange={(value) =>
              update({ type: (value || undefined) as ResourceType | undefined })
            }
            aria-label="Resource type"
            className="w-max"
          >
            {TYPE_ORDER.map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              return (
                <ToggleGroupItem
                  key={type}
                  value={type}
                  aria-label={t.types[type].pluralLabel}
                >
                  <Icon className="size-4" />
                  {t.types[type].pluralLabel}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>

        {activeAmenities.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-fg-muted">
              <Filter className="mr-1 inline size-3.5" />
              {t.search.amenitiesLabel}
            </span>
            {activeAmenities.map((slug) => (
              <Badge key={slug} variant="accent" className="gap-1">
                {localizeAmenity(slug, t.amenities)}
                <button
                  type="button"
                  aria-label={t.search.removeAmenity.replace("{{name}}", localizeAmenity(slug, t.amenities))}
                  className="-mr-1 rounded-sm opacity-70 hover:opacity-100"
                  onClick={() =>
                    update({ amenities: activeAmenities.filter((a) => a !== slug) })
                  }
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterPopover() {
  const { filters, update } = useSearchFilters();
  const { t } = useLocale();
  const activeAmenities = filters.amenities ?? [];

  function toggleAmenity(slug: string) {
    const next = activeAmenities.includes(slug)
      ? activeAmenities.filter((a) => a !== slug)
      : [...activeAmenities, slug];
    update({ amenities: next });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-capacity">{t.search.minCapacity}</Label>
        <Input
          id="filter-capacity"
          type="number"
          inputMode="numeric"
          min={1}
          value={filters.capacity_min ?? ""}
          onChange={(e) =>
            update({ capacity_min: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="Any"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-floor">{t.search.floor}</Label>
        <SelectNative
          id="filter-floor"
          value={filters.floor !== undefined ? String(filters.floor) : ""}
          onChange={(e) =>
            update({ floor: e.target.value === "" ? undefined : Number(e.target.value) })
          }
        >
          <option value="">{t.search.anyFloor}</option>
          {ALL_FLOORS.map((floor) => (
            <option key={floor} value={floor}>
              {floor === 0
                ? t.floors.ground
                : floor < 0
                  ? t.floors.basement.replace("{{n}}", String(Math.abs(floor)))
                  : t.floors.floor.replace("{{n}}", String(floor))}
            </option>
          ))}
        </SelectNative>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>{t.search.amenitiesLabel.replace(":", "")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_AMENITIES.map((slug) => {
            const active = activeAmenities.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleAmenity(slug)}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
                    : "rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg-muted hover:text-fg"
                }
              >
                {localizeAmenity(slug, t.amenities)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
