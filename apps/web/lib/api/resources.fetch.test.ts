import { afterEach, describe, expect, it, vi } from "vitest";
import { searchResources } from "./resources";

vi.mock("./client", () => ({
  apiListResources: vi.fn(),
}));

import { apiListResources } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchResources", () => {
  it("calls apiListResources with empty object when filters are empty", async () => {
    vi.mocked(apiListResources).mockResolvedValue({
      status: 200,
      data: { data: [], has_more: false, next_cursor: null },
    } as any);
    await searchResources({});
    expect(apiListResources).toHaveBeenCalledWith({}, expect.any(Object));
  });

  it("passes filters as params when present", async () => {
    vi.mocked(apiListResources).mockResolvedValue({
      status: 200,
      data: { data: [], has_more: false, next_cursor: null },
    } as any);
    await searchResources({ type: "desk", capacity_min: 2 });
    expect(apiListResources).toHaveBeenCalledWith(
      { type: "desk", capacity_min: 2 },
      expect.any(Object)
    );
  });

  it("throws when unauthorized", async () => {
    vi.mocked(apiListResources).mockResolvedValue({
      status: 401,
      data: { type: "about:blank", title: "Unauthorized", status: 401 },
    } as any);
    await expect(searchResources({})).rejects.toThrow("Unauthorized");
  });

  it("throws when response is not ok", async () => {
    vi.mocked(apiListResources).mockResolvedValue({
      status: 500,
      data: { type: "about:blank", title: "Internal Server Error", status: 500 },
    } as any);
    await expect(searchResources({})).rejects.toThrow(/500/);
  });

  it("returns the parsed data array on success", async () => {
    const sample = [{ id: "r1", name: "Aurora", tenant_id: "t1", type: "desk", capacity: 1, amenities: [], is_active: true, created_at: "2026-01-01T00:00:00Z", is_available_now: true, next_available_at: null }] as any;
    vi.mocked(apiListResources).mockResolvedValue({
      status: 200,
      data: { data: sample, has_more: false, next_cursor: null },
    } as any);
    const result = await searchResources({});
    expect(result).toEqual(sample);
  });
});