<?php
/*
 * PINTAR contact form: delivery by email.
 *
 * Two transports, chosen in the server-side config:
 *   mail  PHP's mail() through the host's own mail system. No password
 *         anywhere. Reliable only when the sending domain's SPF/DKIM allow
 *         the host to send for it.
 *   smtp  An authenticated SMTP mailbox (TLS on 465, or STARTTLS on 587).
 *         The username and password live only in the config file outside
 *         the public web folder; never in this code, never in the browser.
 *
 * The visitor's address is used only as Reply-To, after validation, and no
 * header can be injected: every header value is stripped of line breaks.
 * No acknowledgement is sent to the visitor, so the form cannot be used to
 * send mail to strangers.
 */
if (!defined('PINTAR_CONTACT')) { http_response_code(404); exit; }

final class PintarMailer
{
    public function __construct(private array $cfg) {}

    private static function clean(string $v): string { return trim(preg_replace('/[\r\n\t\0]+/', ' ', $v) ?? ''); }
    private static function encode(string $v): string { return '=?UTF-8?B?' . base64_encode(self::clean($v)) . '?='; }

    public function send(string $subject, string $body, string $replyTo, string $replyName): bool
    {
        $from = self::clean($this->cfg['from']);
        $to = self::clean($this->cfg['to']);
        $replyTo = filter_var(self::clean($replyTo), FILTER_VALIDATE_EMAIL) ?: '';
        $headers = [
            'From: ' . self::encode($this->cfg['from_name']) . " <$from>",
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            'X-Mailer: PINTAR website',
        ];
        if ($replyTo) $headers[] = 'Reply-To: ' . self::encode($replyName) . " <$replyTo>";
        $encodedBody = chunk_split(base64_encode($body));

        if (($this->cfg['transport'] ?? 'mail') === 'smtp') {
            return $this->smtp($to, $from, self::encode($subject), $headers, $encodedBody);
        }
        return @mail($to, self::encode($subject), $encodedBody, implode("\r\n", $headers), '-f' . $from);
    }

    private function smtp(string $to, string $from, string $subject, array $headers, string $body): bool
    {
        $s = $this->cfg['smtp'];
        $secure = ($s['secure'] ?? 'tls') === 'ssl';
        $fp = @stream_socket_client(($secure ? 'ssl://' : 'tcp://') . $s['host'] . ':' . (int) $s['port'], $errno, $err, 15,
            STREAM_CLIENT_CONNECT, stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]));
        if (!$fp) { error_log('pintar-contact: smtp connect failed'); return false; }
        stream_set_timeout($fp, 15);
        $read = function () use ($fp) { $r = ''; while (($l = fgets($fp, 515)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $r; };
        $cmd = function (string $c, array $ok) use ($fp, $read) { if ($c !== '') fwrite($fp, $c . "\r\n"); $r = $read(); return in_array((int) substr($r, 0, 3), $ok, true); };
        $host = gethostname() ?: 'localhost';
        $ok = $cmd('', [220]) && $cmd("EHLO $host", [250]);
        if ($ok && !$secure) {
            $ok = $cmd('STARTTLS', [220]) && stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) && $cmd("EHLO $host", [250]);
        }
        $ok = $ok && $cmd('AUTH LOGIN', [334]) && $cmd(base64_encode($s['user']), [334]) && $cmd(base64_encode($s['pass']), [235])
            && $cmd("MAIL FROM:<$from>", [250]) && $cmd("RCPT TO:<$to>", [250, 251]) && $cmd('DATA', [354]);
        if ($ok) {
            $msg = implode("\r\n", array_merge(["To: <$to>", "Subject: $subject", 'Date: ' . date('r')], $headers)) . "\r\n\r\n" . $body;
            $msg = preg_replace('/^\./m', '..', $msg);
            $ok = $cmd($msg . "\r\n.", [250]);
        }
        @fwrite($fp, "QUIT\r\n"); fclose($fp);
        if (!$ok) error_log('pintar-contact: smtp delivery failed');
        return $ok;
    }
}
