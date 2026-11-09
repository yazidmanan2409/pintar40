import Link from "next/link";
import Ikon from "@/components/Ikon";
import { t, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { kunciKode } from "@/lib/galat-kontrak";
import { tanggal } from "@/lib/tanggal";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import TombolKirim from "@/components/TombolKirim";
import { ALASAN_KELUAR, adalahUuid, kelasDenganTahun, kelompokkan, namaTingkat, nilaiDari, tahunPendek, urai, type KeputusanMurid } from "@/lib/kenaikan";
import DaftarKeputusan, { type OpsiKeputusan } from "@/components/kenaikan/DaftarKeputusan";
import { terapkanKenaikanAksi } from "@/app/konfigurasi/kenaikan-aksi";

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
 * RECONCILED WITH DAISY'S REVIEW OF THE BUILD (TINJAUAN-KENAIKAN-KELAS-DIBANGUN, 9 Nov):
 *   - a step line on every step (K3); the heading «Kelas 5B · Tingkat 5 · 2026/27» (K2); one year format, always written;
 *   - the picker marks each Kelas already processed, with its date, and offers it no more (K4);
 *   - decisions: a live count and exceptions marked (DaftarKeputusan); «Terapkan» fills only the Kelas's own learners,
 *     never one from the Tingkat or with a transfer under way, and says what it did (Q1);
 *   - the review: counts first, the exceptions by name and always shown, the main group folded; the destination Kelas'
 *     teachers only, the box naming those without one; Peran & akses opens in a new tab so no decision is lost (Q2);
 *   - the outcome: checked against PINTAR's data in one line, any mismatch first; grouped as the review; a departure
 *     as «Pendaftaran berakhir · date · reason»; the Kelas still without a teacher; the next Kelas not yet processed (Q3,
 *     K6).
 */
type Murid = { person_id: string; nama: string; nomor: string | null; sumber: "KELAS" | "TINGKAT"; pindah_berjalan: boolean; asesmen_terbuka: boolean };
type Guru = { person_id: string; nama: string; peran: string };
type KelasBaru = { id: string; nama: string; guru: Guru[] };
type Rencana = {
  kelas: { id: string; nama: string; tahun: string | null; tingkat: string | null };
  murid: Murid[]; guru: Guru[]; tahun_berikut: Array<{ id: string; nama: string; kelas: KelasBaru[] }>;
};
type Hasil = { person_id: string; nama: string; sumber?: string | null; keputusan: KeputusanMurid["keputusan"]; kelas_tujuan?: string | null; kelas_tujuan_nama: string | null; alasan: string | null; asesmen_diakhiri?: number };
type HasilAkhir = Hasil & { kelas_sekarang: string | null; akhir: string | null; akhir_pada: string | null; akhir_alasan: string | null; tahun_tujuan: string | null; sesuai: boolean };

export type ParamKenaikan = { kn_kelas?: string; kn_tahun?: string; kn_semua?: string; kn_langkah?: string; kn_d?: string; kn_kode?: string; kn_ref?: string };

const label = "pin-kenaikan-label";
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
  const langkahKe = (n: 1 | 2 | 3, nama: HleEvent) => (
    <p className="pin-meta" data-kenaikan-step={n}>{s("kenaikan.langkah").replace("{n}", String(n))} · {s(nama)}</p>
  );

  // the Kelas of this school already processed (K4): each promotion.applied row names its Kelas and when
  const { data: sudahRows } = await supabase.from("audit_log").select("target_id, at")
    .eq("action", "promotion.applied").eq("target_table", "org_nodes").eq("institution_id", sekolah).order("at", { ascending: false });
  const sudah = new Map<string, string>();
  for (const r of (sudahRows ?? []) as Array<{ target_id: string; at: string }>) if (!sudah.has(r.target_id)) sudah.set(r.target_id, r.at);

  // the school's active learner Kelas with their years, for the picker and for «Lanjut ke …» after a run
  const [{ data: nodes }, { data: tahunRows }] = await Promise.all([
    supabase.from("org_nodes").select("id, name, academic_period_id, member_kind").eq("institution_id", sekolah)
      .eq("kind", "CLASS").eq("is_active", true).not("academic_period_id", "is", null).order("name"),
    supabase.from("academic_periods").select("id, name, starts_on").eq("institution_id", sekolah).order("starts_on"),
  ]);
  const daftar = ((nodes ?? []) as Array<{ id: string; name: string; academic_period_id: string; member_kind: string | null }>)
    .filter((n) => (n.member_kind ?? "LEARNER") === "LEARNER");
  const tahunList = (tahunRows ?? []) as Array<{ id: string; name: string }>;

  // 1. the class
  if (!kelas) {
    return (
      <div className="pin-kenaikan" data-kenaikan-langkah="kelas">
        {langkahKe(1, "kenaikan.langkah.kelas")}
        <p className="pin-meta">{s("kenaikan.intro")}</p>
        {daftar.length === 0 ? <Kosong jenis="belum" kalimat={s("kenaikan.kelas.kosong")} /> : (
          <form method="get" action="/konfigurasi/rollover#rollover" className="pin-kenaikan-isian">
            <label className={label}>{s("kenaikan.kelas.pilih")}
              <select name="kn_kelas" className={field} required defaultValue="">
                <option value="" disabled>{s("kenaikan.pilih")}</option>
                {tahunList.map((y) => {
                  const di = daftar.filter((n) => n.academic_period_id === y.id);
                  return di.length ? (
                    <optgroup key={y.id} label={tahunPendek(y.name)}>
                      {di.map((n) => {
                        const pada = sudah.get(n.id);
                        return <option key={n.id} value={n.id} disabled={Boolean(pada)} data-sudah={pada ? "" : undefined}>
                          {kelasDenganTahun(n.name, y.name)}{pada ? ` · ${s("kenaikan.kelas.sudah").replace("{tanggal}", tanggal(pada, "baca", locale))}` : ""}
                        </option>;
                      })}
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

  const kelasNode = daftar.find((n) => n.id === kelas);
  const lanjutKe = () => {
    // K6: the next Kelas of the same year not yet processed, as the primary way on
    const berikut = kelasNode ? daftar.find((n) => n.academic_period_id === kelasNode.academic_period_id && n.id !== kelas && !sudah.has(n.id)) : undefined;
    return (
      <div className="pin-actions" data-kenaikan-lanjut="">
        {berikut ? <Link className={primer} href={ulang({ kn_kelas: berikut.id })} data-kenaikan-berikut={berikut.id}>
          {s("kenaikan.selesai.berikut").replace("{kelas}", kelasDenganTahun(berikut.name, tahunList.find((y) => y.id === berikut.academic_period_id)?.name))}</Link> : null}
        <Link className="pin-tautan" href={ulang({})}>{s("kenaikan.selesai.lagi")}</Link>
      </div>
    );
  };

  // 4. the outcome, as the database recorded it
  if (langkah === "selesai") {
    const { data, error } = await supabase.rpc("kenaikan_hasil", { p_kelas: kelas });
    const h = (data ?? null) as { pada: string; hasil: HasilAkhir[]; guru_kosong: string[] } | null;
    if (error || !h) return <div className="pin-kenaikan">{tolak ?? <BarisHasil nada="gagal">{s("kenaikan.selesai.tidak_terbaca")}</BarisHasil>}</div>;
    const tidak = h.hasil.filter((m) => !m.sesuai);
    const tahunTujuan = h.hasil.find((m) => m.tahun_tujuan)?.tahun_tujuan ?? null;
    const g = kelompokkan(h.hasil);
    return (
      <div className="pin-kenaikan" data-kenaikan-langkah="selesai">
        <BarisHasil nada="ok">
          {s("kenaikan.selesai.ok").replace("{n}", String(h.hasil.length)).replace("{waktu}", tanggal(h.pada, "cap", locale))}
          {tidak.length === 0 ? ` ${s("kenaikan.selesai.sesuai")}` : ""}
        </BarisHasil>
        {tidak.length > 0 ? (
          <BarisHasil nada="gagal">
            <span data-kenaikan-tidak-sesuai={tidak.length}>{s("kenaikan.selesai.tidak_sesuai").replace("{n}", String(tidak.length))}</span>{" "}
            {tidak.map((m) => `${m.nama}: ${s("kenaikan.selesai.keputusan")} ${kalimat(s, m, tahunTujuan)}, ${s("kenaikan.selesai.tercatat")} ${tercatat(s, m, locale)}`).join("; ")}.{" "}
            {s("kenaikan.selesai.periksa")}
          </BarisHasil>
        ) : null}
        {g.kelompok.map((k) => (
          <section key={k.kunci} className="pin-kenaikan-kelompok" data-kenaikan-kelompok={k.kunci}>
            <h4 className="pin-kenaikan-judul">{judulKelompok(s, k.isi[0], k.isi.length, tahunTujuan)}</h4>
            <ul className="pin-kenaikan-murid" data-kenaikan-hasil="">
              {k.isi.map((m) => <li key={m.person_id} data-murid={m.person_id}>{m.nama} · {tercatat(s, m, locale)}</li>)}
            </ul>
          </section>
        ))}
        {h.guru_kosong.length > 0 ? (
          <p className="pin-kenaikan-teks" data-kenaikan-guru-kosong={h.guru_kosong.length}>
            {s("kenaikan.selesai.guru_kosong").replace("{n}", String(h.guru_kosong.length)).replace("{tahun}", tahunPendek(tahunTujuan))
              .replace("{daftar}", h.guru_kosong.join(", "))}{" "}
            <Link className="pin-tautan" href="/konfigurasi/roles#roles">{s("kenaikan.guru.ke_peran")}</Link>
          </p>
        ) : null}
        {lanjutKe()}
      </div>
    );
  }

  const { data: rencanaData, error: rencanaError } = await supabase.rpc("kenaikan_rencana", { p_kelas: kelas });
  if (rencanaError || !rencanaData) {
    return <div className="pin-kenaikan"><BarisHasil nada="gagal">{s(kunciKode(rencanaError ? (rencanaError.code === "42501" ? "ACTION_NOT_ALLOWED" : "ACTION_FAILED") : "ACTION_FAILED"))}</BarisHasil></div>;
  }
  const r = rencanaData as Rencana;
  // K2: «Kelas 5B · Tingkat 5 · 2026/27»
  const judulKelas = <h3 className="pin-kenaikan-judul">{[r.kelas.nama, namaTingkat(r.kelas.tingkat), tahunPendek(r.kelas.tahun)].filter(Boolean).join(" · ")}</h3>;
  if (r.tahun_berikut.length === 0) {
    return (
      <div className="pin-kenaikan" data-kenaikan-langkah="tanpa-tahun">
        {judulKelas}
        <p className="pin-kenaikan-teks">{s("kenaikan.tahun.belum_ada")} <Link className="pin-tautan" href="/konfigurasi/struktur#struktur">{s("kenaikan.tahun.ke_struktur")}</Link></p>
      </div>
    );
  }
  const tahun = r.tahun_berikut.find((y) => y.id === sp.kn_tahun) ?? r.tahun_berikut[0];
  const keputusan = new Map(urai(sp.kn_d).map((d) => [d.person_id, d]));
  const kt = (k: { nama: string }) => kelasDenganTahun(k.nama, tahun.nama);

  // 3. the review
  if (langkah === "tinjau") {
    const { data, error } = await supabase.rpc("kenaikan_tetapkan", {
      p_kelas: kelas, p_tahun_baru: tahun.id, p_keputusan: [...keputusan.values()], p_guru_ditinjau: false, p_terapkan: false,
    });
    if (error) {
      return (
        <div className="pin-kenaikan">{judulKelas}<BarisHasil nada="gagal">{s(kunciKode(error.code === "PR070" && error.details ? error.details : "ACTION_FAILED"))}</BarisHasil>
          <p><Link className="pin-tautan" href={ulang({ kn_kelas: kelas, kn_tahun: tahun.id, kn_d: sp.kn_d ?? "" })}>{s("kenaikan.tinjau.ubah")}</Link></p></div>
      );
    }
    const hasil = ((data as { hasil: Hasil[] }).hasil ?? []).map((m) => ({ ...m, kelas_tujuan: m.kelas_tujuan ?? null }));
    const g = kelompokkan(hasil);
    const utamaGrup = g.kelompok.find((k) => k.kunci === g.utama);
    // the destination Kelas only, each with its teachers or none (Q2)
    const tujuan = tahun.kelas.filter((k) => hasil.some((h) => h.kelas_tujuan === k.id || h.kelas_tujuan_nama === k.nama));
    const tanpaGuru = tujuan.filter((k) => k.guru.length === 0);
    const ringkas = g.kelompok.map((k) => judulKelompok(s, k.isi[0], k.isi.length, tahun.nama)).join(" · ");
    return (
      <div className="pin-kenaikan" data-kenaikan-langkah="tinjau">
        {langkahKe(3, "kenaikan.langkah.tinjau")}
        {judulKelas}
        <p className="pin-kenaikan-teks">{s("kenaikan.tinjau.intro").replace("{tahun}", tahunPendek(tahun.nama))}</p>
        <p className="pin-kenaikan-hitung" data-kenaikan-ringkas="">{ringkas}</p>
        {g.pengecualian.length > 0 ? (
          <section className="pin-kenaikan-kelompok" data-kenaikan-pengecualian={g.pengecualian.length}>
            <h4 className="pin-kenaikan-judul">{s("kenaikan.tinjau.pengecualian")}</h4>
            <ul className="pin-kenaikan-murid">
              {g.pengecualian.map((m) => (
                <li key={m.person_id} data-murid={m.person_id}>
                  {m.nama} · {m.sumber === "TINGKAT" ? `${s("kenaikan.tinjau.dari_tingkat")} · ` : ""}{kalimat(s, m, tahun.nama)}
                  {m.asesmen_diakhiri ? <span className="pin-meta" data-asesmen-diakhiri={m.asesmen_diakhiri}> · {s("kenaikan.hasil.asesmen").replace("{n}", String(m.asesmen_diakhiri))}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {utamaGrup ? (
          <details className="pin-disclosure pin-kenaikan-kelompok" data-kenaikan-utama={utamaGrup.isi.length}>
            <summary className="cursor-pointer">{judulKelompok(s, utamaGrup.isi[0], utamaGrup.isi.length, tahun.nama)}<Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
            <ul className="pin-kenaikan-murid">
              {utamaGrup.isi.filter((m) => m.sumber !== "TINGKAT").map((m) => (
                <li key={m.person_id} data-murid={m.person_id}>{m.nama}
                  {m.asesmen_diakhiri ? <span className="pin-meta" data-asesmen-diakhiri={m.asesmen_diakhiri}> · {s("kenaikan.hasil.asesmen").replace("{n}", String(m.asesmen_diakhiri))}</span> : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <section className="pin-kenaikan" aria-labelledby="kn-guru">
          <h3 id="kn-guru" className="pin-kenaikan-judul">{s("kenaikan.guru.judul")}</h3>
          <p className="pin-kenaikan-teks">{s("kenaikan.guru.intro")}</p>
          {tujuan.length ? (
            <ul className="pin-kenaikan-murid" data-kenaikan-guru="">
              {tujuan.map((k) => <li key={k.id}>{kt(k)}: {k.guru.length ? k.guru.map((x) => x.nama).join(", ") : s("kenaikan.guru.tidak_ada")}</li>)}
            </ul>
          ) : <p className="pin-kenaikan-teks" data-kenaikan-guru="" data-kenaikan-tanpa-tujuan="">{s("kenaikan.guru.tanpa_tujuan")}</p>}
          <p><Link className="pin-tautan" href="/konfigurasi/roles#roles" target="_blank" rel="noopener">{s("kenaikan.guru.ke_peran_tab")}</Link></p>
        </section>
        <form action={terapkanKenaikanAksi} className="pin-kenaikan">
          <input type="hidden" name="kelas" value={kelas} />
          <input type="hidden" name="tahun" value={tahun.id} />
          <input type="hidden" name="d" value={sp.kn_d ?? ""} />
          <label className="pin-kenaikan-centang">
            <input type="checkbox" name="guru_ditinjau" value="ya" required />
            <span data-kenaikan-tanpa-guru={tanpaGuru.length}>{tanpaGuru.length
              ? s("kenaikan.guru.tahu_tanpa").replace("{daftar}", daftarKata(tanpaGuru.map((k) => k.nama), locale) + ` · ${tahunPendek(tahun.nama)}`)
              : tujuan.length ? s("kenaikan.guru.semua_ada") : s("kenaikan.guru.tanpa_tujuan_centang")}</span>
          </label>
          <p className="pin-kenaikan-teks" data-kenaikan-kalimat="">{s("kenaikan.tinjau.kalimat").replace("{n}", String(hasil.length)).replace("{ringkas}", ringkas)}</p>
          {tolak}
          <div className="pin-actions">
            <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("kenaikan.tinjau.konfirmasi")}</TombolKirim>
            <Link className="pin-tautan" href={ulang({ kn_kelas: kelas, kn_tahun: tahun.id, kn_d: sp.kn_d ?? "" })}>{s("kenaikan.tinjau.ubah")}</Link>
          </div>
        </form>
      </div>
    );
  }

  // 2. a decision for every learner
  const semua = adalahUuid(sp.kn_semua) && tahun.kelas.some((k) => k.id === sp.kn_semua) ? sp.kn_semua : null;
  // Q1: «Terapkan» fills the Kelas's own learners only, never one from the Tingkat or with a transfer under way
  const dariSemua = (m: Murid) => Boolean(semua && !keputusan.get(m.person_id) && !m.pindah_berjalan && m.sumber === "KELAS");
  const awal = (m: Murid) => {
    const d = keputusan.get(m.person_id);
    if (d) return nilaiDari(d);
    return dariSemua(m) ? `NAIK:${semua}` : "";
  };
  const diisi = r.murid.filter(dariSemua).length;
  const opsi: OpsiKeputusan[] = [
    { label: s("kenaikan.opsi.naik_grup"), opsi: tahun.kelas.map((k) => ({ value: `NAIK:${k.id}`, label: s("kenaikan.opsi.naik").replace("{kelas}", kt(k)), ringkas: s("kenaikan.hitung.naik").replace("{kelas}", kt(k)) })) },
    { label: s("kenaikan.opsi.tinggal_grup"), opsi: tahun.kelas.map((k) => ({ value: `TINGGAL:${k.id}`, label: s("kenaikan.opsi.tinggal").replace("{kelas}", kt(k)), ringkas: s("kenaikan.hitung.tinggal") })) },
    { label: s("kenaikan.opsi.lulus_grup"), opsi: [{ value: "LULUS", label: s("kenaikan.opsi.lulus"), ringkas: s("kenaikan.hitung.lulus") }] },
    { label: s("kenaikan.opsi.keluar_grup"), opsi: ALASAN_KELUAR.map((a) => ({ value: `KELUAR:${a}`, label: s(`kenaikan.alasan.${a.toLowerCase()}` as HleEvent), ringkas: s("kenaikan.hitung.keluar") })) },
  ];
  const adaPindah = r.murid.some((m) => m.pindah_berjalan);
  if (adaPindah) opsi.push({ label: s("kenaikan.opsi.pindah_grup"), opsi: [{ value: "PINDAH", label: s("kenaikan.opsi.pindah"), ringkas: s("kenaikan.hitung.pindah") }] });
  return (
    <div className="pin-kenaikan" data-kenaikan-langkah="keputusan">
      {langkahKe(2, "kenaikan.langkah.keputusan")}
      {judulKelas}
      <form method="get" action="/konfigurasi/rollover#rollover" className="pin-baris-isian">
        <input type="hidden" name="kn_kelas" value={kelas} />
        <label className={label}>{s("kenaikan.tahun.label")}
          <select name="kn_tahun" className={field} defaultValue={tahun.id}>
            {r.tahun_berikut.map((y) => <option key={y.id} value={y.id}>{tahunPendek(y.nama)}</option>)}
          </select>
        </label>
        <label className={label}>{s("kenaikan.semua.label")}
          <select name="kn_semua" className={field} defaultValue={semua ?? ""}>
            <option value="">{s("kenaikan.semua.tidak")}</option>
            {tahun.kelas.map((k) => <option key={k.id} value={k.id}>{kt(k)}</option>)}
          </select>
        </label>
        <div className="pin-kenaikan-terapkan"><button type="submit" className="pin-btn">{s("kenaikan.semua.terapkan")}</button></div>
      </form>
      {semua ? (
        <p role="status" className="pin-meta" data-kenaikan-diterapkan={diisi}>
          {s("kenaikan.semua.diterapkan").replace("{n}", String(diisi)).replace("{sisa}", String(r.murid.length - diisi))}
        </p>
      ) : null}
      {r.murid.length === 0 ? <Kosong jenis="belum" kalimat={s("kenaikan.murid.kosong")} /> : (
        <DaftarKeputusan locale={locale} kelas={kelas} tahun={tahun.id} utama={semua ? `NAIK:${semua}` : null} opsi={opsi} tolak={tolak}
          baris={r.murid.map((m) => ({
            person_id: m.person_id, nama: m.nama, nomor: m.nomor, awal: awal(m),
            tanda: [m.sumber === "TINGKAT" ? s("kenaikan.murid.tingkat_saja") : null, m.pindah_berjalan ? s("kenaikan.murid.sedang_pindah") : null,
                    m.asesmen_terbuka ? s("kenaikan.murid.asesmen_terbuka") : null].filter((x): x is string => x !== null),
          }))}
          kata={{ pilih: s("kenaikan.pilih"), keputusanUntuk: s("kenaikan.murid.keputusan_untuk"), pengecualian: s("kenaikan.murid.pengecualian"),
                  belum: s("kenaikan.hitung.belum"), belumNama: s("kenaikan.hitung.belum_nama"), tinjau: s("kenaikan.murid.tinjau"),
                  intro: s("kenaikan.murid.intro").replace("{n}", String(r.murid.length)) }} />
      )}
    </div>
  );
}

/** One learner's outcome, the year always written («Naik ke Kelas 6A · 2027/28»). */
function kalimat(s: (k: HleEvent) => string, m: Hasil, tahun: string | null): string {
  const kelasT = m.kelas_tujuan_nama ? kelasDenganTahun(m.kelas_tujuan_nama, tahun) : "—";
  switch (m.keputusan) {
    case "NAIK": return s("kenaikan.hasil.naik").replace("{kelas}", kelasT);
    case "TINGGAL": return s("kenaikan.hasil.tinggal").replace("{kelas}", kelasT);
    case "LULUS": return s("kenaikan.hasil.lulus");
    // the reason's own words already say «Keluar: …»
    case "KELUAR": return m.alasan ? s(`kenaikan.alasan.${m.alasan.toLowerCase()}` as HleEvent) : s("kenaikan.hasil.keluar");
    case "PINDAH": return s("kenaikan.hasil.pindah");
  }
}

/** A group's heading with its count («36 naik ke Kelas 6A · 2027/28», «1 tinggal kelas»). */
function judulKelompok(s: (k: HleEvent) => string, m: Hasil, n: number, tahun: string | null): string {
  const kelasT = m.kelas_tujuan_nama ? kelasDenganTahun(m.kelas_tujuan_nama, tahun) : "—";
  switch (m.keputusan) {
    case "NAIK": return `${n} ${s("kenaikan.hitung.naik").replace("{kelas}", kelasT)}`;
    case "TINGGAL": return `${n} ${s("kenaikan.hitung.tinggal")} · ${kelasT}`;
    case "LULUS": return `${n} ${s("kenaikan.hitung.lulus")}`;
    case "KELUAR": return `${n} ${s("kenaikan.hitung.keluar")}`;
    case "PINDAH": return `${n} ${s("kenaikan.hitung.pindah")}`;
  }
}

/** Where a learner is now, as PINTAR recorded it: their Kelas with its year, or how and when their enrolment ended. */
function tercatat(s: (k: HleEvent) => string, m: HasilAkhir, locale: "id" | "en"): string {
  if (m.kelas_sekarang) return kelasDenganTahun(m.kelas_sekarang, m.keputusan === "NAIK" || m.keputusan === "TINGGAL" ? m.tahun_tujuan : null);
  if (m.akhir === "EXPIRED" || !m.akhir) return s("kenaikan.akhir.expired");
  // Daisy (Dimas): «Pendaftaran berakhir · 9 Nov 2026 · pindah ke sekolah di luar PINTAR», never «Pindah sekolah»
  const alasan = m.akhir_alasan ? s(`kenaikan.berakhir.${m.akhir_alasan.toLowerCase()}` as HleEvent) : s(`kenaikan.akhir.${m.akhir.toLowerCase()}` as HleEvent);
  return [s("kenaikan.berakhir"), m.akhir_pada ? tanggal(m.akhir_pada, "baca", locale) : null, alasan].filter(Boolean).join(" · ");
}

/** «6A, 6B dan 5A» / «6A, 6B and 5A». */
function daftarKata(xs: string[], locale: "id" | "en"): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} ${locale === "en" ? "and" : "dan"} ${xs[xs.length - 1]}`;
}

