"use client";

import { useSyncExternalStore } from "react";

const diam = () => () => {};

/**
 * HAS THE CLIENT ACTUALLY STARTED?
 *
 * `false` in the server-rendered HTML, `true` once React has hydrated — with
 * no effect and no state write, so there is nothing to mis-order and nothing
 * for a lint rule to be right about.
 *
 * WHY IT EXISTS. The sign-in surface is a client state machine: its submit
 * handlers are JavaScript, and the JavaScript dependency is accepted for
 * PINTAR 4.0. What is not acceptable is the failure mode. If the bundle never
 * arrives — a blocked script, a dead network, a throw during hydration — the
 * server HTML still draws a complete, inviting form, and pressing its button
 * does nothing at all. A control that looks operational and silently is not is
 * worse than one that says it is not ready: the person retypes their address,
 * presses again, and concludes PINTAR is broken rather than that a script
 * failed.
 *
 * So the actionable controls are drawn unavailable until this says otherwise.
 * It is a bounded failure behaviour, not progressive enhancement: nothing here
 * tries to make the screen work without JavaScript.
 */
export function useSiap(): boolean {
  return useSyncExternalStore(diam, () => true, () => false);
}
