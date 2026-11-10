<?php
/*
 * PINTAR contact form handler: POST api/kontak.php
 *
 * Every check happens here, on the server, whatever the browser did:
 *   1. method, origin, size and encoding;
 *   2. honeypot and timing (bots are answered as if sent, and nothing is sent);
 *   3. field validation;
 *   4. rate limit per sender;
 *   5. content moderation (lib/moderation.php): allow, flag, or reject;
 *   6. duplicate detection;
 *   7. delivery by email (lib/mailer.php).
 *
 * The browser's script asks for JSON. Without the script, the same request
 * gets a plain page back, in the visitor's language.
 *
 * Configuration (recipient, transport, SMTP credentials, limits) is read from
 * a file OUTSIDE the public folder: see server/pintar-contact-config.example.php.
 */
declare(strict_types=1);
define('PINTAR_CONTACT', true);
require __DIR__ . '/lib/moderation.php';
require __DIR__ . '/lib/store.php';
require __DIR__ . '/lib/mailer.php';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');

// ------------------------------------------------------------------ config
$docroot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__), '/');
$outside = dirname($docroot);                         // one level above the public folder
$cfg = [
    'to' => 'info@pintarselalu.com',
    'from' => 'no-reply@pintarselalu.com',
    'from_name' => 'Situs PINTAR',
    'transport' => 'mail',                            // or 'smtp'
    'smtp' => ['host' => '', 'port' => 465, 'secure' => 'ssl', 'user' => '', 'pass' => ''],
    'rate_limit' => 5,                                // submissions per sender…
    'rate_window' => 3600,                            // …per hour
    'security_log_days' => 30,
    'min_seconds' => 3,                               // faster than this is a bot
    'store_dir' => $outside . '/pintar-contact-data',
    'secret' => '',
    'allowed_origins' => [],                          // extra origins besides this host
];
$cfgFile = getenv('PINTAR_CONTACT_CONFIG') ?: $outside . '/pintar-contact-config.php';
if (is_file($cfgFile)) { $over = require $cfgFile; if (is_array($over)) $cfg = array_replace_recursive($cfg, $over); }

// ------------------------------------------------------------------ answers
$lang = (($_POST['lang'] ?? '') === 'en') ? 'en' : 'id';
$wantsJson = str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');
$TEXT = [
    'id' => [
        'ok_h' => 'Terima kasih. Pesan Anda sudah terkirim.', 'ok_p' => 'Kami akan membalas ke alamat email yang Anda berikan.',
        'rejected' => 'Pesan Anda tidak dapat dikirim. Mohon periksa kembali isi pesan dan gunakan bahasa yang sesuai.',
        'invalid' => 'Beberapa isian belum lengkap atau belum benar. Mohon kembali dan periksa formulir.',
        'limited' => 'Terlalu banyak pesan dari jaringan ini dalam waktu singkat. Coba lagi nanti, atau kirim email langsung ke info@pintarselalu.com.',
        'failed' => 'Pesan belum terkirim. Coba lagi, atau kirim email langsung ke info@pintarselalu.com.',
        'back' => 'Kembali ke formulir', 'title' => 'Kontak — PINTAR', 'home' => '../kontak/',
    ],
    'en' => [
        'ok_h' => 'Thank you. Your message has been sent.', 'ok_p' => 'We will reply to the email address you gave.',
        'rejected' => 'Your message could not be sent. Please review its content and use appropriate language.',
        'invalid' => 'Some fields are missing or incorrect. Please go back and check the form.',
        'limited' => 'Too many messages from this network in a short time. Please try again later, or email info@pintarselalu.com directly.',
        'failed' => 'Your message was not sent. Please try again, or email info@pintarselalu.com directly.',
        'back' => 'Back to the form', 'title' => 'Contact — PINTAR', 'home' => '../en/contact/',
    ],
][$lang];

function respond(int $status, array $json, string $heading, string $text, bool $wantsJson, array $T, string $lang): never
{
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($json + ['message' => $text], JSON_UNESCAPED_UNICODE);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $h = htmlspecialchars($heading, ENT_QUOTES, 'UTF-8');
    $p = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    echo "<!doctype html><html lang=\"$lang\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        . "<meta name=\"robots\" content=\"noindex\"><title>{$T['title']}</title><link rel=\"stylesheet\" href=\"../assets/css/site.css\"></head>"
        . "<body><main id=\"isi\" class=\"wrap\" style=\"padding-block: 6rem\"><p class=\"wordmark\">PINTAR</p>"
        . "<h1 class=\"h2\" style=\"margin-top: 3rem\">$h</h1><p class=\"lead\">$p</p>"
        . "<p class=\"actions\"><a class=\"link\" href=\"{$T['home']}\">{$T['back']}</a></p></main></body></html>";
    exit;
}

// ------------------------------------------------------------------ 1. request
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); respond(405, ['ok' => false], $TEXT['failed'], '', $wantsJson, $TEXT, $lang); }
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '') {
    $oh = parse_url($origin, PHP_URL_HOST) . ((parse_url($origin, PHP_URL_PORT)) ? ':' . parse_url($origin, PHP_URL_PORT) : '');
    if ($oh !== ($_SERVER['HTTP_HOST'] ?? '') && !in_array($origin, $cfg['allowed_origins'], true)) {
        respond(403, ['ok' => false], $TEXT['failed'], $TEXT['failed'], $wantsJson, $TEXT, $lang);
    }
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) respond(413, ['ok' => false], $TEXT['failed'], $TEXT['failed'], $wantsJson, $TEXT, $lang);
$in = fn (string $k) => is_string($_POST[$k] ?? null) ? (string) $_POST[$k] : '';
foreach (['name', 'email', 'institution', 'subject', 'message'] as $k) {
    if (!mb_check_encoding($in($k), 'UTF-8')) respond(400, ['ok' => false], $TEXT['failed'], $TEXT['failed'], $wantsJson, $TEXT, $lang);
}

