import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { URUTAN_TEMPAT } from "@/lib/nama-tempat";

/**
 * O12 (D-170(d)): the navigation's items in the places' one order (URUTAN_TEMPAT), whoever added them: a surface's own
 * items and the context's (navKonteks) arrive in pieces, and sorting them here, in the DOM, keeps the order on screen and
 * the keyboard's the same (WCAG 2.4.3). An item that is not a known place keeps its place after them, in arrival order.
 */
export function urutkanNav(nav: ReactNode): ReactNode[] {
  const rata: ReactNode[] = [];
  const masuk = (n: ReactNode) => Children.forEach(n, (c) => {
    if (isValidElement(c) && c.type === Fragment) masuk((c.props as { children?: ReactNode }).children);
    else if (c !== null && c !== undefined && c !== false) rata.push(c);
  });
  masuk(nav);
  const tingkat = (c: ReactNode) => {
    const href = isValidElement(c) ? (c.props as { href?: unknown }).href : undefined;
    const i = typeof href === "string" ? URUTAN_TEMPAT.indexOf(href) : -1;
    return i < 0 ? URUTAN_TEMPAT.length : i;
  };
  return rata.map((c, i) => ({ c, i })).sort((a, b) => tingkat(a.c) - tingkat(b.c) || a.i - b.i).map(({ c }) => c);
}

