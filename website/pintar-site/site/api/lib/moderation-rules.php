<?php
/*
 * PINTAR contact form: moderation rules (Bahasa Indonesia and English).
 *
 * This file is configuration, not code: edit the lists, not the engine.
 * It is never served (lib/.htaccess denies it, and it exits if requested
 * directly). Its contents are never shown to a visitor, and no rejection
 * message ever names a rule or repeats a word.
 *
 * Terms are written plain and lower-case. The engine normalises each message
 * before matching (Unicode look-alikes, zero-width characters, accents,
 * l33t substitutions, s.p.a.c.e.d and str-e-tch-ed letters, repeated
 * letters), so variants need not be listed one by one.
 *
 * Matching modes
 *   word      the term is a whole word, optionally with common Indonesian or
 *             English affixes (di-, ng-, -nya, -in, -mu, -lu, -s, -ing, -ed…)
 *   contains  the term may appear inside a word; only for long, distinctive
 *             terms that do not occur inside ordinary words
 *
 * Severity
 *   reject    clearly prohibited: refused, unless the message is plainly a
 *             report or a quotation, in which case it is flagged for review
 *   flag      ambiguous: delivered with a «perlu ditinjau» mark, never discarded
 *   targeted  mild insults: allowed on their own (criticism is welcome),
 *             flagged when aimed at a person, refused when aimed at a person
 *             together with something severe
 */
if (!defined('PINTAR_CONTACT')) { http_response_code(404); exit; }

