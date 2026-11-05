import { cache } from "react";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { tujuanInternal } from "@/lib/tujuan";
import { queryHasil } from "@/lib/galat-kontrak";
import {
  HEADER_JALUR, alamatPilih, bacaKonteks, bacaTempat, melayani, rencanaHalaman, samaPasangan, tujuanJalur,
  type Konteks, type Pasangan, type Penetapan, type Tujuan,
} from "@/lib/konteks";

/**
 * L3 · THE WORKING CONTEXT, ON THE SERVER (CR-83; D-132). The rules are src/lib/konteks.ts; this asks the database
 * (konteks_saya, konteks_tempat_saya, konteks_tetapkan) and applies them to a request.
 *
 * NARROWING ONLY. Nothing here lets anybody do anything: a surface shown, a list narrowed, an action refused. Every
 * act is the database's to decide from the person's grants, whatever the context (§2.11).
 */

/**
 * next/navigation's redirect, loaded when it is called. Imported at the top, next/navigation pulls the client's
 * navigation contexts in, which only Next's own server bundle replaces; the selftests that drive the pure parts of
 * the modules importing this one (pengajar.ts, pimpinan.ts) run under plain Node.
 */
export async function alihkan(ke: string): Promise<never> {
  const { redirect } = await import("next/navigation");
  return redirect(ke);
}

/** This request's own path, as the proxy recorded it; "/" when there is none. Narrowed, because it becomes a link. */
export async function jalurIni(): Promise<string> {
  return tujuanInternal((await headers()).get(HEADER_JALUR), "/");
}

async function bacaKonteksSaya(): Promise<Konteks | null> {
  const { data, error } = await (await supabaseServer()).rpc("konteks_saya");
  return error ? null : bacaKonteks(data);
}

/** Every purpose · place pair this person holds now, for the chooser. Once per request. */
export const tempatSaya = cache(async (): Promise<Pasangan[]> => {
  const { data, error } = await (await supabaseServer()).rpc("konteks_tempat_saya");
  return error ? [] : bacaTempat(data);
});

/**
 * This session's context, re-checked by the database against the grants as they are now. Once per request, and
 * settled before anything reads it: a page of a surface asked for while the session holds no context takes the one
 * held pair that serves it (C4) right here, so the guard, the page and the shell all read the same answer. A neutral
 * page decides nothing, and a server action never sets a context (§2.11: its target is checked against the one there is).
 */
export const konteksSaya = cache(async (): Promise<Konteks | null> => {
  const k = await bacaKonteksSaya();
  if (k?.keadaan !== "KOSONG") return k;
  const h = await headers();
  if (h.get("next-action")) return k;
  const jalur = tujuanInternal(h.get(HEADER_JALUR), "/");
  if (tujuanJalur(jalur) === null) return k;
  const r = rencanaHalaman(jalur, await tempatSaya());
  if (r.tetapkan && (await tetapkanKonteks(r.tetapkan))) return (await bacaKonteksSaya()) ?? k;
  return k;
});

/** The one writer (konteks_tetapkan): the caller's own session, a pair they hold. False when the database refused. */
export async function tetapkanKonteks(p: Penetapan | (Pick<Pasangan, "tujuan" | "tempat" | "platform"> & { sebab: "PILIHAN" })): Promise<boolean> {
  const { error } = await (await supabaseServer()).rpc("konteks_tetapkan", {
    p_tujuan: p.tujuan, p_tempat: p.tempat, p_platform: p.platform, p_sebab: p.sebab,
  });
  return !error;
}

/**
 * What a surface narrows to: the context's pair; TANPA_KONTEKS for an evaluation persona (C10) or a session with no
 * row, which keeps the surface's behaviour from before L3 (the database decides everything either way); or null when
 * no context the person holds serves this page, which narrows to nothing while the page's own refusal stands.
 */
export type KonteksHalaman = Pasangan | "TANPA_KONTEKS" | null;

/**
 * THE SURFACE'S GUARD (§2.6, C4), shared by a surface's layout and its page within one request.
 *
 *   ADA, and it serves this page     the context: the page narrows to it
 *   ADA, and it does not             never rendered in the wrong context, never switched silently: the chooser,
 *                                    offering the pairs that serve this page and continuing here once chosen; when
 *                                    the person holds none, null, and the page's own refusal stands
 *   KOSONG                           C4: exactly one held pair serves this page → set (HALAMAN); several, the chooser;
 *                                    none, null, and the page's own refusal stands
 *   TIDAK_BERLAKU                    cleared by the database (§2.7): the chooser, saying why
 *   TANPA, BERAKHIR                  TANPA_KONTEKS: an evaluation persona keeps its single role's page (C10); an
 *                                    ended session is the proxy's
 *   unreadable                       null: nothing is shown that the context would have to narrow
 */
