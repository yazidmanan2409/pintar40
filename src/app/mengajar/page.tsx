import Link from "next/link";
import Kosong from "@/components/Kosong";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import { namaSapaan } from "@/components/sesi";
import KakiPintar from "@/components/KakiPintar";
import { BarisLingkup } from "@/components/bukti";
import Tur from "@/components/tur/Tur";
import { PARAM_BANTUAN } from "@/components/tur/TombolBantuan";
import { bolehTampilOtomatis, turPengajarBerlaku, TUR_PENGAJAR } from "@/lib/tur";
import { keadaanTur, peranSaya } from "@/lib/tur-negara";
import { kataAnggota } from "@/lib/mengajar";
import { kataMenunggu } from "@/components/mengajar/menunggu";
import { judulHalaman } from "@/lib/judul-halaman";
import { tanggal } from "@/lib/tanggal";

export const generateMetadata = judulHalaman("/mengajar");

export const dynamic = "force-dynamic";

/**
 * SCREEN A — the educator's home.
 *
 * ONE DECISION, THEN CONTEXT. The same shape the learner's home took in Slice
 * 2, for the same reason: a home that lists everything is a home that makes
 * somebody choose, and the whole point of knowing the state is that PINTAR can
 * choose first. So there is one panel on the primary ground — the single most
 * appropriate next act, derived from what is published and what this class does
 * not have — and everything below it is context, not competition.
 *
 * THE CLASS LIST IS A TEACHING CONTEXT, NOT A PERMISSION. `org_nodes_select` is
 * `is_member_of_institution`, so the database would hand this page every class
 * in the school. The list below is derived instead from the reader's OWN role
 * grants and the heading says exactly that — "classes in your teaching scope"
 * — because a heading reading "classes you may see" would be claiming a
 * boundary the database does not draw. Nothing on this page is protected BY
 * that derivation: every action it offers is authorized again server-side.
 *
 * THE COUNTS ARE COUNTS. "18 of 24 submitted" is a row count next to a roster
 * size. It is not a measure of a class and never carries a status colour, and
 * the sections that show it say so where an educator would otherwise assume.
 */

/** The greeting, from the hour the server read for this request. */
function sapaan(jam: number): HleEvent {
  if (jam < 11) return "mengajar.sapa.pagi";
  if (jam < 15) return "mengajar.sapa.siang";
  if (jam < 18) return "mengajar.sapa.sore";
  return "mengajar.sapa.malam";
}

