import Link from "next/link";
import { redirect } from "next/navigation";
import { enumLabel } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions, tabSaya } from "../_lib";
import { saveDefinitionAction } from "../actions";
import { kunciKode } from "@/lib/galat-kontrak";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";
import TandaTautan from "@/components/TandaTautan";
import Penomoran, { UKURAN, halamanDiminta, rentang, tautanHalaman } from "@/components/koleksi/Penomoran";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/definisi");

/**
 * Assessment Definition builder (§10).
 *
 * Every bound shown here is READ from `assessment_definition_bounds` — there is
 * no item count, window or grace constant anywhere in this file or in the
 * action behind it. The server re-applies the same bounds, so a hand-crafted
 * POST gets the same refusal as a form.
 *
 * A change that alters how a result is read saves as a NEW version and says so
 * in plain language; a change of name alone says that instead (INV-29).
 *
 * CR-87, FD-9 (D-127 Q8): Admin sekolah's and Admin platform's alone (src/lib/studio-tab.ts). A rule has one lifecycle:
 * it is set while its chapter is still being drafted, moves with the chapter through Tinjau and becomes the released
 * chapter's Pemetaan Awal or Uji Penguasaan rule (release_cycle_definition reads those two modes only). So the form
 * offers only chapters still being drafted, takes the school from the chapter, offers the two modes the cycle reads, and
 * asks for no passing rule (the school's own pass mark decides, D-081, D-088(b)). Each saved rule names its chapter's
 * steps and whether it is approved; it is edited only while its chapter is still a draft.
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string; hal?: string; ubah?: string }>;

/** The shuffle policies the database accepts, each said in words (studio.definisi.acak.*). */
const ACAK = ["NONE", "ITEMS", "ITEMS_AND_OPTIONS"] as const;

