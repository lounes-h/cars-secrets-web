/**
 * Server-side client for the API. Only the web server calls the API: it forwards
 * the visitor's IP (with the shared internal key, so the API can trust it) and never exposes
 * API_URL or API_INTERNAL_KEY to the browser.
 */

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Bearer session token of the signed-in user. */
  token?: string;
  /** The visitor's address, forwarded for rate limiting. */
  clientIp?: string | null;
};

export function apiUrl(): string {
  return (process.env.API_URL ?? "http://localhost:8001").replace(/\/$/, "");
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, token, clientIp } = options;
  const method = options.method ?? (body === undefined ? "GET" : "POST");
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const key = process.env.API_INTERNAL_KEY;
  if (key && clientIp) {
    headers["x-internal-key"] = key;
    headers["x-client-ip"] = clientIp;
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (cause) {
    console.error(`[api] ${method} ${apiUrl()}${path} unreachable:`, cause);
    throw unavailable();
  }
  const data: unknown = await response.json().catch(() => null);
  if (response.ok) return data as T;
  const error = toApiError(response.status, data);
  if (error.code === "unavailable") {
    // Not an answer the API gives: usually API_URL points at another service.
    console.error(`[api] ${method} ${apiUrl()}${path} returned HTTP ${response.status}, unexpected body:`, data);
  }
  throw error;
}

function unavailable(): ApiError {
  return new ApiError(0, "unavailable", "The service is temporarily unavailable. Please try again in a moment.");
}

/** Maps the API's error bodies: a list of field errors (422) or `{code, message}`. */
export function toApiError(status: number, data: unknown): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (Array.isArray(detail)) {
    const fields: FieldErrors = {};
    for (const item of detail as { loc?: unknown[]; msg?: string }[]) {
      const field = item.loc?.[1];
      if (typeof field === "string" && item.msg) fields[field] = item.msg.replace(/^Value error, /, "");
    }
    return new ApiError(status, "validation", "Please correct the highlighted fields.", fields);
  }
  if (detail && typeof detail === "object" && typeof (detail as { code?: unknown }).code === "string") {
    const { code, message } = detail as { code: string; message?: string };
    return new ApiError(status, code, message ?? "Something went wrong. Please try again.");
  }
  // Anything else (a 404 page, a proxy error, another service's error format) did not come
  // from a working API.
  const error = unavailable();
  return new ApiError(status, error.code, error.message);
}
