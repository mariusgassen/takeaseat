import { afterEach, describe, expect, it, vi } from "vitest";
import { searchResources } from "./resources";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchResources", () => {
  it("calls the mock endpoint with no query when filters are empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [], has_more: false, next_cursor: null }), {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    await searchResources({});
    expect(fetchMock).toHaveBeenCalledWith("/api/mock/resources", expect.any(Object));
  });

  it("appends a query string when filters are present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [], has_more: false, next_cursor: null }), {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    await searchResources({ type: "desk", capacity_min: 2 });
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url.startsWith("/api/mock/resources?")).toBe(true);
    expect(url).toContain("type=desk");
    expect(url).toContain("capacity_min=2");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 }))
    );
    await expect(searchResources({})).rejects.toThrow(/500/);
  });

  it("returns the parsed data array on success", async () => {
    const sample = [{ id: "r1", name: "Aurora" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: sample, has_more: false, next_cursor: null }), {
          status: 200,
        })
      )
    );
    const result = await searchResources({});
    expect(result).toEqual(sample);
  });
});
