import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultsGrid } from "./results-grid";
import type { ResourceWithAvailability } from "@/lib/api/types";

const sample: ResourceWithAvailability = {
  id: "00000000-0000-0000-0000-000000000001",
  tenant_id: "00000000-0000-0000-0000-0000000000aa",
  name: "Aurora",
  type: "room",
  capacity: 12,
  floor: 3,
  amenities: ["whiteboard"],
  is_active: true,
  created_at: "2026-01-12T09:00:00Z",
  next_available_at: null,
  is_available_now: true,
};

describe("ResultsGrid", () => {
  it("renders skeleton placeholders while loading", () => {
    const { container } = render(<ResultsGrid resources={[]} loading={true} error={null} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders error empty-state when error is present", () => {
    render(<ResultsGrid resources={[]} loading={false} error="boom" />);
    expect(screen.getByText("Couldn't load resources")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders no-match empty-state when result list is empty", () => {
    render(<ResultsGrid resources={[]} loading={false} error={null} />);
    expect(screen.getByText("No resources match")).toBeInTheDocument();
  });

  it("renders one card per resource", () => {
    render(<ResultsGrid resources={[sample]} loading={false} error={null} />);
    expect(screen.getByText("Aurora")).toBeInTheDocument();
  });
});
