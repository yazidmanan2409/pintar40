import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { kunciKode } from "@/lib/galat-kontrak";
import { tanggal } from "@/lib/tanggal";
import BarisHasil from "@/components/BarisHasil";
import TombolKirim from "@/components/TombolKirim";
import { ALASAN_KELUAR, adalahUuid, nilaiDari, urai, type KeputusanMurid } from "@/lib/kenaikan";
import { terapkanKenaikanAksi, tinjauKenaikanAksi } from "@/app/konfigurasi/kenaikan-aksi";

/**
 * «KENAIKAN KELAS DAN KELULUSAN» (Daisy's approved flow; owner, 9 Nov; ACCOUNT-LIFECYCLE-INVENTORY.md §10), on
 * Konfigurasi's «rollover» page. Four steps, each a plain page (no script needed), the database deciding every one:
 *   1. Pilih kelas: the school's Kelas, by school year.
 *   2. Keputusan: every learner of the class AND of its Tingkat with no Kelas (kenaikan_rencana), each with one choice:
 *      up into a Kelas of the new year, repeat straight into a Kelas of the new year, graduate, leave with a reason, or
 *      (only while a transfer is under way) wait for the transfer. «Naikkan semua ke …» pre-selects one destination
 *      for everyone; exceptions are then changed one by one.
 *   3. Tinjau: the outcome of each learner, by name, from the database's preview (it writes nothing); the class's and
 *      the destination classes' teachers, who are never carried over; one confirmation, with the review of teachers'
 *      assignments stated.
 *   4. Selesai: what the confirmation did, read back from the database (kenaikan_hasil), each learner by name with where
 *      they are now.
 */
type Murid = { person_id: string; nama: string; nomor: string | null; sumber: "KELAS" | "TINGKAT"; pindah_berjalan: boolean; asesmen_terbuka: boolean };
type Guru = { person_id: string; nama: string; peran: string };
type KelasBaru = { id: string; nama: string; guru: Guru[] };
type Rencana = {
  kelas: { id: string; nama: string; tahun: string | null; tingkat: string | null };
  murid: Murid[]; guru: Guru[]; tahun_berikut: Array<{ id: string; nama: string; kelas: KelasBaru[] }>;
};
type Hasil = { person_id: string; nama: string; keputusan: KeputusanMurid["keputusan"]; kelas_tujuan_nama: string | null; alasan: string | null };
type HasilAkhir = Hasil & { kelas_sekarang: string | null; akhir: string | null };

export type ParamKenaikan = { kn_kelas?: string; kn_tahun?: string; kn_semua?: string; kn_langkah?: string; kn_d?: string; kn_kode?: string; kn_ref?: string };

const label = "grid gap-1 text-sm text-ink-2";
const field = "pin-input"; // the v3 Field, as Konfigurasi's own forms
const primer = "pin-btn pin-primary justify-self-start";

