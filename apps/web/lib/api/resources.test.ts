import { describe, expect, it } from "vitest";
import { buildSearchQuery } from "./resources";

describe("buildSearchQuery", () => {
  it("returns an empty string when no filters are set", () => {
    expect(buildSearchQuery({})).toBe("");
  });

  it("encodes scalar filters", () => {
    const qs = buildSearchQuery({ type: "desk", capacity_min: 2, floor: 3 });
    const params = new URLSearchParams(qs);
    expect(params.get("type")).toBe("desk");
    expect(params.get("capacity_min")).toBe("2");
    expect(params.get("floor")).toBe("3");
  });

  it("joins amenities with commas", () => {
    const qs = buildSearchQuery({ amenities: ["whiteboard", "tv_screen"] });
    expect(new URLSearchParams(qs).get("amenities")).toBe("whiteboard,tv_screen");
  });

  it("omits empty amenity arrays", () => {
    expect(buildSearchQuery({ amenities: [] })).toBe("");
  });

  it("includes available_from / available_until when present", () => {
    const qs = buildSearchQuery({
      available_from: "2026-04-18T10:00:00Z",
      available_until: "2026-04-18T11:00:00Z",
    });
    const params = new URLSearchParams(qs);
    expect(params.get("available_from")).toBe("2026-04-18T10:00:00Z");
    expect(params.get("available_until")).toBe("2026-04-18T11:00:00Z");
  });
});
