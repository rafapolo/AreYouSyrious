/* Suíte do celular: nenhuma página com rolagem lateral, alvos de toque de 44 px, texto de 14 px, mapa que preenche a tela e folha dentro dela.
   As páginas vêm de um servidor local (post.html lê o .md por fetch, que o file:// bloqueia). Só navegadores embutidos do Playwright. */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chromium, webkit, devices, espera, ev, RAIZ, type Browser } from "./comum";

let cr: Browser, wk: Browser, srv: ReturnType<typeof Bun.serve>, B = "";
beforeAll(async () => {
  cr = await chromium.launch(); wk = await webkit.launch();
  srv = Bun.serve({ port: 0, fetch: async (r) => { const f = Bun.file(RAIZ + decodeURIComponent(new URL(r.url).pathname).replace(/\/$/, "/index.html")); return (await f.exists()) ? new Response(f) : new Response("", { status: 404 }); } });
  B = `http://127.0.0.1:${srv.port}/`;
});
afterAll(async () => { await cr.close(); await wk.close(); srv.stop(true); });

const POST = "post.html?p=2016-04-11-ays-daily-news-digest-10-4-2016-fab36d1b4dd4.md";
const PAGINAS = ["index.html", "timeline.html", "map.html", "tour/", POST, "images.html"];
const AP: [string, () => Browser, object][] = [
  ["iPhone 13", () => wk, { ...devices["iPhone 13"] }],
  ["iPhone SE 375x667", () => wk, { ...devices["iPhone SE"], viewport: { width: 375, height: 667 } }],
  ["Android 360x740", () => cr, { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }],
  ["iPhone 13 deitado", () => wk, { ...devices["iPhone 13"], viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 } }],
];

async function abre(nav: Browser, ctx: object, pagina: string, espCSS?: string) {
  const c = await nav.newContext(ctx); const pg = await c.newPage();
  const erros: string[] = []; pg.on("pageerror", (e) => erros.push(e.message));
  await pg.goto(B + pagina, { waitUntil: "load" });
  if (espCSS) await pg.waitForSelector(espCSS, { timeout: 15_000 });
  await pg.waitForTimeout(400);
  return { pg, erros, fecha: () => c.close() };
}

describe("sem rolagem lateral e com viewport", () => {
  for (const [nome, nav, ctx] of AP) for (const pagina of PAGINAS) {
    test(`${nome}: ${pagina}`, async () => {
      const { pg, fecha } = await abre(nav(), ctx, pagina, pagina === POST ? "#post-body p" : undefined);
      try {
        const r = await ev<any>(pg, `({ w: innerWidth, sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth,
          meta: (document.querySelector('meta[name=viewport]') || {}).content || '' })`);
        expect(r.meta).toContain("width=device-width");
        expect(r.sw, "scrollWidth do documento").toBeLessThanOrEqual(r.w);
        expect(r.bw, "scrollWidth do corpo").toBeLessThanOrEqual(r.w);
      } finally { await fecha(); }
    });
  }
});

/* alvos: tudo o que é visível e clicável fora de texto corrido; os chips do mapa rolam, então só se mede a altura deles */
const MEDE = `(() => { const W = innerWidth; const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const ruins = []; for (const e of document.querySelectorAll(SEL)) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.height < 43.5 || (r.width < 43.5)) ruins.push(e.tagName + ':' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }
  return ruins; })()`;