export const konteksHalaman = cache(async (): Promise<KonteksHalaman> => {
  const jalur = await jalurIni();
  const k = await konteksSaya();
  if (!k) return null;
  if (k.keadaan === "TANPA" || k.keadaan === "BERAKHIR") return "TANPA_KONTEKS";
  if (k.keadaan === "ADA") {
    if (melayani(k, jalur)) return k;
    const calon = (await tempatSaya()).filter((p) => melayani(p, jalur));
    if (calon.length === 0) return null;
    const satu = new Set(calon.map((p) => p.tujuan)).size === 1 ? calon[0].tujuan : null;
    return alihkan(alamatPilih({ untuk: satu, alasan: "lain", lanjut: jalur }));
  }
  if (k.keadaan === "KOSONG") {
    // C4 has run (konteksSaya): no single held pair serves this page. Several: the chooser, continuing here. None:
    // nothing to choose, and the page's own refusal stands.
    const tempat = await tempatSaya();
    if (!tempat.some((p) => melayani(p, jalur))) return null;
    return alihkan(rencanaHalaman(jalur, tempat).ke);
  }
  return alihkan(alamatPilih({ alasan: "tidak_berlaku", lanjut: jalur }));
});

/**
 * §2.6: A PAGE ABOUT A THING OF ANOTHER SCHOOL (a class, a place, a package, a report), asked for in this context:
 * never shown here and never switched to silently. When the reader holds a context at that school that serves this
 * page, the chooser offers it and continues here; otherwise the page goes on, and the database decides what it shows
 * (nothing of a school the reader may not see). An evaluation persona is outside the context (C10).
 */
export async function tawarkanSekolahLain(sekolah: string | null | undefined): Promise<void> {
  if (!sekolah) return;
  const kh = await konteksHalaman();
  if (kh === "TANPA_KONTEKS" || (kh !== null && kh.tempat === sekolah)) return;
  const jalur = await jalurIni();
  const di = (await tempatSaya()).find((p) => p.tempat === sekolah && melayani(p, jalur));
  if (di) await alihkan(alamatPilih({ untuk: di.tujuan, tempat: di.tempat, alasan: "lain", lanjut: jalur }));
}

/**
 * §2.11 (D-132(k)): A CONTEXT-BOUND HUMAN ACTION'S TARGET BELONGS TO THE ACTIVE CONTEXT. A narrowing, never a permit:
 * the database still decides the act. `sekolah` is the school (or library) the act is aimed at, or `platform` for an
 * act on the platform as a whole; `tujuan`, the purposes the act belongs to. An evaluation persona (no session row,
 * C10) is outside the context and passes; so does a call no person made, which never reaches here: a system or
 * platform-scoped operation uses its governed scope and never a fabricated device session.
 */
export async function dalamKonteks(sasaran: { sekolah?: string | null; platform?: boolean; tujuan?: readonly Tujuan[] }): Promise<boolean> {
  const k = await konteksSaya();
  if (k?.keadaan === "TANPA") return true;
  if (k?.keadaan !== "ADA") return false;
  if (sasaran.tujuan && !sasaran.tujuan.includes(k.tujuan)) return false;
  if (sasaran.platform) return k.platform;
  return !k.platform && sasaran.sekolah != null && k.tempat === sasaran.sekolah;
}

/** Whether a page (by path) belongs to the active context: for a link offered on another context's page. */
export async function halamanDalamKonteks(jalur: string): Promise<boolean> {
  const k = await konteksSaya();
  return k?.keadaan === "ADA" && (tujuanJalur(jalur) === null || melayani(k, jalur));
}

/** The things a context-bound action may be aimed at, and where each keeps its school. */
const SUMBER_SEKOLAH = {
  kursus: "courses",
  batch: "ingest_batches",
  terbitan: "plp_releases",
  simpul: "org_nodes",
  soal: "items",
  sinyal: "integrity_signals",
  definisi: "assessment_definitions",
  distribusi: "release_distributions",
  keputusan: "management_decisions",
  siklus: "feedback_cycles",
} as const;
export type JenisSasaran = keyof typeof SUMBER_SEKOLAH;

const UUID_SASARAN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The school a target belongs to, read under the person's own row security; null when it cannot be read. */
export async function sekolahDari(jenis: JenisSasaran, id: unknown): Promise<string | null> {
  if (typeof id !== "string" || !UUID_SASARAN.test(id)) return null;
  const { data } = await (await supabaseServer()).from(SUMBER_SEKOLAH[jenis]).select("institution_id").eq("id", id).limit(1);
  const sekolah = (data?.[0] as { institution_id?: unknown } | undefined)?.institution_id;
  return typeof sekolah === "string" ? sekolah : null;
}

