import type { ReactNode } from "react";
import { konteksHalaman } from "@/lib/konteks-server";

/**
 * L3 · THIS SURFACE'S WORKING-CONTEXT GUARD (CR-83; D-132 §2.6, C4). Before anything here is drawn: a page of
 * another purpose or place is never rendered in this session's context and the context is never switched silently
 * (the chooser offers the context that serves this page, and continues here once chosen); a session with no context
 * takes the one held pair that serves this page, or asks. Narrowing only: every act is still the database's to
 * decide. The page reads the same answer (src/lib/konteks-server.ts, once per request).
 */
export default async function Layout({ children }: { children: ReactNode }) {
  await konteksHalaman();
  return <>{children}</>;
}
