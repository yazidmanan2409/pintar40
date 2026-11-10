<?php
/*
 * PINTAR contact form: moderation acceptance cases, Bahasa Indonesia and English.
 * Run: php verify/moderation-cases.php   (exit 1 if any case fails)
 *
 * Three kinds of case, in both languages:
 *   allow   legitimate inquiries, criticism and complaints, including words that
 *           only look like prohibited ones («sekolah dasar», «bang», «Scunthorpe»)
 *   flag    borderline: reports or quotations of offensive language, sensitive
 *           but legitimate topics, a single insult aimed at someone, suspicious links
 *   reject  clearly prohibited, including disguised spellings
 *
 * This file necessarily contains offensive words, as test data only.
 */
define('PINTAR_CONTACT', true);
require __DIR__ . '/../site/api/lib/moderation.php';
$rules = require __DIR__ . '/../site/api/lib/moderation-rules.php';
$m = new PintarModeration($rules);

$cases = [
  // ---------------------------------------------------------------- allow
  ['allow', 'id', 'Selamat pagi, kami dari SMP Negeri 3 Malang ingin melihat demo PINTAR untuk kelas 8.'],
  ['allow', 'id', 'Saya kecewa dengan respons tim Anda minggu lalu. Laporan kelas tidak bisa dicetak dan ini sangat mengganggu.'],
  ['allow', 'id', 'Apakah PINTAR cocok untuk sekolah dasar? Kami punya 400 murid dan 18 guru.'],
  ['allow', 'id', 'Anak kami belajar tentang anjing dan kucing di pelajaran IPA. Apakah ada materi tentang hewan peliharaan?'],
  ['allow', 'id', 'Bang, saya mau tanya soal biaya untuk satu yayasan dengan tiga sekolah.'],
  ['allow', 'id', 'Sial, saya lupa kata sandi akun guru. Bagaimana cara meresetnya?'],
  ['allow', 'id', 'Kami ingin bermitra. Email kepala sekolah kami kepsek@smpn3.sch.id, terima kasih.'],
  ['allow', 'id', 'Menurut saya tampilan laporannya terlalu ramai dan membingungkan bagi orang tua. Mohon dipertimbangkan.'],
  ['allow', 'en', 'Hello, we are a foundation running four schools in Makassar and would like a demonstration.'],
  ['allow', 'en', 'Honestly, the last demo was disappointing and the reports were confusing. Please explain how this will improve.'],
  ['allow', 'en', 'Our partner school in Scunthorpe would like to compare assessment approaches with yours.'],
  ['allow', 'en', 'Please see our school website www.smpn3malang.sch.id for our current timetable.'],
  ['allow', 'en', 'Is the class report available in English? Our international stream would need it.'],

  // ---------------------------------------------------------------- flag (delivered, marked for review)
  ['flag', 'id', 'Saya ingin melaporkan bahwa seorang siswa kami dikatakan "bangsat" oleh siswa lain. Bagaimana PINTAR membantu menangani perundungan?'],
  ['flag', 'en', 'I want to report that a student was called a "faggot" in class. How do you help schools deal with bullying?'],
  ['flag', 'id', 'Bagaimana PINTAR mencegah siswa membuka situs porno di komputer sekolah?'],
  ['flag', 'id', 'Kamu bodoh sekali, demo kemarin buruk dan tidak ada yang menjawab pertanyaan kami.'],
  ['flag', 'en', 'You are stupid if you think teachers have time for this. The setup took us two weeks.'],
  ['flag', 'en', 'Check this tool for schools: https://bit.ly/3xYzAbc it helps teachers a lot with marking.'],
  ['flag', 'id', 'Info judi online terbaru untuk para guru, hubungi saya untuk detailnya.'],
  ['flag', 'en', 'Hеllo, we would like more information about pricing for our school.'],                 // a Cyrillic «е»
  ['flag', 'id', 'Awas kamu kalau demo ini tidak sesuai dengan yang dijanjikan.'],

  // ---------------------------------------------------------------- reject
  ['reject', 'id', 'Dasar goblok, tim kalian bangsat semua! Pelayanan macam apa ini.'],
  ['reject', 'id', 'b a n g s a t kalian semua, pelayanan buruk sekali.'],
  ['reject', 'id', 'k0nt0l lu, sistem kalian tidak berguna sama sekali.'],
  ['reject', 'id', 'anjiiiing lu, dasar tolol, aplikasi kalian rusak.'],
  ['reject', 'id', 'Saya akan bunuh kamu kalau tidak membalas pesan ini.'],
  ['reject', 'id', 'SLOT GACOR maxwin hari ini https://gacor88.xyz daftar sekarang juga'],
  ['reject', 'id', 'ngent0t, ini pesan untuk kalian semua di sana.'],
  ['reject', 'en', 'You are a fucking idiot and your product is garbage.'],
  ['reject', 'en', 'f*ck you and your useless platform, seriously.'],
  ['reject', 'en', 'f.u.c.k this platform, nothing works as promised.'],
  ['reject', 'en', 'ｆｕｃｋ you all, this is the worst service ever.'],                                // full-width letters
  ["reject", 'en', "f\u{200B}uck you, answer my emails."],                                               // zero-width space
  ['reject', 'en', 'I will kill you if you do not answer me by tomorrow.'],
  ['reject', 'en', 'You are a retard, nobody should use this.'],
  ['reject', 'en', 'Your account suspended, verify your account at http://pintar-login.top/verify now'],
  ['reject', 'en', 'Great offers http://a.com http://b.com http://c.com http://d.com http://e.com visit now'],
  ['reject', 'en', 'Please download the enrolment form from http://example.com/form.exe today'],
  ['reject', 'en', 'https://example.com/promo'],
  ['reject', 'en', 'buy buy buy buy buy buy buy buy buy buy buy buy'],
  ['reject', 'en', 'sdfgh jklqw rtzxc vbnmh dfgjk qwrtp zxcvb'],
];

