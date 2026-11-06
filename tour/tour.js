/* Tour pelo arquivo: 33 cenas, uma frase literal de um post e a foto que a acompanha (tour/dados.js, gerado por
   script/monta_tour.py a partir de design/tour.json). Roda como camada sobre a página que o chamou: Esc ou "✕ esc"
   param e devolvem tudo como estava. ?tour=1 abre o convite (o navegador só libera o som depois de um gesto);
   ?rapido=N acelera o relógio N vezes (para a suíte). Som: tour/som.js (Web Audio, sem arquivo). */
(() => {
  'use strict';
  const AQUI = (document.currentScript && document.currentScript.src) || '';
  const BASE = AQUI.replace(/[^/]*$/, '');             // .../tour/
  const q0 = new URLSearchParams(location.search);
  const SOZINHA = document.body && document.body.hasAttribute('data-tour-pagina');   // tour/ é a página do tour, sem arquivo por trás
  const RAPIDO = Math.min(60, Math.max(1, parseFloat(q0.get('rapido')) || 1));
  const SILENCIO_FINAL = 5000;                          // ms de preto e quase silêncio antes de devolver a página
  const FUSAO = 1400;                                   // ms da fusão entre fotos
  const semMov = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TL = {"2016": ["Apr: the Balkan route closed; people stranded at Idomeni.", "Oct–Dec: Calais camp demolished; Aleppo fell; 5,011 died in the Mediterranean."], "2017": ["Jan: people froze in Belgrade and on Greek islands.", "Jul–Nov: Moria hunger strike; slave markets documented in Libya."], "2018": ["Jun: Aquarius refused port; 220 drowned off Libya in 48 hours.", "Year’s end: 2,200 dead at sea; people froze in the Balkans."], "2019": ["Jul: Moria overcrowded beyond capacity on Lesvos.", "Nov: Vučjak camp in Bosnia exposed as unfit for winter."], "2020": ["Mar: Greece suspended asylum at Evros; fires destroyed Moria.", "Year: pushbacks and the pandemic hardened borders."], "2021": ["Aug: Afghanistan fell to the Taliban; evacuations and fear.", "Nov: crisis at the Poland–Belarus border."], "2022": ["Feb: Russia invaded Ukraine; millions displaced across Europe.", "Year: Pylos shipwreck trial questions remained."], "2023": ["Jun: hundreds died when a boat sank off Pylos, Greece.", "Year: border walls and deals expanded."], "2024": ["Year: deaths and pushbacks continued across sea and land routes.", "The archive fell mostly silent."], "2025": ["Feb: the archive’s last post, from Samos.", "Fences and checkpoints still held people at Europe’s edge."]};
  const TL_INICIO = 75000; // ms do tour (1:15)

  const som = window.AysSom || null;

  let DADOS = null, ativo = false, cena = -1, inicio = 0, TOTAL = 0, raf = 0, quemChamou = null, salvo = null;
  const pend = new Set();
  class Parado extends Error {}
  const espera = ms => new Promise((ok, falha) => {
    const p = { falha }; p.id = setTimeout(() => { pend.delete(p); ok(); }, Math.max(0, ms)); pend.add(p);
  });

  const CSS = `
  #ays-tour,#ays-tour *{box-sizing:border-box}
  #ays-tour{position:fixed;inset:0;z-index:100000;background:#000;color:#e9e6e0;display:grid;opacity:0;
    transition:opacity calc(1s / var(--r,1)) ease;font-family:Georgia,"Times New Roman",serif;overflow:hidden;
    grid-template-rows:var(--t-topo,60px) var(--t-faixa,60vh) 1fr}
  #ays-tour.on{opacity:1}
  #ays-tour[hidden]{display:none}
  #ays-tour .t-topo{display:flex;align-items:flex-start;justify-content:flex-end;gap:.6rem;padding:max(.7rem,env(safe-area-inset-top)) max(.9rem,env(safe-area-inset-right)) .7rem max(.9rem,env(safe-area-inset-left))}
  #ays-tour .t-faixa{position:relative;overflow:hidden;background:#050505}
  #ays-tour .t-foto{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity ${FUSAO}ms ease;
    will-change:opacity,transform;background:#050505}
  #ays-tour .t-foto.vis{opacity:1}
  #ays-tour .t-foto img{width:100%;height:100%;display:block}
  #ays-tour .t-mapa{position:absolute;inset:0;background:#06070a;opacity:0;transition:opacity calc(1.2s / var(--r,1)) ease}
  #ays-tour .t-mapa.vis{opacity:1}
  #ays-tour .t-mapa svg{width:100%;height:100%;display:block}
  #ays-tour .m-terra{fill:#15181c;stroke:#2c3138;stroke-width:.8px;vector-effect:non-scaling-stroke}
  #ays-tour .m-lin{fill:none;stroke:#3b3f46;stroke-width:.7px;vector-effect:non-scaling-stroke}
  #ays-tour .m-ext{fill:none;stroke:#7a3a36;stroke-width:1.2px;vector-effect:non-scaling-stroke}
  #ays-tour .m-viz{stroke:#9aa1a9;stroke-width:1.8px}
  #ays-tour .m-cerca{fill:none;stroke:#c8372d;stroke-width:2px;vector-effect:non-scaling-stroke;opacity:0;transition:opacity calc(1.4s / var(--r,1)) ease}
  #ays-tour .m-cerca.on{opacity:.95}
  #ays-tour .m-foco{stroke:#ff4a3d;stroke-width:3px}
  #ays-tour .m-pais{fill:#5d636b;font:600 11px ui-sans-serif,system-ui,sans-serif;font-variant:small-caps;letter-spacing:.14em;pointer-events:none}
  #ays-tour .m-pais.mar{fill:#454b55;font-style:italic}
  #ays-tour .m-pais.encl{fill:#a9cddd;opacity:0;transition:opacity calc(1.4s / var(--r,1)) ease}
  #ays-tour .m-encl .m-anel{stroke:#c8372d;stroke-width:1.6px;vector-effect:non-scaling-stroke;opacity:0;transition:opacity calc(1.4s / var(--r,1)) ease}
  #ays-tour .m-encl.on .m-anel{opacity:.95}
  #ays-tour .m-encl.on .m-pais.encl{opacity:1}
  #ays-tour .m-ptano{fill:#aaa496;font:600 10.5px ui-sans-serif,system-ui,sans-serif}
  #ays-tour .m-pt{fill:#d9d4c8}
  #ays-tour .m-pt.velho{fill:#8d887e}
  #ays-tour .m-nome{fill:#cfcac0;font:600 12px ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em}
  #ays-tour .m-cred{position:absolute;left:.8rem;top:.5rem;font:11px ui-sans-serif,system-ui,sans-serif;color:#6d6a63}
  #ays-tour .m-ano{position:absolute;right:1rem;bottom:.6rem;font:600 22px Georgia,serif;color:#8d887e;letter-spacing:.08em}
  #ays-tour .t-baixo{padding:1.1rem max(clamp(1rem,6vw,9rem),env(safe-area-inset-right)) max(1rem,env(safe-area-inset-bottom)) max(clamp(1rem,6vw,9rem),env(safe-area-inset-left));display:flex;flex-direction:column;gap:.5rem;min-height:0}
  #ays-tour .t-leg{opacity:0;transition:opacity calc(1.1s / var(--r,1)) ease}
  #ays-tour .t-leg.on{opacity:1}
  #ays-tour .t-kick{font:600 12px/1.3 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9d978c}
  #ays-tour .t-frase{margin:.35rem 0 .1rem;font-size:clamp(18px,2.15vw,28px);line-height:1.35;color:#f2efe8;font-weight:400}
  #ays-tour .t-fonte{font:12px/1.4 ui-sans-serif,system-ui,sans-serif;color:#8d887e}
  #ays-tour .t-fonte a{color:#b9b3a7;text-decoration:underline;text-underline-offset:2px}
  #ays-tour .t-prog{position:absolute;left:0;right:0;top:0;height:2px;background:#1b1a18}
  #ays-tour .t-prog i{display:block;height:100%;background:#7d776c;transform:scaleX(0);transform-origin:0 50%}
  #ays-tour button{font:600 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;color:#bdb7ab;background:rgba(20,19,17,.7);
    border:1px solid #3a3733;border-radius:3px;padding:.55rem .7rem;min-height:36px;cursor:pointer}
  #ays-tour button:hover,#ays-tour button:focus-visible{color:#fff;border-color:#8a847a;outline:none}
  #ays-tour .t-som.mudo{opacity:.55;text-decoration:line-through}
  #ays-tour.fim .t-baixo,#ays-tour.fim .t-topo{opacity:0;transition:opacity calc(1.6s / var(--r,1)) ease}
  #ays-tour.fim .t-foto{opacity:0;transition:opacity calc(2.2s / var(--r,1)) ease}
  #ays-tour-convite{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.94);display:grid;place-items:center;
    text-align:center;color:#e9e6e0;font-family:Georgia,"Times New Roman",serif;padding:1.5rem}
  #ays-tour-convite[hidden]{display:none}
  #ays-tour-convite p{max-width:34rem;margin:0 auto 1.6rem;font-size:clamp(18px,2.4vw,24px);line-height:1.45;color:#cfcac0}
  #ays-tour-convite button{font:600 16px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;color:#f2efe8;background:#171614;
    border:1px solid #6f6a60;border-radius:3px;padding:1rem 1.8rem;min-height:48px;cursor:pointer}
  #ays-tour-convite button:hover,#ays-tour-convite button:focus-visible{background:#26241f;border-color:#bdb7ab;outline:none}
  #ays-tour-convite small{display:block;margin-top:1.1rem;font:13px/1.4 ui-sans-serif,system-ui,sans-serif;color:#8d887e}
  @media (prefers-reduced-motion:reduce){#ays-tour,#ays-tour .t-foto,#ays-tour .t-leg,#ays-tour .t-mapa,#ays-tour .m-cerca{transition:none!important}}

  #ays-tour{--tlw:0px}
  #ays-tour.com-linha{--tlw:min(25vw,320px)}
  #ays-tour .t-linha{position:absolute;top:0;right:0;bottom:0;width:var(--tlw);z-index:5;display:flex;flex-direction:column;
    justify-content:center;gap:0;padding:.8rem .9rem .8rem .7rem;background:linear-gradient(90deg,rgba(6,7,10,0),rgba(6,7,10,.82) 18%,rgba(6,7,10,.92));
    opacity:0;transition:opacity 1.8s ease;pointer-events:none;overflow:hidden}
  #ays-tour.com-linha .t-linha{opacity:1}
  #ays-tour .tl-ano{display:flex;align-items:flex-start;gap:.45rem;padding:.18rem 0;color:#5f5b54;font:600 11px/1.2 ui-sans-serif,system-ui,sans-serif;transition:color .6s ease,opacity .6s ease}
  #ays-tour .tl-ano.passou{color:#6f6b63;opacity:.55}
  #ays-tour .tl-ano.agora{color:#f2efe8}
  #ays-tour .tl-y{min-width:2.4rem;font:600 12px/1.2 ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em}
  #ays-tour .tl-ev{font:11px/1.25 ui-sans-serif,system-ui,sans-serif;color:inherit}
  #ays-tour .tl-ev span{display:block}
  #ays-tour .tl-mark{position:absolute;left:.2rem;width:3px;height:14px;border-radius:2px;background:#c8372d;top:0;opacity:0;transition:top 1.2s linear,opacity .6s ease}
  #ays-tour.com-linha .tl-mark{opacity:1}
  #ays-tour.com-linha .t-foto,#ays-tour.com-linha .t-mapa{right:var(--tlw);width:auto}
  /* celular em pé: faixa fina de anos acima da legenda, sem cobrir a foto */
  @media (max-width:719px) and (orientation:portrait){
    #ays-tour.com-linha{--tlw:0px}
    #ays-tour.com-linha .t-linha{position:relative;right:auto;bottom:auto;width:auto;flex-direction:row;align-items:flex-end;justify-content:flex-start;
      justify-content:space-between;gap:0;padding:.5rem 0 0;margin-top:auto;background:transparent;overflow:hidden;min-height:28px;border-top:1px solid #1b1a18}
    #ays-tour .tl-ano{flex-direction:column;gap:0;padding:0;min-width:0}
    #ays-tour .tl-ev{display:none}
    #ays-tour .tl-y{min-width:0;font-size:11px}
    #ays-tour .tl-mark{display:none}
    #ays-tour.com-linha .t-foto,#ays-tour.com-linha .t-mapa{right:0}
  }
  /* deitado / paisagem estreita: painel lateral estreito */
  @media (max-height:520px) and (orientation:landscape){
    #ays-tour.com-linha{--tlw:min(22vw,180px)}
    #ays-tour .tl-ev span:nth-child(n+2){display:none}
    #ays-tour .tl-ano{padding:.08rem 0}
    #ays-tour .tl-y{font-size:11px;min-width:2.1rem}
    #ays-tour .tl-ev{font-size:10px;line-height:1.15}
  }
  /* celular deitado: tela cheia, botões e legenda por cima da foto */
  #ays-tour.cine{grid-template-rows:100%}
  #ays-tour.cine .t-topo{position:absolute;top:0;right:0;z-index:7;padding:max(.4rem,env(safe-area-inset-top)) max(.6rem,env(safe-area-inset-right)) 0 0}
  #ays-tour.cine .t-topo button{background:rgba(0,0,0,.45);border-color:rgba(255,255,255,.18);min-height:34px;padding:.4rem .55rem}
  #ays-tour.cine .t-baixo{position:absolute;left:0;right:var(--tlw);bottom:0;z-index:6;justify-content:flex-end;
    padding:2.6rem max(1.2rem,env(safe-area-inset-right)) max(.6rem,env(safe-area-inset-bottom)) max(1.2rem,env(safe-area-inset-left));
    background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.72) 45%,rgba(0,0,0,.86))}
  #ays-tour.cine .t-frase{font-size:17px;line-height:1.3;margin:.2rem 0 .05rem;text-shadow:0 1px 3px #000}
  #ays-tour.cine .t-kick{font-size:11px}
  #ays-tour.cine .t-fonte{font-size:11px}
  #ays-tour.cine .m-ano{bottom:auto;top:.5rem;right:auto;left:.8rem;font-size:18px}
  #ays-tour.cine .m-cred{top:auto;bottom:.4rem;left:auto;right:.6rem;z-index:8;font-size:10px}
  #ays-tour.cine.com-linha{--tlw:60px}
  #ays-tour.cine .t-linha{padding:3.2rem .4rem .6rem .6rem;justify-content:space-between}
  #ays-tour.cine .tl-ev{display:none}
  #ays-tour.cine .tl-y{min-width:0;font-size:11px}
  @media (prefers-reduced-motion:reduce){#ays-tour .t-linha,#ays-tour .tl-mark,#ays-tour .tl-ano{transition:none!important}}

  .tour-btn{cursor:pointer}`;

  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  let raiz, faixa, fotos, leg, kick, frase, fonte, prog, topo, baixo, botSom, convite, linha, tlMark, tlAnos, tlVis = false, tlAcum = 0;
  let mapaDiv, svg, MAPA = null, gTerra, gLin, gCerca, gNomes, gEncl, gPts, nomeEl, anoEl, vista = null, visitados = [], cercaEl = [], vooRaf = 0, fimTimer = 0;

  function monta() {
    if (raiz) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    raiz = el('div'); raiz.id = 'ays-tour'; raiz.hidden = true; raiz.setAttribute('role', 'dialog');
    raiz.setAttribute('aria-label', 'Tour through the archive'); raiz.style.setProperty('--r', RAPIDO);
    topo = el('div', 't-topo');
    botSom = el('button', 't-som', '♪ sound'); botSom.type = 'button';
    const bParar = el('button', 't-parar', '✕ esc'); bParar.type = 'button'; bParar.setAttribute('aria-label', 'Stop the tour');
    topo.append(botSom, bParar);
    faixa = el('div', 't-faixa');
    fotos = [el('div', 't-foto'), el('div', 't-foto')];
    faixa.append(fotos[0], fotos[1]);
    mapaDiv = el('div', 't-mapa'); mapaDiv.setAttribute('aria-hidden', 'true');
    anoEl = el('div', 'm-ano'); const cred = el('div', 'm-cred', 'Borders: Natural Earth (public domain)');
    mapaDiv.append(anoEl, cred); faixa.appendChild(mapaDiv);
    linha = el('div', 't-linha'); linha.setAttribute('aria-hidden', 'true');
    tlMark = el('div', 'tl-mark'); linha.appendChild(tlMark);
    tlAnos = {};
    for (let y = 2016; y <= 2025; y++) {
      const row = el('div', 'tl-ano'); row.dataset.y = y;
      const yy = el('div', 'tl-y', String(y));
      const ev = el('div', 'tl-ev');
      (TL[y] || []).forEach(t => { const sp = el('span', '', t); ev.appendChild(sp); });
      row.append(yy, ev); linha.appendChild(row); tlAnos[y] = row;
    }
    faixa.appendChild(linha);
    baixo = el('div', 't-baixo');
    leg = el('div', 't-leg'); leg.setAttribute('aria-live', 'polite');
    kick = el('div', 't-kick'); frase = el('p', 't-frase'); fonte = el('div', 't-fonte');
    leg.append(kick, frase, fonte); baixo.append(leg);
    prog = el('div', 't-prog'); prog.appendChild(document.createElement('i'));
    raiz.append(prog, topo, faixa, baixo);
    document.body.appendChild(raiz);
    bParar.addEventListener('click', () => parar(false));
    botSom.addEventListener('click', () => {
      if (!som) return;
      som.alternar();
      if (som.ligado() && ativo) { som.iniciar(); som.cena(cena, DADOS[cena]); }
      marcaSom();
    });
    if (!som) botSom.hidden = true;
    addEventListener('resize', medir);
  }

  /* a faixa de foto: 2,39:1 no desktop. Celular em pé: foto + legenda formam um bloco centralizado na vertical,
     com tarjas pretas iguais em cima e embaixo, como numa sala de cinema. Celular deitado: a foto ocupa a tela
     e a legenda fica por cima, na parte de baixo, como legenda de filme (classe .cine). */
  function medir() {
    if (!raiz) return;
    const W = innerWidth, H = innerHeight, cine = W > H && H <= 520;
    raiz.classList.toggle('cine', cine);
    const emPe = W < 720 && H > W, lugarLinha = emPe ? baixo : faixa;   // em pé: os anos ficam na tarja de baixo, fora da foto
    if (linha && linha.parentNode !== lugarLinha) lugarLinha.appendChild(linha);
    let faixaH, topoH;
    if (W < 720 && H > W) {
      faixaH = Math.round(Math.min(H * 0.5, W * 1.25));
      const leg = Math.round(Math.max(150, H * 0.27));                 // espaço da legenda (3 a 4 linhas)
      topoH = Math.max(52, Math.round((H - faixaH - leg) / 2));
    } else if (cine) { faixaH = H; topoH = 0; }
    else { faixaH = Math.round(Math.min(W / 2.39, H - 230)); topoH = Math.max(48, Math.round((H - faixaH) * 0.28)); }
    raiz.style.setProperty('--t-faixa', faixaH + 'px');
    raiz.style.setProperty('--t-topo', topoH + 'px');
  }

  function marcaSom() {
    const on = !!som && som.ligado();
    botSom.classList.toggle('mudo', !on);
    botSom.setAttribute('aria-pressed', String(on));
    botSom.setAttribute('aria-label', on ? 'Sound: on' : 'Sound: off');
  }

  function carrega() {
    const js = (nome, glob) => window[glob] ? Promise.resolve() : new Promise((ok, falha) => {
      const s = document.createElement('script'); s.src = BASE + nome;
      s.onload = ok; s.onerror = () => falha(new Error(nome)); document.head.appendChild(s);
    });
    return Promise.all([js('dados.js', 'AYS_TOUR'), js('mapa.js', 'AYS_MAPA')]).then(() => { DADOS = window.AYS_TOUR; MAPA = window.AYS_MAPA; });
  }
  function pre(i) { if (DADOS && DADOS[i]) { const im = new Image(); im.src = BASE + DADOS[i].img; } }

  function poeFoto(i, no) {
    const c = DADOS[i];
    no.textContent = '';
    const im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = BASE + c.img;
    const estreita = innerWidth < 720 && innerHeight > innerWidth;      // celular em pé: a faixa é quase quadrada
    im.style.objectFit = (c.ajuste === 'contain' || (c.legivel && estreita)) ? 'contain' : 'cover';
    im.style.objectPosition = (c.foco[0] * 100) + '% ' + (c.foco[1] * 100) + '%';
    no.appendChild(im);
    no.style.transition = 'none'; no.style.transform = 'none';
    return im;
  }

  const MES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dataLonga = d => { const [a, m, dia] = d.split('-'); return parseInt(dia, 10) + ' ' + MES[parseInt(m, 10) - 1] + ' ' + a; };
  function escreve(i) {
    const c = DADOS[i];
    kick.textContent = c.kicker;
    frase.textContent = c.frase;
    fonte.textContent = '';
    const a = document.createElement('a');
    a.href = BASE + '../post.html?p=' + encodeURIComponent(c.fonte); a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'Source: post of ' + dataLonga(c.data) + ' ↗';
    fonte.appendChild(a);
    if (c.credito) fonte.appendChild(document.createTextNode(' · Photo: ' + c.credito));
  }

  let lado = 0;
  async function mostraFoto(i, dur) {
    const antes = fotos[lado], depois = fotos[1 - lado];
    const im = poeFoto(i, depois);
    try { await im.decode(); } catch (e) { /* segue sem decode */ }
    if (!ativo) return;
    // o elemento é reaproveitado: volta ao tamanho natural antes de acender,
    // senão começa com o zoom que tinha no uso anterior
    depois.style.transition = 'none'; depois.style.transform = 'scale(1)'; void depois.offsetWidth;
    depois.style.transition = semMov.matches ? 'none' : '';
    depois.classList.add('vis');
    antes.classList.remove('vis');
    if (!semMov.matches) {
      // movimento quase parado: 2,5% de zoom em toda a cena
      depois.style.transition = `opacity ${FUSAO / RAPIDO}ms ease, transform ${dur}ms linear`;
      requestAnimationFrame(() => requestAnimationFrame(() => { depois.style.transform = 'scale(1.025)'; }));
    }
    lado = 1 - lado;
  }

  /* ---- mapa: fronteiras como traço principal, terra quase apagada ---- */
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs, pai) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (pai) pai.appendChild(e); return e; };
  const px = lon => (lon - MAPA.lon0) * MAPA.kx, py = lat => (MAPA.lat1 - lat) * MAPA.ky;
  const anoDe = c => parseInt(c.data.slice(0, 4), 10);

  function montaMapa() {
    if (svg) return;
    svg = sv('svg', { viewBox: `0 0 ${MAPA.w} ${MAPA.h}`, preserveAspectRatio: 'xMidYMid slice', role: 'presentation' });
    gTerra = sv('g', {}, svg); sv('path', { d: MAPA.terra, class: 'm-terra' }, gTerra);
    gLin = sv('g', {}, svg); gCerca = sv('g', {}, svg); gEncl = sv('g', {}, svg); gNomes = sv('g', {}, svg); gPts = sv('g', {}, svg);
    for (const n of MAPA.nomes) { const t = sv('text', { x: n.x, y: n.y, class: 'm-pais' + (n.mar ? ' mar' : ''), 'text-anchor': 'middle' }, gNomes); t.textContent = n.n; t.dataset.a = n.a; }
    for (const l of MAPA.lin) {
      if (MAPA.cercas[l.p]) {                       // a linha de fronteira do par: base fina + traço aceso por cima
        sv('path', { d: l.d, class: 'm-lin', 'data-par': l.p }, gLin);
        const e = sv('path', { d: l.d, class: 'm-cerca', 'data-par': l.p, 'data-ano': MAPA.cercas[l.p] }, gCerca); cercaEl.push(e);
      } else sv('path', { d: l.d, class: l.e ? 'm-ext' : 'm-lin', 'data-par': l.p }, gLin);
    }
    for (const n in MAPA.extra) { const e = sv('path', { d: MAPA.extra[n].d, class: 'm-cerca', 'data-par': n, 'data-ano': MAPA.extra[n].ano }, gCerca); cercaEl.push(e); }
    const ENC = { Ceuta: [-5.31, 35.89], Melilla: [-2.94, 35.29] };
    for (const n in ENC) {                            // enclaves minúsculas: anel e nome, para não sumirem
      const g = sv('g', { class: 'm-encl', 'data-ano': MAPA.extra[n].ano }, gEncl);
      sv('circle', { cx: px(ENC[n][0]), cy: py(ENC[n][1]), r: 8, fill: 'none', class: 'm-anel' }, g);
      const t = sv('text', { x: px(ENC[n][0]), y: py(ENC[n][1]) - 12, class: 'm-pais encl', 'text-anchor': 'middle' }, g); t.textContent = n;
    }
    nomeEl = sv('text', { class: 'm-nome' }, svg);
    mapaDiv.insertBefore(svg, mapaDiv.firstChild);
  }
  function vistaDe(v) {                              // [lon, lat, largura em graus] -> viewBox
    const W = faixa.clientWidth || 1280, H = faixa.clientHeight || 530;
    const w = v[2] * MAPA.kx, h = w * H / W;
    return { cx: px(v[0]), cy: py(v[1]), w, h };
  }
  function aplicaVista(v) {
    vista = v;
    svg.setAttribute('viewBox', `${v.cx - v.w / 2} ${v.cy - v.h / 2} ${v.w} ${v.h}`);
    const u = v.w / (faixa.clientWidth || 1280);     // unidades do mapa por pixel
    gPts.querySelectorAll('circle').forEach(c => c.setAttribute('r', (c.classList.contains('velho') ? 2.6 : 3.8) * u));
    const anos = [...gPts.querySelectorAll('text')], ocupados = [...gPts.querySelectorAll('circle')].map(c => [+c.getAttribute('cx'), +c.getAttribute('cy'), 4 * u, 4 * u]);
    const colide = (a, b) => Math.abs(a[0] - b[0]) < (a[2] + b[2]) && Math.abs(a[1] - b[1]) < (a[3] + b[3]);
    for (const t of anos) {                          // ano ao lado do ponto, no primeiro canto que não encosta em outro ano nem em ponto
      t.style.fontSize = 10.5 * u + 'px';
      const x = +t.getAttribute('x'), y = +t.getAttribute('y'), w = 2.1 * 10.5 * u, h = 6 * u;
      const cand = [[7 * u + w, -6 * u], [7 * u + w, 12 * u], [-7 * u - w, -6 * u], [-7 * u - w, 12 * u], [7 * u + w, 26 * u], [-7 * u - w, 26 * u]];
      let esc = cand[0];
      for (const c of cand) { const r = [x + c[0] - (c[0] > 0 ? w : -w) + 0 * u, y + c[1], w, h]; r[0] = x + (c[0] > 0 ? 7 * u + w / 2 : -7 * u - w / 2); if (!ocupados.some(o => colide(r, o))) { esc = c; break; } }
      const cx = x + (esc[0] > 0 ? 7 * u + w / 2 : -7 * u - w / 2);
      t.setAttribute('dx', esc[0] > 0 ? 7 * u : -7 * u - w); t.setAttribute('dy', esc[1]);
      ocupados.push([cx, y + esc[1], w / 2, h]);
    }
    rotulos(v, u);
    if (nomeEl.dataset.x) { nomeEl.setAttribute('y', +nomeEl.dataset.y - 7 * u); nomeEl.style.fontSize = 12 * u + 'px'; }
  }
  /* nomes de países e mares só nos quadros regionais, só os que estão no quadro, sem se sobrepor */
  function rotulos(v, u) {
    const regional = v.w / MAPA.kx <= 30, x0 = v.cx - v.w / 2, y0 = v.cy - v.h / 2, W = faixa.clientWidth || 1280;
    const usados = [], nomesUsados = new Set(), fs = 11 * u;
    if (nomeEl.dataset.x) {                          // o nome do lugar atual: fica dentro do quadro e os países desviam dele
      const px0 = +nomeEl.dataset.x, py0 = +nomeEl.dataset.y, wn = nomeEl.textContent.length * 12 * u * 0.62;
      const esq = px0 + 9 * u + wn > x0 + v.w * 0.98;
      nomeEl.setAttribute('text-anchor', esq ? 'end' : 'start'); nomeEl.setAttribute('x', esq ? px0 - 9 * u : px0 + 9 * u);
      usados.push([esq ? px0 - 9 * u - wn / 2 : px0 + 9 * u + wn / 2, py0 - 7 * u, wn + 14 * u]);
    }
    const ts = [...gNomes.children].sort((a, b) => b.dataset.a - a.dataset.a);
    for (const t of ts) {
      const x = +t.getAttribute('x'), y = +t.getAttribute('y');
      const w = t.textContent.length * fs * 0.8;
      let ok = regional && x - w / 2 > x0 + v.w * 0.02 && x + w / 2 < x0 + v.w * 0.98 && y > y0 + v.h * 0.1 && y < y0 + v.h * 0.9;
      if (ok && nomesUsados.has(t.textContent)) ok = false;
      if (ok) { ok = !usados.some(r => Math.abs(r[0] - x) < (r[2] + w) / 2 && Math.abs(r[1] - y) < fs * 1.6); if (ok) { usados.push([x, y, w]); nomesUsados.add(t.textContent); } }
      t.style.display = ok ? '' : 'none';
      t.style.fontSize = fs + 'px';
    }
    gEncl.querySelectorAll('text').forEach(t => {
      const cy = +t.previousSibling.getAttribute('cy'), cx = +t.previousSibling.getAttribute('cx'), baixo = t.textContent === 'Melilla';
      t.style.fontSize = 11 * u + 'px'; t.setAttribute('y', baixo ? cy + 24 * u : cy - 13 * u);
      t.setAttribute('x', baixo ? cx + 4 * u : cx - 4 * u); t.setAttribute('text-anchor', baixo ? 'start' : 'end');
    });
    gEncl.querySelectorAll('circle').forEach(c => c.setAttribute('r', 8 * u));
  }
  function voaPara(alvo, dur) {
    cancelAnimationFrame(vooRaf);
    const a = vista || vistaDe([18, 45, 60]), t0 = performance.now();
    if (semMov.matches || dur <= 0) { aplicaVista(alvo); return; }
    const f = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const passo = () => {
      const k = Math.min(1, (performance.now() - t0) / dur), e = f(k);
      // zoom por razão (não linear), para a aproximação ficar uniforme
      const w = a.w * (alvo.w / a.w) ** e;
      aplicaVista({ cx: a.cx + (alvo.cx - a.cx) * e, cy: a.cy + (alvo.cy - a.cy) * e, w, h: w * alvo.h / alvo.w });
      if (k < 1 && ativo) vooRaf = requestAnimationFrame(passo);
    };
    passo();
  }
  function acendeCercas(ano, foco) {
    gEncl.querySelectorAll('.m-encl').forEach(e => e.classList.toggle('on', +e.dataset.ano <= ano));
    // a fronteira da cena, quando não é cerca, só ganha um traço um pouco mais claro (ex.: Bósnia–Croácia, Ucrânia–Polônia)
    gLin.querySelectorAll('[data-par]').forEach(e => e.classList.toggle('m-viz', !!foco && e.dataset.par === foco && !(MAPA.cercas[foco] <= ano)));
    cercaEl.forEach(e => {
      e.classList.toggle('on', +e.dataset.ano <= ano);
      e.classList.toggle('m-foco', !!foco && e.dataset.par === foco && +e.dataset.ano <= ano);
    });
  }
  function pontoNo(coord, velho, ano, comAno) {
    const [lon, lat] = coord;
    const c = sv('circle', { cx: px(lon), cy: py(lat), r: 3, class: 'm-pt' + (velho ? ' velho' : '') }, gPts);
    if (comAno) { const t = sv('text', { x: px(lon), y: py(lat), class: 'm-ptano' }, gPts); t.textContent = ano; }
    return c;
  }
  /* o mapa de uma cena: aproxima da fronteira, acende as cercas até o ano da cena e acrescenta o trecho da rota */
  async function mapaDaCena(i, dur, parado) {
    const c = DADOS[i], m = c.mapa, ano = anoDe(c);
    montaMapa();
    mapaDiv.classList.add('vis');
    const anim = !semMov.matches && !parado;
    kick.textContent = m.fecho ? '2016 → 2025' : (m.nome || c.lugar) + ' · ' + ano;
    frase.textContent = ''; fonte.textContent = '';
    if (m.fecho) fecho(i, dur, parado);
    else {
      acendeCercas(ano, m.fronteira);
      anoEl.textContent = ano;
      gPts.querySelectorAll('circle').forEach(p => p.classList.add('velho'));
      visitados.push({ coord: c.coord, ano });
      gPts.textContent = '';
      visitados.forEach((v, k) => pontoNo(v.coord, k < visitados.length - 1, v.ano, false));
      nomeEl.textContent = c.lugar; nomeEl.dataset.x = px(c.coord[0]); nomeEl.dataset.y = py(c.coord[1]);
    }
    const alvo = vistaDe(m.fecho && innerWidth < 720 && innerHeight > innerWidth ? [20, 44, 64] : m.vista);
    if (!vista) aplicaVista(vistaDe([18, 45, 60]));
    if (parado) { aplicaVista(alvo); }
    else voaPara(alvo, m.fecho ? 2600 / RAPIDO : Math.min(2300, dur * 0.72));
    leg.classList.add('on');
  }
  /* fecho: o mapa inteiro, as cercas acendendo ano a ano (2016 -> 2025), todos os lugares acesos */
  function fecho(i, dur, parado) {
    nomeEl.textContent = ''; nomeEl.dataset.x = '';
    gPts.textContent = '';
    visitados.forEach(v => pontoNo(v.coord, false, v.ano, true));
    aplicaVista(vista);
    const anos = [...new Set(cercaEl.map(e => +e.dataset.ano))].sort();
    clearInterval(fimTimer);
    if (parado || semMov.matches) { acendeCercas(2025); anoEl.textContent = '2016 → 2025'; return; }
    acendeCercas(2015); anoEl.textContent = 2016;
    const t0 = performance.now(), total = (dur - 1500) / 1, rapido = RAPIDO;
    fimTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) * rapido / total), ano = Math.round(2016 + k * 9);
      anoEl.textContent = ano; acendeCercas(ano);
      if (k >= 1) clearInterval(fimTimer);
    }, 120);
  }
  function fechaMapa() { clearInterval(fimTimer); if (mapaDiv) mapaDiv.classList.remove('vis'); }
  function limpaMapa() {
    if (!svg) return;
    gPts.textContent = ''; visitados = []; vista = null; cercaEl.forEach(e => e.classList.remove('on', 'm-foco'));
    nomeEl.textContent = ''; nomeEl.dataset.x = '';
  }


  function tlMostra(on) {
    tlVis = !!on;
    if (raiz) raiz.classList.toggle('com-linha', tlVis);
  }
  function tlAtualiza(ano, frac) {
    if (!tlAnos) return;
    for (let y = 2016; y <= 2025; y++) {
      const r = tlAnos[y]; if (!r) continue;
      r.classList.toggle('agora', y === ano);
      r.classList.toggle('passou', y < ano);
    }
    if (tlMark && tlAnos[ano]) {
      const r = tlAnos[ano], box = r.parentElement;
      const top = r.offsetTop + Math.min(r.offsetHeight - 4, Math.max(0, frac * r.offsetHeight));
      tlMark.style.top = top + 'px';
    }
  }
  // posição na coluna em anos fracionários (2016.0 = topo de 2016); só anda para a frente:
  // cenas fora de ordem ou o epílogo (foto de 2020 depois de 2025) não fazem o marcador voltar
  const dataPos = c => { const d = new Date(c.data + 'T12:00:00Z'), y = d.getUTCFullYear(); return y + (d - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)); };
  let tlPos = 2016;
  function tlTick(acum, i, f) {
    const c = DADOS[i], n = DADOS[i + 1], p0 = dataPos(c), p1 = n ? Math.max(p0, dataPos(n)) : 2025.999;   // a última cena leva o marcador ao fim da coluna
    tlPos = Math.min(2025.999, Math.max(tlPos, p0 + (p1 - p0) * (f || 0)));
    if (acum < TL_INICIO) { if (tlVis) tlMostra(false); return; }
    if (!tlVis) tlMostra(true);
    const ano = Math.floor(tlPos);
    tlAtualiza(ano, tlPos - ano);
  }

  function progresso() {
    const t = Math.min(1, (performance.now() - inicio) / TOTAL);
    prog.firstChild.style.transform = 'scaleX(' + t + ')';
    if (ativo) raf = requestAnimationFrame(progresso);
  }

  async function iniciar(quem, congelado) {
    if (ativo) return;
    ativo = true;
    quemChamou = quem || document.activeElement;
    if (som && !congelado) som.iniciar();           // o AudioContext nasce AQUI, no gesto, antes de qualquer await
    fechaConvite();
    monta();
    try { await carrega(); } catch (e) { console.error(e); ativo = false; return; }
    if (!ativo) return;
    salvo = { ov: document.body.style.overflow };
    document.body.style.overflow = 'hidden';
    raiz.hidden = false; raiz.classList.remove('fim'); medir(); marcaSom();
    requestAnimationFrame(() => raiz.classList.add('on'));
    TOTAL = (DADOS.reduce((s, c) => s + c.ms + (c.mapa ? c.mapa.ms : 0), 0) + SILENCIO_FINAL) / RAPIDO;
    montaMapa(); limpaMapa(); fechaMapa(); tlMostra(false); tlAcum = 0; tlPos = 2016;
    inicio = performance.now();
    prog.firstChild.style.transform = 'scaleX(0)';
    leg.classList.remove('on'); fotos.forEach(f => { f.classList.remove('vis'); f.textContent = ''; });
    if (congelado) return;
    raf = requestAnimationFrame(progresso);
    try {
      pre(0); pre(1);
      tlAcum = 0; tlPos = 2016; tlMostra(false);
      for (let i = 0; i < DADOS.length; i++) {
        const c = DADOS[i], dur = c.ms / RAPIDO, t0 = performance.now();
        cena = i;
        leg.classList.remove('on');
        if (som) som.cena(i, c);
        tlTick(tlAcum, i, 0);
        if (c.mapa) {
          const mdur = c.mapa.ms / RAPIDO;
          await espera(semMov.matches ? 0 : 450 / RAPIDO);
          tlTick(tlAcum, i, 0);
          await mapaDaCena(i, mdur, false);
          tlTick(tlAcum + c.mapa.ms * 0.5, i, 0.2);
          await espera(mdur - (performance.now() - t0));
          tlAcum += c.mapa.ms;
          tlTick(tlAcum, i, 0.4);
          // a foto da cena anterior ficava acesa debaixo do mapa e reaparecia
          // quando ele se apagava; some agora, ainda coberta, e a nova entra do preto
          fotos.forEach(f => { f.style.transition = 'none'; f.classList.remove('vis'); });
          leg.classList.remove('on'); fechaMapa();
          await espera(FUSAO / RAPIDO * 0.6);
          leg.classList.remove('on');
        }
        const t1 = performance.now();
        tlTick(tlAcum, i, c.mapa ? 0.4 : 0);
        await mostraFoto(i, dur);
        pre(i + 1);
        await espera(Math.min(700, dur * 0.12));
        escreve(i); leg.classList.add('on');
        tlTick(tlAcum + c.ms * 0.3, i, c.mapa ? 0.6 : 0.4);
        await espera(t1 + dur - performance.now());
        tlAcum += c.ms;
        tlTick(tlAcum, i, 1);
      }
      // fecho: legenda some, a foto some e fica o preto, com a última nota apagando
      leg.classList.remove('on');
      raiz.classList.add('fim');
      if (som) som.parar(true);
      await espera(SILENCIO_FINAL / RAPIDO);
      // o fim natural leva ao mapa de todos os lugares; ?fim=fica (suíte) devolve a página, como o Esc
      if (q0.get('fim') !== 'fica') { await vaiParaMapa(); return; }
      parar(true);
    } catch (e) { if (!(e instanceof Parado)) { console.error(e); parar(false); } }
  }

  /* fusão para o preto (a camada já está preta) e navegação; o mapa abre com ?de=tour e clareia a partir do preto */
  async function vaiParaMapa() {
    const preto = el('div'); preto.style.cssText = 'position:fixed;inset:0;z-index:100002;background:#000;opacity:0;transition:opacity ' + (900 / RAPIDO) + 'ms ease';
    document.body.appendChild(preto);
    requestAnimationFrame(() => requestAnimationFrame(() => { preto.style.opacity = '1'; }));
    await espera(1000 / RAPIDO);
    const alvo = new URL('../map.html', BASE || location.href);
    alvo.searchParams.set('de', 'tour');
    location.assign(alvo.href);
  }

  function parar(natural) {
    if (!ativo) return;
    ativo = false; cancelAnimationFrame(raf); cancelAnimationFrame(vooRaf); fechaMapa();
    for (const p of pend) { clearTimeout(p.id); p.falha(new Parado()); }
    pend.clear();
    if (som) som.parar(!!natural);
    if (raiz) {
      raiz.classList.remove('on'); raiz.classList.remove('fim');
      setTimeout(() => { if (!ativo && raiz) { raiz.hidden = true; fotos.forEach(f => { f.textContent = ''; f.classList.remove('vis'); }); } }, 1050 / RAPIDO + 40);
    }
    document.body.style.overflow = salvo ? salvo.ov : '';
    tlMostra(false); tlAcum = 0; tlPos = 2016; cena = -1;
    if (SOZINHA && !natural) { location.assign(new URL('../index.html', BASE || location.href).href); return; }   // não há página a restaurar
    if (quemChamou && quemChamou.isConnected && quemChamou !== document.body) { try { quemChamou.focus({ preventScroll: true }); } catch (e) { /* sem foco */ } }
  }

  /* convite (?tour=1) */
  function fechaConvite() { if (convite) convite.hidden = true; }
  function convida() {
    if (!convite) {
      convite = el('div'); convite.id = 'ays-tour-convite'; convite.setAttribute('role', 'dialog');
      convite.setAttribute('aria-label', 'Tour invitation');
      const p = el('p', '', 'This tour contains accounts of death and suffering at Europe’s borders.');
      const b = el('button', '', 'Press to start'); b.type = 'button';
      const s = el('small'); convite.append(p, b, s);
      document.body.appendChild(convite);
      // qualquer toque no convite começa (é o gesto que libera o som); Esc fecha
      convite.addEventListener('click', () => iniciar());
      if (!document.getElementById('ays-tour-css')) {
        const st = document.createElement('style'); st.id = 'ays-tour-css'; st.textContent = CSS; document.head.appendChild(st);
      }
    }
    convite.querySelector('small').textContent = som && som.ligado()
      ? 'About 4 minutes, with quiet music. Esc stops it.' : 'About 4 minutes, without sound (you turned it off). Esc stops it.';
    convite.hidden = false;
    convite.querySelector('button').focus({ preventScroll: true });
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (ativo) { e.stopPropagation(); e.preventDefault(); parar(false); }
    else if (convite && !convite.hidden) { e.stopPropagation(); if (SOZINHA) location.assign(new URL('../index.html', BASE || location.href).href); else fechaConvite(); }
  }, true);

  function ligaBotoes() {
    document.querySelectorAll('[data-tour]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); iniciar(e.currentTarget); }));
    if (SOZINHA) { convida(); return; }
    if (q0.get('tour') === '1') {
      try { const u = new URL(location.href); u.searchParams.delete('tour'); history.replaceState(null, '', u); } catch (e) { /* file:// */ }
      convida();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligaBotoes); else ligaBotoes();

  /* cena i parada, sem relógio (suíte e prints) */
  async function mostra(i) {
    if (!ativo) await iniciar(null, true);
    fechaMapa(); cena = i; leg.classList.remove('on');
    const im = poeFoto(i, fotos[lado]); try { await im.decode(); } catch (e) { /* ok */ }
    fotos[lado].classList.add('vis'); fotos[lado].style.transition = 'none';
    escreve(i); leg.style.transition = 'none'; leg.classList.add('on');
  }

  /* a cena de mapa de i, parada (prints e suíte); chamar em ordem para a rota acumular */
  async function mapa(i) {
    if (!ativo) await iniciar(null, true);
    cena = i; fotos.forEach(f => f.classList.remove('vis'));
    await mapaDaCena(i, 0, true);
    leg.style.transition = 'none';
  }

  window.aysTour = { mapa, iniciar, parar: () => parar(false), ativo: () => ativo, cena: () => cena, mostra,
                     total: () => (DADOS ? DADOS.length : null), rapido: RAPIDO, carrega: () => carrega().then(() => DADOS.length) };
})();
