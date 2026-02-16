import { ApiErrorPayload } from "@/lib/types/api";
import { clearStoredSession, notifySessionExpired } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, query, body, headers, ...rest } = options;
  const resolvedHeaders = new Headers(headers);
  resolvedHeaders.set("Accept", "application/json");

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

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: resolvedHeaders,
    body: serializedBody,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const hasJsonBody = contentType.includes("application/json");
  const responseBody = hasJsonBody ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = (responseBody as ApiErrorPayload)?.detail;
    const fallbackMessage = `Erro ${response.status} ao acessar ${path}`;

    if (response.status === 401 && token) {
      clearStoredSession();
      notifySessionExpired();
    }

    throw new ApiError(parseErrorMessage(detail, fallbackMessage), response.status, detail);
  }

  return responseBody as T;
}

export { API_BASE_URL };
