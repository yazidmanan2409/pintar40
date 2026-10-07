import { createServerClient, DEFAULT_COOKIE_OPTIONS } from "@supabase/ssr";
import { adalahAlamatKartu, adalahCookieSesi, COOKIE_GESER, perluGeserSesi } from "@/lib/sesi";
import { COOKIE_SIAP, jalurBebasSaatAktivasi, nilaiSiap, siapTersimpan } from "@/lib/penahan-aktivasi";
import { HALAMAN_AKTIVASI } from "@/lib/aktivasi-kontrak";
import { alamatKlien, fetchBerpenerus } from "@/lib/auth-forwarding";
import {
  adalahPrefetch, bacaPenjagaan, COOKIE_JAGA, COOKIE_PERANGKAT, COOKIE_PRIBADI, HALAMAN_PERANGKAT, HALAMAN_TERKUNCI,
  hashPerangkat, idSesiDariToken, jalurBebasPilih, jalurSaatTerkunci, mintaHalaman, navigasiHalaman, nilaiPribadi,
  perangkatBaru, pribadiTersimpan, umurSesiMode, UMUR_PERANGKAT, type ModeSesi,
} from "@/lib/penjaga-sesi";
import { keluarPerangkatIni } from "@/lib/keluar";
import { galatPemeliharaan, HALAMAN_PEMELIHARAAN, jalurSaatPemeliharaan } from "@/lib/pemeliharaan-kontrak";
import { HEADER_JALUR } from "@/lib/konteks";
import { aturTanda, COOKIE_HADIR, COOKIE_SELESAI, opsiTanda } from "@/lib/tanda-keluar";
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
 * in public_surface_registry, as /masuk/kartu is. BOB-27 (Gate 4): the same
 * for «Lupa password?» at /masuk/lupa and its three doors. BOB-28 (Gate 5):
 * its fourth door, recovery by PINTAR ID + PIN.
 */
