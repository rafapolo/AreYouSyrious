**Feito em 2026-11-06.** Registro das decisões, conferências e pontos fracos: `design/tour.md`. Dados: `design/tour.json`; scripts: `script/monta_tour.py` e `script/monta_mapa.py`; suíte: `bun test` (`testes/`).

# Tour com as histórias e as imagens (3 min, legendas mais rápidas)

Pedido: um tour automático de ~3 minutos pelo arquivo, contando histórias reais dos posts com as
imagens que as acompanham, em estilo de cinema, com legendas que trocam mais depressa que no tour dos
rios.

Referência de mecânica (copiar a ideia, não o visual): o tour do `rios-do-brasil` (branch
`maplibre-3d`: `pipeline/tour.js`, `pipeline/som_tour.js`, `design/tour.json`, `design/tour.md`) e o do
`geoglifos-amazonia` (`docs/tour.js`, `docs/som.js`). Pontos que valem copiar: roteiro em JSON embutido
na página, faixas 2.39:1 com a legenda na faixa de baixo, Esc e "✕ esc" param e devolvem a página como
estava, `?tour=1` mostra "Aperte para começar" (o navegador só libera o som depois de um gesto), página
`tour/index.html` que só redireciona, `prefers-reduced-motion` com cortes secos, `?rapido=N` para a suíte
acelerar o relógio, som gerado na hora com Web Audio (sem arquivo), botão de som lembrado em localStorage.

## O que é diferente aqui

- **Duração e ritmo:** ~180 s. Legendas mais rápidas: uma frase curta (até ~90 caracteres) a cada 4 a 6 s,
  em vez de 10 a 12 s por cena. Cerca de 30 a 40 legendas no total. Cada cena troca imagem e legenda com
  corte ou fusão curta, sem voo de câmera (não há mapa): o movimento vem de zoom lento (Ken Burns) na foto.
- **Conteúdo:** histórias reais do arquivo (3.145 posts, 2016–2025, ~19 mil imagens), em ordem
  cronológica, uma por episódio: ponto de partida (acordo UE-Turquia, Idomeni 2016), rota dos Bálcãs,
  Moria e as ilhas gregas, Calais, Mediterrâneo central, pushbacks, Ucrânia 2022, e o fecho. Cada cena
  carrega: data, kicker (lugar e ano), a frase, a fonte (o link do post) e a imagem.
- **Sem inventar:** cada frase tem que sair do texto do post citado (ou de `chronological_list_of_events.md`),
  com data e número conferidos; guardar a conferência em `design/tour.md`, como no tour dos rios (de onde
  saiu, ordem de grandeza esperada, segunda via). Nada de números de memória. Frases traduzidas ou
  resumidas: dizer isso no roteiro (`traducao: true`) e manter a citação original no `tour.md`.
- **Imagens:** escolher pelo conteúdo, não ao acaso: abrir a imagem e conferir que mostra o que a legenda
  diz (o `photos.html`/`images.html` já indexam as 19 mil; usar `thumbs/` para pré-visualizar e
  `assets/<id>/` para o arquivo cheio). Evitar rostos identificáveis de menores e de pessoas em situação
  de risco; preferir lugares, objetos, mapas, cartazes e multidões de longe. Registrar autor/crédito
  quando o post o traz.
- **Offline:** a página continua abrindo por file://. Embutir só as ~40 imagens do tour (redimensionadas,
  webp, ~1280 px de largura, alvo total < 6 MB) em vez de apontar para os 3,8 GB de `assets/`; gerar por
  script (ex.: `script/monta_tour.py`) a partir do roteiro.
- **Música:** original, em Web Audio, de outro clima que o dos rios (sem a água): pulso lento e grave,
  cordas sintéticas e um motivo que sobe de cena em cena; legendas rápidas pedem andamento mais marcado
  (~90 bpm). Silêncio limpo (rampa) ao sair. Não usar trecho de música existente.

## Entregas

1. `design/tour.json` (cenas: id, duracao_ms, data, kicker, frase, fonte, imagem, credito, traducao) e
   `design/tour.md` (conferência de cada frase e de cada imagem).
2. `tour.html` (ou `tour/index.html` + página) autocontido, com faixas, legenda, progresso, Esc, som e
   `?tour=1`; botão "Tour" na `index.html` e no `timeline.html`.
3. `script/monta_tour.py` que redimensiona as imagens e injeta roteiro + imagens na página.
4. Testes: `?tour=1` mostra o convite; o toque começa e as cenas avançam (`?rapido=20`); Esc restaura;
   AudioContext só nasce depois do gesto; reduced-motion; celular (iPhone 13) com legenda legível e sem
   cobrir a foto. Navegadores só os embutidos do Playwright (nunca `channel: "chrome"`), sempre fechando.
5. Vídeo do tour inteiro em 1280×800 (Playwright `recordVideo`, pode ser acelerado) e prints de todas as
   cenas, em desktop e em iPhone 13, olhados um a um antes de dar por pronto.

## Pontos a decidir antes de começar

- Tema único (a rota dos Bálcãs, por exemplo) ou a visão geral 2016–2025? O pedido diz "as histórias":
  proposta inicial é a visão geral, ~12 episódios de 15 s cada, com 3 legendas por episódio.
- Idioma das legendas: inglês original (como nos posts) ou português? Se português, marcar `traducao: true`.
- Se o tour deve citar os nomes de organizações e ONGs dos posts ou só os fatos.
