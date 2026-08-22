import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getTokenServer() {
  try {
    const { token } = await auth.api.getToken({ headers: await headers() });
    return token || null;
  } catch {
    return null;
  }
}

async function handler(req, { params }) {
  const { path } = await params;
  const token = await getTokenServer();

  const url = new URL(`${BACKEND_URL}/api/${path.join("/")}`);
  url.search = req.nextUrl.search;

  const init = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(process.env.INTERNAL_PROXY_SECRET
        ? { "x-internal-secret": process.env.INTERNAL_PROXY_SECRET }
        : {}),
    },
  };

  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.text();
  }

  try {
    const backendRes = await fetch(url, init);
    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { "Content-Type": backendRes.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error(`Proxy request to ${url} failed:`, err.message);
    return NextResponse.json({ error: "Couldn't reach the backend." }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };