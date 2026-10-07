"""Read a PINTAR sign-in link, or a PINTAR code, from the staging test mailbox (Golden School C2).

Usage: python3 mailbox_link.py <address> <since_epoch_seconds> [timeout_seconds] [--kode]
       python3 mailbox_link.py <address> <since_epoch_seconds> [timeout_seconds] --pemberitahuan <subject words>

Waits for the newest message to <address> (a goldenschool+tag@ plus-address)
that arrived after <since>, in any folder, and prints what it carries: with
--kode, the six-digit code of PINTAR's own activation or recovery email (Gate 3
and Gate 4, the «482 913» in its pin-kode block); without it, the sign-in link
(Supabase's /auth/v1/verify link, before Gate 3). Exits 1 if none arrives in
time. The mailbox password comes from GS_MAILBOX_PASSWORD and is never printed;
the caller masks what is printed.

With --pemberitahuan (GS-21's security notice, J2.13), it waits for the newest message whose subject holds the
given words and prints one JSON line: the subject, whether the body carries the PINTAR ID in NOTICE_PINTAR_ID (4+4,
spaced or not), and whether it carries the PIN in NOTICE_PIN. Neither value is printed; both come from the
environment, never the command line.
"""
import json
import email, email.header, email.utils, imaplib, os, re, ssl, sys, time

HOST, PORT = 'pintarselalu.com', 993
USER = 'goldenschool@pintarselalu.com'
LINK = re.compile(r'https?://[^\s"\'<>]+/auth/v1/verify[^\s"\'<>]+')
# PINTAR's code email (src/components/email): the code in its pin-kode block, grouped «482 913»; else the first
# three-and-three digits of the text
KODE_HTML = re.compile(r'class="pin-kode"[^>]*>\s*([\d\s]{6,9}?)\s*<')
KODE_TEKS = re.compile(r'\b(\d{3}) ?(\d{3})\b')
LIST = re.compile(rb'^\((?P<flags>[^)]*)\) (?:"(?:[^"\\]|\\.)*"|NIL) (?P<name>.+)$')


def folders(m):
    out = []
    for line in m.list()[1] or []:
        if not isinstance(line, bytes):
            continue
        hit = LIST.match(line)
        if hit and b'\\noselect' not in hit.group('flags').lower():
            name = hit.group('name').decode()
            out.append(name if name.startswith('"') else '"%s"' % name)
    return out


def body_parts(msg):
    parts = msg.walk() if msg.is_multipart() else [msg]
    html, text = [], []
    for p in parts:
        if p.get_content_maintype() == 'text':
            raw = (p.get_payload(decode=True) or b'').decode(p.get_content_charset() or 'utf-8', errors='replace')
            (html if p.get_content_subtype() == 'html' else text).append(raw)
    return ' '.join(html), ' '.join(text)


def code_in(msg):
    html, text = body_parts(msg)
    hit = KODE_HTML.search(html)
    if hit:
        digits = re.sub(r'\D', '', hit.group(1))
        if len(digits) == 6:
            return digits
    hit = KODE_TEKS.search(text)
    return hit.group(1) + hit.group(2) if hit else None


def body_text(msg):
    parts = msg.walk() if msg.is_multipart() else [msg]
    text = []
    for p in parts:
        if p.get_content_maintype() == 'text':
            raw = p.get_payload(decode=True) or b''
            text.append(raw.decode(p.get_content_charset() or 'utf-8', errors='replace'))
    return ' '.join(text).replace('&amp;', '&')


def newest_link(address, since, kode=False):
    m = imaplib.IMAP4_SSL(HOST, PORT, ssl_context=ssl.create_default_context(), timeout=30)
    m.login(USER, os.environ['GS_MAILBOX_PASSWORD'])
    best = None
    try:
        for f in folders(m):
            if m.select(f, readonly=True)[0] != 'OK':
                continue
            typ, data = m.search(None, 'HEADER', 'To', address)
            for num in (data[0].split() if typ == 'OK' and data and data[0] else []):
                typ, raw = m.fetch(num, '(RFC822)')
                blob = b''.join(p[1] for p in raw if isinstance(p, tuple))
                msg = email.message_from_bytes(blob)
                when = email.utils.parsedate_to_datetime(msg.get('Date')).timestamp() if msg.get('Date') else 0
                if when < since:
                    continue
                if kode:
                    found = code_in(msg)
                else:
                    link = LINK.search(body_text(msg))
                    found = link.group(0) if link else None
                if found and (best is None or when > best[0]):
                    best = (when, found, msg.get('Subject', ''))
    finally:
        m.logout()
    return best


def newest_notice(address, since, words):
    m = imaplib.IMAP4_SSL(HOST, PORT, ssl_context=ssl.create_default_context(), timeout=30)
    m.login(USER, os.environ['GS_MAILBOX_PASSWORD'])
    best = None
    pid = re.sub(r'\s', '', os.environ.get('NOTICE_PINTAR_ID', '')).upper()
    pin = os.environ.get('NOTICE_PIN', '')
    try:
        for f in folders(m):
            if m.select(f, readonly=True)[0] != 'OK':
                continue
            typ, data = m.search(None, 'HEADER', 'To', address)
            for num in (data[0].split() if typ == 'OK' and data and data[0] else []):
                typ, raw = m.fetch(num, '(RFC822)')
                msg = email.message_from_bytes(b''.join(p[1] for p in raw if isinstance(p, tuple)))
                when = email.utils.parsedate_to_datetime(msg.get('Date')).timestamp() if msg.get('Date') else 0
                subject = str(email.header.make_header(email.header.decode_header(msg.get('Subject', ''))))
                if when < since or words.lower() not in subject.lower():
                    continue
                body = body_text(msg)
                flat = re.sub(r'\s', '', body).upper()
                found = {'subject': subject, 'pintar_id': bool(pid) and pid in flat,
                         'pin': bool(pin) and re.search(r'(?<!\d)%s(?!\d)' % re.escape(pin), body) is not None}
                if best is None or when > best[0]:
                    best = (when, found)
    finally:
        m.logout()
    return best


def main():
    if '--pemberitahuan' in sys.argv:
        i = sys.argv.index('--pemberitahuan')
        words = ' '.join(sys.argv[i + 1:])
        args = sys.argv[1:i]
        address, since = args[0].lower(), float(args[1])
        deadline = time.time() + (float(args[2]) if len(args) > 2 else 150)
        while time.time() < deadline:
            found = newest_notice(address, since, words)
            if found:
                print(json.dumps(found[1], ensure_ascii=False))
                return 0
            time.sleep(10)
        print('no notice «%s» to %s arrived in time' % (words, address), file=sys.stderr)
        return 1
    kode = '--kode' in sys.argv
    args = [a for a in sys.argv[1:] if a != '--kode']
    address, since = args[0].lower(), float(args[1])
    deadline = time.time() + (float(args[2]) if len(args) > 2 else 150)
    while time.time() < deadline:
        found = newest_link(address, since, kode)
        if found:
            print(found[1])
            print('subject: %s' % found[2], file=sys.stderr)
            return 0
        time.sleep(10)
    print('no %s email to %s arrived in time' % ('code' if kode else 'sign-in', address), file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
