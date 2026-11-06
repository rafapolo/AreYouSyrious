/* Suíte do mapa de lugares (map.html) e da passagem do tour para ele. file://, navegadores embutidos do Playwright. */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { chromium, webkit, devices, abre, url, espera, ev, RAIZ, type Browser } from "./comum";

let cr: Browser, wk: Browser;
beforeAll(async () => { cr = await chromium.launch(); wk = await webkit.launch(); });
afterAll(async () => { await cr.close(); await wk.close(); });

/* pontos vizinhos se sobrepõem (Idomeni, Gevgelija, Cherso): acha um ponto à vista cujo centro nenhum outro cobre e clica nele */
async function pontoLivre(pg: any, minimo = 30): Promise<{ id: string; nome: string; x: number; y: number }> {
  return pg.evaluate(`(() => { const L = Object.fromEntries(window.aysMapa.lugares().map(l => [l.id, l]));
    for (const el of document.querySelectorAll('circle.pt')) { const l = L[el.dataset.id]; if (l.c < ${minimo}) continue;
      const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2, c = document.getElementById('campo').getBoundingClientRect();
      if (x < c.left + 80 || x > c.right - 80 || y < c.top + 40 || y > c.bottom - 40) continue;
      if (document.elementFromPoint(x, y) === el) return { id: l.id, nome: l.n, x, y }; } return null; })()`);
}

const gaz = JSON.parse(readFileSync(`${RAIZ}/design/lugares.json`, "utf8"));

describe("dados e gazetteer", () => {
  test("todo lugar do gazetteer tem coordenada dentro do quadro e fonte; map-data.js só leva lugares com posts", () => {
    const [x0, y0, x1, y1] = gaz.quadro;
    for (const l of gaz.lugares) {
      expect(l.lon, l.id).toBeGreaterThanOrEqual(x0); expect(l.lon, l.id).toBeLessThanOrEqual(x1);
      expect(l.lat, l.id).toBeGreaterThanOrEqual(y0); expect(l.lat, l.id).toBeLessThanOrEqual(y1);
      expect(l.fonte, l.id).toBeTruthy();
    }
    const js = readFileSync(`${RAIZ}/map-data.js`, "utf8");
    const d = JSON.parse(js.slice(js.indexOf("window.AYS_LUGARES = ") + 21).trim().replace(/;$/, ""));
    expect(d.lugares.length).toBeGreaterThan(300);
    expect(d.posts.length).toBeGreaterThan(3000);
    for (const l of d.lugares) {
      expect(l.c).toBe(l.pp.length);
      const datas = l.pp.map((e: number[]) => d.posts[e[0]][1]);
      expect(datas, l.id).toEqual([...datas].sort());
      for (const e of l.pp) expect(e.length - 1).toBeLessThanOrEqual(3);
    }
  });
});

