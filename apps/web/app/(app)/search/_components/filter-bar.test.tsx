import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterBar } from "./filter-bar";

const replace = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/search",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

beforeEach(() => {
  replace.mockReset();
  currentSearch = "";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FilterBar", () => {
  it("renders a search input and the four type toggles", () => {
    render(<FilterBar />);
    expect(screen.getByLabelText("Search resources")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Meeting rooms" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Desks" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Parking" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Equipment" })).toBeInTheDocument();
  });

  it("writes the type filter to the URL when a toggle is clicked", async () => {
    render(<FilterBar />);
    await userEvent.click(screen.getByRole("radio", { name: "Desks" }));
    expect(replace).toHaveBeenCalledWith("/search?type=desk", { scroll: false });
  });

  it("debounces text input before writing q to the URL", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<FilterBar />);
    const input = screen.getByLabelText("Search resources");
    await userEvent.type(input, "aurora");
    await vi.advanceTimersByTimeAsync(300);
    expect(replace).toHaveBeenCalled();
    const lastCall = replace.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("q=aurora");
  });

  it("shows the active filter count badge and a Clear button when filters are active", async () => {
    currentSearch = "type=room&capacity_min=4";
    render(<FilterBar />);
    expect(screen.getByText("2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Clear/ }));
    expect(replace).toHaveBeenCalledWith("/search", { scroll: false });
  });

  it("renders amenity chips with remove buttons when amenities are active", async () => {
    currentSearch = "amenities=whiteboard,tv_screen";
    render(<FilterBar />);
    expect(screen.getByText("Whiteboard")).toBeInTheDocument();
    expect(screen.getByText("Tv Screen")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove whiteboard" }));
    const lastCall = replace.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("amenities=tv_screen");
  });
});