export default async function Definisi({ searchParams }: { searchParams: Search }) {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("definisi")) redirect("/studio");
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;
  const institutions = (await studioInstitutions()).filter((i) => can(i, "CAN_DRAFT"));
  const namaSekolah = new Map(institutions.map((i) => [i.id, i.name]));

  const halaman = halamanDiminta(sp.hal);
  const [{ data: bounds }, { data: semuaDefinisi }, { data: courses }] = await Promise.all([
    supabase.from("assessment_definition_bounds").select("*").order("mode"),
    // L4 (CR-88): one page of rules at a time (src/components/koleksi/Penomoran.tsx), one more read to know if another follows
    supabase.from("assessment_definitions")
      .select("id, title, mode, version, item_count, institution_id, course_id, module_id, is_ad_hoc, status")
      .eq("is_ad_hoc", false).in("institution_id", institutions.map((i) => i.id)).order("title").order("id")
      .range(...rentang(halaman)),
    supabase.from("courses").select("id, title, institution_id, status")
      .in("institution_id", institutions.map((i) => i.id)).order("title"),
  ]);
  const lagi = (semuaDefinisi ?? []).length > UKURAN;
  const definitions = (semuaDefinisi ?? []).slice(0, UKURAN);
  // L4 (CR-88): a row's edit form opens by «Ubah», one row at a time; a refused save returns to that row's page with that
  // row open (saveDefinitionAction keeps `hal` and `ubah`), so what was typed comes back to its own form (CR-84 (3))
  const bukaUbah = (id: string) => sp.ubah === id;
  const ke = (n: number) => tautanHalaman("/studio/definisi", sp, "hal", n, "definisi");
  // FD-9: a rule is set while its chapter is still being drafted, and is read only as one of the cycle's two modes
  const MODE_SIKLUS = ["PRE_TEST", "POST_TEST"];
  const draf = (courses ?? []).filter((c) => c.status === "INGESTED");
  const judulBab = new Map((courses ?? []).map((c) => [c.id as string, c]));

  // the definition's two outcomes are whole sentences of their own
  const banner = sp.hasil === "ok" && (sp.kode === "DEFINITION_NEW_VERSION" || sp.kode === "DEFINITION_KEPT")
    ? s(kunciKode(sp.kode))
    : outcomeLine(sp);

  return (
    <div className="grid gap-6">
      <h2 className="text-lg font-medium">{s("studio.definisi.judul")}</h2>

      <section className={card}>
        <h3 className="font-medium">{s("studio.definisi.batas")}</h3>
        <ul className="mt-2 grid gap-1 text-sm text-ink-2">
          {(bounds ?? []).map((b) => (
            <li key={b.mode} className="tabular-nums">
              {/* D-140(c): the limits in words, never «3–20 · 300s · 1×» */}
              {enumLabel("mode", b.mode)}: {b.item_count_min}–{b.item_count_max} {s("studio.definisi.unit.soal")}
              {" · "}{s("studio.definisi.unit.tenggang")} {b.late_sync_grace_max} {s("studio.definisi.unit.detik")}
              {b.attempt_limit_max ? <>{" · "}{s("studio.definisi.unit.percobaan")} {b.attempt_limit_max}</> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className={card} id="definisi">
        <form action={saveDefinitionAction} id="definisi-baru" className="grid gap-2">
          <label className={label}>
            {/* CR-84 (4): only chapters still being drafted, each with its school; the school is the chapter's own */}
            <span>{s("studio.paket.judul")}</span>
            <select className={field} name="course" defaultValue="" required>
              <option value="" disabled>—</option>
              {draf.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}{institutions.length > 1 ? ` · ${namaSekolah.get(c.institution_id) ?? ""}` : ""}
                </option>
              ))}
            </select>
          </label>
          {/* D-140(c): every field has its visible label; the shuffle and the two switches are said in words */}
          <label className={label}><span>{s("studio.definisi.f.judul")}</span>
            <input className={field} name="judul" required />
          </label>
          <div className="flex flex-wrap gap-2">
            <label className={label}><span>{s("studio.definisi.f.mode")}</span>
            <select className={field} name="mode" defaultValue="POST_TEST">
              {(bounds ?? []).filter((b) => MODE_SIKLUS.includes(b.mode)).map((b) => (
                <option key={b.mode} value={b.mode}>{enumLabel("mode", b.mode)}</option>
              ))}
            </select>
            </label>
            <label className={label}><span>{s("studio.bank.saring.untuk")}</span>
            <select className={field} name="bank" defaultValue="PRACTICE">
              {/* L4 (CR-85, D-127 Q5): the bank's own words (jenis.bank.*, as Bank Soal says them), the value underneath */}
              {["PRACTICE", "TEST", "EXAM"].map((b) => <option key={b} value={b}>{enumLabel("bank", b)}</option>)}
            </select>
            </label>
            <label className={label}><span>{s("studio.definisi.f.jumlah")}</span><input className={field} name="jumlah" type="number" min={1} required /></label>
            <label className={label}><span>{s("studio.definisi.f.keselamatan")}</span><input className={field} name="keselamatan" type="number" min={0} /></label>
            <label className={label}><span>{s("studio.definisi.f.ragu")}</span><input className={field} name="ragu" type="number" min={0} /></label>
            <label className={label}><span>{s("studio.definisi.f.tenggang")}</span><input className={field} name="tenggang" type="number" min={0} /></label>
            <label className={label}><span>{s("studio.definisi.f.percobaan")}</span><input className={field} name="percobaan" type="number" min={1} /></label>
            <label className={label}><span>{s("studio.definisi.f.acak")}</span>
            <select className={field} name="acak" defaultValue="ITEMS_AND_OPTIONS">
              {ACAK.map((v) => <option key={v} value={v}>{s(`studio.definisi.acak.${v}`)}</option>)}
            </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1"><input type="checkbox" name="jeda" /> {s("studio.definisi.f.jeda")}</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="luring" /> {s("studio.definisi.f.luring")}</label>
          </div>
          {/* L4 (CR-85): how many questions of each difficulty, one number per band in the band's own word, never typed JSON */}
          <div className="flex flex-wrap gap-2">
            {(["MUDAH", "SEDANG", "SULIT"] as const).map((b) => (
              <label key={b} className={label}>
                <span>{s(`mengajar.cepat.tingkat.${b}`)}</span>
                <input className={field} name={`komposisi_${b}`} type="number" min={0} />
              </label>
            ))}
          </div>
          <input type="hidden" name="definisi" value="" />
          <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
        </form>
        <SimpanIsian form="definisi-baru" ditolak={ditolak("definisi")} pemilik={pemilik} />
        <HasilDi q={sp} bagian="definisi" kalimat={banner} />
      </section>

      <section className="grid gap-2">
        <ul className="grid gap-2">
          {(definitions ?? []).map((d) => {
            const bab = d.course_id ? judulBab.get(d.course_id) : undefined;
            return (
              <li key={d.id} className={card}>
                <p className="font-medium">{d.title}</p>
                <p className="mt-1 text-sm text-ink-3 tabular-nums">{enumLabel("mode", d.mode)} · {d.item_count} {s("studio.definisi.unit.soal")}</p>
                {/* FD-9: where the rule stands, and its chapter's steps, which it moves through */}
                <p className="mt-1 text-sm text-ink-2">
                  {s(d.status === "APPROVED" ? "studio.langkah.keadaan.selesai" : "studio.langkah.keadaan.nanti")}
                  {bab ? (
                    <>{" · "}<Link href={`/studio/paket/${bab.id}`} className="underline underline-offset-4">{bab.title}</Link></>
                  ) : null}
                </p>
                {bab?.status === "INGESTED" && !bukaUbah(d.id) ? (
                  <Link href={`/studio/definisi?hal=${halaman}&ubah=${d.id}#definisi-${d.id}`} className="pin-tautan">{s("koleksi.ubah")}<TandaTautan /></Link>
                ) : null}
                {bab?.status === "INGESTED" && bukaUbah(d.id) ? (
                  <form action={saveDefinitionAction} id={`definisi-${d.id}`} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="definisi" value={d.id} />
                    <input type="hidden" name="hal" value={halaman} />
                    <label className={label}><span>{s("studio.definisi.f.judul")}</span><input className={field} name="judul" defaultValue={d.title} /></label>
                    <label className={label}><span>{s("studio.definisi.f.jumlah")}</span><input className={field} name="jumlah" type="number" min={1} defaultValue={d.item_count} /></label>
                    <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
                  </form>
                ) : null}
                {bab?.status === "INGESTED" && bukaUbah(d.id) ? <SimpanIsian form={`definisi-${d.id}`} ditolak={ditolak("definisi")} pemilik={pemilik} /> : null}
              </li>
            );
          })}
        </ul>
        {/* a page past the last says so, rather than an empty list (the Second Eye's finding 5) */}
        {definitions.length === 0 && halaman > 1 ? <p className="text-sm text-ink-3">{s("config.empty")}</p> : null}
        <Penomoran halaman={halaman} lagi={lagi} ke={ke} />
      </section>
    </div>
  );
}
