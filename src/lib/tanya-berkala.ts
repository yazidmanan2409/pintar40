/**
 * ASK NOW AND EVERY `ms`, NEVER TWO AT A TIME (efficiency audit, 2 Oct, after the L1 run on staging).
 *
 * Server actions from one tab run one after another (Next's action queue). A timer that starts a new ask every
 * `ms` whatever happened to the last one only queues asks behind each other once an answer takes longer than `ms`
 * -- in the L1 run the question player's assistance check took a median 5.6 s against its 5 s timer -- and the
 * learner's own saves then wait behind that queue. Here a tick that finds the last ask still waiting is skipped, so
 * at most one ask is ever in flight. When answers come back within `ms` nothing changes: one ask per tick.
 *
 * Returns the function that stops the timer. A failed ask behaves as it did with a bare timer (the promise
 * rejects) and the next tick asks again.
 */
export function tanyaBerkala(ask: () => Promise<void>, ms: number): () => void {
  let menunggu = false;
  const sekali = async () => {
    if (menunggu) return;
    menunggu = true;
    try {
      await ask();
    } finally {
      menunggu = false;
    }
  };
  void sekali();
  const timer = setInterval(() => { void sekali(); }, ms);
  return () => clearInterval(timer);
}
