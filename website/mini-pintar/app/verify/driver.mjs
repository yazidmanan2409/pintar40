// A minimal static server and CDP driver.
//
// No npm dependency, deliberately. The bundle ships with none, and a
// verification suite that needs a 200 MB install is a suite that stops
// being run. Node 22's global WebSocket is enough to speak CDP.

import { createServer, get as httpGet } from "node:http";
import { spawn } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export function serve(dir) {
  const requested = [];
  const server = createServer(async (req, res) => {
    const path = req.url.split("?")[0];
    requested.push(path);
    const file = path === "/" ? "index.html" : path.replace(/^\/+/, "");
    try {
      const body = await readFile(join(dir, file));
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        port: server.address().port,
        requested,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

const CHROME = process.env.CHROMIUM
  || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/**
 * Chromium writes its chosen debug port to DevToolsActivePort in the
 * profile directory, so that is what we read.
 *
 * Its stderr is discarded rather than parsed. Scraping "DevTools listening
 * on ws://..." out of it looks simpler and is a trap: headless Chromium
 * emits a continuous flood of dbus errors on a machine with no session
 * bus, and a listener that accumulates them into a string while running a
 * regex over the whole thing per chunk grows quadratically. That is what
 * killed the first three runs of this suite, with no output at all to say
 * so.
 */
export async function launch() {
  const dir = await mkdtemp(join(tmpdir(), "mini-pintar-cdp-"));
  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--remote-debugging-port=0", `--user-data-dir=${dir}`,
    "--disable-extensions", "--no-first-run", "--disable-dev-shm-usage",
    "--disable-background-networking", "--disable-component-update",
    "--disable-default-apps", "--disable-sync", "--no-default-browser-check",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "ignore"] });

  let exited = null;
  proc.on("exit", (code) => { exited = code; });

  const portFile = join(dir, "DevToolsActivePort");
  let port = null;
  for (let i = 0; i < 200 && port === null; i += 1) {
    if (exited !== null) throw new Error(`chromium exited ${exited} before listening`);
    try {
      const lines = (await readFile(portFile, "utf8")).split("\n");
      if (lines.length >= 2 && lines[0].trim()) port = lines[0].trim();
    } catch { /* not written yet */ }
    if (port === null) await new Promise((r) => setTimeout(r, 100));
  }
  if (port === null) throw new Error("chromium never wrote DevToolsActivePort");

  const pageUrl = await pageTarget(port);
  return {
    proc, port, pageUrl, dir,
    kill: async () => {
      proc.kill("SIGKILL");
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

async function pageTarget(port, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    const list = await new Promise((resolve, reject) => {
      const req = httpGet({ host: "127.0.0.1", port, path: "/json/list" }, (res) => {
        let body = "";
        res.on("data", (d) => { body += d; });
        res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
      });
      req.on("error", reject);
    }).catch(() => null);
    const page = (list || []).find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (page) return page.webSocketDebuggerUrl;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("no page target appeared");
}

export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const cb of this.handlers.get(msg.method) || []) cb(msg.params);
      }
    });
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", () => reject(new Error("cdp connect failed")), { once: true });
    });
    return new CDP(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(method, cb) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(cb);
    return () => {
      const list = this.handlers.get(method) || [];
      const i = list.indexOf(cb);
      if (i >= 0) list.splice(i, 1);
    };
  }

  /** Resolve on the next occurrence of an event, then stop listening. */
  once(method) {
    return new Promise((resolve) => {
      const off = this.on(method, (p) => { off(); resolve(p); });
    });
  }
}

/** A page, with the handful of operations the journey test needs. */
export class Page {
  constructor(cdp) { this.cdp = cdp; }

