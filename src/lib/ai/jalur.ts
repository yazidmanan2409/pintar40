/**
 * C3w-1 · THE DRAFTING ROUTE, ITS CORE (design §2 step 3; Sharon's F-2; Bob's decisions of 21 Nov). Pure: every
 * database call and the provider come in as arguments, so the order of steps is the code below and C3W-R01 runs it
 * against recording fakes. No network, no React, no secret; imports only @/lib/ai/* and node:crypto (R3-07).
 *
 * The order, and why:
 *   1. a lesson source reads c3w_bahan once, as the teacher (an invoker: it sees only what the teacher sees);
 *   2. ai_minta_draf checks that exact text for personal data and records the request (D11 makes a repeated key answer
 *      its first outcome and nothing more);
 *   3. no provider, no reservation;
 *   4. ai_cadangkan reserves the attempt's worst case;
 *   5. F-2: the text about to be sent must hash to the `sidik` the check answered, or the reservation is released and
 *      the request refused AI_TEKS_BERUBAH, before the claim and before the provider;
 *   6. ai_tandai_kirim claims the sending: from here the attempt is never released (Bob's decision 2);
 *   7. the provider, through the one builder, under a hard timeout;
 *   8. ai_tulis_draf writes the drafts and settles at once; a refused output, or a provider failure with usage, is
 *      settled by ai_gagal. A failure with usage is retried as a new attempt, at most MAKS_PERCOBAAN in all; a timeout
 *      with no usage is left to the sweep (ai_sapu) and not retried; a refused output is not retried.
 */
import { createHash } from "node:crypto";
import type { HasilPenyedia, PermintaanPenyedia, SoalDraf } from "@/lib/ai/kontrak";
import { bangunPermintaan } from "@/lib/ai/permintaan";

export const MAKS_PERCOBAAN = 3;

type GalatRpc = { message: string; details?: string | null } | null;
export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: GalatRpc }>;
export type PenyediaJalur = { panggil: (p: PermintaanPenyedia) => Promise<HasilPenyedia> } | { kode: "AI_TIDAK_TERSEDIA" };

export type Dependensi = {
  /** the teacher's own client: c3w_bahan, ai_minta_draf */
  pengguna: Rpc;
  /** the service client: ai_cadangkan, ai_tandai_kirim, ai_lepaskan, ai_tulis_draf, ai_gagal */
  layanan: Rpc;
  penyedia: PenyediaJalur;
  batasMs: number;
};

export type MasukDraf = {
  course: string;
  lesson: string;
  sumber: "TEMPEL" | "PELAJARAN";
  /** the pasted text; ignored for a lesson source, whose text is read once from c3w_bahan */
  teks?: string;
  objectives: string[];
  jumlah: number;
  kunci: string;
  hakSumber: boolean;
};

export type HasilDraf =
  | { ok: true; permintaan: string; items: unknown; ulang?: boolean }
  | { ok: false; kode: string; permintaan?: string; kelas?: unknown; rentang?: unknown; ulang?: boolean };

/**
 * A database client as the core's Rpc: only the PR220 code in DETAIL crosses, never an error's own text (X.8, BOB07);
 * anything else is AI_GAGAL. The route hands its two clients through this.
 */
export function sebagaiRpc(k: { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { details?: string | null } | null }> }): Rpc {
  return async (fn, args) => {
    const { data, error } = await k.rpc(fn, args);
    if (!error) return { data, error: null };
    const d = error.details ?? "";
    return { data: null, error: { message: "rpc", details: /^[A-Z][A-Z0-9_]+$/.test(d) ? d : "AI_GAGAL" } };
  };
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** The PR220 code a refusal carries in DETAIL, or AI_GAGAL. */
function kodeDari(e: GalatRpc): string {
  const d = e?.details ?? "";
  return /^[A-Z][A-Z0-9_]+$/.test(d) ? d : "AI_GAGAL";
}

/** The provider's answer in the closed shape ai_soal_tertutup accepts: stem, and options of label, body, is_correct. */
function keSoalTertutup(soal: SoalDraf[]) {
  return soal.map((s) => ({
    stem: s.stem,
    options: s.options.map((o) => ({ label: o.label, body: o.text, is_correct: o.correct })),
  }));
}

async function denganBatas<T>(p: Promise<T>, ms: number): Promise<T | "HABIS"> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const habis = new Promise<"HABIS">((r) => { t = setTimeout(() => r("HABIS"), ms); });
  try {
    return await Promise.race([p, habis]);
  } finally {
    if (t) clearTimeout(t);
  }
}

