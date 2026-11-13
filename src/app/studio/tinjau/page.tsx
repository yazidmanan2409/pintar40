import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import { t, type HleEvent } from "@/lib/hle";
import Kosong from "@/components/Kosong";
import { studioInstitutions, tabSaya, when, zonaStudio } from "../_lib";
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
  // the owner's ruling (10 Nov): each package's moment on its school's clock (zonaStudio)
  const [institutions, locale, zonaDari] = await Promise.all([studioInstitutions(), currentLocale(), zonaStudio()]);
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

  // C1w (Daisy Q6): «Perbaikan kunci menunggu konfirmasi», each school's waiting key corrections, by the database's
  // own read (koreksi_kunci_antrean refuses anyone who is neither the owner nor a confirmer there)
  type Antre = { koreksi: string; paket: string | null; kunci_lama: string[]; kunci_baru: string[]; nama_pengaju: string;
    diajukan_pada: string; milik_sendiri: boolean; sekolah: string };
  const antre: Antre[] = (await Promise.all(institutions
    .filter((i) => i.capabilities.includes("CAN_REVIEW") || i.capabilities.includes("CAN_PUBLISH"))
    .map(async (i) => {
      const { data, error } = await supabase.rpc("koreksi_kunci_antrean", { p_institution: i.id });
      return error ? [] : ((data ?? []) as Omit<Antre, "sekolah">[]).map((k) => ({ ...k, sekolah: i.id }));
    }))).flat();

  return (
    <div className="pin-studio-halaman">
      <h2 className="pin-studio-h3">{s("studio.tinjau.judul")}</h2>
      {antre.length > 0 ? (
        <section className="pin-studio-halaman" aria-labelledby="pin-antre-kunci" data-antre-kunci={antre.length}>
          <h3 id="pin-antre-kunci" className="pin-studio-h3">{s("studio.kunci.antrean")}</h3>
          <div className="pin-list">
            {antre.map((k) => (
              <Link key={k.koreksi} href={`/studio/tinjau/kunci/${k.koreksi}`} className="pin-row" data-koreksi={k.koreksi}>
                <span className="pin-title">{s("studio.kunci.halaman")}</span>
                <span className="pin-rowmeta">
                  <span>{s("studio.kunci.antrean.baris").replace("{paket}", k.paket ?? "—").replace("{lama}", k.kunci_lama.join(", "))
                    .replace("{baru}", k.kunci_baru.join(", ")).replace("{nama}", k.nama_pengaju).replace("{waktu}", when(k.diajukan_pada, locale, zonaDari(k.sekolah)))}</span>
                  {k.milik_sendiri ? <span>{s("studio.kunci.orang_kedua")}</span> : null}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {rows.length === 0 ? (
        <Kosong jenis="belum" kalimat={s("studio.tinjau.kosong")} />
      ) : (
        <div className="pin-list">
          {rows.map((c) => (
            <Link key={c.id} href={`/studio/paket/${c.id}`} className="pin-row">
              <span className="pin-title">{c.title}</span>
              <span className="pin-rowmeta">
                <span>{c.subject} · {c.grade_label} · {byId.get(c.institution_id) ?? ""} · {when(c.created_at, locale, zonaDari(c.institution_id))}</span>
                {c.author_person_id && c.author_person_id === me ? <span>{s("studio.tinjau.bukan_penulis")}</span> : null}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
