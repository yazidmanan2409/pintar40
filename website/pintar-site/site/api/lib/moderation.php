<?php
/*
 * PINTAR contact form: server-side moderation.
 *
 * Deliberately small and rule-based, proportionate to a low-volume
 * institutional contact form. Three layers:
 *
 *   1. Normalisation: undo the usual disguises before anything is matched
 *      (Unicode compatibility forms, look-alike letters from other scripts,
 *      zero-width and invisible characters, accents, l33t digits and symbols,
 *      s.p.a.c.e.d or stret-ched letters, and repeated letters).
 *   2. Rules: configurable terms and patterns (moderation-rules.php) for
 *      obscenity, slurs, insults, threats, spam and phishing; plus link,
 *      repetition and gibberish checks.
 *   3. Context: a message that is plainly reporting or quoting offensive
 *      language is flagged for a person to read, not refused; an insult is
 *      only a problem when it is aimed at someone.
 *
 * The result is one of three decisions:
 *   allow   deliver as normal
 *   flag    deliver, marked «perlu ditinjau» (needs review): never discarded
 *   reject  refuse, with a neutral message that names no rule and repeats no word
 *
 * The categories returned are for the server's own minimal security log.
 * They are never sent to the visitor.
 */
if (!defined('PINTAR_CONTACT')) { http_response_code(404); exit; }