export async function buatDrafAi(dep: Dependensi, masuk: MasukDraf): Promise<HasilDraf> {
  // 1. the text: pasted, or the lesson's, read once
  let teks = masuk.teks ?? "";
  if (masuk.sumber === "PELAJARAN") {
    const b = await dep.pengguna("c3w_bahan", { p_lesson: masuk.lesson, p_objectives: [] });
    if (b.error) return { ok: false, kode: kodeDari(b.error) };
    teks = String((b.data as { teks?: unknown } | null)?.teks ?? "");
  }

  // 2. the check and the request
  const m = await dep.pengguna("ai_minta_draf", {
    p_course: masuk.course,
    p_lesson: masuk.lesson,
    p_teks: teks,
    p_tujuan: masuk.objectives.join("\n"),
    p_jumlah: masuk.jumlah,
    p_kunci_idempoten: masuk.kunci,
    p_hak_sumber: masuk.hakSumber,
    p_sumber: masuk.sumber,
  });
  if (m.error) return { ok: false, kode: kodeDari(m.error) };
  const jawab = (m.data ?? {}) as { ok?: boolean; kode?: string; permintaan?: string; sidik?: string; ulang?: boolean; kelas?: unknown; rentang?: unknown; hasil?: string | null };
  if (jawab.ok !== true) return { ok: false, kode: jawab.kode ?? "AI_GAGAL", permintaan: jawab.permintaan, kelas: jawab.kelas, rentang: jawab.rentang, ulang: jawab.ulang };
  const permintaan = String(jawab.permintaan);
  // D11: a repeated key answers its first outcome and sends nothing
  if (jawab.ulang) return { ok: true, permintaan, items: null, ulang: true };

  // 3. no provider, no reservation
  const pv = dep.penyedia;
  if (!("panggil" in pv)) return { ok: false, kode: pv.kode, permintaan };

  const req = bangunPermintaan({ excerpt: teks, objectives: masuk.objectives, jumlah: masuk.jumlah });

  for (let ke = 1; ke <= MAKS_PERCOBAAN; ke++) {
    // 4. reserve
    const c = await dep.layanan("ai_cadangkan", { p_permintaan: permintaan });
    if (c.error || !c.data) return { ok: false, kode: kodeDari(c.error), permintaan };
    const percobaan = String(c.data);

    // 5. F-2: only the checked text is sent
    if (typeof jawab.sidik !== "string" || sha256(req.excerpt) !== jawab.sidik) {
      await dep.layanan("ai_lepaskan", { p_percobaan: percobaan });
      return { ok: false, kode: "AI_TEKS_BERUBAH", permintaan };
    }

    // 6. claim the sending
    const k = await dep.layanan("ai_tandai_kirim", { p_percobaan: percobaan });
    if (k.error || k.data !== true) {
      await dep.layanan("ai_lepaskan", { p_percobaan: percobaan });
      return { ok: false, kode: k.error ? kodeDari(k.error) : "AI_PERCOBAAN_TIDAK_TERBUKA", permintaan };
    }

    // 7. the provider, under the timeout
    let hasil: HasilPenyedia | "HABIS";
    try {
      hasil = await denganBatas(pv.panggil(req), dep.batasMs);
    } catch {
      hasil = { ok: false, sebab: "GAGAL", penggunaan: null };
    }
    // a timeout or a failure with no usage: the sweep settles it at its reservation; never retried
    if (hasil === "HABIS") return { ok: false, kode: "AI_GAGAL", permintaan };
    if (!hasil.ok) {
      if (!hasil.penggunaan) return { ok: false, kode: "AI_GAGAL", permintaan };
      await dep.layanan("ai_gagal", { p_percobaan: percobaan, p_penggunaan: hasil.penggunaan, p_hasil: "PROVIDER_FAILED" });
      continue;
    }

    // 8. write and settle at once; a refused output is settled at its usage and not retried
    const t = await dep.layanan("ai_tulis_draf", { p_percobaan: percobaan, p_soal: keSoalTertutup(hasil.soal), p_penggunaan: hasil.penggunaan });
    if (t.error) {
      await dep.layanan("ai_gagal", { p_percobaan: percobaan, p_penggunaan: hasil.penggunaan, p_hasil: "INVALID_OUTPUT" });
      return { ok: false, kode: kodeDari(t.error), permintaan };
    }
    return { ok: true, permintaan, items: (t.data as { items?: unknown } | null)?.items ?? null };
  }
  return { ok: false, kode: "AI_GAGAL", permintaan };
}
