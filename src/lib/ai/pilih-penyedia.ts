/**
 * C3w-1 · WHICH PROVIDER ANSWERS (Sharon's D-5, C3W-1-DESIGN.md §9). Pure: no network, no database, no React.
 *
 * C3w-1 has no real adapter. The local stub answers only under the harness's explicit flag, PINTAR_AI_STUB_HARNESS=1,
 * which only the selftest harness and the CI jobs that run it set. Anywhere else, a missing adapter is
 * AI_TIDAK_TERSEDIA, so a staging entitlement can never write fabricated drafts. The build mode is never the test: a
 * development build is not the harness.
 */
export type Pilihan = { ok: true; jenis: "stub" } | { ok: false; kode: "AI_TIDAK_TERSEDIA" };

const BENDERA = "PINTAR_AI_STUB_HARNESS";

export function pilihPenyedia(env: Record<string, string | undefined>): Pilihan {
  if (env[BENDERA] === "1") return { ok: true, jenis: "stub" };
  return { ok: false, kode: "AI_TIDAK_TERSEDIA" };
}