const PUBLIC_PATHS = new Set(["/", "/masuk", "/masuk/kartu", "/masuk/password", "/aktifkan", "/aktifkan/kode",
                              "/aktifkan/periksa", "/masuk/lupa", "/masuk/lupa/kode", "/masuk/lupa/periksa",
                              "/masuk/lupa/password", "/masuk/lupa/pin", "/auth/callback", "/keluar"]);
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
//
// BOB-28 (Gate 5, IDENTITY-4.0 §5): "/id/" is the page a PINTAR card's QR
// opens, the same page for every ID. It reads nothing; its recovery is the
// /masuk/lupa/pin door above. Its own row in public_surface_registry.
const PUBLIC_PREFIXES = ["/verifikasi/", "/api/verifikasi/", "/id/"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: denganJalur(request) } });

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
          response = NextResponse.next({ request: { headers: denganJalur(request) } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const aman = request.nextUrl.protocol === "https:";

  // BOB-29 (Gate 6; IDENTITY-4.0 C4, C11; T1): THE LOCK. Where this session stands is the database's answer
  // (sesi_periksa; src/lib/penjaga-sesi.ts), asked on every signed-in request but a prefetch, and skipped only for a
  // session this server signed as PERSONAL. Locked: a page goes to «PINTAR terkunci», anything else is refused 423;
  // the data itself is refused by the database whatever happens here. Ended: this device is signed out. A staff
  // person's browser gets its device value the first time, for «Komputer siapa ini?».
  // None of its cookies is written on a server action: there every cookie makes Next redraw the page (BOB-23).
  let mode: ModeSesi | null = null;
  let perluPilih = false;
  const aksi = Boolean(request.headers.get("next-action"));
  if (user) {
    const kartu = adalahAlamatKartu(user.email);
    const idSesi = idSesiDariToken((await supabase.auth.getSession()).data.session?.access_token);
    let alat = request.cookies.get(COOKIE_PERANGKAT)?.value;
    if (!kartu && !aksi && !hashPerangkat(alat)) {
      alat = perangkatBaru();
      response.cookies.set(COOKIE_PERANGKAT, alat, { path: "/", sameSite: "lax", httpOnly: true, secure: aman, maxAge: UMUR_PERANGKAT });
    }
    if (!kartu && pribadiTersimpan(idSesi, request.cookies.get(COOKIE_PRIBADI)?.value)) {
      mode = "PERSONAL";
    } else if (!adalahPrefetch(request.headers)) {
      const { data, error } = await supabase.rpc("sesi_periksa", {
        p_perangkat: kartu ? null : hashPerangkat(alat), p_navigasi: navigasiHalaman(request.method, request.headers) });
      const jaga = error ? null : bacaPenjagaan(data);
      // #148 (D-094, D-100): a maintenance window that stops this person answers the session check itself (PT503).
      // A page goes to /pemeliharaan, which says what stops them and what next; anything else is refused 503.
      const henti = galatPemeliharaan(error);
      if (henti && !jalurSaatPemeliharaan(path)) {
        const tutup = mintaHalaman(path, request.headers)
          ? NextResponse.redirect(new URL(HALAMAN_PEMELIHARAAN, request.url))
          : NextResponse.json({ error: henti === "EMERGENCY" ? "pintar_dihentikan" : "pemeliharaan" },
              { status: 503, headers: { "cache-control": "no-store" } });
        for (const k of response.cookies.getAll()) tutup.cookies.set(k);
        return tutup;
      }
      if (jaga?.keadaan === "TERKUNCI" && !jalurSaatTerkunci(path)) {
        const tahan = mintaHalaman(path, request.headers)
          ? NextResponse.redirect(alamatTerkunci(request))
          : NextResponse.json({ error: "sesi_terkunci" }, { status: 423, headers: { "cache-control": "no-store" } });
        for (const k of response.cookies.getAll()) tahan.cookies.set(k);
        return tahan;
      }
      if (jaga?.keadaan === "BERAKHIR") {
        await keluarPerangkatIni(supabase);
        const akhir = mintaHalaman(path, request.headers)
          ? NextResponse.redirect(new URL("/masuk?sesi=berakhir", request.url))
          : NextResponse.json({ error: "sesi_berakhir" }, { status: 401, headers: { "cache-control": "no-store" } });
        for (const k of response.cookies.getAll()) akhir.cookies.set(k);
        akhir.cookies.set(COOKIE_PRIBADI, "", { path: "/", maxAge: 0 });
        akhir.cookies.set(COOKIE_JAGA, "", { path: "/", maxAge: 0 });
        // L3 (D-132(e)): the session ended on this browser, so the next sign-in here carries no destination from it
        akhir.cookies.set(COOKIE_HADIR, "", { path: "/", maxAge: 0 });
        akhir.cookies.set(COOKIE_SELESAI, "1", opsiTanda(aman));
        return akhir;
      }
      mode = jaga?.mode ?? null;
      perluPilih = jaga?.keadaan === "BUKA" && jaga.perluPilih;
      const tanda = mode === "PERSONAL" && idSesi ? nilaiPribadi(idSesi) : null;
      if (tanda && !aksi) response.cookies.set(COOKIE_PRIBADI, tanda, { path: "/", sameSite: "lax", httpOnly: true, secure: aman, maxAge: umurSesiMode("PERSONAL", user.email) });
    } else {
      // a prefetch asks nothing; the cookies keep the lifetime the last page load gave them
      const j = request.cookies.get(COOKIE_JAGA)?.value;
      mode = j === "SHARED" || j === "CARD" ? j : null;
    }
    // what the screen needs for its inactivity clock (src/components/PenjagaSesi.tsx)
    const jagaLayar = mode === "SHARED" || mode === "CARD" ? mode : null;
    if ((request.cookies.get(COOKIE_JAGA)?.value ?? null) !== jagaLayar && !aksi && !adalahPrefetch(request.headers)) {
      response.cookies.set(COOKIE_JAGA, jagaLayar ?? "", { path: "/", sameSite: "lax", httpOnly: false, secure: aman, maxAge: jagaLayar ? umurSesiMode(jagaLayar, user.email) : 0 });
    }
  } else if (request.cookies.get(COOKIE_JAGA) && !aksi) {
    response.cookies.set(COOKIE_JAGA, "", { path: "/", maxAge: 0 });
  }

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
    // BOB-29: by the session's mode (penjaga-sesi.ts): a personal computer 7 days, a shared one and a card 60 minutes
    const umur = umurSesiMode(mode, user.email);
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
  // L3 (D-132(e)), 4.0'S STALE-CONTINUATION GUARD (src/lib/tanda-keluar.ts): a browser that held a session and
  // arrives without one had it end here, by «Keluar», expiry, or from elsewhere. It is marked, and while it is no
  // `lanjut` is minted: the next sign-in lands by that person's own door and context, never on the last one's page.
  const tanda = aturTanda({ masuk: Boolean(user), berakhir: false, aksi,
                            hadir: request.cookies.has(COOKIE_HADIR), selesai: request.cookies.has(COOKIE_SELESAI) });
  if (tanda.pasangHadir) response.cookies.set(COOKIE_HADIR, "1", opsiTanda(aman));
  if (tanda.hapusHadir) response.cookies.set(COOKIE_HADIR, "", { path: "/", maxAge: 0 });
  if (tanda.pasangSelesai) response.cookies.set(COOKIE_SELESAI, "1", opsiTanda(aman));

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
        path: "/", sameSite: "lax", httpOnly: true, secure: request.nextUrl.protocol === "https:", maxAge: umurSesiMode(mode, user.email) });
    }
  }

  // BOB-29 (C11): «Komputer siapa ini?», asked of a staff person on a browser that has not answered it, once the
  // set-up is done, before any other page. Until it is answered the computer is SHARED (the safer default).
  // Asked of a browser's page load only (Sec-Fetch-Dest: document): a script or a data request is never redirected.
  if (user && perluPilih && !jalurBebasPilih(path) && navigasiHalaman(request.method, request.headers)) {
    const tanya = request.nextUrl.clone();
    tanya.pathname = HALAMAN_PERANGKAT;
    tanya.search = "";
    tanya.searchParams.set("lanjut", `${path}${request.nextUrl.search}`);
    const alih = NextResponse.redirect(tanya);
    for (const k of response.cookies.getAll()) alih.cookies.set(k);
    return alih;
  }

  if (!user && !isPublic) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    if (tanda.tandai) url.search = "";
    else url.searchParams.set("lanjut", path);
    const masuk = NextResponse.redirect(url);
    for (const k of response.cookies.getAll()) masuk.cookies.set(k);
    return masuk;
  }
  return response;
}

/**
 * L3: the request's own headers, with the path it is for (and its query, less Next's own `_rsc`), so a surface's
 * layout can offer to continue here (src/lib/konteks-server.ts). Always overwritten: a value a client sent is never
 * passed on, and the layout narrows it again (tujuanInternal) because it becomes a link.
 */
function denganJalur(request: NextRequest): Headers {
  const h = new Headers(request.headers);
  const q = new URLSearchParams(request.nextUrl.search);
  q.delete("_rsc");
  const cari = q.toString();
  h.set(HEADER_JALUR, `${request.nextUrl.pathname}${cari ? `?${cari}` : ""}`);
  return h;
}

/** «PINTAR terkunci», returning afterwards to the page that was asked for. */
function alamatTerkunci(request: NextRequest): URL {
  const url = request.nextUrl.clone();
  const lanjut = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = HALAMAN_TERKUNCI;
  url.search = "";
  if (request.method === "GET" && lanjut !== "/") url.searchParams.set("lanjut", lanjut);
  return url;
}

// public/brand and public/fonts are what the anonymous pages themselves load.
// Gated, a stranger at /masuk was redirected instead of sent the logo and fonts.
// The trailing slashes keep the exemption to those two folders (F01-R08).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|fonts/).*)"],
};
