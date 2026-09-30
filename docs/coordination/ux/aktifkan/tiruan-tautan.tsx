// Review tooling: next/link outside Next. A link is an anchor; there is no
// router to prefetch or transition with.
import type { AnchorHTMLAttributes, ReactNode } from "react";

export default function Link({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; prefetch?: boolean }) {
  const { prefetch: _abaikan, ...a } = rest as typeof rest & { prefetch?: boolean };
  void _abaikan;
  return <a href={href} {...a}>{children}</a>;
}
