import { enumLabel } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions } from "../_lib";
import { saveDefinitionAction } from "../actions";
import { kunciKode } from "@/lib/galat-kontrak";
import TombolKirim from "@/components/TombolKirim";

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
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Definisi({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const institutions = (await studioInstitutions()).filter((i) => can(i, "CAN_DRAFT"));

  const [{ data: bounds }, { data: definitions }, { data: courses }] = await Promise.all([
    supabase.from("assessment_definition_bounds").select("*").order("mode"),
    supabase.from("assessment_definitions")
      .select("id, title, mode, version, item_count, institution_id, course_id, module_id, is_ad_hoc")
      .eq("is_ad_hoc", false).order("title"),
    supabase.from("courses").select("id, title, institution_id").order("title"),
  ]);

  // the definition's two outcomes are whole sentences of their own
  const banner = sp.hasil === "ok" && (sp.kode === "DEFINITION_NEW_VERSION" || sp.kode === "DEFINITION_KEPT")
    ? s(kunciKode(sp.kode))
    : outcomeLine(sp);

  return (
    <div className="grid gap-6">
      <h2 className="text-lg font-medium">{s("studio.definisi.judul")}</h2>
      {banner ? <p className={card}>{banner}</p> : null}

      <section className={card}>
        <h3 className="font-medium">{s("studio.definisi.batas")}</h3>
        <ul className="mt-2 grid gap-1 text-sm text-ink-2">
          {(bounds ?? []).map((b) => (
            <li key={b.mode} className="tabular-nums">
              {enumLabel("mode", b.mode)}: {b.item_count_min}–{b.item_count_max} · {b.late_sync_grace_max}s
              {b.attempt_limit_max ? ` · ${b.attempt_limit_max}×` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className={card} id="definisi">
        <form action={saveDefinitionAction} className="grid gap-2">
          <label className={label}>
            <span>{s("config.section.roles")}</span>
            <select className={field} name="institution" defaultValue={institutions[0]?.id ?? ""} required>
              {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
          <label className={label}>
            <span>{s("studio.paket.judul")}</span>
            <select className={field} name="course" defaultValue="">
              <option value="">—</option>
              {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <input className={field} name="judul" placeholder="nama aturan" required />
          <div className="flex flex-wrap gap-2">
            <select className={field} name="mode" defaultValue="QUICK">
              {(bounds ?? []).map((b) => <option key={b.mode} value={b.mode}>{enumLabel("mode", b.mode)}</option>)}
            </select>
            <select className={field} name="bank" defaultValue="PRACTICE">
              {["PRACTICE", "TEST", "EXAM"].map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input className={field} name="jumlah" type="number" placeholder="jumlah soal" required />
            <input className={field} name="keselamatan" type="number" placeholder="minimum keselamatan" />
            <input className={field} name="ragu" type="number" placeholder="jendela ragu (detik)" />
            <input className={field} name="tenggang" type="number" placeholder="tenggang kirim (detik)" />
            <input className={field} name="percobaan" type="number" placeholder="batas percobaan" />
            <select className={field} name="acak" defaultValue="ITEMS_AND_OPTIONS">
              {["NONE", "ITEMS", "ITEMS_AND_OPTIONS"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1"><input type="checkbox" name="jeda" /> jeda</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="luring" /> luring</label>
          </div>
          <input className={field} name="komposisi" placeholder='komposisi, mis. {"MUDAH":3,"SEDANG":2}' />
          <input className={field} name="kelulusan" placeholder='kelulusan, mis. {"mastery_min":0.6}' />
          <input type="hidden" name="definisi" value="" />
          <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
        </form>
      </section>

      <section className="grid gap-2">
        <ul className="grid gap-2">
          {(definitions ?? []).map((d) => (
            <li key={d.id} className={card}>
              <p className="font-medium">{d.title}</p>
              <p className="mt-1 text-sm text-ink-3 tabular-nums">{enumLabel("mode", d.mode)} · {d.item_count}</p>
              <form action={saveDefinitionAction} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="definisi" value={d.id} />
                <input className={field} name="judul" defaultValue={d.title} />
                <input className={field} name="jumlah" type="number" defaultValue={d.item_count} />
                <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
