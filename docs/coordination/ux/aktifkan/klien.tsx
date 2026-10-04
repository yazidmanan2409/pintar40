/**
 * DAISY-20 REVIEW HARNESS, the browser half. Not product code.
 *
 * Draws the real DAISY-20 components, in the real page frames, in the browser,
 * with `fetch` answering as BOB-26's contract says the routes will (§2–§4). The
 * driver (buat-bukti.mts) then presses what a person presses. Nothing here
 * decides anything the components do.
 */
import { createRoot } from "react-dom/client";
import Link from "next/link";
import type { ReactNode } from "react";
import { t, type Locale } from "@/lib/hle";
import MerekPintar from "@/components/MerekPintar";
import PengalihBahasa from "@/components/PengalihBahasa";
import PanelPernyataan, { KalimatPonsel } from "@/components/masuk/PanelPernyataan";
import MintaKode from "@/components/aktifkan/MintaKode";
import WizardAktivasi from "@/components/aktifkan/WizardAktivasi";
import AkunSaya from "@/components/aktifkan/AkunSaya";
import LayarMasuk from "@/components/masuk/LayarMasuk";
import BarisSesi from "@/components/BarisSesi";
import FormAktivasi from "@/components/aktivasi/FormAktivasi";
import DaftarNama, { type NamaDicatat } from "@/components/pendataan/DaftarNama";

type Jawab = [number, unknown];
type Kasus = { layar: string; locale: Locale; jawab: Record<string, Jawab[]>; nama?: NamaDicatat[] };
declare global {
  interface Window { __KASUS: Kasus; __PERMINTAAN: Array<{ jalur: string; isian: Record<string, string> }> }
}

const k = window.__KASUS;
window.__PERMINTAAN = [];
// each path answers its list in order, the last answer repeating
const antre: Record<string, Jawab[]> = Object.fromEntries(Object.entries(k.jawab).map(([p, a]) => [p, [...a]]));
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const jalur = typeof input === "string" ? input : input instanceof URL ? input.pathname : new URL(input.url).pathname;
  const isian = init?.body instanceof FormData ? Object.fromEntries([...init.body.entries()].map(([a, b]) => [a, String(b)])) : {};
  window.__PERMINTAAN.push({ jalur, isian });
  const daftar = antre[jalur];
  const [status, body] = daftar && daftar.length > 1 ? daftar.shift()! : daftar?.[0] ?? [0, null];
  if (status === 0) throw new TypeError("Failed to fetch");
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
};

const L = k.locale;
function Panggung({ children }: { children: ReactNode }) {
  return (
    <main className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop"><MerekPintar /><PengalihBahasa locale={L} /></div>
          <div className="pin-authbody">{children}<KalimatPonsel locale={L} /></div>
          <p className="pin-berdiri">{t("auth.foot", "public", { locale: L })}</p>
          <span className="pin-tanda" aria-hidden="true" />
        </div>
        <PanelPernyataan locale={L} />
      </div>
    </main>
  );
}
function Cangkang({ children }: { children: ReactNode }) {
  const s = (x: Parameters<typeof t>[0]) => t(x, "staff", { locale: L });
  return (
    <>
      <header className="pin-top pin-shell">
        <MerekPintar />
        <nav className="pin-tabs" aria-label={s("app.name")}>
          <Link href="/pendataan" aria-current="page">{s("nav.pendataan")}</Link>
          <Link href="/aktivasi">{s("nav.aktivasi")}</Link>
        </nav>
        <span className="pin-spacer" />
        <PengalihBahasa locale={L} />
        <BarisSesi locale={L} persona="staff" nama="Nadia Putri Maharani" />
      </header>
      <main className="pin-col">{children}</main>
    </>
  );
}

let isi: ReactNode;
const st = (x: Parameters<typeof t>[0]) => t(x, "staff", { locale: L });
switch (k.layar) {
  case "tamu": isi = <Panggung><MintaKode locale={L} /></Panggung>; break;
  case "wizard": isi = <Panggung><WizardAktivasi locale={L} /></Panggung>; break;
  case "masuk": isi = <Panggung><LayarMasuk locale={L} lanjut="" /></Panggung>; break;
  case "akun":
    isi = <Cangkang><div className="pin-head"><h1 className="pin-h1">{st("akun.judul")}</h1><p className="pin-intro">{st("akun.intro")}</p></div><AkunSaya locale={L} /></Cangkang>;
    break;
  case "aktivasi":
    isi = (
      <Cangkang>
        <div className="pin-head"><h1 className="pin-h1">{st("aktivasi.judul")}</h1></div>
        <FormAktivasi locale={L} adminSistem orang={[{ person_id: "p1", display_name: "Rahmat Hidayat", institutional_id: "2026001", institution_id: "i1" }]} />
      </Cangkang>
    );
    break;
  case "pendataan":
    isi = (
      <Cangkang>
        <section className="pin-sec" aria-labelledby="pin-pratinjau">
          <h2 id="pin-pratinjau">{st("pendataan.pratinjau.judul")}</h2>
          <DaftarNama locale={L} nama={k.nama ?? []} />
          <p className="pin-mm">{st("pendataan.pratinjau.tanya")}</p>
          <button type="button" className="pin-btn pin-go pin-data-btn">{st("pendataan.pratinjau.setuju")}</button>
        </section>
      </Cangkang>
    );
    break;
}
document.documentElement.lang = L;
createRoot(document.getElementById("akar")!).render(isi);
