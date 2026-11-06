/* Ajudantes da suíte do tour. Só navegadores EMBUTIDOS do Playwright (chromium, webkit): nunca o Chrome instalado. */
import { chromium, webkit, devices, type Browser, type Page } from "playwright";
import { resolve } from "node:path";

export const RAIZ = resolve(import.meta.dir, "..");
export const url = (pagina = "index.html", q = "") => `file://${RAIZ}/${pagina}${q}`;
export { chromium, webkit, devices };

/* conta os AudioContext criados e guarda a preferência de som antes de qualquer script da página */
export const SONDA_AUDIO = (som?: string) => `
  window.__audios = 0;
  for (const nome of ['AudioContext', 'webkitAudioContext']) {
    const A = window[nome]; if (!A) continue;
    window[nome] = function (...a) { window.__audios++; return new A(...a); };
    window[nome].prototype = A.prototype;
  }
  ${som ? `try { localStorage.setItem('ays-tour-som', '${som}'); } catch (e) {}` : ""}`;

export type Aberta = { pg: Page; erros: string[]; fecha: () => Promise<void> };

export async function abre(nav: Browser, u: string, o: { ctx?: object; som?: string } = {}): Promise<Aberta> {
  const c = await nav.newContext({ viewport: { width: 1280, height: 800 }, ...(o.ctx ?? {}) });
  const pg = await c.newPage();
  const erros: string[] = [];
  pg.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  pg.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erros.push(`console: ${m.text()}`); });
  await pg.addInitScript(SONDA_AUDIO(o.som));
  await pg.goto(u, { waitUntil: "domcontentloaded" });
  return { pg, erros, fecha: () => c.close() };
}

export const ev = <T>(pg: Page, fn: string): Promise<T> => pg.evaluate(fn) as Promise<T>;
export const espera = (pg: Page, cond: string, ms = 60_000) => pg.waitForFunction(cond, undefined, { timeout: ms, polling: 50 });
