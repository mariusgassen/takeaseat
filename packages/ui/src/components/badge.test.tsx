import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Beta</Badge>);
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("applies variant class for accent", () => {
    render(<Badge variant="accent">New</Badge>);
    expect(screen.getByText("New").className).toContain("bg-accent-soft");
  });

  it("applies variant class for success", () => {
    render(<Badge variant="success">OK</Badge>);
    expect(screen.getByText("OK").className).toContain("text-success");
  });
});
