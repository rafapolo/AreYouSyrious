/* Prints de todas as cenas (foto e mapa), em desktop 1280x800 (chromium) e iPhone 13 (webkit), e o vídeo do tour inteiro.
   Uso: bun testes/prints.ts <pasta de saída> */
import { readFileSync, mkdirSync } from "node:fs";
import { chromium, webkit, devices, abre, url, espera, ev, RAIZ } from "./comum";

const saida = process.argv[2] ?? "/tmp/ays-prints";
mkdirSync(saida, { recursive: true });
const tour = JSON.parse(readFileSync(`${RAIZ}/design/tour.json`, "utf8"));
const nn = (i: number) => String(i + 1).padStart(2, "0");

async function prints(nav: any, rotulo: string, ctx: object) {
  const { pg, fecha } = await abre(nav, url("index.html", "?rapido=1"), { ctx });
  try {
    await pg.waitForSelector("[data-tour]");
    for (let i = 0; i < tour.length; i++) {
      const c = tour[i];
      if (c.mapa) {
        await ev(pg, `window.aysTour.mapa(${i})`);
        await pg.waitForTimeout(1700);
        await pg.screenshot({ path: `${saida}/ays-${rotulo}-${nn(i)}a-mapa-${c.id}.png` });
      }
      await ev(pg, `window.aysTour.mostra(${i})`);
      await pg.waitForTimeout(1700);
      await pg.screenshot({ path: `${saida}/ays-${rotulo}-${nn(i)}b-${c.id}.png` });
    }
  } finally { await fecha(); }
}

async function video(rapido: number) {
  const nav = await chromium.launch();
  try {
    const c = await nav.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: saida, size: { width: 1280, height: 800 } } });
    const pg = await c.newPage();
    await pg.goto(url("index.html", `?tour=1&rapido=${rapido}`), { waitUntil: "domcontentloaded" });
    await pg.locator("#ays-tour-convite").waitFor({ state: "visible" });
    await pg.waitForTimeout(1500);
    await pg.click("#ays-tour-convite button");
    await espera(pg, `!window.aysTour.ativo()`, 600_000);
    await pg.waitForTimeout(1500);
    const v = pg.video();
    await c.close();
    await v!.saveAs(`${saida}/ays-tour-completo-x${rapido}.webm`);
  } finally { await nav.close(); }
}

const nd = await chromium.launch();
await prints(nd, "desktop", {}); await nd.close();
const ni = await webkit.launch();
await prints(ni, "iphone13", { ...devices["iPhone 13"] }); await ni.close();
if (process.argv[3] !== "--sem-video") await video(Number(process.argv[4] ?? 3));
console.log("pronto");
