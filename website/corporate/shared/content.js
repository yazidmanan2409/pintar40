// Shared strings: the sample banner, the primary navigation, the footer,
// and the CTA labels every page reuses so they never drift between pages.

import { L } from "./dom.js";

export const SAMPLE = {
  label: L("CONTOH RANCANGAN", "DESIGN SAMPLE"),
  body: L(
    "Situs korporat PINTAR, untuk ditinjau. Semua foto adalah placeholder berlabel; formulir kontak tidak terhubung ke mana pun.",
    "The PINTAR corporate site, for review. Every photo is a labelled placeholder; the contact form connects to nothing."),
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
    "PINTAR dirancang untuk memberi pendidik lebih banyak waktu untuk mendidik.",
    "PINTAR is designed to give educators more time to educate."),
  navHeading: L("Jelajahi", "Explore"),
  roleHeading: L("Untuk Siapa", "Who It's For"),
  // Not "Perusahaan / Company": the legal entity is still open, and a heading
  // must not imply one.
  aboutHeading: L("Tentang PINTAR", "About PINTAR"),
  langHeading: L("Bahasa", "Language"),
  // The legal entity is OPEN pending Yazid's confirmation. The line names
  // none rather than inventing one, and says so.
  copyright: L(
    `© ${new Date().getFullYear()} · Pemegang hak cipta menunggu konfirmasi. Contoh rancangan, bukan situs produksi.`,
    `© ${new Date().getFullYear()} · Copyright holder pending confirmation. Design sample, not a production site.`),
  // Three different things, kept apart on every page: what PINTAR is designed
  // to do, what Mini-PINTAR demonstrates, and what is live. The site makes no
  // claim about the third; availability is a conversation, not a sentence.
  status: L(
    "Situs ini menjelaskan cara PINTAR dirancang bekerja. Mini-PINTAR adalah demonstrasi, bukan asesmen resmi. Untuk ketersediaan di sekolah Anda, bicaralah dengan kami.",
    "This site explains how PINTAR is designed to work. Mini-PINTAR is a demonstration, not an official assessment. For availability at your school, talk to us."),
};

export const NAV_LABEL = L("Navigasi utama", "Main navigation");
export const MENU_OPEN = L("Buka menu", "Open menu");
export const MENU_CLOSE = L("Tutup menu", "Close menu");
export const SKIP_LINK = L("Langsung ke konten", "Skip to content");
