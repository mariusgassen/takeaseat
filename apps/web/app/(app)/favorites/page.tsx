import { Star } from "lucide-react";
import { EmptyState } from "@takeaseat/ui";

export default function FavoritesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-sm text-fg-muted">
          Star resources from search to find them quickly here.
        </p>
      </header>
      <EmptyState
        icon={<Star className="size-5" />}
        title="No favorites yet"
        description="Open a resource and tap the star to keep it close at hand."
      />
    </div>
  );
}
