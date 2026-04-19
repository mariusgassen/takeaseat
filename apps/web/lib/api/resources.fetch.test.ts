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
      headers: new Headers(),
    });
    await searchResources({});
    expect(apiListResources).toHaveBeenCalledWith({}, expect.any(Object));
  });

  it("passes filters as params when present", async () => {
    vi.mocked(apiListResources).mockResolvedValue({
      status: 200,
      data: { data: [], has_more: false, next_cursor: null },
      headers: new Headers(),
    });
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
      headers: new Headers(),
    });
    await expect(searchResources({})).rejects.toThrow("Unauthorized");
  });

  it("throws when response is not ok", async () => {
    vi.mocked(apiListResources).mockResolvedValue({
      status: 500,
      data: { type: "about:blank", title: "Internal Server Error", status: 500 },
      headers: new Headers(),
    });
    await expect(searchResources({})).rejects.toThrow(/500/);
  });

  it("returns the parsed data array on success", async () => {
    const sample = [{ id: "r1", name: "Aurora" }] as any;
    vi.mocked(apiListResources).mockResolvedValue({
      status: 200,
      data: { data: sample, has_more: false, next_cursor: null },
      headers: new Headers(),
    });
    const result = await searchResources({});
    expect(result).toEqual(sample);
  });
});