import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResourceCard } from "./resource-card";
import type { ResourceWithAvailability } from "@/lib/api/types";

const baseResource: ResourceWithAvailability = {
  id: "00000000-0000-0000-0000-000000000001",
  tenant_id: "00000000-0000-0000-0000-0000000000aa",
  name: "Aurora",
  type: "room",
  capacity: 12,
  floor: 3,
  amenities: ["whiteboard", "tv_screen"],
  is_active: true,
  created_at: "2026-01-12T09:00:00Z",
  next_available_at: null,
  is_available_now: true,
};

describe("ResourceCard", () => {
  it("renders name, capacity, floor and an Available badge when bookable now", () => {
    render(<ResourceCard resource={baseResource} onBook={vi.fn()} />);
    expect(screen.getByText("Aurora")).toBeInTheDocument();
    expect(screen.getByText("12 seats")).toBeInTheDocument();
    expect(screen.getByText("Floor 3")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book now" })).toBeInTheDocument();
  });

  it("shows Busy badge and View slots CTA when not available now", () => {
    render(
      <ResourceCard
        resource={{ ...baseResource, is_available_now: false, next_available_at: "2026-04-18T13:30:00Z" }}
        onBook={vi.fn()}
      />
    );
    expect(screen.getByText("Busy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View slots" })).toBeInTheDocument();
  });

  it("invokes onBook with the resource when CTA is clicked", async () => {
    const onBook = vi.fn();
    render(<ResourceCard resource={baseResource} onBook={onBook} />);
    await userEvent.click(screen.getByRole("button", { name: "Book now" }));
    expect(onBook).toHaveBeenCalledWith(baseResource);
  });

  it("collapses amenities beyond four into a +N badge", () => {
    render(
      <ResourceCard
        resource={{
          ...baseResource,
          amenities: ["a", "b", "c", "d", "e", "f"],
        }}
        onBook={vi.fn()}
      />
    );
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders 1 seat (singular) for capacity = 1", () => {
    render(
      <ResourceCard
        resource={{ ...baseResource, capacity: 1, type: "desk", name: "Desk 1" }}
        onBook={vi.fn()}
      />
    );
    expect(screen.getByText("1 seat")).toBeInTheDocument();
  });
});
