import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSearchFilters } from "./use-search-filters";

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

describe("useSearchFilters", () => {
  it("parses an empty URL into an empty filter object", () => {
    const { result } = renderHook(() => useSearchFilters());
    expect(result.current.filters).toEqual({
      type: undefined,
      capacity_min: undefined,
      floor: undefined,
      amenities: undefined,
      q: undefined,
      available_from: undefined,
      available_until: undefined,
    });
  });

  it("parses scalar filters from the URL", () => {
    currentSearch = "type=desk&capacity_min=4&floor=2&q=aurora";
    const { result } = renderHook(() => useSearchFilters());
    expect(result.current.filters).toMatchObject({
      type: "desk",
      capacity_min: 4,
      floor: 2,
      q: "aurora",
    });
  });

  it("ignores invalid resource types", () => {
    currentSearch = "type=skill";
    const { result } = renderHook(() => useSearchFilters());
    expect(result.current.filters.type).toBeUndefined();
  });

  it("parses comma-separated amenities", () => {
    currentSearch = "amenities=whiteboard,tv_screen";
    const { result } = renderHook(() => useSearchFilters());
    expect(result.current.filters.amenities).toEqual(["whiteboard", "tv_screen"]);
  });

  it("update() writes new params via router.replace", () => {
    const { result } = renderHook(() => useSearchFilters());
    act(() => result.current.update({ type: "room", capacity_min: 8 }));
    expect(replace).toHaveBeenCalledWith("/search?type=room&capacity_min=8", { scroll: false });
  });

  it("update() clears keys when value is undefined or empty array", () => {
    currentSearch = "type=room&amenities=whiteboard";
    const { result } = renderHook(() => useSearchFilters());
    act(() => result.current.update({ type: undefined, amenities: [] }));
    expect(replace).toHaveBeenCalledWith("/search", { scroll: false });
  });

  it("reset() clears every filter", () => {
    currentSearch = "type=room&capacity_min=8";
    const { result } = renderHook(() => useSearchFilters());
    act(() => result.current.reset());
    expect(replace).toHaveBeenCalledWith("/search", { scroll: false });
  });
});
