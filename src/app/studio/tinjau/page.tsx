import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { card, s, studioInstitutions, when, tabSaya } from "../_lib";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/tinjau");

/**
 * Review queue (§4). A reviewer never sees an "approve" affordance for their
 * own draft — but that is presentation. The refusal is the database's: from
 * 0057 the APPROVED transition requires CAN_REVIEW and records the caller as
 * the reviewer, so approving one's own draft is refused whether the button is
 * on the page or not.
 */
export default async function Tinjau() {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("tinjau")) redirect("/studio");
  const supabase = await supabaseServer();
  const institutions = await studioInstitutions();
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
        <p className={card}>{s("studio.tinjau.kosong")}</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((c) => (
            <li key={c.id} className={card}>
              <Link href={`/studio/paket/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                {c.title}
              </Link>
              <p className="mt-1 text-sm text-ink-3">
                {c.subject} · {c.grade_label} · {byId.get(c.institution_id) ?? ""} · {when(c.created_at)}
              </p>
              {c.author_person_id && c.author_person_id === me ? (
                <p className="mt-2 text-sm text-ink-2">{s("studio.tinjau.bukan_penulis")}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