// The name field is moderated too.
$fieldCases = [
  ['reject', ['name' => 'Nigger', 'institution' => '', 'message' => 'I would like to know more about your platform please.']],
  ['allow',  ['name' => 'Siti Rahmawati', 'institution' => 'SMA Negeri 1 Bangsalsari', 'message' => 'Kami tertarik dengan demo PINTAR untuk kelas XI.']],
];

$fail = 0; $n = 0;
foreach ($cases as [$want, $lang, $text]) {
  $n++;
  $got = $m->check(['name' => 'Penguji', 'institution' => '', 'message' => $text]);
  if (in_array('-v', $argv, true)) printf("  %2d %-6s %-6s %s\n", $n, $want, $got['decision'], implode(',', $got['categories']) ?: '-');
  if ($got['decision'] !== $want) { $fail++; printf("  x [%s] expected %s, got %s (%s): case %d\n", $lang, $want, $got['decision'], implode(',', $got['categories']), $n); }
}
foreach ($fieldCases as [$want, $fields]) {
  $n++;
  $got = $m->check($fields);
  if ($got['decision'] !== $want) { $fail++; printf("  x [fields] expected %s, got %s (%s): case %d\n", $want, $got['decision'], implode(',', $got['categories']), $n); }
}
// Disguise must not change the verdict: the plain and the disguised spelling decide alike.
$pairs = [['bangsat kalian', 'b@ngs4t kalian'], ['fuck you', 'FuUuUck you'], ['kontol lu', 'k-o-n-t-o-l lu']];
foreach ($pairs as [$plain, $disguised]) {
  $n++;
  $a = $m->check(['message' => "$plain, tolong balas pesan ini."])['decision'];
  $b = $m->check(['message' => "$disguised, tolong balas pesan ini."])['decision'];
  if ($a !== $b || $a !== 'reject') { $fail++; printf("  x disguise changed the verdict: %s / %s (case %d)\n", $a, $b, $n); }
}

printf("moderation: %d cases, %d failed\n", $n, $fail);
exit($fail ? 1 : 0);
