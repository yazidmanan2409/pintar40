import Link from "next/link";
import { redirect } from "next/navigation";
import { enumLabel } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import { button, can, card, field, kataStudio, label, outcomeLine, studioInstitutions, tabSaya } from "../_lib";
import { saveDefinitionAction } from "../actions";
import { kunciKode } from "@/lib/galat-kontrak";
import { batasDalamKata, petunjukAturan, type BatasMode } from "@/lib/aturan-asesmen";
import TombolKirim from "@/components/TombolKirim";
import BidangTeks from "@/components/bentuk/BidangTeks";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";
import TandaTautan from "@/components/TandaTautan";
import Kosong from "@/components/Kosong";
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
 *
 * W1.3 (Batch 3; RV-14, DG-28/29): the form is Daisy's Form layout. Every field has its label above and, where it is a
 * number, a hint saying what it is for and its limit in words, from the bounds (src/lib/aturan-asesmen.ts); the send
 * grace is asked in minutes (the action turns it into the seconds the database keeps). Only the optional fields say
 * «(opsional)». A choice of two or three is a radio group whose rows are 44 px (components/Radio: «Two to four options:
 * a segmented control or radios instead»); the two switches are checkboxes with their explanation under them. The
 * names the action reads are unchanged. W1.9: every word in the reader's language.
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string; hal?: string; ubah?: string; baris?: string }>;

/** The shuffle policies the database accepts, each said in words (studio.definisi.acak.*). */
const ACAK = ["NONE", "ITEMS", "ITEMS_AND_OPTIONS"] as const;

