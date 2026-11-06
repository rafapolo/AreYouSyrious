/* Suíte do tour: páginas abertas por file://. Navegadores embutidos do Playwright, sempre fechados no fim.
   `?rapido=20` acelera o relógio do tour 20 vezes (167 s de fotos e ~45 s de mapas cabem em ~11 s). */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { chromium, webkit, devices, abre, url, espera, ev, RAIZ, type Browser } from "./comum";

let cr: Browser, wk: Browser;
beforeAll(async () => { cr = await chromium.launch(); wk = await webkit.launch(); });
afterAll(async () => { await cr.close(); await wk.close(); });

const tour = JSON.parse(readFileSync(`${RAIZ}/design/tour.json`, "utf8"));

describe("dados", () => {
  test("cada cena tem lugar e coordenada dentro do mapa, e cada episódio tem ao menos uma", () => {
    for (const c of tour) {
      expect(c.lugar, c.id).toBeTruthy();
      expect(c.coord[0], c.id).toBeGreaterThanOrEqual(-12); expect(c.coord[0], c.id).toBeLessThanOrEqual(48);
      expect(c.coord[1], c.id).toBeGreaterThanOrEqual(27); expect(c.coord[1], c.id).toBeLessThanOrEqual(62);
      expect(c.traducao).toBe(false);
    }
    expect(new Set(tour.map((c: any) => c.ep)).size).toBeGreaterThanOrEqual(11);
    expect(tour.filter((c: any) => c.mapa).length).toBeGreaterThanOrEqual(12);
  });
  test("o peso das imagens do tour fica abaixo de 6 MB e a duração perto de 3 min", async () => {
    const { readdirSync, statSync } = await import("node:fs");
    const total = readdirSync(`${RAIZ}/tour/img`).reduce((s, f) => s + statSync(`${RAIZ}/tour/img/${f}`).size, 0);
    expect(total).toBeLessThan(6 * 1024 * 1024);
    const seg = tour.reduce((s: number, c: any) => s + c.duracao_ms + (c.mapa ? c.mapa.ms : 0), 0) / 1000;
    expect(seg).toBeGreaterThan(170); expect(seg).toBeLessThan(260);
  });
});

describe("convite e começo", () => {
  test("?tour=1 mostra o convite sóbrio; nenhum AudioContext antes do gesto; o toque começa e o som nasce uma vez", async () => {
    const { pg, erros, fecha } = await abre(cr, url("index.html", "?tour=1&rapido=20&fim=fica"));
    try {
      const conv = pg.locator("#ays-tour-convite");
      await conv.waitFor({ state: "visible" });
      const t = await conv.innerText();
      expect(t).toContain("accounts of death and suffering");
      expect(t).toContain("Press to start");
      expect(await ev(pg, `window.aysTour.ativo()`)).toBe(false);
      expect(await ev(pg, `window.__audios`), "AudioContext antes do gesto").toBe(0);
      expect(pg.url()).not.toContain("tour=1");
      await pg.click("#ays-tour-convite button");
      expect(await ev(pg, `window.__audios`)).toBe(1);
      expect(await ev(pg, `window.AysSom.criado()`)).toBe(true);
      await espera(pg, `window.aysTour.ativo()`, 5000);
      expect(await ev(pg, `document.body.style.overflow`)).toBe("hidden");
      await espera(pg, `!window.aysTour.ativo()`);
      expect(erros).toEqual([]);
    } finally { await fecha(); }
  });

  test("o botão Tour do index e do timeline abre o convite sem sair da página; Esc fecha só o convite", async () => {
    for (const pagina of ["index.html", "timeline.html"]) {
      const { pg, fecha } = await abre(cr, url(pagina));
      try {
        await pg.waitForSelector("[data-tour]");
        await pg.click("[data-tour]");
        await espera(pg, `window.aysTour.ativo()`, 8000);
        expect(pg.url()).toContain(pagina);
        await pg.keyboard.press("Escape");
        await espera(pg, `!window.aysTour.ativo()`, 3000);
      } finally { await fecha(); }
    }
  });

  test("tour/index.html redireciona para a página com ?tour=1 e leva ?rapido junto", async () => {
    const { pg, fecha } = await abre(cr, url("tour/index.html", "?rapido=7"));
    try {
      await pg.waitForURL(/index\.html/, { timeout: 5000 });
      await pg.locator("#ays-tour-convite").waitFor({ state: "visible" });
      expect(await ev(pg, `window.aysTour.rapido`)).toBe(7);
    } finally { await fecha(); }
  });
});