$store = new PintarStore($cfg);
if (!$store->ready()) { error_log('pintar-contact: store directory not writable'); respond(503, ['ok' => false], $TEXT['failed'], $TEXT['failed'], $wantsJson, $TEXT, $lang); }
$ipHash = $store->ipHash((string) ($_SERVER['REMOTE_ADDR'] ?? ''));

// ------------------------------------------------------------------ 2. bots
// A filled honeypot or an impossibly fast submission is answered exactly like
// a sent message, so a bot learns nothing; nothing is sent.
$started = $in('started');
$tooFast = ctype_digit($started) && (microtime(true) * 1000 - (float) $started) < $cfg['min_seconds'] * 1000;
if ($in('website') !== '' || $tooFast) {
    $store->log('discarded', [$in('website') !== '' ? 'honeypot' : 'too_fast'], $ipHash);
    respond(200, ['ok' => true], $TEXT['ok_h'], $TEXT['ok_p'], $wantsJson, $TEXT, $lang);
}

// ------------------------------------------------------------------ 3. validation
$SUBJECTS = ['umum' => 'Pertanyaan umum', 'demo' => 'Minta demo', 'kemitraan' => 'Kemitraan', 'dukungan' => 'Dukungan', 'lainnya' => 'Lainnya'];
$name = trim($in('name'));
$email = trim($in('email'));
$inst = trim($in('institution'));
$subject = $in('subject');
$message = trim(str_replace("\r\n", "\n", $in('message')));
$errors = [];
if ($name === '' || mb_strlen($name) > 120 || preg_match('/[\p{Cc}\p{Cf}]/u', $name)) $errors['name'] = 1;
if (mb_strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 1;
if (mb_strlen($inst) > 160 || preg_match('/[\p{Cc}\p{Cf}]/u', $inst)) $errors['institution'] = 1;
if (!isset($SUBJECTS[$subject])) $errors['subject'] = 1;
if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) $errors['message'] = 1;
if ($in('consent') !== 'yes') $errors['consent'] = 1;
if ($errors) respond(422, ['ok' => false, 'errors' => $errors], $TEXT['invalid'], $TEXT['invalid'], $wantsJson, $TEXT, $lang);

// ------------------------------------------------------------------ 4. rate limit
if (!$store->allow($ipHash)) {
    $store->log('rate_limited', ['rate_limit'], $ipHash);
    respond(429, ['ok' => false], $TEXT['limited'], $TEXT['limited'], $wantsJson, $TEXT, $lang);
}

// ------------------------------------------------------------------ 5. moderation
$rules = require __DIR__ . '/lib/moderation-rules.php';
$mod = (new PintarModeration($rules))->check(['name' => $name, 'institution' => $inst, 'message' => $message]);
if ($mod['decision'] === 'reject') {
    // Nothing of the message is kept: only the time, the categories and the hashed address.
    $store->log('rejected', $mod['categories'], $ipHash);
    respond(422, ['ok' => false, 'rejected' => true], $TEXT['rejected'], $TEXT['rejected'], $wantsJson, $TEXT, $lang);
}

// ------------------------------------------------------------------ 6. duplicates
$dup = $store->duplicate((new PintarModeration($rules))->fingerprint($message, $store->secret()), $ipHash);
if ($dup === 'same_sender') respond(200, ['ok' => true], $TEXT['ok_h'], $TEXT['ok_p'], $wantsJson, $TEXT, $lang);   // a double submit: already sent
if ($dup === 'campaign') {
    $store->log('rejected', ['duplicate_campaign'], $ipHash);
    respond(422, ['ok' => false, 'rejected' => true], $TEXT['rejected'], $TEXT['rejected'], $wantsJson, $TEXT, $lang);
}

// ------------------------------------------------------------------ 7. delivery
$flag = $mod['decision'] === 'flag';
if ($flag) $store->log('flagged', $mod['categories'], $ipHash);
$when = (new DateTime('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d H:i') . ' WIB';
$mailSubject = ($flag ? '[PERLU DITINJAU] ' : '') . '[PINTAR] ' . $SUBJECTS[$subject] . ' — ' . $name . ($inst !== '' ? " ($inst)" : '');
$body = "Pesan baru dari formulir kontak situs PINTAR.\n\n"
    . ($flag ? "PERLU DITINJAU: pesan ini ditandai otomatis (" . implode(', ', $mod['categories']) . "). Mohon dibaca oleh seseorang sebelum ditindaklanjuti.\n\n" : '')
    . "Subjek:    {$SUBJECTS[$subject]}\nNama:      $name\nEmail:     $email\nInstitusi: " . ($inst !== '' ? $inst : '—') . "\n"
    . "Bahasa:    " . strtoupper($lang) . "\nDiterima:  $when\nPersetujuan pemrosesan data: ya\n\n"
    . "—\n\n$message\n";
$sent = (new PintarMailer($cfg))->send($mailSubject, $body, $email, $name);
if (!$sent) {
    error_log('pintar-contact: delivery failed');
    respond(502, ['ok' => false], $TEXT['failed'], $TEXT['failed'], $wantsJson, $TEXT, $lang);
}
respond(200, ['ok' => true], $TEXT['ok_h'], $TEXT['ok_p'], $wantsJson, $TEXT, $lang);
