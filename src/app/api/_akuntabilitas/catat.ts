import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { alamatKlien } from "@/lib/auth-forwarding";
import { cardPepper } from "@/lib/env";
import { supabaseService } from "@/lib/supabase/service";
import type { CaraMasuk, JenisAkuntabilitas } from "@/lib/akuntabilitas-kontrak";

/**
 * B1 · THE ONE WRITER OF THE SIGN-IN RECORD (docs/completion-4.1/batches/B1-COMPLETION.md; migration 20270116100000).
 * Every sign-in route, the sign-out path and B2's print path call this module, and nothing else in src/ calls the
 * database's writer (akuntabilitas_catat).
 *
 *   * ONE PROCESSED ATTEMPT, ONE ROW (blocker 2). A route calls it once, after its final answer for the request and
 *     before the response is sent; a retry inside the route (its own repeated call to Auth) happens before that answer
 *     and adds nothing. The same request object is never written twice (a second call for it is refused here).
 *   * WHAT IS SENT: the kind, the method, the route's own outcome code, the Auth user when the route knows it, the
 *     identifier the attempt resolved to (an account's address or a PINTAR ID, for the database to find the person; it
 *     is not stored), the governed hash of the typed identifier on a failure, and the coarse origin. Never a password,
 *     code, PIN, card secret, full address, user agent or the typed identifier. The schools are the database's to
 *     compute (execution requirement 1): nothing here names one.
 *   * THE ORIGIN comes from alamatKlien alone (x-real-ip, which the platform sets), an IPv4-mapped IPv6 address read as
 *     IPv4, then cut to its /24 (IPv4) or /48 (IPv6). No other header is read.
 *   * THE HASH: HMAC-SHA256 with the existing pepper under this store's own label, «akuntabilitas», over the
 *     normalised typed identifier; never over an address. Rotating the pepper breaks the link to older hashes
 *     (stated in the migration's header).
 *   * FAILURE: a sign-in or sign-out FAILS OPEN: the write is bounded (1.5 s), and a write that fails or times out is
 *     logged without the identifier, counted (akuntabilitas_gagal_hitung, reported by the health check), and the route
 *     proceeds. A print FAILS CLOSED: catatPermintaanCetak throws, and B2 makes no official print.
 */

/** How long the route waits for the writer before it proceeds without it. */
export const BATAS_TULIS_MS = 1500;
export const LABEL_HASH = "akuntabilitas";

// ─────────────────────────────────────────────── the origin
function hextet(v6: string): number[] | null {
  let s = v6.toLowerCase();
  const pct = s.indexOf("%");
  if (pct >= 0) s = s.slice(0, pct);
  // an IPv4 tail (::ffff:203.0.113.9, 64:ff9b::1.2.3.4) as its two groups
  const empat = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (empat) {
    const b = empat.slice(1).map(Number);
    s = s.slice(0, empat.index) + ((b[0] << 8) | b[1]).toString(16) + ":" + ((b[2] << 8) | b[3]).toString(16);
  }
  const [kiri, kanan, lebih] = s.split("::");
  if (lebih !== undefined) return null;
  const a = kiri ? kiri.split(":") : [];
  const b = kanan !== undefined ? (kanan ? kanan.split(":") : []) : [];
  const isi = kanan !== undefined ? 8 - a.length - b.length : 0;
  if (isi < 0 || (kanan === undefined && a.length !== 8)) return null;
  const g = [...a, ...Array(isi).fill("0"), ...b].map((x) => parseInt(x, 16));
  return g.length === 8 && g.every((x) => Number.isInteger(x) && x >= 0 && x <= 0xffff) ? g : null;
}