export default async function BerandaPengajar({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string; [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const konteks = await ajar.konteks();
  const [aku, ringkas, satu, buka] = await Promise.all([
    ajar.saya(),
    ajar.ringkasKelas(konteks.kelas.map((k) => k.id)),
    ajar.satuHal(konteks.kelas),
    ajar.berjalan(konteks.kelas.map((k) => k.id)),
  ]);

  // UX-37: what waits in each class, as /langkah decides it (menungguKelas), batched over the classes; asked now,
  // so it is read beside the line below rather than after it
  const menungguDibaca = ajar.menungguBeranda(konteks.kelas, buka, ringkas);
  // W16: with no suggestion, a class that has no material at all while the school has published some
  const baru = satu ? null : await ajar.kelasTanpaMateri(konteks.kelas);
  const menunggu = await menungguDibaca;
  const sekarang = ajar.waktu();
  const nama = new Map(konteks.kelas.map((k) => [k.id, k.nama]));

  // ───────────────────────────────────────────────── the first-login tour (UX-1)
  //
  // WHOSE TOUR THIS IS. Seniority does not accumulate tours (§H-3): a Head of
  // Department standing on this page is not shown the educator's seven steps,
  // because their week includes review work this page does not carry and a
  // confident map of somebody else's page is worse than none. They get no
  // automatic tour and Help offers them none, until their own is designed.
  //
  // Nothing about this decides what anybody may do. Every act this page offers
  // is authorized again in the database from the caller's own session; this
  // only decides which map is drawn.
  const [keadaan, peran] = await Promise.all([keadaanTur(TUR_PENGAJAR), peranSaya()]);
  const turBerlaku = turPengajarBerlaku(peran ?? []);
  const sapa = aku ? namaSapaan(aku.nama, peran) : null;
  const bolehTur = bolehTampilOtomatis(keadaan, {
    tautanLangsung: typeof sp.lanjut === "string" && sp.lanjut.length > 0,
    // The Quick Assessment exclusion is the LEARNER's (§J-10): it protects a
    // class waiting to start. An educator's own landing has nothing to hold up.
    ujiCepatBerjalan: false,
  });

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <BarisLingkup
          scope={{ institution: konteks.institusi?.nama ?? null, period: konteks.periode }}
          locale={locale}
        />

        <div className="pin-head">
          <p className="pin-eyebrow">{tanggal(sekarang.iso, "hari", locale)}</p>
          {/* NO HONORIFIC, AND NONE INFERRED. `persons` carries `display_name`
              and nothing else — no title, no salutation, no gender — so "Bu"
              or "Pak" here could only come from guessing at a name, which the
              ruling forbids and which would be wrong about real people. The
              name is greeted as the school stored it -- in full for staff, and
              by first name for anybody else who reaches this page (D-020): a
              student who types /mengajar on a shared tablet must not see their
              full name printed here any more than in the session strip. */}
          <h1 className="pin-h1">
            {s(sapaan(sekarang.jam))}
            {sapa ? `, ${sapa}` : ""}
          </h1>
          <p className="pin-intro">{s("mengajar.beranda.intro")}</p>
        </div>

        {/* Step 1's target, on both branches: the card when there is one thing
            worth doing, and the line that says there is not. §J-1 — the
            spotlight goes to the area where the thing will appear, and nothing
            is ever invented to give the tour something to point at. */}
        {satu ? (
          <div className="pin-lanjut" data-tur="layak">
            <p className="pin-where">{s("mengajar.layak.eyebrow")}</p>
            <h2>
              {satu.kursus} {s("mengajar.layak.terbit")} {satu.kelasNama}
            </h2>
            <p className="pin-sub">{s("mengajar.layak.sebab")}</p>
            <div className="pin-actions">
              <Link
                className="pin-btn pin-primary"
                href={`/mengajar/${satu.kelasId}/siapkan?terbitan=${satu.terbitanId}`}
              >
                {s("mengajar.aksi.siapkan")} {satu.kursus} {s("mengajar.untuk")} {satu.kelasNama}
              </Link>
              <Link className="pin-btn" href={`/mengajar/${satu.kelasId}`}>
                {s("mengajar.aksi.lihat")} {satu.kelasNama}
              </Link>
            </div>
          </div>
        ) : baru ? (
          <div className="pin-lanjut" data-tur="layak">
            <p className="pin-where">{s("mengajar.layak.eyebrow")}</p>
            <h2>
              {s("mengajar.layak.kelas_baru")} {baru.kelasNama}
            </h2>
            <div className="pin-actions">
              <Link className="pin-btn pin-primary" href={`/mengajar/${baru.kelasId}/siapkan`}>
                {s("mengajar.siap.eyebrow")}
              </Link>
              <Link className="pin-btn" href={`/mengajar/${baru.kelasId}`}>
                {s("mengajar.aksi.lihat")} {baru.kelasNama}
              </Link>
            </div>
          </div>
        ) : (
          <div data-tur="layak"><Kosong jenis="belum" kalimat={s("mengajar.layak.kosong")} /></div>
        )}

        <div className="pin-sec" data-tur="kelas">
          <h2>{s("mengajar.kelas.judul")}</h2>
          <p className="pin-sub">{s("mengajar.kelas.sub")}</p>
          {konteks.kelas.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.kelas.kosong")} />
          ) : (
            <div className="pin-list">
              {konteks.kelas.map((k) => {
                const r = ringkas[k.id];
                const jalan = buka.filter((b) => b.nodeId === k.id);
                const meta = [
                  r?.mapel,
                  `${format.number(r?.murid ?? 0, locale)} ${format.satuan(r?.murid ?? 0, s(kataAnggota("mengajar.bukti.murid", k.jenis)), locale)}`,
                  ...jalan.map(
                    (b) =>
                      `${b.judul} · ${format.number(b.mengumpulkan, locale)}/${format.number(r?.murid ?? 0, locale)} ${s("mengajar.bukti.kumpul").toLowerCase()}`,
                  ),
                ].filter(Boolean);
                const tunggu = menunggu[k.id] ?? [];
                return (
                  <Link key={k.id} className="pin-row" href={`/mengajar/${k.id}`}>
                    <span className="pin-title">{k.nama}</span>
                    <span className="pin-rowmeta">
                      {meta.map((m, i) => (
                        <span key={i}>{m}</span>
                      ))}
                    </span>
                    {/* UX-37: the class's waiting work, in /langkah's own words; the row opens the class */}
                    {tunggu.length > 0 ? (
                      <span className="pin-rowmeta" data-menunggu={k.id}>
                        {tunggu.map((m) => (
                          <span key={m.key}>{kataMenunggu(m, s, locale, kataAnggota("mengajar.bukti.murid", k.jenis)).judul}</span>
                        ))}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="pin-sec" data-tur="berjalan">
          <h2>{s("mengajar.berjalan.judul")}</h2>
          {buka.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("mengajar.berjalan.kosong")} />
          ) : (
            <div className="pin-list">
              {buka.map((b) => (
                // UX-37: a running assessment opens who has submitted it, as «Lihat bukti» and /langkah lead there
                <Link key={b.id} className="pin-row" href={`/mengajar/${b.nodeId}/siapa?penugasan=${b.id}`}>
                  <span className="pin-title">
                    {b.judul} · {nama.get(b.nodeId) ?? ""}
                  </span>
                  <span className="pin-rowmeta">
                    {b.ditutup ? <span>{tanggal(b.ditutup, "hari", locale)}</span> : null}
                    <span>
                      {format.number(b.mengumpulkan, locale)}/
                      {format.number(ringkas[b.nodeId]?.murid ?? 0, locale)}{" "}
                      {s("mengajar.bukti.kumpul").toLowerCase()}
                    </span>
                  </span>
                  <span className="pin-pill pin-neutral">{s("mengajar.status.berjalan")}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <KakiPintar />
      </main>

      {/* A SIBLING OF THE PAGE, NOT A CHILD OF IT: while a step is open the
          tour makes every sibling inert, and a tour mounted inside `main`
          would be making itself inert along with the page. */}
      <Tur
        kunci={TUR_PENGAJAR}
        varian="pengajar"
        locale={locale}
        persona="educator"
        keadaan={keadaan}
        otomatis={bolehTur.boleh}
        tersedia={turBerlaku}
        bantuanAwal={sp[PARAM_BANTUAN] === "1"}
        kosong={[
          ...(satu ? [] : ["layak"]),
          ...(konteks.kelas.length === 0 ? ["kelas"] : []),
          ...(buka.length === 0 ? ["berjalan"] : []),
        ]}
      />
    </>
  );
}
