/* Som do tour: música gerada na hora com Web Audio, sem arquivo. É um tour sobre mortes e sofrimento nas fronteiras
   da Europa, então a música é contida: nada de pulso marcado nem de cadência.
     bordão    A1 + A2 e uma quinta quase inaudível, sempre ali, como um ar parado
     cordas    quatro serras desafinadas atrás de um filtro que respira devagar; o acorde troca a cada poucas cenas
               (lá menor, fá, ré menor, mi), com glissando longo
     notas     de tempos em tempos, uma nota longa e macia da escala menor, caindo mais do que subindo
     silêncio  nas cenas de morte e naufrágio (silencio: true) as cordas e as notas somem e fica só o bordão baixo
     fim       a última nota apaga em ~6 s, sem clímax
   Mestre com passa-altas, compressor e teto suave (limitador); saída sempre com rampa. O AudioContext só nasce em
   iniciar(), que o tour chama dentro do gesto do leitor. A preferência (ligado/mudo) fica em localStorage. */
(() => {
  'use strict';
  const CHAVE = 'ays-tour-som';
  const LA = 55;                                   // lá 1
  const ACORDES = [[0, 3, 7, 10], [-4, 0, 3, 7], [-7, -3, 0, 3], [-5, -1, 2, 7]];   // Am7, F, Dm, E (sobre o lá)
  const NOTAS = [12, 15, 19, 22, 17, 14, 10, 7];   // lá menor, uma oitava e meia acima do bordão
  let ctx = null, saida, bus, sala, bordao, cordas, tocando = false, ligado = true, timer = 0, silencio = false, grupo = -1;
  let notaTimer = 0, parou = false;
  try { ligado = localStorage.getItem(CHAVE) !== 'off'; } catch (e) { /* sem storage */ }

  const hz = (semi, base = LA) => base * 2 ** (semi / 12);
  const sorte = a => a[Math.floor(Math.random() * a.length)];

  function montar() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (navigator.audioSession) { try { navigator.audioSession.type = 'ambient'; } catch (e) { /* iOS antigo */ } }
    const pa = ctx.createBiquadFilter(); pa.type = 'highpass'; pa.frequency.value = 28;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24; comp.ratio.value = 4; comp.attack.value = 0.02; comp.release.value = 0.4;
    const teto = ctx.createWaveShaper(), cv = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) cv[i] = Math.tanh((i / 511.5 - 1) * 1.1) / Math.tanh(1.1);
    teto.curve = cv;
    saida = ctx.createGain(); saida.gain.value = 0;
    bus = ctx.createGain(); bus.gain.value = 0.8;
    bus.connect(pa); pa.connect(comp); comp.connect(teto); teto.connect(saida); saida.connect(ctx.destination);

    // sala: 5 s de ruído que morre, agudos primeiro
    const n = Math.floor(ctx.sampleRate * 5), ir = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c); let lp = 0;
      for (let i = 0; i < n; i++) { const t = i / n; lp += (Math.random() * 2 - 1 - lp) * (1 - (0.15 + 0.82 * t)); d[i] = lp * (1 - t) ** 2.6 * 0.5; }
    }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    sala = ctx.createGain(); sala.gain.value = 0.55; sala.connect(conv); conv.connect(bus);

    // bordão
    const bg = ctx.createGain(); bg.gain.value = 0;
    const bf = ctx.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = 220; bf.Q.value = 0.4;
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = LA;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = LA * 2;
    const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = LA * 3 / 2 * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.18; const g3 = ctx.createGain(); g3.gain.value = 0.05;
    o1.connect(bg); o2.connect(g2); g2.connect(bg); o3.connect(g3); g3.connect(bg);
    bg.connect(bf); bf.connect(bus);
    const be = ctx.createGain(); be.gain.value = 0.3; bf.connect(be); be.connect(sala);
    [o1, o2, o3].forEach(o => o.start());
    bordao = { g: bg };

    // cordas: quatro serras desafinadas por voz do acorde
    const cg = ctx.createGain(); cg.gain.value = 0;
    const cf = ctx.createBiquadFilter(); cf.type = 'lowpass'; cf.frequency.value = 520; cf.Q.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
    const lg = ctx.createGain(); lg.gain.value = 170; lfo.connect(lg); lg.connect(cf.frequency); lfo.start();
    const vozes = [0, 1, 2, 3].map(() => [-8, 7].map(det => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = det; o.frequency.value = hz(12); o.start();
      const g = ctx.createGain(); g.gain.value = 0.07; o.connect(g); g.connect(cg); return o;
    }));
    cg.connect(cf); cf.connect(bus);
    const ce = ctx.createGain(); ce.gain.value = 0.7; cf.connect(ce); ce.connect(sala);
    cordas = { g: cg, f: cf, vozes };
    acorde(0, 0.1);
  }

  function acorde(k, gl = 7) {
    const ac = ACORDES[k % ACORDES.length], t = ctx.currentTime;
    cordas.vozes.forEach((par, i) => par.forEach(o => {
      o.frequency.cancelScheduledValues(t); o.frequency.setValueAtTime(o.frequency.value, t);
      o.frequency.linearRampToValueAtTime(hz(ac[i] + 24), t + gl);
    }));
  }

  /* uma nota longa e macia, de vez em quando */
  function nota() {
    if (!tocando || silencio || !ctx) return;
    const t = ctx.currentTime, semi = sorte(NOTAS) + 12 * (Math.random() < 0.2 ? 1 : 0);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(semi);
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = hz(semi) * 2.003;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 780; f.Q.value = 0.3;
    const g = ctx.createGain(); g.gain.value = 0;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11, t + 2.8); g.gain.linearRampToValueAtTime(0, t + 9);
    const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(f);
    o.connect(f); f.connect(g); g.connect(bus); const e = ctx.createGain(); e.gain.value = 0.8; g.connect(e); e.connect(sala);
    o.start(t); o2.start(t); o.stop(t + 9.5); o2.stop(t + 9.5);
  }
  function agenda() {
    clearTimeout(notaTimer);
    if (!tocando) return;
    nota();
    notaTimer = setTimeout(agenda, 7000 + Math.random() * 6000);
  }

  const api = {
    ligado: () => ligado,
    criado: () => !!ctx,
    iniciar() {
      if (!ligado) return;
      if (!ctx) montar();
      if (ctx.state === 'suspended') ctx.resume();
      if (tocando) return;
      tocando = true; parou = false; silencio = false; grupo = -1;
      clearTimeout(timer);
      const t = ctx.currentTime;
      saida.gain.cancelScheduledValues(t); saida.gain.setValueAtTime(saida.gain.value, t); saida.gain.linearRampToValueAtTime(0.9, t + 5);
      bordao.g.gain.cancelScheduledValues(t); bordao.g.gain.setValueAtTime(bordao.g.gain.value, t); bordao.g.gain.linearRampToValueAtTime(0.5, t + 6);
      notaTimer = setTimeout(agenda, 5000);
    },
    /* cena i do tour; c.silencio = cena de morte: só o bordão, baixo */
    cena(i, c) {
      if (!ctx || !tocando) return;
      const t = ctx.currentTime, mudo = !!(c && c.silencio);
      silencio = mudo;
      cordas.g.gain.cancelScheduledValues(t); cordas.g.gain.setValueAtTime(cordas.g.gain.value, t);
      cordas.g.gain.linearRampToValueAtTime(mudo ? 0.0 : 0.55, t + (mudo ? 3 : 6));
      bordao.g.gain.cancelScheduledValues(t); bordao.g.gain.setValueAtTime(bordao.g.gain.value, t);
      bordao.g.gain.linearRampToValueAtTime(mudo ? 0.3 : 0.5, t + 4);
      const g = Math.floor(Math.max(0, i) / 4);
      if (g !== grupo) { grupo = g; acorde(g); }
    },
    parar(natural) {
      if (!ctx || !tocando) return;
      tocando = false; clearTimeout(notaTimer);
      const t = ctx.currentTime, d = natural ? 6 : 0.5;
      saida.gain.cancelScheduledValues(t); saida.gain.setValueAtTime(saida.gain.value, t); saida.gain.linearRampToValueAtTime(0, t + d);
      if (natural) {          // a última nota: uma só, longa, que apaga com o resto
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(12);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 1.5); g.gain.linearRampToValueAtTime(0, t + 6);
        o.connect(g); g.connect(bus); g.connect(sala); o.start(t); o.stop(t + 6.2);
      }
      parou = true;
    },
    alternar() {
      ligado = !ligado;
      try { localStorage.setItem(CHAVE, ligado ? 'on' : 'off'); } catch (e) { /* sem storage */ }
      if (!ligado && ctx) { const t = ctx.currentTime; tocando = false; clearTimeout(notaTimer); saida.gain.cancelScheduledValues(t); saida.gain.setValueAtTime(saida.gain.value, t); saida.gain.linearRampToValueAtTime(0, t + 0.4); }
      return ligado;
    },
  };
  window.AysSom = api;
})();
