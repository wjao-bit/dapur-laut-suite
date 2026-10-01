/**
 * E2E KIT — lingkungan DOM (happy-dom) + spionase + helper mount/klik.
 *
 * URUTAN PENTING: bundling dijalankan SEBELUM global `window` dipasang, karena
 * esbuild membaca `typeof window` untuk memilih mode browser.
 */
import { createRequire } from "node:module";
import { buildBundle, BUNDLE_PATH, root } from "./e2e-build.mjs";

export * from "./e2e-build.mjs";
export { root };

const require = createRequire(import.meta.url);

export async function setupE2E() {
  await buildBundle();

  const { Window } = require("happy-dom");
  const win = new Window({ url: "http://localhost/dashboard/overview" });
  const G = globalThis;

  G.window = win;
  G.document = win.document;
  G.navigator = win.navigator;
  G.location = win.location;
  G.history = win.history;
  G.getComputedStyle = win.getComputedStyle.bind(win);
  G.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  G.cancelAnimationFrame = (id) => clearTimeout(id);
  G.IS_REACT_ACT_ENVIRONMENT = true;
  for (const k of [
    "HTMLElement", "HTMLAnchorElement", "HTMLButtonElement", "HTMLInputElement",
    "HTMLTextAreaElement", "HTMLSelectElement", "HTMLDivElement", "HTMLSpanElement",
    "Element", "Node", "Text", "DocumentFragment", "Event", "CustomEvent",
    "MouseEvent", "KeyboardEvent", "InputEvent", "FocusEvent", "Blob", "File",
    "FormData", "FileReader", "DOMRect", "DOMRectReadOnly", "SVGElement",
    "localStorage", "sessionStorage", "MutationObserver", "XMLHttpRequest",
    "AbortController", "AbortSignal", "Image", "CSSStyleDeclaration", "Range",
  ]) {
    if (win[k] !== undefined) G[k] = win[k];
  }

  if (!win.PointerEvent) {
    class PointerEvent extends win.MouseEvent {
      constructor(type, init = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? "mouse";
        this.isPrimary = init.isPrimary ?? true;
      }
    }
    win.PointerEvent = PointerEvent;
    G.PointerEvent = PointerEvent;
  }
  if (!win.ResizeObserver) {
    win.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    G.ResizeObserver = win.ResizeObserver;
  }
  if (!win.IntersectionObserver) {
    win.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
    G.IntersectionObserver = win.IntersectionObserver;
  }
  for (const proto of [win.Element.prototype, win.HTMLElement.prototype]) {
    if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
    if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
    if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
    if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
  }

  // ---- spionase: print, unduhan, toast, error ----
  const spy = { print: 0, downloads: [], toasts: [], mutations: [], queries: [], errors: [] };
  const blobMap = new Map();
  let blobSeq = 0;

  win.print = () => {
    spy.print++;
  };
  G.print = win.print;

  const createObjectURL = (blob) => {
    const url = `blob:e2e/${++blobSeq}`;
    blobMap.set(url, blob);
    return url;
  };
  const revokeObjectURL = () => {};
  win.URL.createObjectURL = createObjectURL;
  win.URL.revokeObjectURL = revokeObjectURL;
  if (G.URL && G.URL !== win.URL) {
    G.URL.createObjectURL = createObjectURL;
    G.URL.revokeObjectURL = revokeObjectURL;
  }
  win.HTMLAnchorElement.prototype.click = function () {
    const blob = blobMap.get(this.href ?? "");
    spy.downloads.push({ filename: String(this.download ?? ""), blob });
  };

  console.error = (...a) => {
    spy.errors.push(
      a
        .map((x) => (x instanceof Error ? x.stack ?? x.message : typeof x === "string" ? x : String(x)))
        .join(" "),
    );
  };
  console.warn = () => {};

  G.__E2E__ = { spy, fixtures: {}, mutationResults: {}, actionResults: {}, loadingState: undefined };

  // ---- bundle (DOM sudah siap) ----
  const B = require(BUNDLE_PATH);
  const { React, act, createRoot, MemoryRouter, Routes, Route, useLocation } = B;
  const h = React.createElement;

  function resetState({ fixtures = {}, mutationResults = {}, actionResults = {} } = {}) {
    spy.print = 0;
    spy.downloads = [];
    spy.toasts = [];
    spy.mutations = [];
    spy.queries = [];
    spy.errors = [];
    G.__E2E__.fixtures = fixtures;
    G.__E2E__.mutationResults = mutationResults;
    G.__E2E__.actionResults = actionResults;
    G.__E2E__.loadingState = undefined;
    try {
      win.localStorage.clear();
    } catch {}
  }

  async function mount(factory, route = "/dashboard/overview") {
    const container = win.document.createElement("div");
    win.document.body.appendChild(container);
    const rootEl = createRoot(container);
    let error = null;
    await act(async () => {
      try {
        rootEl.render(h(MemoryRouter, { initialEntries: [route] }, factory()));
      } catch (e) {
        error = e;
      }
    });
    return {
      container,
      error,
      text: () => container.textContent ?? "",
      buttons: () => Array.from(container.querySelectorAll("button")),
      inputs: () => Array.from(container.querySelectorAll("input")),
      buttonByText: (needle) =>
        Array.from(container.querySelectorAll("button")).find((b) => (b.textContent ?? "").includes(needle)),
      unmount: async () => {
        try {
          await act(async () => rootEl.unmount());
        } catch {}
        container.remove();
      },
    };
  }

  function fire(el, type, init = {}) {
    const Ev = type === "click" || type.startsWith("pointer") ? win.PointerEvent ?? win.MouseEvent : win.Event;
    el.dispatchEvent(new Ev(type, { bubbles: true, cancelable: true, view: win, ...init }));
  }

  async function click(el) {
    if (!el) throw new Error("tombol tidak ditemukan");
    let err = null;
    await act(async () => {
      try {
        fire(el, "pointerdown", { button: 0, buttons: 1, pointerId: 1 });
        fire(el, "pointerup", { button: 0, buttons: 0, pointerId: 1 });
        fire(el, "click", { button: 0 });
      } catch (e) {
        err = e;
      }
    });
    if (err) throw err;
  }

  async function typeInto(el, value) {
    if (!el) throw new Error("input tidak ditemukan");
    const proto = el.tagName === "TEXTAREA" ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    await act(async () => {
      if (setter) setter.call(el, value);
      else el.value = value;
      el.dispatchEvent(new win.Event("input", { bubbles: true }));
      el.dispatchEvent(new win.Event("change", { bubbles: true }));
    });
  }

  function labelOf(btn) {
    return (btn.textContent || btn.getAttribute("aria-label") || btn.getAttribute("title") || "(ikon)")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
  }

  /** Klik SETIAP tombol yang tampak, satu per satu. Mengembalikan daftar masalah. */
  async function clickEveryButton(view, { skip = [] } = {}) {
    const problems = [];
    for (const btn of Array.from(view.container.querySelectorAll("button"))) {
      const label = labelOf(btn);
      if (skip.some((s) => label.includes(s))) continue;
      if (btn.disabled) continue;
      const before = spy.errors.length;
      try {
        await click(btn);
      } catch (e) {
        problems.push({ label, error: String(e?.message ?? e).split("\n")[0] });
        continue;
      }
      const real = spy.errors.slice(before).filter((m) => !/not implemented/i.test(m));
      if (real.length) problems.push({ label, error: real[0].split("\n")[0] });
    }
    return problems;
  }

  function Probe({ marker }) {
    const loc = useLocation();
    return h("div", { "data-probe": marker }, `PROBE:${loc.pathname}${loc.search}`);
  }

  const downloadNames = () => spy.downloads.map((d) => d.filename);
  async function downloadText(i) {
    const blob = spy.downloads[i]?.blob;
    if (!blob) throw new Error(`unduhan #${i} tidak tertangkap`);
    return await blob.text();
  }

  return {
    B, h, win, act, resetState, mount, click, typeInto, clickEveryButton,
    downloadNames, downloadText, Probe, spy, labelOf,
  };
}

// ============================================================================
// RUNNER (hasil tes)
// ============================================================================
export function createRunner() {
  const state = { pass: 0, fail: 0, failures: [], section: "" };
  const expect = (cond, msg) => {
    if (!cond) throw new Error(msg || "gagal");
  };
  const check = async (name, fn) => {
    try {
      const res = await fn();
      if (res === false) throw new Error("pemeriksaan mengembalikan false");
      console.log(`  ✅ ${name}`);
      state.pass++;
    } catch (e) {
      console.log(`  ❌ ${name}`);
      console.log(`       → ${String(e?.message ?? e).split("\n")[0]}`);
      state.fail++;
      state.failures.push(`[${state.section}] ${name}: ${e?.message ?? e}`);
    }
  };
  const setSection = (s) => {
    state.section = s;
  };
  const report = (title = "HASIL AKHIR") => {
    console.log("\n" + "=".repeat(70));
    console.log(`${title}: ${state.pass} lulus, ${state.fail} gagal`);
    console.log("=".repeat(70));
    if (state.failures.length) {
      console.log("\nGAGAL:");
      for (const f of state.failures) console.log(`  ❌ ${f}`);
    }
    console.log("");
    return state.fail === 0;
  };
  return { check, expect, setSection, report, state };
}
