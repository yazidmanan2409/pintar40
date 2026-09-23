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
// INV-38: exactly one public certificate verification surface. Both entries
// below ARE that one surface — the route a QR code points at, and the data
// endpoint that route reads. `public_surface_registry` records the second as
// a CHILD of the first (`parent: certificate_verification`), not as a second
// verification shape, which is what the invariant forbids. They are prefixes
// rather than fixed paths because the token is in the URL.
//
// THE ENDPOINT HAS TO BE HERE. The page fetches
// `${appUrl()}/api/verifikasi/<token>` over HTTP, so that request re-enters
// this middleware carrying no session. While it was absent every such fetch
// answered 401, `res.ok` was false, `row` stayed null, and a QR scan rendered
// "not found" for a perfectly valid certificate. The failure was silent
// because it is fail-closed: it could never report a forged certificate as
// valid, only refuse every real one.
//
// It went unseen because nothing tested THIS FILE. The registry declared the
// endpoint anonymously reachable and `assert_public_surface()` asserted that
// DECLARATION, so the declaration and the middleware drifted apart with both
// halves reporting success. F01-R07 now probes the running middleware over
// HTTP, positively and negatively.
//
// The trailing slash is load-bearing. It admits `/api/verifikasi/<token>` and
// nothing else: `/api/verifikasi` itself, and any sibling such as
// `/api/verifikasi-admin`, remain protected.
const PUBLIC_PREFIXES = ["/verifikasi/", "/api/verifikasi/"];

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