/** The coarse network origin of an address: «203.0.113.0/24» or «2001:db8:a::/48»; null for anything that is not one. */
export function asalDariAlamat(alamat: string | null | undefined): string | null {
  const a = (alamat ?? "").trim();
  if (!a) return null;
  if (isIP(a) === 4) {
    const p = a.split(".").map(Number);
    return `${p[0]}.${p[1]}.${p[2]}.0/24`;
  }
  if (isIP(a) !== 6) return null;
  const g = hextet(a);
  if (!g) return null;
  // IPv4-mapped (::ffff:a.b.c.d) is the IPv4 address it carries
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.0/24`;
  return `${g[0].toString(16)}:${g[1].toString(16)}:${g[2].toString(16)}::/48`;
}

/** The origin of a request, from the trusted address only. */
export function asalJaringan(headers: Headers): string | null {
  return asalDariAlamat(alamatKlien(headers));
}

// ─────────────────────────────────────────────── the identifier
/** The governed hash of a typed identifier, already normalised by the caller's rule (see normalPengenal). */
export function hashPengenal(normal: string): string {
  return createHmac("sha256", cardPepper()).update(`${LABEL_HASH}|${normal}`).digest("hex");
}

/** Each route's own normalisation of what was typed: an email or username, a card number, a PINTAR ID. */
export function normalPengenal(jenis: "nama" | "kartu" | "pintar_id", v: unknown): string {
  const s = typeof v === "string" ? v : "";
  if (jenis === "kartu") return s.replace(/\D/g, "");
  // the PINTAR ID as the recovery reads it (kanonikPintarId): no spaces or dashes, O as 0, I and L as 1
  if (jenis === "pintar_id") return s.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1").slice(0, 64);
  return s.trim().toLowerCase().slice(0, 320);
}

// ─────────────────────────────────────────────── the write
export type FaktaMasuk = {
  jenis: Extract<JenisAkuntabilitas, "SIGN_IN_OK" | "SIGN_IN_FAILED" | "SIGN_OUT">;
  cara?: CaraMasuk;
  /** OK, or the route's own failure code */
  hasil: string;
  /** the Auth user the route knows (a success, a sign-out; a failure when the route resolved one) */
  authUserId?: string | null;
  /** an account's sign-in address or a PINTAR ID the attempt resolved to: for the database to find the person, not stored */
  pengenal?: string | null;
  /** the typed identifier, normalised (normalPengenal): hashed on a failure, never sent */
  diketik?: string | null;
};

type Penulis = {
  tulis(args: Record<string, unknown>): Promise<{ ref: string | null }>;
  hitungGagal(kind: "SIGN_IN" | "SIGN_OUT" | "PRINT_REQUEST"): Promise<void>;
  log(baris: string): void;
};

function galatKode(e: unknown): string {
  if (e && typeof e === "object") {
    const o = e as { name?: unknown; code?: unknown; details?: unknown };
    if (o.name === "TimeoutError" || o.name === "AbortError") return "timeout";
    return [o.code, o.details].filter((x) => typeof x === "string" && /^[A-Z0-9_]{2,40}$/.test(x)).join("/") || String(o.name ?? "error").slice(0, 40);
  }
  return "error";
}

const penulisBaku: Penulis = {
  async tulis(args) {
    const { data, error } = await supabaseService().rpc("akuntabilitas_catat", args).abortSignal(AbortSignal.timeout(BATAS_TULIS_MS));
    if (error) throw error;
    const d = (data ?? {}) as { ref?: unknown };
    return { ref: typeof d.ref === "string" ? d.ref : null };
  },
  async hitungGagal(kind) {
    await supabaseService().rpc("akuntabilitas_gagal_hitung", { p_kind: kind }).abortSignal(AbortSignal.timeout(BATAS_TULIS_MS));
  },
  log: (baris) => console.error(baris),
};

/** The requests already written: one request is never written twice. */
const sudah = new WeakSet<object>();

/**
 * The one call a sign-in route or the sign-out path makes, once its answer is final and before it answers. Never
 * throws: a write that fails is logged (no identifier) and counted, and the route proceeds.
 */
export async function catatAkuntabilitas(headers: Headers, rute: string, f: FaktaMasuk, penulis: Penulis = penulisBaku): Promise<void> {
  if (sudah.has(headers)) {
    penulis.log(`[akuntabilitas] ${rute}: a second event for one request was not written`);
    return;
  }
  sudah.add(headers);
  const gagal = f.jenis === "SIGN_IN_FAILED";
  try {
    await penulis.tulis({
      p_kind: f.jenis,
      p_method: f.jenis === "SIGN_OUT" ? null : (f.cara ?? null),
      p_outcome: f.hasil,
      p_auth_user: f.authUserId ?? null,
      p_pengenal: f.pengenal ? f.pengenal.trim().slice(0, 320) || null : null,
      p_identifier_hash: gagal && f.diketik ? hashPengenal(f.diketik) : null,
      p_origin: asalJaringan(headers),
      p_resource: null,
    });
  } catch (e) {
    penulis.log(`[akuntabilitas] ${rute}: the ${f.jenis} event was not written (${galatKode(e)}); the route proceeds`);
    await penulis.hitungGagal(f.jenis === "SIGN_OUT" ? "SIGN_OUT" : "SIGN_IN")
      .catch((x) => penulis.log(`[akuntabilitas] ${rute}: the failure could not be counted either (${galatKode(x)})`));
  }
}

export type LingkupCetak = { node_id: string } | { learning_assignment_id: string } | { assessment_assignment_id: string };

/**
 * B2's print path: the print request's event and its reference, or an error. FAILS CLOSED: without the reference
 * there is no official print. The school is the resource's own, computed by the database.
 */
export async function catatPermintaanCetak(headers: Headers, p: { authUserId: string; laporan: string; lingkup: LingkupCetak },
  penulis: Penulis = penulisBaku): Promise<{ ref: string }> {
  if (sudah.has(headers)) throw new Error("AKUNTABILITAS_SUDAH_DICATAT");
  sudah.add(headers);
  try {
    const { ref } = await penulis.tulis({
      p_kind: "PRINT_REQUEST", p_method: null, p_outcome: "OK", p_auth_user: p.authUserId, p_pengenal: null,
      p_identifier_hash: null, p_origin: asalJaringan(headers), p_resource: { report: p.laporan, ...p.lingkup },
    });
    if (!ref) throw new Error("no reference");
    return { ref };
  } catch (e) {
    penulis.log(`[akuntabilitas] cetak: the print request was not written (${galatKode(e)}); no official print`);
    await penulis.hitungGagal("PRINT_REQUEST").catch(() => undefined);
    throw new Error("AKUNTABILITAS_CETAK_GAGAL");
  }
}