describe("alvos de toque (>= 44 px) nos menus e controles", () => {
  const CASOS: [string, string][] = [
    ["index.html", ".top-links a, .top-links button, nav a, #country-filter, footer a"],
    ["timeline.html", ".top-links a, .top-links button, footer a"],
    [POST, ".top-links a, .top-links button, .back-link"],
    ["images.html", ".top-links a, .top-links button, .btn, footer a"],
    ["map.html", ".topo nav a, .topo nav button, #anos .todos, #anos input, .zoom button"],
  ];
  for (const [nome, nav, ctx] of AP) for (const [pagina, sel] of CASOS) {
    test(`${nome}: ${pagina}`, async () => {
      const { pg, fecha } = await abre(nav(), ctx, pagina, pagina === POST ? "#post-body p" : undefined);
      try { expect(await ev<string[]>(pg, MEDE.replace("SEL", JSON.stringify(sel)))).toEqual([]); } finally { await fecha(); }
    });
  }
  test("iPhone 13: a lista do arquivo tem linhas de 44 px e o menu do topo do index cabe em duas linhas sem passar da tela", async () => {
    const { pg, fecha } = await abre(wk, { ...devices["iPhone 13"] }, "index.html");
    try {
      expect(await ev<string[]>(pg, MEDE.replace("SEL", JSON.stringify("li a")))).toEqual([]);
      const r = await ev<any>(pg, `(() => { const b = document.querySelector('.top-bar').getBoundingClientRect(); const l = [...document.querySelectorAll('.top-links a')].filter(a => getComputedStyle(a).display !== 'none').map(a => a.getBoundingClientRect());
        return { alt: b.height, esq: Math.min(...l.map(x => x.left)), dir: Math.max(...l.map(x => x.right)), W: innerWidth, n: l.length, tema: document.getElementById('theme-btn').getBoundingClientRect().right }; })()`);
      expect(r.n).toBe(4); expect(r.esq).toBeGreaterThanOrEqual(0); expect(r.dir).toBeLessThanOrEqual(r.W); expect(r.tema).toBeLessThanOrEqual(r.W);
      expect(r.alt).toBeLessThan(110);
    } finally { await fecha(); }
  });
});

describe("texto de 14 px ou mais", () => {
  const TEXTO = `(() => { const ruins = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while (n = w.nextNode()) { const p = n.parentElement; if (!n.textContent.trim() || !p || p.closest('svg,script,style,noscript,[hidden]')) continue;
      const r = p.getBoundingClientRect(), s = getComputedStyle(p); if (r.width < 2 || r.height < 2 || s.visibility === 'hidden' || s.display === 'none') continue;
      const fs = parseFloat(s.fontSize); if (fs < 13.9) ruins.add(fs + 'px ' + p.tagName + '.' + p.className + ' ' + n.textContent.trim().slice(0, 20)); }
    return [...ruins].slice(0, 5); })()`;
  for (const pagina of ["index.html", "timeline.html", "images.html", POST, "map.html"]) {
    test(`iPhone 13: ${pagina}`, async () => {
      const { pg, fecha } = await abre(wk, { ...devices["iPhone 13"] }, pagina, pagina === POST ? "#post-body p" : undefined);
      try { expect(await ev<string[]>(pg, TEXTO)).toEqual([]); } finally { await fecha(); }
    });
  }
});

