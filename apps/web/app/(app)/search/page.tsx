"use client";
import * as React from "react";
import { searchResources } from "@/lib/api/resources";
import { useSearchFilters } from "@/lib/hooks/use-search-filters";
import type { ResourceWithAvailability } from "@/lib/api/types";
import { useLocale } from "@/lib/i18n/context";
import { FilterBar } from "./_components/filter-bar";
import { ResultsGrid } from "./_components/results-grid";

export default function SearchPage() {
  const { filters } = useSearchFilters();
  const { t } = useLocale();
  const [resources, setResources] = React.useState<ResourceWithAvailability[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    searchResources(filters, controller.signal)
      .then((data) => setResources(data))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [filters]);

  const heading = filters.type ? t.types[filters.type].pluralLabel : t.search.heading;

  const matchText = loading
    ? t.search.searching
    : [
        resources.length === 1 ? t.search.matchSingular : t.search.matchPlural.replace("{{count}}", String(resources.length)),
        t.search.availableNow.replace("{{count}}", String(resources.filter((r) => r.is_available_now).length)),
      ].join(" · ");

  return (
    <>
      <FilterBar />
      <section className="mx-auto mt-6 max-w-6xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
            <p className="text-sm text-fg-muted">{matchText}</p>
          </div>
        </header>
        <ResultsGrid resources={resources} loading={loading} error={error} />
      </section>
    </>
  );
}