  static async open(wsUrl) {
    const cdp = await CDP.connect(wsUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    await cdp.send("Console.enable");
    const page = new Page(cdp);
    page.requests = [];
    page.consoleErrors = [];
    cdp.on("Network.requestWillBeSent", (p) => page.requests.push(p.request.url));
    cdp.on("Runtime.exceptionThrown", (p) =>
      page.consoleErrors.push(p.exceptionDetails.text + " " +
        (p.exceptionDetails.exception?.description || "")));
    cdp.on("Console.messageAdded", (p) => {
      if (p.message.level === "error") page.consoleErrors.push(p.message.text);
    });
    return page;
  }

  /**
   * Go to a url, ADDING NO SESSION-HISTORY ENTRY.
   *
   * Two traps, both of which this suite fell into.
   *
   * A navigation that differs from the current url only by its fragment is
   * a SAME-DOCUMENT navigation: no load event fires, and a driver waiting
   * for one waits forever. That hung the deep-link case.
   *
   * And a test that goes somewhere forty times must not spend history
   * entries doing it. Chromium caps session history at 50 entries, and the
   * first fix here -- routing through about:blank -- spent two per call, so
   * by the end of the run the entries a `history.go(-4)` was counting back
   * over had been dropped off the front. `location.replace` replaces the
   * current entry instead of pushing one, and a reload adds none, so a
   * relative history assertion means the same thing at the end of the run
   * as at the start.
   */
  async goto(url) {
    const current = await this.eval("location.href").catch(() => "");
    const fresh = !current || current === "about:blank";
    const sameDoc = !fresh && current.split("#")[0] === url.split("#")[0];

    if (sameDoc) {
      // Same document: move the url without an entry, then force the load.
      await this.eval(`location.replace(${JSON.stringify(url)})`).catch(() => {});
      await this.reloadRaw();
    } else {
      const done = this.cdp.once("Page.loadEventFired");
      if (fresh) await this.cdp.send("Page.navigate", { url });
      else await this.eval(`location.replace(${JSON.stringify(url)})`).catch(() => {});
      await Promise.race([done, new Promise((r) => setTimeout(r, 15000))]);
    }
    await this.settle();
  }

  async reloadRaw() {
    const done = this.cdp.once("Page.loadEventFired");
    await this.cdp.send("Page.reload");
    await Promise.race([done, new Promise((r) => setTimeout(r, 15000))]);
  }

  async reload() {
    await this.reloadRaw();
    await this.settle();
  }

  /** Let the app's own render and its 40 ms live-region delay finish. */
  settle() { return this.eval("new Promise(r => setTimeout(r, 60))", true); }

  async eval(expression, awaitPromise = false) {
    let r;
    try {
      r = await this.cdp.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
    } catch (e) {
      // The page can navigate itself between our send and its execution.
      if (!/navigated or closed/i.test(e.message)) throw e;
      await new Promise((res) => setTimeout(res, 120));
      r = await this.cdp.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
    }
    if (r.exceptionDetails) {
      throw new Error("page error: " + (r.exceptionDetails.exception?.description
        || r.exceptionDetails.text));
    }
    return r.result.value;
  }

  async viewport(width, height, scale = 1) {
    await this.cdp.send("Emulation.setDeviceMetricsOverride", {
      width, height, deviceScaleFactor: scale, mobile: width < 768,
    });
  }

  /**
   * A key press. Non-character keys need `rawKeyDown`; the space bar needs
   * its `text` or the browser will not treat it as the character that
   * activates a button.
   */
  async key(key, code, keyCode) {
    // Enter and the space bar activate a button through their CHARACTER
    // event, so both need `text` and a full `keyDown`. Arrow keys are not
    // characters and take `rawKeyDown`. Sending Enter as a bare rawKeyDown
    // dispatches a keydown that no button acts on -- which is exactly how
    // the keyboard-only journey stalled at every primary action while
    // looking, in the DOM, as though the key had been pressed.
    const text = key === "Enter" ? "\r" : (key.length === 1 ? key : null);
    const base = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    await this.cdp.send("Input.dispatchKeyEvent", {
      ...base, type: text === null ? "rawKeyDown" : "keyDown", ...(text === null ? {} : { text }),
    });
    await this.cdp.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await this.settle();
  }

  async screenshot(path) {
    // The step transition is a fade. Capturing during it produces a
    // washed-out image that looks like a contrast failure and is not one.
    await this.eval("new Promise(r => setTimeout(r, 520))", true);
    // Focus moves to each step's heading, and Chromium treats the driver's
    // synthetic clicks as keyboard-ish, so :focus-visible paints a ring
    // that a visitor using a mouse never sees. Blur for the capture: the
    // screens should show the resting state, and the focus behaviour is
    // asserted by the accessibility checks rather than by a picture.
    await this.eval("document.activeElement && document.activeElement.blur()");
    const { data } = await this.cdp.send("Page.captureScreenshot", { captureBeyondViewport: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(path, Buffer.from(data, "base64"));
  }
}
