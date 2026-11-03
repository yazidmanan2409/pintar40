import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import { berstruktur, nilaiMetrik } from "@/lib/nilai-metrik";
import NilaiLaporan from "@/components/bukti/NilaiLaporan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import RingkasKesiapan from "@/components/pimpinan/RingkasKesiapan";
import AngkaTerkelola from "@/components/pimpinan/AngkaTerkelola";
import { BarisLingkup, KartuKetiadaan } from "@/components/bukti";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/pimpinan/[simpul]");

export const dynamic = "force-dynamic";

/**
 * ONE PART OF THE SCHOOL, LOOKED AT DELIBERATELY.
 *
 * The second step of the journey the WP1 ruling describes: aggregate by default,
 * then a legitimate branch, then a roster, then one named learner. Nothing here
 * is a new kind of reading — it is the home's evidence section at one chosen
 * node, plus the way into the roster beneath it.
 *
 * THE NODE IN THE URL IS NEVER TRUSTED. `simpulDalamLingkup` asks
 * `management_scope_over_node` about it on every request, so a hand-edited
 * segment naming a department in another faculty, or a uuid that is nobody, both
 * arrive at the same refusal page — which has no slot for a reason precisely so
 * one cannot leak.
 *
 * THE BRANCH BELOW IS NAVIGATION AND NOT A CLAIM. `cabang()` filters on `jalur`
 * in Postgres and re-checks here, throwing if anything outside the reader's
 * confirmed scopes survives. What it lists is where this reader may go next, and
 * every one of those places re-decides on arrival.
 */
export default async function SimpulPimpinan({
  params,
}: {
  params: Promise<{ simpul: string }>;
}) {
  const { simpul } = await params;
  const locale = await currentLocale();
  const s = (k: string) => t(k as HleEvent, "staff", { locale });

  const node = await pim.simpulDalamLingkup(simpul);
  if (!node) {
    return (
      <HalamanPenolakan
        messageKey="pimpinan.ditolak"
        persona="staff"
        locale={locale}
        backHref="/pimpinan"
        backKey="pimpinan.kembali"
      />
    );
  }

  const [bukti, bawah] = await Promise.all([
    pim.buktiPimpinan(node.id, node.institusi),
    pim.cabang([node.id]),
  ]);

  const angka = bukti.filter((e) => e.status === "ok");
  const absen = bukti.filter((e) => e.status !== "ok");
  // The node itself comes back from its own subtree; it is where the reader
  // already is, not somewhere to go. W11: nor are the hidden Jenjang and Reguler.
  const lain = pim.bagianDiBawah(node.id, bawah);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/pimpinan">
          ← {s("pimpinan.kembali")}
        </Link>
        <BarisLingkup scope={{ path: [node.nama] }} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("pimpinan.eyebrow")}</p>
          <h1 className="pin-h1">{node.nama}</h1>
        </div>

        <section className="pin-sec" aria-labelledby="pin-bukti">
          <h2 id="pin-bukti">{s("pimpinan.bukti.judul")}</h2>
          {bukti.length === 0 ? (
            <p className="pin-empty">{s("pimpinan.bukti.kosong")}</p>
          ) : (
            // W3.9 (RV-9): the figures and the absence cards under them are spaced by the layout gap, never touching
            <div className="pin-bukti-tumpuk">
              {angka.length > 0 ? (
                <div className="pin-grid2">
                  {angka.map((e, i) => (
                    <AngkaTerkelola
                      key={e.metric_id ?? `angka-${i}`}
                      entry={e}
                      value={nilaiMetrik(e.metric_id, e.value, locale)}
                      rincian={berstruktur(e.value) ? <NilaiLaporan entry={e} locale={locale} /> : undefined}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : null}
              {absen.map((e, i) => (
                <KartuKetiadaan
                  key={e.metric_id ?? `absen-${i}`}
                  entry={e}
                  locale={locale}
                  persona="staff"
                />
              ))}
            </div>
          )}
        </section>

        <RingkasKesiapan entries={bukti} locale={locale} />

        {/* WP7C. One more thing this part of the school has, reached the same
            way the roster is. It is a LIST of rounds, one class and one
            educator each: nothing on the other side of this link adds two
            classes together, and nothing compares two educators. */}
        <section className="pin-sec" aria-labelledby="pin-ub">
          <h2 id="pin-ub">{s("umpanbalik.pimpinan.judul")}</h2>
          <p className="pin-mm">{s("umpanbalik.pimpinan.sub")}</p>
          <Link className="pin-btn" href={`/pimpinan/${encodeURIComponent(node.id)}/umpan-balik`}>
            {s("umpanbalik.pimpinan.buka")}
          </Link>
        </section>

        <section className="pin-sec" aria-labelledby="pin-murid">
          <h2 id="pin-murid">{s("pimpinan.murid.judul")}</h2>
          <p className="pin-mm">{s("pimpinan.murid.sub")}</p>
          <Link className="pin-btn" href={`/pimpinan/${encodeURIComponent(node.id)}/murid`}>
            {s("pimpinan.murid.judul")}
          </Link>
        </section>

        {lain.length > 0 ? (
          <section className="pin-sec" aria-labelledby="pin-bawah">
            <h2 id="pin-bawah">{s("pimpinan.lingkup.judul")}</h2>
            <ul className="pin-list">
              {lain.map((n) => (
                <li key={n.id}>
                  <Link href={`/pimpinan/${encodeURIComponent(n.id)}`}>{n.nama}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

