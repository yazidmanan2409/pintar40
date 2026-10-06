"""Read a PINTAR sign-in link, or a PINTAR code, from the staging test mailbox (Golden School C2).

Usage: python3 mailbox_link.py <address> <since_epoch_seconds> [timeout_seconds] [--kode]

Waits for the newest message to <address> (a goldenschool+tag@ plus-address)
that arrived after <since>, in any folder, and prints what it carries: with
--kode, the six-digit code of PINTAR's own activation or recovery email (Gate 3
and Gate 4, the «482 913» in its pin-kode block); without it, the sign-in link
(Supabase's /auth/v1/verify link, before Gate 3). Exits 1 if none arrives in
time. The mailbox password comes from GS_MAILBOX_PASSWORD and is never printed;
the caller masks what is printed.
"""
import email, email.utils, imaplib, os, re, ssl, sys, time

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


def main():
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
