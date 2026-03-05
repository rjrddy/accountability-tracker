import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAuthHeaders, createGoal } from "@/lib/client/api";

describe("client api createGoal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("buildAuthHeaders includes bearer token", async () => {
    const user = {
      getIdToken: vi.fn().mockResolvedValue("token-123")
    } as never;

    const headers = await buildAuthHeaders(user);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("sends Authorization header in signed-in mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "g1",
          kind: "oneTime",
          uiKey: "oneTime:g1",
          date: "2026-03-05",
          text: "Read",
          completed: false,
          createdAt: "2026-03-05T00:00:00.000Z"
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = {
      getIdToken: vi.fn().mockResolvedValue("token-123")
    } as never;

    await createGoal(user, "2026-03-05", "Read");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer token-123");
  });

  it("throws helpful message on non-OK response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = {
      getIdToken: vi.fn().mockResolvedValue("bad-token")
    } as never;

    await expect(createGoal(user, "2026-03-05", "Read")).rejects.toThrow("HTTP 401: Unauthorized");
  });

  it("refreshes token and retries once when first response is 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Invalid bearer token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "g1",
            kind: "oneTime",
            uiKey: "oneTime:g1",
            date: "2026-03-05",
            text: "Read",
            completed: false,
            createdAt: "2026-03-05T00:00:00.000Z"
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const getIdToken = vi
      .fn()
      .mockImplementationOnce(async () => "stale-token")
      .mockImplementationOnce(async () => "fresh-token");
    const user = { getIdToken } as never;

    await createGoal(user, "2026-03-05", "Read");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
  });
});
