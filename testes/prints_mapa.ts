/* Prints do mapa: inteiro, um ponto clicado e o filtro de ano, em desktop 1280x800 e iPhone 13. Uso: bun testes/prints_mapa.ts <pasta> */
import { mkdirSync } from "node:fs";
import { chromium, webkit, devices, abre, url } from "./comum";
const saida = process.argv[2] ?? "/tmp/ays-prints"; mkdirSync(saida, { recursive: true });
const livre = (pg: any) => pg.evaluate(`(() => { const L = Object.fromEntries(window.aysMapa.lugares().map(l => [l.id, l]));
  for (const el of document.querySelectorAll('circle.pt')) { const l = L[el.dataset.id]; if (l.c < 80) continue;
    const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2, c = document.getElementById('campo').getBoundingClientRect();
    if (x < c.left + 80 || x > c.right - 80 || y < c.top + 40 || y > c.bottom - 40) continue;
    if (document.elementFromPoint(x, y) === el) return { x, y }; } return null; })()`);
async function rodada(nav: any, rot: string, ctx: object, toque: boolean) {
  const { pg, fecha } = await abre(nav, url("map.html"), { ctx });
  try {
    await pg.waitForSelector("circle.pt"); await pg.waitForTimeout(900);
    await pg.screenshot({ path: `${saida}/aysmapa-${rot}-1-inteiro.png` });
    const p = await livre(pg);
    if (toque) await pg.touchscreen.tap(p.x, p.y); else await pg.mouse.click(p.x, p.y);
    await pg.waitForTimeout(1500);
    await pg.screenshot({ path: `${saida}/aysmapa-${rot}-2-ponto.png` });
    await pg.keyboard.press("Escape"); await pg.waitForTimeout(500);
    await pg.locator("#anos button", { hasText: "2016" }).click(); await pg.waitForTimeout(900);
    await pg.screenshot({ path: `${saida}/aysmapa-${rot}-3-ano2016.png` });
  } finally { await fecha(); }
}
const a = await chromium.launch(); try { await rodada(a, "desktop", {}, false); } finally { await a.close(); }
const b = await webkit.launch(); try { await rodada(b, "iphone13", { ...devices["iPhone 13"] }, true); } finally { await b.close(); }
console.log("pronto");
