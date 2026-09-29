import "server-only";
import { isIP } from "node:net";
import { publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";

/**
 * BOB-12 (a): SUPABASE AUTH SEES THE STUDENT'S ADDRESS, NOT THE SERVER'S.
 *
 * Every card sign-in and every session refresh reaches Auth from PINTAR's
 * server, so Auth's per-address limits count the whole country as one address.
 * Auth trusts a forwarded `Sb-Forwarded-For` only on a request made with a
 * SECRET API key (`sb_secret_…`), and only once the project turns forwarding
 * on (`security_sb_forwarded_for_enabled`). That key is a service-role key, so
 * it goes on as few requests as possible:
 *
 *   POST <project>/auth/v1/token?grant_type=password       a sign-in
 *   POST <project>/auth/v1/token?grant_type=refresh_token  a refresh
 *   POST <project>/auth/v1/verify                          a code check (Gate 1, C15)
 *
 * matched exactly: this project's origin, that path, that method, that grant.
 * Every other request, and every data request, goes out exactly as the client
 * built it, with the publishable key. A `sb-forwarded-for` header already on a
 * request is always removed, so the address Auth sees is only ever the one
 * read here.
 *
 * THE ADDRESS comes only from `x-real-ip`, which Vercel sets to the address
 * the connection came from and overwrites whatever a client sent. It must
 * parse as an IP. `x-forwarded-for` and a client's own `sb-forwarded-for` are
 * never read. Without a usable address, or without the key (before the
 * project's key is set), nothing is forwarded and nothing changes.
 *
 * This module is the key's one reader (F01-S03) and is `server-only`.
 */

const KODE = "/auth/v1/verify";
const TOKEN = "/auth/v1/token";
const HIBAH = new Set(["password", "refresh_token"]);

function kunciPenerus(): string | null {
  const v = process.env.SUPABASE_AUTH_FORWARDING_KEY?.trim();
  // Only a secret API key is accepted by Auth for forwarding; anything else is
  // treated as absent, so a legacy service-role JWT is never sent this way.
  return v && /^sb_secret_[A-Za-z0-9_-]{8,}$/.test(v) ? v : null;
}

/** The address Vercel saw the request come from, or null. */
export function alamatKlien(headers: Headers): string | null {
  const v = headers.get("x-real-ip")?.trim() ?? "";
  return v && isIP(v) ? v : null;
}

/** Whether a request is one of the three Auth calls that may carry the address. */
export function bolehDiteruskan(method: string, url: string): boolean {
  if (method.toUpperCase() !== "POST") return false;
  let u: URL, proyek: URL;
  try {
    u = new URL(url);
    proyek = new URL(publicSupabaseUrl());
  } catch {
    return false;
  }
  if (u.origin !== proyek.origin || u.username || u.password) return false;
  const dasar = proyek.pathname.replace(/\/+$/, "");
  if (u.pathname === dasar + KODE) return true;
  if (u.pathname !== dasar + TOKEN) return false;
  const hibah = u.searchParams.getAll("grant_type");
  return hibah.length === 1 && HIBAH.has(hibah[0]);
}

function bagian(input: RequestInfo | URL, init?: RequestInit): { url: string; method: string; headers: Headers } {
  const req = typeof input === "object" && "url" in input && !(input instanceof URL) ? input : null;
  return {
    url: req ? req.url : String(input),
    method: init?.method ?? req?.method ?? "GET",
    headers: new Headers(init?.headers ?? req?.headers),
  };
}

/**
 * A fetch for a Supabase client that forwards `alamat` on the three Auth calls
 * above, and on nothing else.
 */
export function fetchBerpenerus(alamat: string | null, dasar: typeof fetch = fetch): typeof fetch {
  return (input, init) => {
    const { url, method, headers } = bagian(input, init);
    headers.delete("sb-forwarded-for");
    const kunci = kunciPenerus();
    if (kunci && alamat && isIP(alamat) && bolehDiteruskan(method, url)) {
      headers.set("apikey", kunci);
      // The client's own bearer is the publishable key on these calls; a user's
      // token is never replaced.
      const bearer = headers.get("authorization");
      if (!bearer || bearer === `Bearer ${publicSupabaseAnonKey()}`) headers.set("authorization", `Bearer ${kunci}`);
      headers.set("sb-forwarded-for", alamat);
    }
    return dasar(input, { ...init, method, headers });
  };
}
