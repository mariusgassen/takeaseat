import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BookDialog } from "./book-dialog";
import type { ResourceWithAvailability } from "@/lib/api/types";

vi.mock("@/lib/api/client", () => ({
  apiCreateReservation: vi.fn().mockResolvedValue({ status: 201, data: {} }),
  apiCreateRecurringSeries: vi.fn().mockResolvedValue({
    status: 201,
    data: {
      id: "series-1",
      occurrences_created: 4,
      occurrences_skipped: 0,
    },
  }),
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("calls apiCreateReservation and shows confirmation for single booking", async () => {
    const { apiCreateReservation } = await import("@/lib/api/client");
    render(<BookDialog resource={resource} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
    await waitFor(() => expect(screen.getByText("Reservation confirmed")).toBeInTheDocument());
    expect(apiCreateReservation).toHaveBeenCalledOnce();
  });

  it("shows recurrence options when repeat is toggled", async () => {
    render(<BookDialog resource={resource} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /repeat/i }));
    expect(screen.getByText("Frequency")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("calls apiCreateRecurringSeries for recurring booking", async () => {
    const { apiCreateRecurringSeries } = await import("@/lib/api/client");
    render(<BookDialog resource={resource} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /repeat/i }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
    await waitFor(() => expect(screen.getByText("Reservation confirmed")).toBeInTheDocument());
    expect(apiCreateRecurringSeries).toHaveBeenCalledOnce();
    expect(screen.getByText(/4 occurrence/)).toBeInTheDocument();
  });

  it("shows error when API returns 409", async () => {
    const { apiCreateReservation } = await import("@/lib/api/client");
    vi.mocked(apiCreateReservation).mockResolvedValueOnce({ status: 409, data: null });
    render(<BookDialog resource={resource} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/slot may be taken/)
    );
  });
});