describe("a página do mapa", () => {
  test("abre sem erro; todo ponto está dentro do quadro do mapa; os controles existem", async () => {
    const { pg, erros, fecha } = await abre(cr, url("map.html"));
    try {
      await pg.waitForSelector("circle.pt");
      const r = await ev<any>(pg, `(() => { const q = window.aysMapa.quadro(); const c = [...document.querySelectorAll('circle.pt')];
        return { n: c.length, fora: c.filter(e => { const x = +e.getAttribute('cx'), y = +e.getAttribute('cy'); return !(x >= 0 && x <= q.w && y >= 0 && y <= q.h); }).length,
          anos: [...document.querySelectorAll('#anos button')].map(b => b.dataset.ano || b.textContent), links: [...document.querySelectorAll('.topo a')].map(a => a.textContent) } })()`);
      expect(r.n).toBeGreaterThan(300);
      expect(r.fora).toBe(0);
      expect(r.anos).toContain("2016"); expect(r.anos).toContain("2025");
      expect(await pg.locator("#indice-corpo li").count()).toBeGreaterThan(300);
      expect(erros).toEqual([]);
    } finally { await fecha(); }
  });

  test("clicar num ponto abre o painel com o nome e os posts em ordem de data, e cada post leva ao post completo", async () => {
    const { pg, erros, fecha } = await abre(cr, url("map.html"));
    try {
      await pg.waitForSelector("circle.pt");
      const p = await pontoLivre(pg);
      await pg.mouse.click(p.x, p.y);
      await espera(pg, `document.getElementById('painel').classList.contains('on')`, 5000);
      expect(await pg.locator("#p-nome").innerText()).toBe(p.nome);
      const datas = await pg.locator("#p-lista time").evaluateAll((ts) => ts.map((t) => (t as HTMLTimeElement).dateTime));
      expect(datas.length).toBeGreaterThanOrEqual(10);
      expect(datas).toEqual([...datas].sort());
      expect(await pg.locator("#p-lista .post a.t").first().getAttribute("href")).toMatch(/^post\.html\?p=20\d\d-.*\.md$/);
      expect(await pg.locator("#p-lista .fotos img").count()).toBeGreaterThan(5);
      expect(pg.url()).toContain("#lugar=" + p.id);
      await pg.keyboard.press("Escape");
      await espera(pg, `!document.getElementById('painel').classList.contains('on')`, 3000);
      expect(erros).toEqual([]);
    } finally { await fecha(); }
  });

  test("um lugar com centenas de posts pagina o painel (25 por vez) e o endereço #lugar= abre direto", async () => {
    const { pg, fecha } = await abre(cr, url("map.html", "#lugar=lesvos"));
    try {
      await espera(pg, `document.getElementById('painel').classList.contains('on')`, 5000);
      expect(await pg.locator("#p-nome").innerText()).toBe("Lesvos");
      expect(await pg.locator("#p-lista .post").count()).toBe(25);
      await pg.locator("#p-lista .mais").click();
      expect(await pg.locator("#p-lista .post").count()).toBe(50);
    } finally { await fecha(); }
  });

  test("o filtro por ano reduz os pontos, apaga as cercas ainda inexistentes e filtra o painel", async () => {
    const { pg, fecha } = await abre(cr, url("map.html"));
    try {
      await pg.waitForSelector("circle.pt");
      const medida = () => ev<any>(pg, `({ pts: [...document.querySelectorAll('circle.pt')].filter(c => c.style.display !== 'none').length,
        cercas: document.querySelectorAll('.m-cerca.on').length, tot: document.querySelector('#anos .tot').textContent })`);
      await pg.waitForTimeout(150);
      const todos = await medida();
      await pg.locator("#anos button", { hasText: "2016" }).click();
      await pg.waitForTimeout(150);
      const a16 = await medida();
      expect(a16.pts).toBeLessThan(todos.pts);
      expect(a16.cercas).toBeLessThan(todos.cercas);
      expect(a16.cercas).toBeGreaterThan(0);
      await pg.locator("#anos button", { hasText: "2022" }).click();
      await pg.waitForTimeout(150);
      const a22 = await medida();
      expect(a22.cercas).toBeGreaterThan(a16.cercas);
      expect(a22.tot).not.toBe(todos.tot);
      await pg.locator("#anos button", { hasText: "2016" }).click();
      await ev(pg, `window.aysMapa.abre('athens')`);
      const anos = await pg.locator("#p-lista time").evaluateAll((ts) => ts.map((t) => (t as HTMLTimeElement).dateTime.slice(0, 4)));
      expect(new Set(anos)).toEqual(new Set(["2016"]));
      await pg.locator("#anos button", { hasText: "All" }).click();
      await pg.waitForTimeout(150);
      expect((await medida()).pts).toBe(todos.pts);
    } finally { await fecha(); }
  });

  test("o índice em lista busca por nome sem acento, e clicar abre o painel", async () => {
    const { pg, fecha } = await abre(cr, url("map.html"));
    try {
      await pg.waitForSelector("circle.pt");
      await pg.click("#abre-indice");
      await pg.fill("#busca", "bihac");
      const vis = await pg.locator("#indice-corpo li:not(.so)").allInnerTexts();
      expect(vis.length).toBeGreaterThan(0);
      expect(vis.length).toBeLessThan(10);
      await pg.locator("#indice-corpo li:not(.so) button", { hasText: /^Biha/ }).first().click();
      await espera(pg, `document.getElementById('painel').classList.contains('on')`, 5000);
      expect(await pg.locator("#p-nome").innerText()).toMatch(/^Biha/);
    } finally { await fecha(); }
  });

  test("as fronteiras são clicáveis: cada ponto de travessia cai na fronteira certa e o painel mostra cerca, pontos e posts", async () => {
    const { pg, erros, fecha } = await abre(cr, url("map.html"));
    try {
      await pg.waitForSelector("circle.pt");
      const fr = Object.fromEntries((await ev<any[]>(pg, `aysMapa.fronteiras()`)).map((b) => [b.id, b]));
      const esperado: Record<string, string[]> = { "HUN-SRB": ["horgos", "roszke", "kelebija", "tompa"], "GRC-MKD": ["idomeni", "gevgelija"],
        "HRV-SRB": ["sid", "tovarnik"], "GRC-TUR": ["pazarkule", "kastanies"], "FRA-ITA": ["ventimiglia"], "BLR-POL": ["bruzgi", "kuznica", "usnarz-gorny"],
        "AUT-SVN": ["spielfeld"], "CHE-ITA": ["chiasso"], "POL-UKR": ["medyka"], "BLR-LTU": ["medininkai"] };
      for (const [id, cruz] of Object.entries(esperado)) expect(new Set(fr[id].cruz), id).toEqual(new Set(cruz));
      expect(Object.values(fr).reduce((n: number, b: any) => n + (b.encl ? 0 : b.cruz.length), 0)).toBe(20);   // todo ponto de travessia tem fronteira
      // clicar no meio da linha Hungria–Sérvia abre o painel da fronteira
      await ev(pg, `location.hash = '#fronteira=HUN-SRB'`); await pg.waitForTimeout(900);   // pelo endereço: com zoom na fronteira
      await ev(pg, `document.querySelector('#painel .fecha').click()`); await pg.waitForTimeout(300);
      // um trecho da linha que não esteja sob um ponto ou um nome
      const p = await ev<any>(pg, `(() => { const g = document.querySelector('.m-b[data-b="HUN-SRB"] .m-bh'), L = g.getTotalLength(), m = g.getScreenCTM();
        for (let f = .05; f < 1; f += .05) { const q = g.getPointAtLength(L * f), x = q.x * m.a + m.e, y = q.y * m.d + m.f, e = document.elementFromPoint(x, y);
          if (e && e.closest('.m-b[data-b="HUN-SRB"]')) return { x, y }; } return null; })()`);
      expect(p).not.toBeNull();
      await pg.mouse.click(p.x, p.y); await pg.waitForTimeout(500);
      expect(await ev(pg, `aysMapa.fronteira()`)).toBe("HUN-SRB");
      expect(await pg.locator("#p-nome").innerText()).toBe("Hungary – Serbia");
      expect(await pg.locator("#p-sub").innerText()).toContain("fenced since 2016");
      expect(await pg.locator("#p-cruz button").count()).toBe(4);
      expect(await ev(pg, `location.hash`)).toBe("#fronteira=HUN-SRB");
      const datas = await pg.locator("#p-lista time").evaluateAll((ts) => ts.map((t) => (t as HTMLTimeElement).dateTime));
      expect(datas.length).toBe(25); expect([...datas].sort()).toEqual(datas);
      // filtro por ano vale para a fronteira; um ponto de travessia abre o lugar
      await pg.locator('#anos .marcas button[data-ano="2016"]').click(); await pg.waitForTimeout(300);
      const anos = await pg.locator("#p-lista time").evaluateAll((ts) => ts.map((t) => (t as HTMLTimeElement).dateTime.slice(0, 4)));
      expect(new Set(anos)).toEqual(new Set(["2016"]));
      await pg.locator("#p-cruz button", { hasText: "Röszke" }).click(); await pg.waitForTimeout(300);
      expect(await ev(pg, `aysMapa.selecionado()`)).toBe("roszke");
      expect(await ev(pg, `aysMapa.fronteira()`)).toBe(null);
      expect(await pg.locator("#p-cruz button").count()).toBe(0);
      // fronteira sem travessia nomeada: só o nome; Esc fecha
      await ev(pg, `aysMapa.abreFronteira('DEU-POL')`); await pg.waitForTimeout(300);
      expect(await pg.locator("#p-lista").innerText()).toContain("no crossing point");
      await pg.keyboard.press("Escape");
      expect(await ev(pg, `aysMapa.fronteira()`)).toBe(null);
      expect(erros).toEqual([]);
    } finally { await fecha(); }
  });

  test("#fronteira=ESP-MAR-ceuta abre o enclave, e o índice lista as fronteiras", async () => {
    const { pg, fecha } = await abre(cr, url("map.html", "#fronteira=ESP-MAR-ceuta"));
    try {
      await espera(pg, `document.getElementById('painel').classList.contains('on')`, 5000);
      expect(await pg.locator("#p-nome").innerText()).toBe("Ceuta · Spain – Morocco");
      await pg.click("#abre-indice"); await pg.fill("#busca", "horgos");
      expect(await pg.locator("#indice-corpo li:not(.so) button", { hasText: "Hungary – Serbia" }).count()).toBe(1);
    } finally { await fecha(); }
  });

  test("?de=tour mostra a linha de boas-vindas, e o menu do arquivo e da linha do tempo leva ao mapa", async () => {
    const { pg, fecha } = await abre(cr, url("map.html", "?de=tour"));
    try {
      await pg.locator("#bv").waitFor({ state: "visible" });
      expect(await pg.locator("#bv-txt").innerText()).toContain("Every place the archive names");
    } finally { await fecha(); }
    for (const pagina of ["index.html", "timeline.html"]) {
      const a = await abre(cr, url(pagina));
      try {
        const href = await a.pg.locator(".top-links a", { hasText: "Map" }).getAttribute("href");
        expect(href).toBe("map.html");
      } finally { await a.fecha(); }
    }
  });
});

