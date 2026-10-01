"""Read a PINTAR sign-in link from the staging test mailbox (Golden School C2).

Usage: python3 mailbox_link.py <address> <since_epoch_seconds> [timeout_seconds]

Waits for the newest message to <address> (a goldenschool+tag@ plus-address)
that arrived after <since>, in any folder, and prints the sign-in link it
carries (Supabase's /auth/v1/verify link). Exits 1 if none arrives in time.
The mailbox password comes from GS_MAILBOX_PASSWORD and is never printed.
"""
import email, email.utils, imaplib, os, re, ssl, sys, time

HOST, PORT = 'pintarselalu.com', 993
USER = 'goldenschool@pintarselalu.com'
LINK = re.compile(r'https?://[^\s"\'<>]+/auth/v1/verify[^\s"\'<>]+')
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


def body_text(msg):
    parts = msg.walk() if msg.is_multipart() else [msg]
    text = []
    for p in parts:
        if p.get_content_maintype() == 'text':
            raw = p.get_payload(decode=True) or b''
            text.append(raw.decode(p.get_content_charset() or 'utf-8', errors='replace'))
    return ' '.join(text).replace('&amp;', '&')


def newest_link(address, since):
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
                link = LINK.search(body_text(msg))
                if link and (best is None or when > best[0]):
                    best = (when, link.group(0), msg.get('Subject', ''))
    finally:
        m.logout()
    return best


def main():
    address, since = sys.argv[1].lower(), float(sys.argv[2])
    deadline = time.time() + (float(sys.argv[3]) if len(sys.argv) > 3 else 150)
    while time.time() < deadline:
        found = newest_link(address, since)
        if found:
            print(found[1])
            print('subject: %s' % found[2], file=sys.stderr)
            return 0
        time.sleep(10)
    print('no sign-in email to %s arrived in time' % address, file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
