import { createServerClient, DEFAULT_COOKIE_OPTIONS } from "@supabase/ssr";
import { adalahAlamatKartu, adalahCookieSesi, COOKIE_GESER, perluGeserSesi, umurSesi } from "@/lib/sesi";
import { COOKIE_SIAP, jalurBebasSaatAktivasi, nilaiSiap, siapTersimpan } from "@/lib/penahan-aktivasi";
import { HALAMAN_AKTIVASI } from "@/lib/aktivasi-kontrak";
import { alamatKlien, fetchBerpenerus } from "@/lib/auth-forwarding";
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
 *
 * BOB-26 (Gate 3): "Aktifkan akun PINTAR Anda" starts signed out, so
 * /aktifkan is public, and so are its two doors and the password sign-in's,
 * each POST-only and rewritten to its handler (next.config.ts), each declared
 * in public_surface_registry, as /masuk/kartu is.
 */
const PUBLIC_PATHS = new Set(["/", "/masuk", "/masuk/kartu", "/masuk/password", "/aktifkan", "/aktifkan/kode",
                              "/aktifkan/periksa", "/auth/callback", "/keluar"]);
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
      // BOB-12 (a): a refresh reaches Auth as the student's own address, not the server's
      global: { fetch: fetchBerpenerus(alamatKlien(request.headers)) },
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

  // BOB-05 (D-009): the idle limit slides with activity. Each signed-in
  // request re-sends the auth cookies with this account's lifetime -- 60
  // minutes for a classroom card, 7 days for an email account -- so a device
  // left idle past it is forgotten by the browser itself. A refresh above has
  // already put the new cookies on `response`; otherwise the request's own are
  // re-sent unchanged but for their lifetime.
  //
  // BOB-23: on a server action the re-send is throttled (perluGeserSesi in
  // src/lib/sesi.ts), because every cookie an action writes makes Next redraw
  // the whole page. A page request always re-sends, and so does any request
  // whose session this proxy has just refreshed.
  if (user) {
    const umur = umurSesi(user.email);
    const baru = new Map(response.cookies.getAll().map((k) => [k.name, k]));
    const sekarang = Math.floor(Date.now() / 1000);
    const disegarkan = [...baru.keys()].some(adalahCookieSesi);
    if (disegarkan || perluGeserSesi({ aksi: Boolean(request.headers.get("next-action")), sekarang,
                                       terakhir: request.cookies.get(COOKIE_GESER)?.value, umur })) {
      for (const k of request.cookies.getAll()) {
        if (!adalahCookieSesi(k.name)) continue;
        const tulis = baru.get(k.name);
        if (tulis && !tulis.value) continue; // a deletion stays a deletion
        response.cookies.set(k.name, tulis?.value ?? k.value, { ...DEFAULT_COOKIE_OPTIONS, maxAge: umur });
      }
      // Only the proxy reads it: httpOnly, Lax, Secure wherever the app is served over HTTPS.
      // Tampering is harmless: deleted, it only costs extra re-sends; forged to "just now",
      // it only lets this person's own session lapse sooner; it extends nothing.
      response.cookies.set(COOKIE_GESER, String(sekarang), {
        path: "/", sameSite: "lax", httpOnly: true, secure: request.nextUrl.protocol === "https:", maxAge: umur });
    }
  }
  // /api/dev/* is decided by its own handler: a plain 404 outside development
  // (FABLE-01 §11) — a 401 here would reveal that the namespace exists.
  const isDevNamespace = path === "/api/dev" || path.startsWith("/api/dev/");
  const isPublic = PUBLIC_PATHS.has(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p)) || isDevNamespace || path.startsWith("/_next") || path === "/favicon.ico";

  // BOB-26: THE HOLD. A signed-in email account whose set-up is REQUIRED goes
  // to the wizard and nowhere else (src/lib/penahan-aktivasi.ts). A class card
  // has no set-up and is never asked about. Unreadable, the state holds
  // nothing: the hold is a journey, not an authority, and every page's own
  // checks stand either way.
  if (user && !adalahAlamatKartu(user.email) && !isPublic && !jalurBebasSaatAktivasi(path)
      && !siapTersimpan(user.id, request.cookies.get(COOKIE_SIAP)?.value)) {
    const { data: keadaan, error } = await supabase.rpc("my_setup_state");
    if (!error && keadaan === "REQUIRED") {
      const tahan = path.startsWith("/api/")
        ? NextResponse.json({ error: "setup_required" }, { status: 403, headers: { "cache-control": "no-store" } })
        : NextResponse.redirect(new URL(HALAMAN_AKTIVASI, request.url));
      for (const k of response.cookies.getAll()) tahan.cookies.set(k);
      return tahan;
    }
    const nilai = !error && (keadaan === "COMPLETE" || keadaan === "NOT_APPLICABLE") ? nilaiSiap(user.id) : null;
    if (nilai) {
      response.cookies.set(COOKIE_SIAP, nilai, {
        path: "/", sameSite: "lax", httpOnly: true, secure: request.nextUrl.protocol === "https:", maxAge: umurSesi(user.email) });
    }
  }

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

// public/brand and public/fonts are what the anonymous pages themselves load.
// Gated, a stranger at /masuk was redirected instead of sent the logo and fonts.
// The trailing slashes keep the exemption to those two folders (F01-R08).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|fonts/).*)"],
};
