import { describe, expect, it } from "vitest";
import { TYPE_META, TYPE_ORDER, formatAmenity, formatFloor } from "./type-meta";

describe("type-meta", () => {
  it("exposes meta for every resource type in TYPE_ORDER", () => {
    for (const type of TYPE_ORDER) {
      expect(TYPE_META[type]).toBeDefined();
      expect(TYPE_META[type].label).toBeTruthy();
      expect(TYPE_META[type].pluralLabel).toBeTruthy();
    }
  });

  describe("formatAmenity", () => {
    it("title-cases and replaces underscores", () => {
      expect(formatAmenity("tv_screen")).toBe("Tv Screen");
      expect(formatAmenity("ev_charger")).toBe("Ev Charger");
    });

    it("handles single words", () => {
      expect(formatAmenity("whiteboard")).toBe("Whiteboard");
    });
  });

  describe("formatFloor", () => {
    it("formats null as em dash", () => {
      expect(formatFloor(null)).toBe("—");
    });

    it("formats 0 as Ground", () => {
      expect(formatFloor(0)).toBe("Ground");
    });

    it("formats positive floors", () => {
      expect(formatFloor(3)).toBe("Floor 3");
    });

    it("formats basement floors", () => {
      expect(formatFloor(-1)).toBe("B1");
      expect(formatFloor(-2)).toBe("B2");
    });
  });
});
