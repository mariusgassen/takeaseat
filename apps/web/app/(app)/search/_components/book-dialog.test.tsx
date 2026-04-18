import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookDialog } from "./book-dialog";
import type { ResourceWithAvailability } from "@/lib/api/types";

const resource: ResourceWithAvailability = {
  id: "00000000-0000-0000-0000-000000000001",
  tenant_id: "00000000-0000-0000-0000-0000000000aa",
  name: "Aurora",
  type: "room",
  capacity: 12,
  floor: 3,
  amenities: [],
  is_active: true,
  created_at: "2026-01-12T09:00:00Z",
  next_available_at: null,
  is_available_now: true,
};

describe("BookDialog", () => {
  it("renders nothing when resource is null", () => {
    const { container } = render(<BookDialog resource={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the resource name in the title and closes on Cancel", async () => {
    const onClose = vi.fn();
    render(<BookDialog resource={resource} onClose={onClose} />);
    expect(screen.getByText("Book Aurora")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("transitions to confirmation when Confirm is clicked", async () => {
    render(<BookDialog resource={resource} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
    expect(await screen.findByText("Reservation confirmed")).toBeInTheDocument();
  });
});
