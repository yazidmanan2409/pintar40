import { NextResponse } from "next/server";

/**
 * Dev-only tooling namespace (FABLE-01 §11; INV-21). Outside
 * NODE_ENV === 'development' every path under /api/dev/* is a plain 404 —
 * indistinguishable from a route that does not exist. Tools that exist here
 * in development produce evidence only inside synthetic tenants.
 */
function notFound() {
  return new NextResponse("Not Found", { status: 404 });
}

export async function GET(_: Request, ctx: { params: Promise<{ tool?: string[] }> }) {
  if (process.env.NODE_ENV !== "development") return notFound();
  const { tool } = await ctx.params;
  const name = (tool ?? []).join("/");
  if (name === "ping") return NextResponse.json({ ok: true, environment: "development" });
  return notFound();
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") return notFound();
  return notFound();
}
