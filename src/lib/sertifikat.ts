import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";

/**
 * The learner's own certificates (UX-1 Slice 1) — the reads.
 *
 * The column list, the four states and what each may render live next door in
 * `sertifikat-kontrak.ts`, which holds no privileged import; they are
 * re-exported here so a surface has one module to reach for.
 *
 * THE COLUMN LIST IS THE CONTRACT, AND IT IS WRITTEN ONCE.
 *
 * Q-11 ruled that contract-level column denial is not required: a direct read
 * of `certificates` must simply select the learner-facing fields and nothing
 * else. `signature`, `key_version`, `canonical_payload` and `snapshot_id` are
 * never requested, never rendered, never retained, never logged, never printed
 * and never used. They are not "hidden" — they are not fetched, so there is
 * nothing on this side of the wire to hide.
 *
 * `LIST_COLUMNS` below is the single place that list exists in the codebase.
 * UX1-S1-CERT-COLS-01 greps for it and fails if the string ever differs from
 * the ten columns the ruling names, so a tenth-and-a-half column cannot be
 * added by a later edit without the test saying so.
 *
 * `institution_id` is in the list because without it nothing resolves the
 * issuing institution's name — the learner reads that through
 * `institutions_select`, which is `is_member_of_institution(id)`. It was added
 * to the ruling on 2026-09-16 after Second Eye's review.
 *
 * THREE CONTRACT FACTS THIS MODULE IS BUILT AROUND (all OBSERVED in the frozen
 * schema at 9b2cc5d, migration 20260914103000_certificates_core.sql):
 *
 *  1. `my_certificate` DOES NOT FILTER BY STATUS, so it returns ELIGIBLE rows.
 *     The detail page applies the ELIGIBLE binding to its result too.
 *  2. `certificates_one_root_per_session` — UNIQUE (session_id) WHERE
 *     supersedes_certificate_id IS NULL — guarantees `my_certificate` returns
 *     exactly the ROOT certificate for a session, which after a reissue is the
 *     SUPERSEDED original. There is no forward pointer, so the replacement is
 *     found through the list: the row whose `supersedes_certificate_id` equals
 *     this row's `id`, followed to the end of the chain. The ten columns
 *     already carry both, so no column change is needed. This is the shape the
 *     contract intends, not a gap.
 *  3. `certificate_signed_when_issued` — CHECK (status = 'ELIGIBLE' OR
 *     (signature IS NOT NULL AND key_version IS NOT NULL)). An ELIGIBLE row can
 *     hold key material only as NULL, so the state Slice 1 meets by default
 *     carries nothing to leak. The column discipline still applies to ISSUED,
 *     REVOKED and SUPERSEDED rows, which do carry it.
 *
 * NO PAGE HERE ISSUES ANYTHING. `POST /api/certificates/issue` is not imported,
 * not called and not linked (V-6a): the lifecycle step that turns ELIGIBLE into
 * ISSUED is Bob's bounded gap, and a learner page that called a service-role
 * route to fill it would be building the gap's replacement in the wrong layer.
 */

export {
  LIST_COLUMNS, rendersCredential, rendersVerification,
  type CertificateStatus, type CertificateRow, type CertificateDetail,
} from "./sertifikat-kontrak";

import { LIST_COLUMNS } from "./sertifikat-kontrak";
import type { CertificateRow, CertificateDetail } from "./sertifikat-kontrak";

export async function myCertificates(): Promise<CertificateRow[]> {
  const db = await supabaseServer();
  const { data } = await db
    .from("certificates")
    .select(LIST_COLUMNS)
    .order("issued_at_iso", { ascending: false });
  return (data ?? []) as unknown as CertificateRow[];
}

/**
 * The replacement for a superseded certificate, found by following the chain
 * to its end — fact (2) above. A replacement that was itself replaced hands
 * back the last one, which is the certificate the learner should be using.
 */
export function replacementFor(row: CertificateRow, all: CertificateRow[]): CertificateRow | null {
  let current = row;
  for (let hops = 0; hops < all.length + 1; hops++) {
    const next = all.find((c) => c.supersedes_certificate_id === current.id);
    if (!next) break;
    current = next;
  }
  return current === row ? null : current;
}

export async function certificateForSession(sessionId: string): Promise<CertificateDetail | null> {
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  return (await engine.myCertificate(db, sessionId)) as CertificateDetail | null;
}

/**
 * The issuing institution's name, read through `institutions_select`, which is
 * `is_member_of_institution(id)` — the learner's own membership, not a
 * privileged lookup. A name that does not come back simply does not render; it
 * is never replaced by a stand-in.
 */
export async function institutionNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const db = await supabaseServer();
  const { data } = await db.from("institutions").select("id, name").in("id", unique);
  return new Map((data ?? []).map((r) => [String(r.id), String(r.name)]));
}

/**
 * The layout the issuing institution chose for its certificates.
 *
 * OBSERVED, and worth stating plainly because it shapes what this returns:
 * `certificate_templates_select` is `can_in_institution('CAN_PUBLISH', …)`, so
 * A LEARNER NEVER READS A TEMPLATE ROW. The read is made anyway — it is the
 * authorized read, and a staff viewer would get their row — and when it comes
 * back empty, the sheet falls back to the one layout the constraint permits
 * anything to be. No backend change is needed for this and none is proposed:
 * the learner's sheet is correct under the fallback, and the fallback is named
 * rather than implied.
 */
export const DEFAULT_LAYOUT = "CLASSIC";

export async function layoutFor(institutionId: string): Promise<string> {
  const db = await supabaseServer();
  const { data } = await db
    .from("certificate_templates")
    .select("layout")
    .eq("institution_id", institutionId)
    .limit(1);
  const row = (data ?? [])[0] as { layout?: string } | undefined;
  return row?.layout ?? DEFAULT_LAYOUT;
}
