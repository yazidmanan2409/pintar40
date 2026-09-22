// Shared strings: the sample banner, the primary navigation, the footer,
// and the CTA labels every page reuses so they never drift between pages.

import { L } from "./dom.js";

export const SAMPLE = {
  label: L("CONTOH RANCANGAN", "DESIGN SAMPLE"),
  body: L(
    "Arah desain baru untuk situs korporat PINTAR, dibuat untuk ditinjau. Semua foto adalah placeholder berlabel; formulir kontak tidak terhubung ke mana pun.",
    "A fresh design direction for the PINTAR corporate site, made for review. Every photo is a labelled placeholder; the contact form connects to nothing."),
};

export const BRAND = { word: "PINTAR" };

// Every route, in the order the footer's full sitemap uses. The primary
// header keeps only a restrained subset (see chrome.js) — this list is the
// single source of truth so a page can never silently vanish from the
// footer while still being reachable, or vice versa.
export const PAGES = [
  { slug: "beranda", href: "/", primary: true,
    label: L("Beranda", "Home") },
  { slug: "apa-yang-dilakukan", href: "/apa-yang-dilakukan/", primary: true,
    label: L("Apa yang Dilakukan", "What PINTAR Does") },
  { slug: "untuk-pendidik", href: "/untuk-pendidik/", primary: true,
    label: L("Untuk Pendidik", "For Educators") },
  { slug: "untuk-manajemen", href: "/untuk-manajemen/", primary: true,
    label: L("Untuk Manajemen", "For Management") },
  { slug: "cara-kerja", href: "/cara-kerja/", primary: false,
    label: L("Cara Kerja", "How It Works") },
  { slug: "laporan", href: "/laporan/", primary: true,
    label: L("Laporan", "Reports") },
  { slug: "tentang", href: "/tentang/", primary: true,
    label: L("Tentang", "About") },
  { slug: "kontak", href: "/kontak/", primary: false,
    label: L("Kontak", "Contact") },
  { slug: "mini-pintar", href: "/mini-pintar/", primary: false,
    label: L("Coba Mini-PINTAR", "Try Mini-PINTAR") },
];

export const CTA = {
  tryMini: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),
  aboutPintar: L("Kenali PINTAR", "About PINTAR"),
  talkToUs: L("Bicara dengan Kami", "Talk to Us"),
  seeReports: L("Lihat Contoh Laporan", "See Sample Reports"),
  seeForSchools: L("Lihat PINTAR untuk Sekolah", "See PINTAR for Schools"),
};

export const FOOTER = {
  tagline: L(
    "PINTAR memberi pendidik lebih banyak waktu untuk mendidik.",
    "PINTAR gives educators more time to educate."),
  navHeading: L("Jelajahi", "Explore"),
  roleHeading: L("Untuk Siapa", "Who It's For"),
  aboutHeading: L("Perusahaan", "Company"),
  langHeading: L("Bahasa", "Language"),
  copyright: L(
    `© ${new Date().getFullYear()} PINTAR. Contoh rancangan, bukan situs produksi.`,
    `© ${new Date().getFullYear()} PINTAR. Design sample, not a production site.`),
};

export const NAV_LABEL = L("Navigasi utama", "Main navigation");
export const MENU_OPEN = L("Buka menu", "Open menu");
export const MENU_CLOSE = L("Tutup menu", "Close menu");
export const SKIP_LINK = L("Langsung ke konten", "Skip to content");
