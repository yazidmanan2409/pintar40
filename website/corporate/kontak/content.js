import { L } from "../shared/dom.js";

export const HEADER = {
  eyebrow: L("KONTAK", "CONTACT"),
  headline: L("Mari bicara.", "Let's talk."),
  lede: L(
    "Ceritakan sedikit tentang sekolah atau institusi Anda. Kami akan menghubungi Anda untuk percakapan singkat, tanpa tekanan.",
    "Tell us a little about your school or institution. We'll reach out for a short, no-pressure conversation."),
};

export const NEXT = {
  label: L("SETELAH ANDA MENGIRIM", "AFTER YOU SEND THIS"),
  items: [
    L("Kami membaca permintaan Anda.", "We read your request."),
    L("Kami menghubungi Anda untuk menjadwalkan percakapan singkat.", "We reach out to schedule a short conversation."),
    L("Kami menyesuaikan pembicaraan dengan kebutuhan sekolah Anda — bukan presentasi umum.",
      "We tailor the conversation to your school's needs — not a generic pitch."),
  ],
};

export const FORM = {
  name: L("Nama", "Name"),
  org: L("Sekolah / Institusi", "School / Institution"),
  role: L("Peran Anda", "Your Role"),
  roleOptions: [
    L("Pendidik", "Educator"),
    L("Kepala Sekolah", "Principal"),
    L("Yayasan Pendidikan", "Education Foundation"),
    L("Dinas / Pembuat Kebijakan", "Education Office / Policymaker"),
    L("Lainnya", "Other"),
  ],
  email: L("Email", "Email"),
  phone: L("Nomor Telepon (opsional)", "Phone Number (optional)"),
  message: L("Ceritakan sedikit tentang kebutuhan Anda", "Tell us a little about what you need"),
  submit: L("Kirim Permintaan", "Send Request"),
  note: L(
    "Ini contoh rancangan. Formulir ini tidak mengirim data ke mana pun.",
    "This is a design sample. This form doesn't send data anywhere."),
};

export const CONFIRM = {
  headline: L("Terima kasih.", "Thank you."),
  body: L(
    "Pada situs yang sesungguhnya, permintaan Anda akan sampai ke tim PINTAR di sini. Karena ini contoh rancangan, tidak ada yang benar-benar terkirim.",
    "On the real site, your request would reach the PINTAR team here. Because this is a design sample, nothing was actually sent."),
  cta: L("Coba Mini-PINTAR selagi menunggu", "Try Mini-PINTAR in the meantime"),
};
