"use client";
import * as React from "react";
import { SearchX } from "lucide-react";
import { Card, CardContent, CardHeader, EmptyState, Skeleton } from "@takeaseat/ui";
import type { ResourceWithAvailability } from "@/lib/api/types";
import { ResourceCard } from "./resource-card";
import { BookDialog } from "./book-dialog";

export interface ResultsGridProps {
  resources: ResourceWithAvailability[];
  loading: boolean;
  error: string | null;
}

export function ResultsGrid({ resources, loading, error }: ResultsGridProps) {
  const [selected, setSelected] = React.useState<ResourceWithAvailability | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="mt-3 h-5 w-2/3" />
              <Skeleton className="mt-1 h-3 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-3 h-6 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<SearchX className="size-5" />}
        title="Couldn't load resources"
        description={error}
      />
    );
  }

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-5" />}
        title="No resources match"
        description="Try widening the time window or removing a filter."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} onBook={setSelected} />
        ))}
      </div>
      <BookDialog resource={selected} onClose={() => setSelected(null)} />
    </>
  );
}