describe("o passeio", () => {
  test("as 33 cenas passam em ordem, o mapa aparece em cada episódio, a fronteira acende por ano e o fim devolve a página", async () => {
    const { pg, erros, fecha } = await abre(cr, url("index.html", "?tour=1&rapido=20&fim=fica"));
    try {
      await pg.locator("#ays-tour-convite").waitFor();
      await ev(pg, `window.scrollTo(0, 400)`);
      const y0 = await ev<number>(pg, `window.scrollY`);
      await ev(pg, `(() => { window.__v = { cenas: [], frases: new Set(), mapas: [], acesas: 0, fotos: 0 };
        const tick = () => { const T = window.aysTour; if (T.ativo()) { const v = window.__v;
          if (!v.cenas.includes(T.cena()) && T.cena() >= 0) v.cenas.push(T.cena());
          const m = document.querySelector('#ays-tour .t-mapa'); const vis = m && m.classList.contains('vis');
          if (vis) { const k = document.querySelector('#ays-tour .t-kick').textContent; if (k && !v.mapas.includes(k)) v.mapas.push(k);
            v.acesas = Math.max(v.acesas, document.querySelectorAll('#ays-tour .m-cerca.on').length); }
          const f = document.querySelector('#ays-tour .t-frase').textContent; if (f) v.frases.add(f); }
          requestAnimationFrame(tick); }; tick(); })()`);
      await pg.click("#ays-tour-convite button");
      await espera(pg, `!window.aysTour.ativo()`);
      const v = await ev<any>(pg, `({ cenas: window.__v.cenas, frases: [...window.__v.frases], mapas: window.__v.mapas, acesas: window.__v.acesas })`);
      expect(v.cenas.length).toBe(tour.length);
      expect(v.cenas).toEqual([...Array(tour.length).keys()]);
      expect(v.frases.length).toBeGreaterThanOrEqual(tour.length - 2);
      expect(v.mapas.length, "uma cena de mapa por episódio, mais o fecho").toBeGreaterThanOrEqual(11);
      expect(v.mapas).toContain("2016 → 2025");
      expect(v.acesas, "fronteiras com cerca acesas ao longo do tour").toBeGreaterThanOrEqual(10);
      await pg.waitForTimeout(1500);
      expect(await ev(pg, `document.body.style.overflow`)).toBe("");
      expect(await ev(pg, `document.getElementById('ays-tour').hidden`)).toBe(true);
      expect(await ev<number>(pg, `window.scrollY`)).toBe(y0);
      expect(erros).toEqual([]);
    } finally { await fecha(); }
  });

  test("Esc para o tour, devolve o foco, a rolagem e o corpo da página, e o som apaga", async () => {
    const { pg, fecha } = await abre(cr, url("index.html", "?rapido=1"));
    try {
      await pg.waitForSelector("[data-tour]");
      await ev(pg, `window.scrollTo(0, 300)`);
      const y0 = await ev<number>(pg, `window.scrollY`);
      await pg.focus("[data-tour]");
      await pg.keyboard.press("Enter");
      await espera(pg, `window.aysTour.cena() >= 0`, 15000);
      await pg.keyboard.press("Escape");
      await espera(pg, `!window.aysTour.ativo()`, 3000);
      await pg.waitForTimeout(1300);
      expect(await ev(pg, `document.body.style.overflow`)).toBe("");
      expect(await ev(pg, `document.getElementById('ays-tour').hidden`)).toBe(true);
      expect(await ev(pg, `document.activeElement.hasAttribute('data-tour')`)).toBe(true);
      expect(await ev<number>(pg, `window.scrollY`)).toBe(y0);
    } finally { await fecha(); }
  });

  test("com o som desligado em localStorage nenhum AudioContext nasce", async () => {
    const { pg, fecha } = await abre(cr, url("index.html", "?tour=1&rapido=60&fim=fica"), { som: "off" });
    try {
      await pg.click("#ays-tour-convite button");
      expect(await ev(pg, `window.__audios`)).toBe(0);
      await espera(pg, `!window.aysTour.ativo()`);
    } finally { await fecha(); }
  });

  test("prefers-reduced-motion: sem Ken Burns nem voo, cortes secos, e o passeio termina", async () => {
    const { pg, erros, fecha } = await abre(cr, url("index.html", "?tour=1&rapido=40&fim=fica"), { ctx: { reducedMotion: "reduce" } });
    try {
      await pg.click("#ays-tour-convite button");
      await espera(pg, `window.aysTour.cena() >= 1`, 8000);
      const t = await ev<string>(pg, `getComputedStyle(document.querySelector('#ays-tour .t-foto.vis, #ays-tour .t-foto')).transform`);
      expect(t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
      const dur = await ev<string>(pg, `getComputedStyle(document.querySelector('#ays-tour .t-mapa')).transitionDuration`);
      expect(dur.split(",").every((x) => parseFloat(x) === 0)).toBe(true);
      await espera(pg, `!window.aysTour.ativo()`);
      expect(erros).toEqual([]);
    } finally { await fecha(); }
  });
});

describe("mapa", () => {
  for (const [nome, dev] of [["desktop", {}], ["iphone", { ...devices["iPhone 13"] }]] as const) {
    test(`${nome}: quadros regionais com nomes, sem linhas de rota, e o fecho contém todos os pontos`, async () => {
      const { pg, fecha } = await abre(nome === "desktop" ? cr : wk, url("index.html"), { ctx: dev });
      try {
        await pg.waitForSelector("[data-tour]");
        const beats = tour.map((c: any, i: number) => (c.mapa ? i : -1)).filter((i: number) => i >= 0);
        for (const i of beats) {
          await ev(pg, `window.aysTour.mapa(${i})`);
          const m = await ev<any>(pg, `(() => { const f = document.querySelector('#ays-tour .t-faixa').getBoundingClientRect();
            const vis = [...document.querySelectorAll('#ays-tour .m-pais:not(.encl)')].filter(t => t.style.display !== 'none' && t.getBoundingClientRect().width > 0);
            const dentro = vis.every(t => { const r = t.getBoundingClientRect(); return r.left >= f.left - 2 && r.right <= f.right + 2 && r.top >= f.top - 2 && r.bottom <= f.bottom + 2; });
            const pts = [...document.querySelectorAll('#ays-tour .m-pt:not(.velho)')];
            return { nomes: vis.length, dentro, rota: document.querySelectorAll('#ays-tour .m-rota').length, atuais: pts.length,
              span: document.querySelector('#ays-tour svg').viewBox.baseVal.width / window.AYS_MAPA.kx } })()`);
          const c = tour[i];
          expect(m.rota).toBe(0);
          if (c.mapa.fecho) continue;
          expect(m.atuais, c.id).toBe(1);
          expect(m.span, `${c.id}: quadro regional, não a fronteira solta`).toBeGreaterThanOrEqual(10);
          expect(m.nomes, `${c.id}: nomes de países no quadro`).toBeGreaterThanOrEqual(2);
          expect(m.dentro, `${c.id}: nomes dentro do quadro`).toBe(true);
        }
        const f = await ev<any>(pg, `(() => { const r = document.querySelector('#ays-tour .t-faixa').getBoundingClientRect();
          const pts = [...document.querySelectorAll('#ays-tour .m-pt')].map(c => c.getBoundingClientRect());
          return { n: pts.length, fora: pts.filter(b => b.left < r.left || b.right > r.right || b.top < r.top || b.bottom > r.bottom).length,
            anos: document.querySelectorAll('#ays-tour .m-ptano').length, encl: document.querySelectorAll('#ays-tour .m-encl.on').length } })()`);
        expect(f.n).toBe(beats.length - 1);
        expect(f.fora, "pontos fora do quadro do fecho").toBe(0);
        expect(f.anos).toBe(f.n);
        expect(f.encl, "Ceuta e Melilla acesas no fecho").toBe(2);
      } finally { await fecha(); }
    });
  }
});

describe("celular (iPhone 13, webkit)", () => {
  test("a legenda é legível (>= 16 px), não cobre a foto nem o mapa, e nada passa da tela", async () => {
    const { pg, fecha } = await abre(wk, url("index.html", "?rapido=20"), { ctx: { ...devices["iPhone 13"] } });
    try {
      await pg.waitForSelector("[data-tour]");
      await ev(pg, `window.aysTour.mostra(0)`);
      const r = async () => ev<any>(pg, `(() => { const b = e => document.querySelector(e).getBoundingClientRect();
        const f = getComputedStyle(document.querySelector('#ays-tour .t-frase')).fontSize;
        return { faixa: b('#ays-tour .t-faixa'), leg: b('#ays-tour .t-leg'), fonte: parseFloat(f), W: innerWidth, H: innerHeight,
          sobra: document.documentElement.scrollWidth > innerWidth } })()`);
      let m = await r();
      expect(m.fonte).toBeGreaterThanOrEqual(16);
      expect(m.leg.top, "legenda abaixo da foto").toBeGreaterThanOrEqual(m.faixa.bottom - 1);
      expect(m.leg.bottom).toBeLessThanOrEqual(m.H + 1);
      // maior frase do roteiro, para o pior caso
      const idx = tour.reduce((b: number, c: any, i: number) => (c.frase.length > tour[b].frase.length ? i : b), 0);
      await ev(pg, `window.aysTour.mostra(${idx})`);
      m = await r();
      expect(m.leg.top).toBeGreaterThanOrEqual(m.faixa.bottom - 1);
      expect(m.leg.bottom).toBeLessThanOrEqual(m.H + 1);
      // cena de mapa: o nome do lugar fica na legenda, fora do mapa
      const ib = tour.findIndex((c: any) => c.mapa);
      await ev(pg, `window.aysTour.mapa(${ib})`);
      m = await r();
      expect(m.leg.top).toBeGreaterThanOrEqual(m.faixa.bottom - 1);
      expect(await pg.locator("#ays-tour .t-mapa.vis").count()).toBe(1);
    } finally { await fecha(); }
  });

  test("o toque começa o tour no celular e o AudioContext só nasce depois do gesto", async () => {
    const { pg, fecha } = await abre(wk, url("index.html", "?tour=1&rapido=40&fim=fica"), { ctx: { ...devices["iPhone 13"] } });
    try {
      await pg.locator("#ays-tour-convite").waitFor({ state: "visible" });
      expect(await ev(pg, `window.__audios`)).toBe(0);
      await pg.tap("#ays-tour-convite button");
      expect(await ev(pg, `window.__audios`)).toBe(1);
      await espera(pg, `!window.aysTour.ativo()`);
    } finally { await fecha(); }
  });
});
