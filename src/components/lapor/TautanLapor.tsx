"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Locale, type Persona } from "@/lib/hle";
import { alamatLapor } from "@/lib/lapor-masalah-kontrak";
import Ikon from "@/components/Ikon";

/**
 * DAISY-12 (D-037 step 2): «Laporkan masalah», beside Bantuan on every staff shell. It carries the page the reader is
 * on, so the report says where the problem happened without being asked; the query string is left behind, since it
 * can hold a name or an id the report does not need.
 */
export default function TautanLapor({ locale, persona = "staff", kelas = "pin-bantuan-tombol" }: {
  locale: Locale; persona?: Persona; kelas?: string;
}) {
  const path = usePathname() ?? "/";
  return (
    <Link className={kelas} href={alamatLapor(path)} data-lapor="1" data-tip-host="">
      {/* E1: the staff rail shows the icon (triangle-alert) and keeps the word as the link's name, visually hidden */}
      <Ikon nama="triangle-alert" kelas="pin-rail-ikon" />
      <span className="pin-rail-teks">{t("nav.lapor", persona, { locale })}</span>
      <span className="pin-nav-tip" aria-hidden="true">{t("nav.lapor", persona, { locale })}</span>
    </Link>
  );
}