final class PintarModeration
{
    /** Letters from other scripts that look like Latin ones. */
    private const CONFUSABLES = [
        'а' => 'a', 'в' => 'b', 'е' => 'e', 'ё' => 'e', 'к' => 'k', 'м' => 'm', 'н' => 'h', 'о' => 'o', 'р' => 'p', 'с' => 'c', 'т' => 't',
        'у' => 'y', 'х' => 'x', 'і' => 'i', 'ї' => 'i', 'ј' => 'j', 'ѕ' => 's', 'ԁ' => 'd', 'ɡ' => 'g', 'ո' => 'n', 'ս' => 'u',
        'α' => 'a', 'β' => 'b', 'ε' => 'e', 'η' => 'n', 'ι' => 'i', 'κ' => 'k', 'ν' => 'v', 'ο' => 'o', 'ρ' => 'p', 'τ' => 't', 'υ' => 'u', 'χ' => 'x', 'ω' => 'w',
        'ı' => 'i', 'ł' => 'l', 'ø' => 'o', 'đ' => 'd', 'ß' => 'ss', 'æ' => 'ae', 'œ' => 'oe',
    ];
    /** Digits and symbols used in place of letters, inside words that contain letters. */
    private const LEET = ['0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't', '8' => 'b', '9' => 'g', '@' => 'a', '$' => 's', '!' => 'i', '|' => 'i', '+' => 't', '€' => 'e', '£' => 'l'];
    private const AFFIX = '/^(?:di|ke|ng|nge|me|ter|se)?%s(?:nya|lah|in|an|kan|mu|lu|kau|ku|s|es|ed|ing|er|ers|y)?$/u';

    private array $rules;

    public function __construct(array $rules) { $this->rules = $rules; }

    /** Normalise text into the forms the rules are matched against. */
    public function normalise(string $raw): array
    {
        $s = $raw;
        $mixedScript = (bool) preg_match('/(?=\S*\p{Latin})(?=\S*[\p{Cyrillic}\p{Greek}])\S+/u', $s);
        $invisible = (bool) preg_match('/[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{FEFF}\x{00AD}\x{034F}\x{180E}]/u', $s);
        if (class_exists('Normalizer')) {
            $s = Normalizer::normalize($s, Normalizer::FORM_KC) ?: $s;
        }
        $s = preg_replace('/[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{FEFF}\x{00AD}\x{034F}\x{180E}]/u', '', $s) ?? $s;
        if (class_exists('Normalizer')) {
            $d = Normalizer::normalize($s, Normalizer::FORM_D);
            if ($d !== false) $s = preg_replace('/\p{Mn}+/u', '', $d) ?? $s;
        }
        $s = mb_strtolower($s, 'UTF-8');
        $s = strtr($s, self::CONFUSABLES);

        // Word tokens: split on anything that is not a letter, digit or l33t symbol.
        $raw_tokens = preg_split('/[^\p{L}\p{N}@$!|+€£]+/u', $s, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $tokens = array_map(fn ($t) => $this->deleet($t), $raw_tokens);
        // Whitespace tokens with everything but letters removed: catches «b-a-n-g-s-a-t», «f*ck».
        $ws = preg_split('/\s+/u', $s, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $joined = [];
        foreach ($ws as $w) {
            $x = preg_replace('/[^\p{L}]+/u', '', $this->deleet($w)) ?? '';
            if ($x !== '') $joined[] = $x;
        }
        // Runs of single letters: «b a n g s a t».
        $run = '';
        foreach ($tokens as $t) {
            if (mb_strlen($t) === 1 && preg_match('/\p{L}/u', $t)) { $run .= $t; continue; }
            if (mb_strlen($run) >= 3) $joined[] = $run;
            $run = '';
        }
        if (mb_strlen($run) >= 3) $joined[] = $run;

        $squeeze = fn ($t) => preg_replace('/(\p{L})\1+/u', '$1', $t) ?? $t;
        $forms = array_values(array_unique(array_merge($tokens, $joined, array_map($squeeze, $tokens), array_map($squeeze, $joined))));
        $text = ' ' . implode(' ', $tokens) . ' ';
        return ['text' => $text, 'tokens' => $tokens, 'forms' => $forms, 'mixed_script' => $mixedScript, 'invisible' => $invisible, 'clean' => $s];
    }

    private function deleet(string $t): string
    {
        if (!preg_match('/\p{L}/u', $t)) return $t;           // «2024» stays a number
        return strtr($t, self::LEET);
    }

    private function wordMatch(string $term, array $forms): bool
    {
        $re = sprintf(self::AFFIX, preg_quote($term, '/'));
        $sq = preg_replace('/(\p{L})\1+/u', '$1', $term) ?? $term;
        $re2 = sprintf(self::AFFIX, preg_quote($sq, '/'));
        foreach ($forms as $f) if (preg_match($re, $f) || preg_match($re2, $f)) return true;
        return false;
    }

    private function containsMatch(string $term, array $forms): bool
    {
        foreach ($forms as $f) if (mb_strpos($f, $term) !== false) return true;
        return false;
    }

    private function phraseMatch(string $phrase, string $text): bool
    {
        return mb_strpos($text, ' ' . $phrase . ' ') !== false || mb_strpos($text, ' ' . $phrase) !== false;
    }

    /** Positions of a term among word tokens, for the «aimed at someone» test. */
    private function positions(string $term, array $tokens): array
    {
        $re = sprintf(self::AFFIX, preg_quote($term, '/'));
        $out = [];
        foreach ($tokens as $i => $t) {
            $sq = preg_replace('/(\p{L})\1+/u', '$1', $t) ?? $t;
            if (preg_match($re, $t) || preg_match($re, $sq)) $out[] = $i;
        }
        return $out;
    }

    /**
     * Moderate a submission. $fields: ['name' => …, 'institution' => …, 'message' => …].
     * Returns ['decision' => allow|flag|reject, 'categories' => [...]].
     */
    public function check(array $fields): array
    {
        $R = $this->rules;
        $reasons = [];               // category => severity
        $add = function (string $cat, string $sev) use (&$reasons) {
            $rank = ['allow' => 0, 'flag' => 1, 'reject' => 2];
            if (!isset($reasons[$cat]) || $rank[$sev] > $rank[$reasons[$cat]]) $reasons[$cat] = $sev;
        };

        $message = (string) ($fields['message'] ?? '');
        $all = trim(($fields['name'] ?? '') . "\n" . ($fields['institution'] ?? '') . "\n" . $message);
        $n = $this->normalise($all);
        $m = $this->normalise($message);
        $text = $n['text'];

        // Context: is this message reporting or quoting rather than abusing?
        $reporting = false;
        foreach ($R['reporting'] as $cue) if ($this->phraseMatch($cue, $text)) { $reporting = true; break; }

        // 1. Prohibited language.
        foreach (['obscene', 'obscene_contains', 'slur', 'sexual_topic'] as $cat) {
            $rule = $R[$cat] ?? null;
            if (!$rule) continue;
            foreach ($rule['terms'] as $term) {
                $hit = $rule['mode'] === 'contains' ? $this->containsMatch($term, $n['forms']) : $this->wordMatch($term, $n['forms']);
                if (!$hit) continue;
                $sev = $rule['severity'];
                if ($sev === 'reject' && $reporting) $sev = 'flag';
                $add(str_replace('_contains', '', $cat), $sev);
                break;
            }
        }

        // 2. Insults: only a problem when aimed at someone.
        $second = $R['second_person'] ?? [];
        $leads = $R['insult_lead'] ?? [];
        $tokens = $n['tokens'];
        $targeted = 0; $insults = 0;
        foreach ($R['insult']['terms'] as $term) {
            foreach ($this->positions($term, $tokens) as $i) {
                $insults++;
                $near = array_slice($tokens, max(0, $i - 3), 7);
                $aimed = (bool) array_intersect($near, $second);
                if ($i > 0 && in_array($tokens[$i - 1], $leads, true)) $aimed = true;
                if (preg_match('/^\p{L}+(mu|lu|kau)$/u', $tokens[$i]) && $tokens[$i] !== $term) $aimed = true; // «goblokmu»
                if ($aimed) $targeted++;
            }
        }
        if ($targeted > 0) {
            $severe = isset($reasons['obscene']) || isset($reasons['slur']);
            $add('harassment', (!$reporting && ($severe || $targeted >= 2)) ? 'reject' : 'flag');
        } elseif ($insults >= 4) {
            $add('insult', 'flag');
        }
        $mild = 0;
        foreach ($R['mild']['terms'] as $term) $mild += count($this->positions($term, $tokens));
        if ($mild >= 3) $add('mild_language', 'flag');

        // 3. Threats.
        foreach ($R['threat']['patterns'] as $re) if (preg_match($re, $text)) { $add('threat', $reporting ? 'flag' : 'reject'); break; }
        foreach ($R['threat_soft']['patterns'] as $re) if (preg_match($re, $text)) { $add('threat', 'flag'); break; }

        // 4. Links.
        $L = $R['links'];
        preg_match_all('~\b(?:https?://|www\.)[^\s<>"]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|id|co|io|xyz|top|click|link|info|biz|me|ly|gl|at|gd|cc|in|ru|cn|tk|ml|ga|cf|gq|zip|mov|win|loan|bid|cam|rest|icu|buzz|work|site|online|shop|store)\b(?:/[^\s<>"]*)?~iu', $n['clean'], $mm);
        $links = $mm[0] ?? [];
        $links = array_values(array_filter($links, fn ($u) => !preg_match('/^[^@\s]+@/u', $u)));
        $emailDomains = [];
        preg_match_all('/[^\s@]+@([^\s@]+\.[^\s@]+)/u', $n['clean'], $em);
        foreach ($em[1] ?? [] as $d) $emailDomains[] = mb_strtolower(rtrim($d, '.,;:)'));
        $links = array_values(array_filter($links, fn ($u) => !in_array(mb_strtolower(rtrim($u, '.,;:)')), $emailDomains, true)));
        $linkCount = count($links);
        if ($linkCount > $L['max']) $add('spam_links', 'reject');
        foreach ($links as $u) {
            $host = mb_strtolower(preg_replace('~^(?:https?://)?(?:www\.)?([^/:?#]+).*$~iu', '$1', $u) ?? '');
            if (in_array($host, $L['shorteners'], true)) $add('shortened_link', 'flag');
            if (preg_match('/^\d{1,3}(\.\d{1,3}){3}$/', $host)) $add('ip_link', 'flag');
            $tld = substr(strrchr($host, '.') ?: '', 1);
            if (in_array($tld, $L['suspicious_tlds'], true)) $add('suspicious_link', 'flag');
            if (preg_match('/\.(' . implode('|', array_map('preg_quote', $L['dangerous_ext'])) . ')(?:$|[?#])/i', $u)) $add('dangerous_link', 'reject');
        }
        $withoutLinks = trim(preg_replace('~\S*(?:https?://|www\.)\S*~u', '', $message) ?? '');
        if ($linkCount > 0 && mb_strlen(preg_replace('/\s+/u', '', $withoutLinks) ?? '') < 10) $add('link_only', 'reject');

        // 5. Spam and phishing: refused when they come with a link, flagged otherwise.
        foreach (['spam', 'phishing'] as $cat) {
            foreach ($R[$cat]['terms'] as $phrase) {
                if (!$this->phraseMatch($phrase, $text)) continue;
                $add($cat, $linkCount > 0 ? 'reject' : 'flag');
                break;
            }
        }

        // 6. Nonsense, repetition and bot-like text (message only).
        $mt = $m['tokens'];
        $letters = preg_replace('/[^\p{L}]/u', '', $m['clean']) ?? '';
        $nonSpace = preg_replace('/\s/u', '', $m['clean']) ?? '';
        $nl = mb_strlen($letters); $ns = max(1, mb_strlen($nonSpace));
        if ($ns >= 20 && $nl / $ns < 0.5) $add('nonsense', 'flag');
        if (preg_match('/(\S)\1{11,}/u', $m['clean'])) $add('nonsense', 'flag');
        if (count($mt) >= 8) {
            $counts = array_count_values($mt); arsort($counts);
            $top = reset($counts);
            if ($top >= 8 && $top / count($mt) > 0.5) $add('repetition', 'reject');
        }
        $mash = 0;
        foreach (['qwert', 'asdf', 'zxcv', 'hjkl', 'uiop', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'jkl', 'wert', 'erty', 'cvbn', 'vbnm'] as $row) $mash += substr_count($letters, $row);
        if ($nl >= 20) {
            $vowels = preg_match_all('/[aeiouy]/u', $letters);
            $ratio = $vowels / $nl;
            if ($ratio < 0.15) $add('nonsense', $mash >= 2 ? 'reject' : 'flag');
            elseif ($mash >= 3) $add('nonsense', 'flag');
        }
        foreach ($mt as $t) if (mb_strlen($t) >= 30 && !preg_match('~[/.]~', $t)) { $add('nonsense', 'flag'); break; }
        $nonLatin = preg_match_all('/[\p{Cyrillic}\p{Han}\p{Arabic}\p{Hangul}\p{Thai}]/u', $message);
        if ($nonLatin > 0 && $nonLatin / max(1, mb_strlen($message)) > 0.3) $add('unexpected_script', 'flag');

        // 7. Disguise itself is a signal: mixed scripts inside a word, invisible characters.
        if ($n['mixed_script'] || $n['invisible']) $add('obfuscation', 'flag');

        $decision = 'allow';
        foreach ($reasons as $sev) {
            if ($sev === 'reject') { $decision = 'reject'; break; }
            if ($sev === 'flag') $decision = 'flag';
        }
        $cats = array_keys(array_filter($reasons, fn ($s) => $s !== 'allow'));
        sort($cats);
        return ['decision' => $decision, 'categories' => $cats, 'reporting' => $reporting];
    }

    /** A stable fingerprint of a message's content, for duplicate detection. Not reversible. */
    public function fingerprint(string $message, string $secret): string
    {
        $n = $this->normalise($message);
        return substr(hash_hmac('sha256', implode(' ', $n['tokens']), $secret), 0, 32);
    }
}
