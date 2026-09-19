import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, toApiError } from "@/lib/api";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("API_URL", "http://api.test/");
  vi.stubEnv("API_INTERNAL_KEY", "internal-key");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("api", () => {
  it("posts JSON with the bearer token and the forwarded visitor address", async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true }));
    await expect(api("/api/auth/me", { body: { a: 1 }, token: "tok", clientIp: "1.2.3.4" })).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/auth/me");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      authorization: "Bearer tok",
      "x-internal-key": "internal-key",
      "x-client-ip": "1.2.3.4",
    });
  });

  it("does not send the internal key without a visitor address", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await api("/api/health");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("x-internal-key");
  });

  it("turns error bodies into ApiError", async () => {
    fetchMock.mockResolvedValue(json(403, { detail: { code: "email_unverified", message: "Confirm first." } }));
    await expect(api("/api/auth/login", { body: {} })).rejects.toMatchObject({
      status: 403,
      code: "email_unverified",
      message: "Confirm first.",
    });
  });

  it("reports an unreachable API as unavailable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(api("/api/health")).rejects.toMatchObject({ code: "unavailable", status: 0 });
  });
});

describe("toApiError", () => {
  it("maps 422 field errors to their field names", () => {
    const error = toApiError(422, {
      detail: [
        { loc: ["body", "password"], msg: "Use 10 to 128 characters." },
        { loc: ["body", "email"], msg: "Value error, bad" },
      ],
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("validation");
    expect(error.fields).toEqual({ password: "Use 10 to 128 characters.", email: "bad" });
  });

  it("falls back to a generic message", () => {
    expect(toApiError(500, null).message).toMatch(/try again/i);
  });
});
