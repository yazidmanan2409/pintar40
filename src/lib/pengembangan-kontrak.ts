/**
 * BOB-47 / DAISY-34 (D-069(b), D-070(a), (b)): THE PROFESSIONAL-LEARNING RECORD'S CONTRACT. Pure: no database, no
 * React, no server.
 *
 * `professional_learning_record(p_node)` returns one read-only record per place: per participant and package, what
 * the reader's audience may see, decided in the database. The facilitator, the Kepala departemen over the place and the
 * Dekan read every column, the result through learner.result (catalogue MC-5); Admin sekolah reads enrolment,
 * participation, the two tests' state and completion, and the database leaves progress and the result out. This file
 * only reads what came back: a column appears on the screen because the reader received it, never because this file
 * decided they may see it. Completion is the Uji Penguasaan handed in, whatever the outcome (D-070(b)).
 *
 * src never names the context (R10): the record is about participants, and the database says which places have one.
 */

export type KeadaanUji = "BELUM" | "SEDANG" | "SELESAI";

export type PaketPeserta = {
  id: string;
  judul: string;
  mulai: boolean;
  pemetaan: KeadaanUji;
  penguasaan: KeadaanUji;
  selesai: boolean;
  /** Present only when the database returned them to this reader. */
  pelajaran?: { selesai: number; jumlah: number };
  hasil?: { penguasaan: number; tercapai: boolean | null } | null;
};

export type PesertaCatatan = {
  id: string;
  nama: string;
  terdaftar: "ACTIVE" | "PENDING";
  paket: PaketPeserta[];
};

export type CatatanPengembangan = {
  simpul: string;
  nama: string;
  /** FULL: progress and the result were returned; COMPLETION: enrolment, participation and completion only. */
  kolom: "FULL" | "COMPLETION";
  peserta: PesertaCatatan[];
};

const keadaan = (v: unknown): KeadaanUji => (v === "SEDANG" || v === "SELESAI" ? v : "BELUM");
const teks = (v: unknown): string => (typeof v === "string" ? v : "");
const angka = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

/** The database's answer, read defensively; null for anything that is not a record. */
export function bacaCatatan(raw: unknown): CatatanPengembangan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.node_id !== "string" || !Array.isArray(r.participants)) return null;
  const penuh = r.columns === "FULL";
  return {
    simpul: r.node_id,
    nama: teks(r.name),
    kolom: penuh ? "FULL" : "COMPLETION",
    peserta: (r.participants as unknown[]).flatMap((x) => {
      if (!x || typeof x !== "object") return [];
      const p = x as Record<string, unknown>;
      if (typeof p.person_id !== "string") return [];
      return [{
        id: p.person_id,
        nama: teks(p.display_name),
        terdaftar: p.enrolment_status === "PENDING" ? "PENDING" : "ACTIVE",
        paket: (Array.isArray(p.packages) ? p.packages : []).flatMap((y: unknown) => {
          if (!y || typeof y !== "object") return [];
          const k = y as Record<string, unknown>;
          if (typeof k.learning_assignment_id !== "string") return [];
          const paket: PaketPeserta = {
            id: k.learning_assignment_id,
            judul: teks(k.title),
            mulai: k.started === true,
            pemetaan: keadaan(k.pre_test),
            penguasaan: keadaan(k.post_test),
            selesai: k.completed === true,
          };
          // only what came back: a column the database left out stays out
          if (penuh && "lessons_total" in k) {
            paket.pelajaran = { selesai: angka(k.lessons_done) ?? 0, jumlah: angka(k.lessons_total) ?? 0 };
          }
          if (penuh && "result" in k) {
            const h = k.result as Record<string, unknown> | null;
            const m = h ? angka(h.mastery) : null;
            paket.hasil = h && m !== null ? { penguasaan: m, tercapai: typeof h.passed === "boolean" ? h.passed : null } : null;
          }
          return [paket];
        }),
      }];
    }),
  };
}

/** A place whose record this reader may open (professional_record_places). */
export type TempatCatatan = { id: string; nama: string; tahun: string | null };

export function bacaTempatCatatan(raw: unknown): TempatCatatan[] {
  return (Array.isArray(raw) ? raw : []).flatMap((x) => {
    const r = (x ?? {}) as Record<string, unknown>;
    return typeof r.node_id === "string" ? [{ id: r.node_id, nama: teks(r.name), tahun: typeof r.academic_year === "string" ? r.academic_year : null }] : [];
  });
}

/** Where the record lives. */
export function alamatCatatan(simpul: string): string {
  return `/pengembangan/${encodeURIComponent(simpul)}`;
}