export default async function KenaikanKelas({ sekolah, sp, locale }: { sekolah: string; sp: ParamKenaikan; locale: "id" | "en" }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const kelas = adalahUuid(sp.kn_kelas) ? sp.kn_kelas : null;
  const langkah = sp.kn_langkah === "tinjau" || sp.kn_langkah === "selesai" ? sp.kn_langkah : "keputusan";
  const tolak = sp.kn_kode ? (
    <BarisHasil nada="gagal">{s(kunciKode(sp.kn_kode))}{sp.kn_ref ? ` ${s("galat.rujukan")}: ${sp.kn_ref}.` : ""}</BarisHasil>
  ) : null;
  const ulang = (extra: Record<string, string>) => `/konfigurasi/rollover?${new URLSearchParams(extra).toString()}#rollover`;

  // 1. the class
  if (!kelas) {
    const [{ data: nodes }, { data: tahun }] = await Promise.all([
      supabase.from("org_nodes").select("id, name, academic_period_id, member_kind").eq("institution_id", sekolah)
        .eq("kind", "CLASS").eq("is_active", true).not("academic_period_id", "is", null).order("name"),
      supabase.from("academic_periods").select("id, name, starts_on").eq("institution_id", sekolah).order("starts_on"),
    ]);
    const daftar = ((nodes ?? []) as Array<{ id: string; name: string; academic_period_id: string; member_kind: string | null }>)
      .filter((n) => (n.member_kind ?? "LEARNER") === "LEARNER");
    const tahunList = (tahun ?? []) as Array<{ id: string; name: string }>;
    return (
      <div className="mt-3 grid gap-3" data-kenaikan-langkah="kelas">
        <p className="text-sm text-ink-3">{s("kenaikan.intro")}</p>
        {daftar.length === 0 ? <p className="text-sm text-ink-3">{s("kenaikan.kelas.kosong")}</p> : (
          <form method="get" action="/konfigurasi/rollover#rollover" className="grid max-w-md gap-2">
            <label className={label}>{s("kenaikan.kelas.pilih")}
              <select name="kn_kelas" className={field} required defaultValue="">
                <option value="" disabled>{s("kenaikan.pilih")}</option>
                {tahunList.map((y) => {
                  const di = daftar.filter((n) => n.academic_period_id === y.id);
                  return di.length ? (
                    <optgroup key={y.id} label={y.name}>
                      {di.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </label>
            <div><button type="submit" className={primer}>{s("kenaikan.kelas.lanjut")}</button></div>
          </form>
        )}
      </div>
    );
  }

  // 4. the outcome, as the database recorded it
  if (langkah === "selesai") {
    const { data, error } = await supabase.rpc("kenaikan_hasil", { p_kelas: kelas });
    const h = (data ?? null) as { pada: string; hasil: HasilAkhir[] } | null;
    if (error || !h) return <div className="mt-3">{tolak ?? <BarisHasil nada="gagal">{s("kenaikan.selesai.tidak_terbaca")}</BarisHasil>}</div>;
    return (
      <div className="mt-3 grid gap-3" data-kenaikan-langkah="selesai">
        <BarisHasil nada="ok">{s("kenaikan.selesai.ok").replace("{n}", String(h.hasil.length)).replace("{waktu}", tanggal(h.pada, "cap", locale))}</BarisHasil>
        <table className="w-full text-sm" data-kenaikan-hasil="">
          <caption className="pin-sr">{s("kenaikan.selesai.judul")}</caption>
          <thead><tr className="text-left text-ink-3"><th scope="col">{s("kenaikan.kolom.murid")}</th><th scope="col">{s("kenaikan.kolom.hasil")}</th><th scope="col">{s("kenaikan.kolom.sekarang")}</th></tr></thead>
          <tbody>
            {h.hasil.map((m) => (
              <tr key={m.person_id} className="border-b border-line-1" data-murid={m.person_id}>
                <th scope="row" className="py-1 text-left font-normal text-ink-1">{m.nama}</th>
                <td>{kalimat(s, m)}</td>
                <td className="text-ink-2">{m.kelas_sekarang ?? (m.akhir ? s(`kenaikan.akhir.${m.akhir.toLowerCase()}` as HleEvent) : "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><Link className="pin-tautan" href={ulang({})}>{s("kenaikan.selesai.lagi")}</Link></p>
      </div>
    );
  }

  const { data: rencanaData, error: rencanaError } = await supabase.rpc("kenaikan_rencana", { p_kelas: kelas });
  if (rencanaError || !rencanaData) {
    return <div className="mt-3"><BarisHasil nada="gagal">{s(kunciKode(rencanaError ? (rencanaError.code === "42501" ? "ACTION_NOT_ALLOWED" : "ACTION_FAILED") : "ACTION_FAILED"))}</BarisHasil></div>;
  }
  const r = rencanaData as Rencana;
  const judulKelas = <h3 className="text-sm font-medium text-ink-1">{r.kelas.nama}{r.kelas.tahun ? ` · ${r.kelas.tahun}` : ""}{r.kelas.tingkat ? ` · ${r.kelas.tingkat}` : ""}</h3>;
  if (r.tahun_berikut.length === 0) {
    return (
      <div className="mt-3 grid gap-2" data-kenaikan-langkah="tanpa-tahun">
        {judulKelas}
        <p className="text-sm text-ink-2">{s("kenaikan.tahun.belum_ada")} <Link className="pin-tautan" href="/konfigurasi/struktur#struktur">{s("kenaikan.tahun.ke_struktur")}</Link></p>
      </div>
    );
  }
  const tahun = r.tahun_berikut.find((y) => y.id === sp.kn_tahun) ?? r.tahun_berikut[0];
  const keputusan = new Map(urai(sp.kn_d).map((d) => [d.person_id, d]));

  // 3. the review
  if (langkah === "tinjau") {
    const { data, error } = await supabase.rpc("kenaikan_tetapkan", {
      p_kelas: kelas, p_tahun_baru: tahun.id, p_keputusan: [...keputusan.values()], p_guru_ditinjau: false, p_terapkan: false,
    });
    if (error) {
      return (
        <div className="mt-3 grid gap-2">{judulKelas}<BarisHasil nada="gagal">{s(kunciKode(error.code === "PR070" && error.details ? error.details : "ACTION_FAILED"))}</BarisHasil>
          <p><Link className="pin-tautan" href={ulang({ kn_kelas: kelas, kn_tahun: tahun.id, kn_d: sp.kn_d ?? "" })}>{s("kenaikan.tinjau.ubah")}</Link></p></div>
      );
    }
    const hasil = ((data as { hasil: Hasil[] }).hasil ?? []);
    const tujuan = tahun.kelas.filter((k) => hasil.some((h) => h.kelas_tujuan_nama === k.nama));
    return (
      <div className="mt-3 grid gap-3" data-kenaikan-langkah="tinjau">
        {judulKelas}
        <p className="text-sm text-ink-2">{s("kenaikan.tinjau.intro").replace("{tahun}", tahun.nama)}</p>
        <table className="w-full text-sm" data-kenaikan-pratinjau="">
          <caption className="pin-sr">{s("kenaikan.tinjau.judul")}</caption>
          <thead><tr className="text-left text-ink-3"><th scope="col">{s("kenaikan.kolom.murid")}</th><th scope="col">{s("kenaikan.kolom.hasil")}</th></tr></thead>
          <tbody>
            {hasil.map((m) => (
              <tr key={m.person_id} className="border-b border-line-1" data-murid={m.person_id}>
                <th scope="row" className="py-1 text-left font-normal text-ink-1">{m.nama}</th><td>{kalimat(s, m)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <section className="grid gap-1" aria-labelledby="kn-guru">
          <h3 id="kn-guru" className="text-sm font-medium text-ink-1">{s("kenaikan.guru.judul")}</h3>
          <p className="text-sm text-ink-2">{s("kenaikan.guru.intro")}</p>
          <ul className="text-sm text-ink-2" data-kenaikan-guru="">
            <li>{r.kelas.nama}: {r.guru.length ? r.guru.map((g) => g.nama).join(", ") : s("kenaikan.guru.tidak_ada")}</li>
            {tujuan.map((k) => <li key={k.id}>{k.nama}: {k.guru.length ? k.guru.map((g) => g.nama).join(", ") : s("kenaikan.guru.tidak_ada")}</li>)}
          </ul>
          <p className="text-sm"><Link className="pin-tautan" href="/konfigurasi/roles#roles">{s("kenaikan.guru.ke_peran")}</Link></p>
        </section>
        <form action={terapkanKenaikanAksi} className="grid gap-2">
          <input type="hidden" name="kelas" value={kelas} />
          <input type="hidden" name="tahun" value={tahun.id} />
          <input type="hidden" name="d" value={sp.kn_d ?? ""} />
          <label className="flex items-start gap-2 text-sm text-ink-1">
            <input type="checkbox" name="guru_ditinjau" value="ya" required />
            <span>{s("kenaikan.guru.sudah_ditinjau")}</span>
          </label>
          {tolak}
          <div className="flex flex-wrap items-center gap-3">
            <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("kenaikan.tinjau.konfirmasi")}</TombolKirim>
            <Link className="pin-tautan" href={ulang({ kn_kelas: kelas, kn_tahun: tahun.id, kn_d: sp.kn_d ?? "" })}>{s("kenaikan.tinjau.ubah")}</Link>
          </div>
        </form>
      </div>
    );
  }

  // 2. a decision for every learner
  const semua = adalahUuid(sp.kn_semua) && tahun.kelas.some((k) => k.id === sp.kn_semua) ? sp.kn_semua : null;
  const awal = (m: Murid) => {
    const d = keputusan.get(m.person_id);
    if (d) return nilaiDari(d);
    return semua && !m.pindah_berjalan ? `NAIK:${semua}` : "";
  };
  return (
    <div className="mt-3 grid gap-3" data-kenaikan-langkah="keputusan">
      {judulKelas}
      <form method="get" action="/konfigurasi/rollover#rollover" className="pin-baris-isian">
        <input type="hidden" name="kn_kelas" value={kelas} />
        <label className={label}>{s("kenaikan.tahun.label")}
          <select name="kn_tahun" className={field} defaultValue={tahun.id}>
            {r.tahun_berikut.map((y) => <option key={y.id} value={y.id}>{y.nama}</option>)}
          </select>
        </label>
        <label className={label}>{s("kenaikan.semua.label")}
          <select name="kn_semua" className={field} defaultValue={semua ?? ""}>
            <option value="">{s("kenaikan.semua.tidak")}</option>
            {tahun.kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </label>
        <div className="self-end"><button type="submit" className="pin-btn">{s("kenaikan.semua.terapkan")}</button></div>
      </form>
      {r.murid.length === 0 ? <p className="text-sm text-ink-3">{s("kenaikan.murid.kosong")}</p> : (
        <form action={tinjauKenaikanAksi} className="grid gap-2">
          <input type="hidden" name="kelas" value={kelas} />
          <input type="hidden" name="tahun" value={tahun.id} />
          <p className="text-sm text-ink-2">{s("kenaikan.murid.intro").replace("{n}", String(r.murid.length))}</p>
          <ul className="grid gap-1" data-kenaikan-murid="">
            {r.murid.map((m) => (
              <li key={m.person_id} className="grid gap-1 border-b border-line-1 py-1 sm:grid-cols-[1fr_auto] sm:items-center" data-murid={m.person_id}>
                <span className="text-sm text-ink-1">
                  {m.nama}{m.nomor ? <span className="text-ink-3"> · {m.nomor}</span> : null}
                  {m.sumber === "TINGKAT" ? <span className="pin-pill pin-info ml-2">{s("kenaikan.murid.tingkat_saja")}</span> : null}
                  {m.pindah_berjalan ? <span className="pin-pill pin-neutral ml-2">{s("kenaikan.murid.sedang_pindah")}</span> : null}
                  {m.asesmen_terbuka ? <span className="pin-pill pin-blocked ml-2">{s("kenaikan.murid.asesmen_terbuka")}</span> : null}
                </span>
                <label className="text-sm"><span className="pin-sr">{s("kenaikan.murid.keputusan_untuk")} {m.nama}</span>
                  <select name={`k[${m.person_id}]`} className={field} required defaultValue={awal(m)}>
                    <option value="">{s("kenaikan.pilih")}</option>
                    <optgroup label={s("kenaikan.opsi.naik_grup")}>
                      {tahun.kelas.map((k) => <option key={`n${k.id}`} value={`NAIK:${k.id}`}>{s("kenaikan.opsi.naik").replace("{kelas}", k.nama)}</option>)}
                    </optgroup>
                    <optgroup label={s("kenaikan.opsi.tinggal_grup")}>
                      {tahun.kelas.map((k) => <option key={`t${k.id}`} value={`TINGGAL:${k.id}`}>{s("kenaikan.opsi.tinggal").replace("{kelas}", k.nama)}</option>)}
                    </optgroup>
                    <option value="LULUS">{s("kenaikan.opsi.lulus")}</option>
                    <optgroup label={s("kenaikan.opsi.keluar_grup")}>
                      {ALASAN_KELUAR.map((a) => <option key={a} value={`KELUAR:${a}`}>{s(`kenaikan.alasan.${a.toLowerCase()}` as HleEvent)}</option>)}
                    </optgroup>
                    {m.pindah_berjalan ? <option value="PINDAH">{s("kenaikan.opsi.pindah")}</option> : null}
                  </select>
                </label>
              </li>
            ))}
          </ul>
          {tolak}
          <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("kenaikan.murid.tinjau")}</TombolKirim></div>
        </form>
      )}
    </div>
  );
}

function kalimat(s: (k: HleEvent) => string, m: Hasil): string {
  switch (m.keputusan) {
    case "NAIK": return s("kenaikan.hasil.naik").replace("{kelas}", m.kelas_tujuan_nama ?? "—");
    case "TINGGAL": return s("kenaikan.hasil.tinggal").replace("{kelas}", m.kelas_tujuan_nama ?? "—");
    case "LULUS": return s("kenaikan.hasil.lulus");
    case "KELUAR": return `${s("kenaikan.hasil.keluar")} ${m.alasan ? s(`kenaikan.alasan.${m.alasan.toLowerCase()}` as HleEvent) : ""}`.trim();
    case "PINDAH": return s("kenaikan.hasil.pindah");
  }
}
