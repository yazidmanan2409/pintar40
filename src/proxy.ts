import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Server-side route protection (FABLE-01 §4/§10; INV-37). Every
 * authenticated route is covered here, independent of any UI. This layer
 * refreshes the session and refuses anonymous access to protected paths;
 * authorization (scope/capability) is decided by the database primitives on
 * the page/route itself — never by the UI.
 *
 * Public in Phase 1: "/", "/masuk", auth callback. Everything else requires
 * a session. Dev-only routes are additionally gated by NODE_ENV in their
 * handlers (INV-21).
 */
const PUBLIC_PATHS = new Set(["/", "/masuk", "/masuk/kartu", "/auth/callback", "/keluar"]);
// INV-38: exactly one public certificate verification surface. It is a prefix
// rather than a fixed path because the token is in the URL, and it is the ONLY
// prefix here — a second verification shape would be a second route, which the
// invariant forbids. `public_surface_registry` declares it and
// `assert_public_surface()` asserts the declaration matches reality.
const PUBLIC_PREFIXES = ["/verifikasi/"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  // /api/dev/* is decided by its own handler: a plain 404 outside development
  // (FABLE-01 §11) — a 401 here would reveal that the namespace exists.
  const isDevNamespace = path === "/api/dev" || path.startsWith("/api/dev/");
  const isPublic = PUBLIC_PATHS.has(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p)) || isDevNamespace || path.startsWith("/_next") || path === "/favicon.ico";

  if (!user && !isPublic) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.searchParams.set("lanjut", path);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
