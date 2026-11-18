// «Hari-hari biasa di sekolah»: five ordinary school situations, drawn from the journeys Daisy proposed in her
// review of the 4.2/4.5/5.0 planning audit (J42-0, J42-9, J42-10, J42-11, J42-12; ux-1/daisy-experience,
// docs/coordination/ux/roadmap/TINJAUAN-AUDIT-PERENCANAAN-63c66ba9.md §1). They illustrate how entries work
// together and are NOT counted as features. Each lists the catalogue entries it uses, by id; the build shows
// each entry's own status beside it, so a planned part is never read as available. All names are fictional.
export const HARI = [
  { judul: "Hari pertama seorang guru dan kelasnya",
    cerita: "Bu Ratna mengaktifkan akunnya dengan kode dari email, lalu menekan Mengajar dan memilih Kelas 7B. Ia menyediakan bab Pecahan, dan murid mengerjakan Pemetaan Awal. Murid masuk dengan kartu kelas di komputer laboratorium, yang bertanya «Komputer siapa ini?». Sore harinya, Bu Ratna membaca hasil pertama kelasnya.",
    fitur: ["40-aktivasi", "40-kartu-kelas", "40-masuk-aman", "40-sediakan", "40-pemetaan", "40-lihat-bukti"] },
  { judul: "Satu minggu yang biasa",
    cerita: "Senin, Bu Ratna menyediakan materi. Rabu, ia memberi Uji Cepat sepuluh menit. Kamis, ia membaca hasil kelas dan mencetak ringkasannya untuk rapat guru. Jumat, ia mengajarkan ulang satu bagian, meminta beberapa murid membaca lagi, lalu membuka Uji Penguasaan.",
    fitur: ["40-sediakan", "40-uji-cepat", "40-lihat-bukti", "40-cetak", "40-baca-lagi", "40-uji-penguasaan"] },
  { judul: "Seorang murid pindah sekolah di tengah semester",
    cerita: "Citra pindah dari Bandung ke Bogor pada bulan Oktober. Kedua sekolah menyelesaikan perpindahannya bersama. Hasil dan sertifikatnya yang lama tetap tercatat atas nama sekolah asal, dan sertifikat itu tetap dapat diperiksa keasliannya. Membuka laporan periode lalu dan mengekspor data sekolah baru direncanakan untuk 4.2.",
    fitur: ["40-pindah-sekolah", "40-sertifikat", "42-periode-lalu", "42-ekspor"] },
  { judul: "Seorang guru berhenti di tengah semester",
    cerita: "Pak Galih mengundurkan diri pada bulan Oktober. Admin sekolah mengakhiri tugasnya, dan materi yang ia susun tetap tercatat atas namanya. Sesi asesmen yang masih terbuka diurus dengan pengaturan sesi. Tampilan serah terima bagi guru pengganti, dan daftar kelas yang belum memiliki guru, direncanakan untuk 4.2.",
    fitur: ["40-akhir-tugas", "41-atur-sesi", "42-serah-terima", "42-tanpa-guru"] },
  { judul: "Listrik atau jaringan padam saat sesi di laboratorium",
    cerita: "Di tengah Uji Penguasaan, listrik laboratorium padam. Jawaban yang sudah tersimpan tidak hilang. Jika masalahnya besar, Admin PINTAR dapat menghentikan kelas itu saja, dan sesi ditahan dengan sisa waktunya. Melanjutkan di komputer lain dengan izin guru, dengan hanya satu perangkat yang dapat menyimpan jawaban, sedang diselesaikan di 4.1.",
    fitur: ["40-uji-penguasaan", "41-darurat", "41-pemulihan-sesi", "41-satu-penulis"] },
];
