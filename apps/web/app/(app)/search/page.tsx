"use client";
import * as React from "react";
import { searchResources } from "@/lib/api/resources";
import { useSearchFilters } from "@/lib/hooks/use-search-filters";
import type { ResourceWithAvailability } from "@/lib/api/types";
import { FilterBar } from "./_components/filter-bar";
import { ResultsGrid } from "./_components/results-grid";
import { TYPE_META } from "./_components/type-meta";

export default function SearchPage() {
  const { filters } = useSearchFilters();
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

  const heading = filters.type ? TYPE_META[filters.type].pluralLabel : "All resources";
  const availableCount = resources.filter((r) => r.is_available_now).length;

  return (
    <>
      <FilterBar />
      <section className="mx-auto mt-6 max-w-6xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
            <p className="text-sm text-fg-muted">
              {loading
                ? "Searching…"
                : `${resources.length} match${resources.length === 1 ? "" : "es"} · ${availableCount} available now`}
            </p>
          </div>
        </header>
        <ResultsGrid resources={resources} loading={loading} error={error} />
      </section>
    </>
  );
}