/**
 * What a context-bound act is aimed at: the school (or library) of its target, or of either end of a target that has
 * two (a transfer); `platform` for an act on the platform as a whole; `atauPlatform` where «Seluruh platform» reaches
 * every school's people too (Aktivasi, Keamanan: the Admin platform's own surfaces for them, D-132 C7).
 */
export type Sasaran = { sekolah?: string | null | readonly (string | null)[]; platform?: boolean; atauPlatform?: boolean };

function sekolahSasaran(sasaran: Sasaran): string[] {
  return Array.isArray(sasaran.sekolah)
    ? (sasaran.sekolah as readonly (string | null)[]).filter((x): x is string => typeof x === "string")
    : typeof sasaran.sekolah === "string" ? [sasaran.sekolah] : [];
}

/**
 * §2.11 (D-132(k)): whether a context-bound act's target is in the active context. A target whose school cannot be
 * read is left to the database, which refuses what this person may not touch; a session not yet in any context
 * (KOSONG) has no context the target could be in. An evaluation persona is outside the context (C10).
 */
export async function sasaranDalamKonteks(sasaran: Sasaran): Promise<boolean> {
  const daftar = sekolahSasaran(sasaran);
  if (sasaran.platform) return dalamKonteks({ platform: true });
  if (daftar.length === 0) return true;
  if (sasaran.atauPlatform && (await dalamKonteks({ platform: true }))) return true;
  return (await Promise.all(daftar.map((x) => dalamKonteks({ sekolah: x })))).some(Boolean);
}

/**
 * §2.11 (D-132(k)): A CONTEXT-BOUND HUMAN ACTION, ITS TARGET IN THE ACTIVE CONTEXT, or not taken here. A narrowing,
 * never a permit: the database still decides the act. Outside it, the chooser offers the target's context and then
 * returns to the page the action was posted from (the proxy's record of the request), carrying CONTEXT_OTHER_PLACE for
 * the form's own part (`bagian`), so what the person typed is kept (CR-84 (3)). Never called from a system path,
 * which uses its governed scope and no device session.
 */
export async function wajibDalamKonteks(sasaran: Sasaran, bagian?: string, tetap: Record<string, string> = {}): Promise<void> {
  if (await sasaranDalamKonteks(sasaran)) return;
  const jalur = (await jalurIni()).split(/[?#]/)[0];
  // E-K4: what the form's page needs to draw the form again (the certificate it was revoking) comes back with the answer
  const q = bagian ? queryHasil(bagian, { ok: false, kode: "CONTEXT_OTHER_PLACE" }) : null;
  for (const [k, v] of Object.entries(tetap)) if (q && /^[a-z_]{1,20}$/.test(k) && /^[0-9a-zA-Z-]{1,64}$/.test(v)) q.set(k, v);
  const kembali = q ? `${jalur}?${q.toString()}#${bagian}` : jalur;
  await alihkan(alamatPilih({
    tempat: sekolahSasaran(sasaran)[0] ?? null, platform: Boolean(sasaran.platform), alasan: "lain", lanjut: kembali,
  }));
}

/**
 * The schools a person belongs to, as far as the reader may see them (their school number and their enrolments,
 * under the reader's own row security): the target of an act on a person (§2.11). Empty when none can be read.
 */
export async function sekolahOrang(orang: unknown): Promise<string[]> {
  if (typeof orang !== "string" || !UUID_SASARAN.test(orang)) return [];
  const c = await supabaseServer();
  const [{ data: nomor }, { data: daftar }] = await Promise.all([
    c.from("institutional_identities").select("institution_id").eq("person_id", orang).limit(50),
    c.from("enrollments").select("institution_id").eq("person_id", orang).limit(50),
  ]);
  return [...new Set([...(nomor ?? []), ...(daftar ?? [])]
    .map((r) => (r as { institution_id?: unknown }).institution_id)
    .filter((x): x is string => typeof x === "string"))];
}

/**
 * §2.6: A PAGE OF THE PLATFORM AS A WHOLE, asked for in a school's context: never shown there and never switched to
 * silently. When the reader holds «Seluruh platform» for this page, the chooser offers it and continues here;
 * otherwise the page's own refusal stands. An evaluation persona is outside the context (C10).
 */
export async function tawarkanPlatform(): Promise<void> {
  const kh = await konteksHalaman();
  if (kh === "TANPA_KONTEKS" || kh?.platform === true) return;
  const jalur = await jalurIni();
  const di = (await tempatSaya()).find((p) => p.platform && melayani(p, jalur));
  if (di) await alihkan(alamatPilih({ untuk: di.tujuan, platform: true, alasan: "lain", lanjut: jalur }));
}

export { samaPasangan };
