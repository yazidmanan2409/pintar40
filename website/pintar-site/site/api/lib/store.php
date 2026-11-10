<?php
/*
 * PINTAR contact form: the little it remembers, and for how long.
 *
 * Deletion happens when the records are next touched (any use of the form)
 * and whenever server/cleanup.php runs; schedule that daily so that expired
 * records go even if nobody uses the form.
 *
 * The form itself stores nothing a visitor writes (a delivered message lives
 * in the receiving mailbox, under that mailbox's own retention). It keeps only:
 *   - rate-limit entries: a keyed hash of the sender's IP address and a
 *     time, deleted after the rate window (default one hour);
 *   - duplicate fingerprints: a keyed, irreversible hash of a message's
 *     normalised words, deleted after the same window;
 *   - a security log of refused and flagged submissions: time, decision,
 *     category and the hashed IP. No name, no email address, no message.
 *     Deleted after `security_log_days` (default 30 days).
 *
 * The store lives OUTSIDE the public web folder (see config), is created
 * with owner-only permissions, and every write is locked.
 */
if (!defined('PINTAR_CONTACT')) { http_response_code(404); exit; }

final class PintarStore
{
    private string $dir;
    private array $cfg;

    public function __construct(array $cfg)
    {
        $this->cfg = $cfg;
        $this->dir = rtrim($cfg['store_dir'], '/');
        if (!is_dir($this->dir)) @mkdir($this->dir, 0700, true);
    }

    public function ready(): bool { return is_dir($this->dir) && is_writable($this->dir); }

    /** The keyed-hash secret: from config, or generated once and kept in the store. */
    public function secret(): string
    {
        if (!empty($this->cfg['secret'])) return (string) $this->cfg['secret'];
        $f = $this->dir . '/secret';
        if (!is_file($f)) { @file_put_contents($f, bin2hex(random_bytes(32)), LOCK_EX); @chmod($f, 0600); }
        return trim((string) @file_get_contents($f)) ?: 'pintar';
    }

    public function ipHash(string $ip): string { return substr(hash_hmac('sha256', $ip, $this->secret()), 0, 24); }

    /** Read-modify-write a JSON file under an exclusive lock. */
    private function update(string $name, callable $fn)
    {
        $f = $this->dir . '/' . $name;
        $h = @fopen($f, 'c+');
        if (!$h) return null;
        @chmod($f, 0600);
        flock($h, LOCK_EX);
        $data = json_decode(stream_get_contents($h) ?: '[]', true) ?: [];
        [$data, $result] = $fn($data);
        ftruncate($h, 0); rewind($h);
        fwrite($h, json_encode($data));
        fflush($h); flock($h, LOCK_UN); fclose($h);
        return $result;
    }

    /** True if this sender may submit now; records the attempt if so. */
    public function allow(string $ipHash): bool
    {
        $now = time(); $win = (int) $this->cfg['rate_window']; $max = (int) $this->cfg['rate_limit'];
        return (bool) $this->update('rate.json', function ($d) use ($now, $win, $max, $ipHash) {
            foreach ($d as $k => $times) { $d[$k] = array_values(array_filter($times, fn ($t) => $t > $now - $win)); if (!$d[$k]) unset($d[$k]); }
            $mine = $d[$ipHash] ?? [];
            if (count($mine) >= $max) return [$d, false];
            $mine[] = $now; $d[$ipHash] = $mine;
            return [$d, true];
        });
    }

    /**
     * Duplicate check, BEFORE sending. Returns 'new', 'same_sender' (this
     * sender's identical message was already DELIVERED: answer as before and
     * do not send again) or 'campaign' (the same text already delivered from
     * several senders: refuse). Only delivered messages are remembered (see
     * delivered()), so a message whose delivery failed is never answered with
     * a false «sent» when the visitor retries.
     */
    public function duplicate(string $fingerprint, string $ipHash): string
    {
        $now = time(); $win = (int) $this->cfg['rate_window'];
        return (string) $this->update('seen.json', function ($d) use ($now, $win, $fingerprint, $ipHash) {
            $d = $this->pruneSeen($d, $now, $win);
            $senders = array_unique(array_column($d[$fingerprint] ?? [], 1));
            $result = 'new';
            if (in_array($ipHash, $senders, true)) $result = 'same_sender';
            elseif (count($senders) >= 2) $result = 'campaign';
            return [$d, $result];
        });
    }

    /** Remember a message's fingerprint once it has actually been delivered. */
    public function delivered(string $fingerprint, string $ipHash): void
    {
        $now = time(); $win = (int) $this->cfg['rate_window'];
        $this->update('seen.json', function ($d) use ($now, $win, $fingerprint, $ipHash) {
            $d = $this->pruneSeen($d, $now, $win);
            $d[$fingerprint][] = [$now, $ipHash];
            return [$d, null];
        });
    }

    private function pruneSeen(array $d, int $now, int $win): array
    {
        foreach ($d as $k => $e) { $d[$k] = array_values(array_filter($e, fn ($x) => $x[0] > $now - $win)); if (!$d[$k]) unset($d[$k]); }
        return $d;
    }

    /**
     * Delete everything past its retention: rate entries and fingerprints older
     * than the window, security records older than security_log_days. Runs on
     * every use of the form, and from server/cleanup.php for a scheduled job,
     * so that deletion does not depend on the form being used again.
     */
    public function prune(): void
    {
        $now = time(); $win = (int) $this->cfg['rate_window']; $keep = 86400 * (int) $this->cfg['security_log_days'];
        $this->update('rate.json', function ($d) use ($now, $win) {
            foreach ($d as $k => $t) { $d[$k] = array_values(array_filter($t, fn ($x) => $x > $now - $win)); if (!$d[$k]) unset($d[$k]); }
            return [$d, null];
        });
        $this->update('seen.json', fn ($d) => [$this->pruneSeen($d, $now, $win), null]);
        $this->update('security-log.json', fn ($d) => [array_values(array_filter($d, fn ($x) => ($x['t'] ?? 0) > $now - $keep)), null]);
    }

    /** Minimal security metadata for refused and flagged submissions. */
    public function log(string $decision, array $categories, string $ipHash): void
    {
        $now = time(); $keep = 86400 * (int) $this->cfg['security_log_days'];
        $this->update('security-log.json', function ($d) use ($now, $keep, $decision, $categories, $ipHash) {
            $d = array_values(array_filter($d, fn ($x) => ($x['t'] ?? 0) > $now - $keep));
            $d[] = ['t' => $now, 'decision' => $decision, 'categories' => array_values($categories), 'ip' => $ipHash];
            return [$d, null];
        });
    }
}