describe("do tour para o mapa", () => {
  test("o fim natural do tour (?tour=1&rapido=20) navega para map.html?de=tour", async () => {
    const { pg, fecha } = await abre(cr, url("tour/index.html", "?rapido=20"));
    try {
      await pg.locator("#ays-tour-convite").waitFor();
      await pg.click("#ays-tour-convite button");
      await pg.waitForURL(/map\.html\?de=tour/, { timeout: 60_000 });
      await pg.waitForSelector("circle.pt");
      await pg.locator("#bv").waitFor({ state: "visible" });
    } finally { await fecha(); }
  });

  test("Esc no meio do tour leva ao arquivo (index.html), não ao mapa", async () => {
    const { pg, fecha } = await abre(cr, url("tour/index.html", "?rapido=20"));
    try {
      await pg.locator("#ays-tour-convite").waitFor();
      await pg.click("#ays-tour-convite button");
      await espera(pg, `window.aysTour.cena() >= 2`, 15000);
      await pg.keyboard.press("Escape");
      await pg.waitForURL(/\/index\.html/, { timeout: 5000 });
      await pg.waitForTimeout(4000);       // mais que a fusão e o silêncio finais, que não podem acontecer
      expect(pg.url()).toMatch(/\/index\.html$/);
      expect(pg.url()).not.toContain("tour/");
    } finally { await fecha(); }
  });
});

