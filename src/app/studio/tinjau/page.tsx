import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import { t, type HleEvent } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import Kosong from "@/components/Kosong";
import { studioInstitutions, tabSaya } from "../_lib";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/tinjau");

/**
 * Review queue (§4). A reviewer never sees an "approve" affordance for their
 * own draft — but that is presentation. The refusal is the database's: from
 * 0057 the APPROVED transition requires CAN_REVIEW and records the caller as
 * the reviewer, so approving one's own draft is refused whether the button is
 * on the page or not.
 *
 * W1.6 (Batch 3). Each package opens at its «Setujui isi» step, where the reviewer approves it or sends it back to
 * its author with a reason (kembalikan_paket). The queue is Daisy's list (as J1Terbit draws Studio's), in the reader's
 * language (UX-25), and an empty queue is the Empty state.
 */
export default async function Tinjau() {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("tinjau")) redirect("/studio");
  const supabase = await supabaseServer();
  const [institutions, locale] = await Promise.all([studioInstitutions(), currentLocale()]);
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const byId = new Map(institutions.map((i) => [i.id, i.name]));

  const [{ data: me }, { data: courses }] = await Promise.all([
    supabase.rpc("current_person_id"),
    supabase.from("courses")
      .select("id, title, subject, grade_label, institution_id, author_person_id, created_at")
      .eq("status", "IN_REVIEW")
      // L3 (FD-4): read for the working context's place alone, not every school's queue
      .in("institution_id", institutions.map((i) => i.id))
      .order("created_at", { ascending: true }),
  ]);

  const rows = (courses ?? []).filter((c) =>
    institutions.some((i) => i.id === c.institution_id && i.capabilities.includes("CAN_REVIEW")));

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-medium">{s("studio.tinjau.judul")}</h2>
      {rows.length === 0 ? (
        <Kosong jenis="belum" kalimat={s("studio.tinjau.kosong")} />
      ) : (
        <div className="pin-list">
          {rows.map((c) => (
            <Link key={c.id} href={`/studio/paket/${c.id}`} className="pin-row">
              <span className="pin-title">{c.title}</span>
              <span className="pin-rowmeta">
                <span>{c.subject} · {c.grade_label} · {byId.get(c.institution_id) ?? ""} · {tanggal(c.created_at, "cap", locale)}</span>
                {c.author_person_id && c.author_person_id === me ? <span>{s("studio.tinjau.bukan_penulis")}</span> : null}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
