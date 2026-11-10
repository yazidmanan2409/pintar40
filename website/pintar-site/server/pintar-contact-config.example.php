<?php
/*
 * PINTAR contact form: server configuration (EXAMPLE).
 *
 * Copy this file to ONE LEVEL ABOVE the public web folder, named
 * pintar-contact-config.php (for example /home/<account>/pintar-contact-config.php
 * when the site lives in /home/<account>/public_html). It is then never
 * reachable from the web. Alternatively set the environment variable
 * PINTAR_CONTACT_CONFIG to its path.
 *
 * Only the values you set here replace the defaults in api/kontak.php.
 * Secrets (an SMTP password) belong here and nowhere else.
 */
return [
    'to' => 'info@pintarselalu.com',
    'from' => 'no-reply@pintarselalu.com',      // must be a domain the server may send for (SPF/DKIM)
    'from_name' => 'Situs PINTAR',

    // 'mail' uses the host's mail system. 'smtp' uses an authenticated mailbox.
    'transport' => 'mail',
    'smtp' => [
        'host' => 'mail.example.com',          // [to confirm] the mailbox provider's SMTP host
        'port' => 465,
        'secure' => 'ssl',                     // 'ssl' on 465, 'tls' (STARTTLS) on 587
        'user' => 'no-reply@pintarselalu.com',
        'pass' => 'CHANGE-ME',
    ],

    'rate_limit' => 5,          // valid submissions per sender per window
    'rate_window' => 3600,      // seconds; rate and duplicate entries are deleted after this
    'security_log_days' => 30,  // refused/flagged metadata (no content) is deleted after this
    // 'store_dir' => '/home/<account>/pintar-contact-data',   // default: beside this file, outside the public folder
    // 'secret' => '<64 random hex characters>',             // default: generated once into the store
];