export default async function Definisi({ searchParams }: { searchParams: Search }) {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("definisi")) redirect("/studio");
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const locale = await currentLocale();
  const s = kataStudio(locale);
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
  const modeSiklus = ((bounds ?? []) as BatasMode[]).filter((b) => MODE_SIKLUS.includes(b.mode));
  // W1.3: each number's hint and limit in words, from the bounds of the two modes this form offers
  const namaMode = (m: string) => enumLabel("mode", m, locale);
  const petunjuk = petunjukAturan(modeSiklus, s, namaMode);
  const opsional = s("studio.definisi.opsional");

  // the definition's two outcomes are whole sentences of their own
  const banner = sp.hasil === "ok" && (sp.kode === "DEFINITION_NEW_VERSION" || sp.kode === "DEFINITION_KEPT")
    ? s(kunciKode(sp.kode))
    : outcomeLine(sp, locale);

  return (
    <div className="pin-studio-halaman">
      <h2 className="pin-studio-h2">{s("studio.definisi.judul")}</h2>

      <section className={card}>
        <h3 className="pin-studio-h3">{s("studio.definisi.batas")}</h3>
        <ul className="pin-daftar-rapat pin-ket pin-num">
          {(bounds ?? []).map((b) => (
            // D-140(c), W1.3: the limits in words, a time in minutes, never «3–20 · 300s · 1×»
            <li key={b.mode}>{enumLabel("mode", b.mode, locale)}: {batasDalamKata(b as BatasMode, s)}</li>
          ))}
        </ul>
      </section>

      <section className={card} id="definisi">
        <form action={saveDefinitionAction} id="definisi-baru" className="pin-formulir">
          <p className="pin-ket">{s("studio.definisi.wajib")}</p>
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
          <div className="pin-formulir-baris">
            <fieldset className="pin-fieldset">
              <legend>{s("studio.definisi.f.mode")}</legend>
              {modeSiklus.map((b) => (
                <label key={b.mode} className="pin-pilihan">
                  <input type="radio" name="mode" value={b.mode} defaultChecked={b.mode === "POST_TEST"} />
                  <span>{enumLabel("mode", b.mode, locale)}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="pin-fieldset">
              <legend>{s("studio.bank.saring.untuk")}</legend>
              {/* L4 (CR-85, D-127 Q5): the bank's own words (jenis.bank.*, as Bank Soal says them), the value underneath */}
              {["PRACTICE", "TEST", "EXAM"].map((b) => (
                <label key={b} className="pin-pilihan">
                  <input type="radio" name="bank" value={b} defaultChecked={b === "PRACTICE"} />
                  <span>{enumLabel("bank", b, locale)}</span>
                </label>
              ))}
            </fieldset>
          </div>
          {/* W1.3: each number with its hint and its limit in words (Text field: the help under the label) */}
          <div className="pin-formulir-baris">
            <BidangTeks id="definisi-jumlah" name="jumlah" type="number" inputMode="numeric" min={1} required
              label={s("studio.definisi.f.jumlah")} petunjuk={petunjuk.jumlah} />
            <BidangTeks id="definisi-keselamatan" name="keselamatan" type="number" inputMode="numeric" min={0}
              label={s("studio.definisi.f.keselamatan")} petunjuk={petunjuk.keselamatan} opsional={opsional} />
            <BidangTeks id="definisi-ragu" name="ragu" type="number" inputMode="numeric" min={0}
              label={s("studio.definisi.f.ragu")} petunjuk={petunjuk.ragu} opsional={opsional} />
            <BidangTeks id="definisi-tenggang" name="tenggang_menit" type="number" inputMode="decimal" min={0} step={0.5}
              label={s("studio.definisi.f.tenggang_menit")} petunjuk={petunjuk.tenggang} opsional={opsional} />
            <BidangTeks id="definisi-percobaan" name="percobaan" type="number" inputMode="numeric" min={1}
              label={s("studio.definisi.f.percobaan")} petunjuk={petunjuk.percobaan} opsional={opsional} />
          </div>
          {/* L4 (CR-85): how many questions of each difficulty, one number per band in the band's own word, never typed JSON */}
          <fieldset className="pin-fieldset" aria-describedby="definisi-komposisi-petunjuk">
            <legend>{s("studio.definisi.f.komposisi")}<span className="pin-opsional"> {opsional}</span></legend>
            <p id="definisi-komposisi-petunjuk" className="pin-hint">{petunjuk.komposisi}</p>
            <div className="pin-formulir-baris">
              {(["MUDAH", "SEDANG", "SULIT"] as const).map((b) => (
                <label key={b} className={label}>
                  <span>{s(`mengajar.cepat.tingkat.${b}`)}</span>
                  <input className={field} name={`komposisi_${b}`} type="number" inputMode="numeric" min={0} />
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="pin-fieldset">
            <legend>{s("studio.definisi.f.acak")}</legend>
            {ACAK.map((v) => (
              <label key={v} className="pin-pilihan">
                <input type="radio" name="acak" value={v} defaultChecked={v === "ITEMS_AND_OPTIONS"} />
                <span>{s(`studio.definisi.acak.${v}`)}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="pin-fieldset">
            <legend>{s("studio.definisi.f.selama")}</legend>
            <label className="pin-pilihan">
              <input type="checkbox" name="jeda" />
              <span>{s("studio.definisi.f.jeda")}</span>
              <small>{s("studio.definisi.petunjuk.jeda")}</small>
            </label>
            <label className="pin-pilihan">
              <input type="checkbox" name="luring" />
              <span>{s("studio.definisi.f.luring")}</span>
              <small>{s("studio.definisi.petunjuk.luring")}</small>
            </label>
          </fieldset>
          <input type="hidden" name="definisi" value="" />
          <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
        </form>
        <SimpanIsian form="definisi-baru" ditolak={ditolak("definisi")} pemilik={pemilik} />
        <HasilDi q={sp} bagian="definisi" kalimat={banner} />
      </section>

      <section className="pin-studio-halaman">
        {/* E-K4: a saved edit makes a new version, whose row is not the one edited: it is answered above the list */}
        <HasilDi q={sp} bagian="definisi-baris" kalimat={banner} barisDiHalaman={(definitions ?? []).map((d) => d.id)} />
        <ul className="pin-daftar">
          {(definitions ?? []).map((d) => {
            const bab = d.course_id ? judulBab.get(d.course_id) : undefined;
            return (
              <li key={d.id} className={card}>
                <p className="pin-judul-baris">{d.title}</p>
                <p className="pin-ket-3 pin-num">{enumLabel("mode", d.mode, locale)} · {d.item_count} {s("studio.definisi.unit.soal")}</p>
                {/* FD-9: where the rule stands, and its chapter's steps, which it moves through */}
                <p className="pin-ket">
                  {s(d.status === "APPROVED" ? "studio.langkah.keadaan.selesai" : "studio.langkah.keadaan.nanti")}
                  {bab ? (
                    <>{" · "}<Link href={`/studio/paket/${bab.id}`} className="pin-tautan">{bab.title}<TandaTautan /></Link></>
                  ) : null}
                </p>
                {bab?.status === "INGESTED" && !bukaUbah(d.id) ? (
                  <Link href={`/studio/definisi?hal=${halaman}&ubah=${d.id}#definisi-${d.id}`} className="pin-tautan">{s("koleksi.ubah")}<TandaTautan /></Link>
                ) : null}
                {bab?.status === "INGESTED" && bukaUbah(d.id) ? (
                  <form action={saveDefinitionAction} id={`definisi-${d.id}`} className="pin-baris-aksi">
                    <input type="hidden" name="definisi" value={d.id} />
                    <input type="hidden" name="hal" value={halaman} />
                    <label className={label}><span>{s("studio.definisi.f.judul")}</span><input className={field} name="judul" defaultValue={d.title} /></label>
                    <label className={label}><span>{s("studio.definisi.f.jumlah")}</span><input className={field} name="jumlah" type="number" inputMode="numeric" min={1} defaultValue={d.item_count} /></label>
                    <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
                  </form>
                ) : null}
                {/* E-K4: an edit is answered in its own row */}<HasilDi q={sp} bagian="definisi-baris" baris={d.id} kalimat={banner} />
                {bab?.status === "INGESTED" && bukaUbah(d.id) ? <SimpanIsian form={`definisi-${d.id}`} ditolak={ditolak("definisi")} pemilik={pemilik} /> : null}
              </li>
            );
          })}
        </ul>
        {/* a page past the last says so, rather than an empty list (the Second Eye's finding 5); W3.2: the Empty state */}
        {definitions.length === 0 && halaman > 1 ? <Kosong jenis="tidak_cocok" kalimat={s("config.empty")} /> : null}
        <Penomoran halaman={halaman} lagi={lagi} ke={ke} locale={locale} benda={s("koleksi.benda.definisi")} jumlah={definitions.length} />
      </section>
    </div>
  );
}