describe("celular (iPhone 13, webkit)", () => {
  test("a folha de baixo cabe na tela, não gera rolagem lateral e o mapa abre sem erro", async () => {
    const { pg, erros, fecha } = await abre(wk, url("map.html"), { ctx: { ...devices["iPhone 13"] } });
    try {
      await pg.waitForSelector("circle.pt");
      const p = await pontoLivre(pg);
      await pg.touchscreen.tap(p.x, p.y);
      await espera(pg, `document.getElementById('painel').classList.contains('on')`, 5000);
      await pg.waitForTimeout(500);
      const m = await ev<any>(pg, `(() => { const r = document.getElementById('painel').getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, W: innerWidth, H: innerHeight, lateral: document.documentElement.scrollWidth > innerWidth } })()`);
      expect(m.top).toBeGreaterThanOrEqual(0); expect(m.bottom).toBeLessThanOrEqual(m.H + 1);
      expect(m.left).toBeGreaterThanOrEqual(0); expect(m.right).toBeLessThanOrEqual(m.W + 1);
      expect(m.top).toBeGreaterThan(m.H * 0.3);          // é uma folha, não a tela inteira
      expect(m.lateral).toBe(false);
      const ponto = await ev<any>(pg, `(() => { const e = document.querySelector('circle.pt.sel').getBoundingClientRect(); return { y: e.top + e.height / 2, topoFolha: document.getElementById('painel').getBoundingClientRect().top } })()`);
      expect(ponto.y, "o ponto escolhido fica acima da folha").toBeLessThan(ponto.topoFolha);
      expect(erros).toEqual([]);
    } finally { await fecha(); }
  });
});
