import { NextResponse } from "next/server";

/** BOB-26: every Gate 3 route answers JSON, no-store, with Retry-After when it asks the person to wait. */
export function jawab(h: { status: number; body: unknown; retryAfter?: number }): NextResponse {
  const headers: Record<string, string> = { "cache-control": "no-store" };
  if (h.retryAfter) headers["retry-after"] = String(h.retryAfter);
  return NextResponse.json(h.body, { status: h.status, headers });
}

/** A browser that lands on a POST-only door has nothing to see. */
export function kembaliKe(lokasi: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { location: lokasi, "cache-control": "no-store" } });
}
