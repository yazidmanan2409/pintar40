<?php
/*
 * PINTAR contact form: scheduled cleanup.
 *
 * Deletes rate-limit entries and duplicate fingerprints older than the rate
 * window, and security records older than security_log_days, even when nobody
 * uses the form. Run daily, for example from cPanel → Cron Jobs:
 *
 *   17 3 * * * php /home/<account>/pintar-contact-cleanup.php
 *
 * Copy this file as pintar-contact-cleanup.php beside pintar-contact-config.php
 * (outside the public folder). PUBLIC_DIR below is the folder that holds api/.
 */
declare(strict_types=1);
const PUBLIC_DIR = __DIR__ . '/public_html';
define('PINTAR_CONTACT', true);
require PUBLIC_DIR . '/api/lib/store.php';
$cfg = ['rate_window' => 3600, 'security_log_days' => 30, 'store_dir' => __DIR__ . '/pintar-contact-data', 'secret' => ''];
$file = getenv('PINTAR_CONTACT_CONFIG') ?: __DIR__ . '/pintar-contact-config.php';
if (is_file($file)) { $over = require $file; if (is_array($over)) $cfg = array_replace_recursive($cfg, $over); }
$store = new PintarStore($cfg);
if (!$store->ready()) { fwrite(STDERR, "store not writable\n"); exit(1); }
$store->prune();
echo "pintar-contact: expired records deleted\n";
