import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileNav } from "./mobile-nav";

let currentPathname = "/search";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

describe("MobileNav", () => {
  it("renders all three nav links", () => {
    render(<MobileNav />);
    expect(screen.getByRole("link", { name: /Search/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Reservations/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Favorites/i })).toBeInTheDocument();
  });

  it("applies active styling to the current route link", () => {
    currentPathname = "/reservations";
    render(<MobileNav />);
    const active = screen.getByRole("link", { name: /Reservations/i });
    expect(active.className).toContain("text-accent");
    const inactive = screen.getByRole("link", { name: /Search/i });
    expect(inactive.className).toContain("text-fg-muted");
  });
});
