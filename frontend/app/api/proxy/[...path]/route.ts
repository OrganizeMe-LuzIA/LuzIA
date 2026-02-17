import { NextRequest, NextResponse } from "next/server";

const backendApiBaseUrl = (
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

function buildTargetUrl(request: NextRequest, pathSegments: string[]): URL {
  const path = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const target = new URL(`${backendApiBaseUrl}/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target;
}

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (normalized === "host" || normalized === "connection" || normalized === "content-length") {
      return;
    }
    // O backend não precisa do Origin para chamadas server-to-server.
    if (normalized === "origin") {
      return;
    }
    headers.set(key, value);
  });
  return headers;
}

async function proxy(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const url = buildTargetUrl(request, pathSegments);
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstream = await fetch(url.toString(), {
      method,
      headers: buildForwardHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { detail: "Falha de comunicação com o backend." },
      { status: 502 },
    );
  }
}

type RouteContext = {
  params: {
    path?: string[];
  };
};

async function handler(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxy(request, context.params.path ?? []);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