return [
  // Obscene and sexually explicit language.
  'obscene' => ['severity' => 'reject', 'mode' => 'word', 'terms' => [
    // id
    'kontol', 'memek', 'ngentot', 'entot', 'ngewe', 'jembut', 'pepek', 'peler', 'titit', 'coli', 'colmek', 'sange',
    'lonte', 'perek', 'jablay', 'pantek', 'puki', 'kimak', 'pukimak', 'jancok', 'jancuk', 'dancuk', 'bangsat', 'bajingan', 'keparat',
    // en
    'fuck', 'fucker', 'fucking', 'motherfucker', 'fck', 'fuk', 'fcking', 'cunt', 'whore', 'slut', 'blowjob', 'dickhead', 'cocksucker', 'asshole',
  ]],
  // Sexual topics a school may legitimately raise («bagaimana mencegah akses ke situs porno?»): flagged, never refused.
  'sexual_topic' => ['severity' => 'flag', 'mode' => 'word', 'terms' => [
    'porn', 'porno', 'pornografi', 'bokep', 'pelacur', 'pussy', 'nude', 'nudes', 'telanjang',
  ]],
  'obscene_contains' => ['severity' => 'reject', 'mode' => 'contains', 'terms' => [
    'ngentot', 'motherfuck', 'kontol', 'cocksuck', 'pukimak',
  ]],

  // Slurs: hate speech against a group. Discussion of them still arrives as a
  // flagged report when the message is plainly reporting or quoting.
  'slur' => ['severity' => 'reject', 'mode' => 'word', 'terms' => [
    'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'tranny', 'kike', 'spic', 'chink', 'wetback',
    'cokin',
  ]],
  // Words that can be a slur or entirely ordinary («anjing» is also a dog,
  // «babi» a pig, «kafir» a theological term): flagged only when aimed at a person.
  'insult' => ['severity' => 'targeted', 'mode' => 'word', 'terms' => [
    // id
    'anjing', 'asu', 'babi', 'monyet', 'goblok', 'goblog', 'tolol', 'bego', 'bodoh', 'dungu', 'idiot', 'bencong', 'banci', 'kafir', 'brengsek', 'sinting', 'gila', 'setan', 'iblis', 'tai', 'tahi',
    // en
    'stupid', 'dumb', 'moron', 'idiot', 'bitch', 'bastard', 'loser', 'scum', 'pig', 'jerk', 'dick', 'freak',
  ]],
  // Everyday mild expletives: allowed. Many of them together are flagged.
  'mild' => ['severity' => 'allow', 'mode' => 'word', 'terms' => [
    'sialan', 'sial', 'kampret', 'anjir', 'anjay', 'njir', 'buset', 'shit', 'damn', 'crap', 'wtf', 'hell',
  ]],

  // Threats (regular expressions over the normalised text).
  'threat' => ['severity' => 'reject', 'patterns' => [
    '/\b(saya|aku|gue|gua|gw|kami|kita)\s+(akan\s+|mau\s+|bakal\s+)?(bunuh|habisi|bacok|tusuk|tembak|bakar|ledakkan|bom|culik|hajar|gebuk|perkosa|santet)\b/u',
    '/\b(bunuh|habisi|bacok|tusuk|tembak|bakar|perkosa)\s+(kamu|kau|lu|lo|elu|anda|kalian|kau)\b/u',
    '/\b(i|we)\s*(\'?ll|will|am going to|gonna)\s+(kill|shoot|stab|bomb|hurt|rape|find)\s+(you|u|ya|your)\b/u',
    '/\b(kill|shoot|stab|rape)\s+(you|u|yourself)\b/u',
  ]],
  'threat_soft' => ['severity' => 'flag', 'patterns' => [
    '/\bawas\s+(kamu|kau|lu|lo|elu|anda|kalian)\b/u',
    '/\b(tunggu|lihat)\s+(saja\s+)?(pembalasan|akibatnya)\b/u',
    '/\byou\s*(\'?ll|will)\s+(regret|pay for|be sorry)\b/u',
    '/\b(bom|bomb)\b/u',
  ]],

  // Spam and promotion that has no place on an institutional contact form.
  'spam' => ['severity' => 'flag', 'mode' => 'phrase', 'terms' => [
    'judi online', 'slot gacor', 'slot online', 'situs slot', 'togel', 'casino', 'kasino', 'pinjol', 'pinjaman online cepat', 'bandar bola', 'maxwin',
    'viagra', 'cialis', 'jasa seo', 'seo services', 'backlink', 'backlinks', 'guest post', 'crypto airdrop', 'forex signal', 'binary option',
    'earn money fast', 'work from home and earn', 'dapatkan uang', 'penghasilan tambahan', 'investasi bodong', 'double your', 'buy followers', 'beli followers',
  ]],
  // Phishing: requests for credentials or account action.
  'phishing' => ['severity' => 'flag', 'mode' => 'phrase', 'terms' => [
    'verify your account', 'account suspended', 'account will be closed', 'confirm your password', 'reset your password', 'update your payment',
    'konfirmasi akun', 'akun anda diblokir', 'akun anda akan ditutup', 'verifikasi akun', 'masukkan kata sandi', 'kirim kata sandi', 'kode otp', 'kirim otp',
  ]],

  // Signals that a message is reporting or quoting, not abusing.
  'reporting' => [
    'lapor', 'melapor', 'melaporkan', 'laporan', 'pengaduan', 'mengadu', 'keluhan', 'mengeluh', 'mengeluhkan', 'dikatakan', 'mengatakan', 'berkata', 'bilang',
    'dipanggil', 'memanggil', 'disebut', 'menyebut', 'kata kasar', 'kata-kata', 'perundungan', 'dirundung', 'merundung', 'dihina', 'menghina', 'mengejek', 'diejek', 'kutipan', 'mengutip',
    'report', 'reporting', 'reported', 'complain', 'complaint', 'called me', 'called my', 'called him', 'called her', 'called them', 'said', 'wrote', 'quote', 'quoted',
    'bullied', 'bullying', 'insulted', 'harassed', 'harassment', 'slur', 'used the word', 'offensive word', 'abuse', 'abusive',
  ],
  // Second-person words: what makes an insult personally targeted.
  'second_person' => ['kamu', 'kau', 'engkau', 'dikau', 'lu', 'lo', 'loe', 'elu', 'elo', 'anda', 'kalian', 'ente', 'you', 'ur', 'your', 'yourself'],
  // «dasar goblok»: an insult right after this word is aimed at someone. («Sekolah dasar» is not.)
  'insult_lead' => ['dasar'],

  // Links.
  'links' => [
    'max' => 3,                         // more than this: refused as spam
    'shorteners' => ['bit.ly', 'tinyurl.com', 's.id', 't.co', 'goo.gl', 'cutt.ly', 'shorturl.at', 'rb.gy', 'is.gd', 'ow.ly', 'tiny.cc', 'lnkd.in'],
    'suspicious_tlds' => ['xyz', 'top', 'click', 'link', 'zip', 'mov', 'work', 'loan', 'win', 'bid', 'cam', 'rest', 'icu', 'buzz'],
    'dangerous_ext' => ['exe', 'apk', 'scr', 'bat', 'cmd', 'msi', 'jar', 'vbs', 'ps1', 'dmg'],
  ],
];
