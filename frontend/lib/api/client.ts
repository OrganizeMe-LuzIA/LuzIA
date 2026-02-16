import { ApiErrorPayload } from "@/lib/types/api";
import { clearStoredSession, notifySessionExpired } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

const DEFAULT_GET_CACHE_TTL_MS = 15_000;

interface CacheEntry {
  expiresAt: number;
  payload: unknown;
}

const responseCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  status: number;
  detail: ApiErrorPayload["detail"];

  constructor(message: string, status: number, detail: ApiErrorPayload["detail"]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  token?: string;
  body?: BodyInit | object;
  query?: Record<string, string | number | undefined | null>;
  useCache?: boolean;
  cacheTtlMs?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function parseErrorMessage(detail: ApiErrorPayload["detail"], fallback: string): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (first?.msg) {
      return first.msg;
    }
  }

  if (detail && typeof detail === "object" && "msg" in detail) {
    return String((detail as { msg: unknown }).msg);
  }

  return fallback;
}

function clearExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key);
    }
  }
}

function buildCacheKey(method: string, url: string, token?: string): string {
  return `${method}::${url}::${token || "anonymous"}`;
}

export function clearApiCache(): void {
  responseCache.clear();
  inFlightRequests.clear();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    token,
    query,
    body,
    headers,
    useCache = true,
    cacheTtlMs = DEFAULT_GET_CACHE_TTL_MS,
    method = "GET",
    signal,
    ...rest
  } = options;
  const resolvedHeaders = new Headers(headers);
  resolvedHeaders.set("Accept", "application/json");
  const normalizedMethod = method.toUpperCase();

  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (typeof body === "string" || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
      serializedBody = body;
    } else {
      serializedBody = JSON.stringify(body);
      if (!resolvedHeaders.has("Content-Type")) {
        resolvedHeaders.set("Content-Type", "application/json");
      }
    }
  }

  if (token) {
    resolvedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const requestUrl = buildUrl(path, query);
  const shouldUseCache = normalizedMethod === "GET" && useCache && cacheTtlMs > 0;
  const hasAbortSignal = Boolean(signal);
  const cacheKey = shouldUseCache ? buildCacheKey(normalizedMethod, requestUrl, token) : "";

  const makeRequest = async (): Promise<T> => {
    const response = await fetch(requestUrl, {
      ...rest,
      method: normalizedMethod,
      headers: resolvedHeaders,
      body: serializedBody,
      cache: "no-store",
      signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJsonBody = contentType.includes("application/json");
    const responseBody = hasJsonBody ? await response.json() : await response.text();

    if (!response.ok) {
      const detail = (responseBody as ApiErrorPayload)?.detail;
      const fallbackMessage = `Erro ${response.status} ao acessar ${path}`;

      if (response.status === 401 && token) {
        clearStoredSession();
        clearApiCache();
        notifySessionExpired();
      }

      throw new ApiError(parseErrorMessage(detail, fallbackMessage), response.status, detail);
    }

    if (normalizedMethod !== "GET") {
      clearApiCache();
    }

    return responseBody as T;
  };

  if (!shouldUseCache) {
    return makeRequest();
  }

  clearExpiredCacheEntries();

  const cachedEntry = responseCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.payload as T;
  }

  if (!hasAbortSignal) {
    const inFlightRequest = inFlightRequests.get(cacheKey);
    if (inFlightRequest) {
      return inFlightRequest as Promise<T>;
    }
  }

  const requestPromise = makeRequest()
    .then((payload) => {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + cacheTtlMs,
        payload,
      });
      return payload;
    })
    .finally(() => {
      if (!hasAbortSignal) {
        inFlightRequests.delete(cacheKey);
      }
    });

  if (!hasAbortSignal) {
    inFlightRequests.set(cacheKey, requestPromise as Promise<unknown>);
  }

  return requestPromise;
}

export { API_BASE_URL };