describe("mapa no celular", () => {
  for (const [nome, nav, ctx] of AP.slice(0, 3)) {
    test(`${nome}: a vista inicial preenche a tela dentro do mapa e mostra poucos nomes; a folha cabe na tela`, async () => {
      const { pg, erros, fecha } = await abre(nav(), ctx, "map.html", "circle.pt");
      try {
        const v = await ev<any>(pg, `(() => { const q = window.aysMapa.quadro(), w = window.aysMapa.vista(), c = document.getElementById('campo'), h = w.w * c.clientHeight / c.clientWidth;
          return { topo: w.cy - h / 2, base: w.cy + h / 2, esq: w.cx - w.w / 2, dir: w.cx + w.w / 2, H: q.h, W: q.w,
            rotulos: [...document.querySelectorAll('text.rotulo')].filter(t => t.style.display !== 'none').length,
            pts: [...document.querySelectorAll('circle.pt')].filter(t => t.style.display !== 'none').length }; })()`);
        expect(v.base, "sem faixa vazia abaixo do mapa").toBeLessThanOrEqual(v.H + 1);
        expect(v.topo).toBeGreaterThanOrEqual(-1); expect(v.esq).toBeGreaterThanOrEqual(-1); expect(v.dir).toBeLessThanOrEqual(v.W + 1);
        expect(v.rotulos, "rótulos no mapa inicial").toBeLessThanOrEqual(16);
        expect(v.pts).toBeGreaterThan(40);
        await ev(pg, `window.aysMapa.abre('idomeni')`);
        await espera(pg, `document.getElementById('painel').classList.contains('on')`, 5000);
        await pg.waitForTimeout(700);
        const s = await ev<any>(pg, `(() => { const r = document.getElementById('painel').getBoundingClientRect(), W = innerWidth, H = innerHeight;
          const ponto = document.querySelector('circle.pt.sel').getBoundingClientRect();
          return { l: r.left, r: r.right, t: r.top, b: r.bottom, W, H, sw: document.documentElement.scrollWidth, pTopo: ponto.top, pBase: ponto.bottom }; })()`);
        expect(s.l).toBeGreaterThanOrEqual(0); expect(s.r).toBeLessThanOrEqual(s.W + 1); expect(s.b).toBeLessThanOrEqual(s.H + 1); expect(s.t).toBeGreaterThan(s.H * 0.25);
        expect(s.sw).toBeLessThanOrEqual(s.W);
        expect(s.pBase, "o ponto aberto fica acima da folha").toBeLessThanOrEqual(s.t);
        expect(erros).toEqual([]);
      } finally { await fecha(); }
    });
  }

  test("a barra de anos é um slider que cabe na tela: arrastar e tocar num ano filtram, All volta a todos", async () => {
    const { pg, fecha } = await abre(wk, { ...devices["iPhone 13"] }, "map.html", "#anos input[type=range]");
    try {
      const r = await ev<any>(pg, `(() => { const b = anos.getBoundingClientRect(), m = [...anos.querySelectorAll('.marcas button')].map(x => x.getBoundingClientRect());
        return { sw: anos.scrollWidth <= anos.clientWidth + 1, l: Math.min(...m.map(x => x.left)), rr: Math.max(...m.map(x => x.right)), W: innerWidth, n: m.length } })()`);
      expect(r.sw, "sem rolagem lateral").toBe(true);
      expect(r.n).toBe(10); expect(r.l).toBeGreaterThanOrEqual(0); expect(r.rr).toBeLessThanOrEqual(r.W);
      const b = await pg.locator("#anos input").boundingBox();
      await pg.touchscreen.tap(b!.x + 10, b!.y + b!.height / 2); await pg.waitForTimeout(400);   // perto do começo do trilho
      expect(await ev(pg, `aysMapa.selecionado() === null && document.querySelector('#anos .marcas [aria-pressed=true]')?.dataset.ano`)).toBe("2016");
      await pg.locator('#anos .marcas button[data-ano="2025"]').tap(); await pg.waitForTimeout(400);
      expect(await ev(pg, `anos.querySelector('input').value`)).toBe("2025");
      expect(await ev(pg, `location.hash`)).toContain("ano=2025");
      await pg.locator("#anos .todos").tap(); await pg.waitForTimeout(400);
      expect(await ev(pg, `anos.querySelector('.todos').getAttribute('aria-pressed')`)).toBe("true");
      expect(await ev(pg, `location.hash`)).not.toContain("ano=");
    } finally { await fecha(); }
  });

  test("o menu do mapa mostra Archive, Timeline, Tour e Index lado a lado, sem passar da tela", async () => {
    for (const [, nav, ctx] of AP) {
      const { pg, fecha } = await abre(nav(), ctx, "map.html", "circle.pt");
      try {
        const r = await ev<any>(pg, `[...document.querySelectorAll('.topo nav > *')].map(a => { const b = a.getBoundingClientRect(); return [a.textContent.trim(), Math.round(b.left), Math.round(b.right), getComputedStyle(a).display]; })`);
        expect(r.map((x: any) => x[0]).sort()).toEqual(["Archive", "Index", "Timeline", "Tour"]);
        for (const x of r) { expect(x[3]).not.toBe("none"); expect(x[1]).toBeGreaterThanOrEqual(0); expect(x[2]).toBeLessThanOrEqual(await ev<number>(pg, `innerWidth`)); }
      } finally { await fecha(); }
    }
  });
});
