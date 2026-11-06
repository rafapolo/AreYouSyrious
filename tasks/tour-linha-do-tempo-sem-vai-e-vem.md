**Feito em 2026-11-06.** `tlTick` em `tour/tour.js` agora usa a data da cena com posição monótona (`tlPos`); teste em `testes/tour.test.ts` ("a linha do tempo da direita só anda para a frente").

# Tour: a linha do tempo da direita anda só para a frente

Pedido (2026-11-06): no tour, o marcador da linha do tempo (coluna da direita, 2016–2025) vai e volta.
Ele tem que descer reto, do começo ao fim, como a própria coluna representa o tempo. Hoje não é assim.

## Por que vai e volta hoje (`tour/tour.js`, `tlTick` e `tlAtualiza`)

- O ano aceso e a linha do marcador vêm do **ano da cena** (`anoDe(c)`), mas a posição dentro da linha
  (`frac`) vem do **relógio geral do tour** (`anoCont = 2016 + k * 9`). As duas fontes não andam juntas:
  numa cena de 2016 tardia o `frac` pode estar perto do fim da linha e, na cena seguinte, voltar ao topo.
- A expressão `Math.max(ano, a) && ano ? ano : a` sempre devolve `ano` (o da cena): o relógio geral
  nunca decide o ano, só o `frac`.
- As datas das cenas em `design/tour.json` não são monótonas:
  - cena 1 (2016-05-18) antes da 2 (2016-05-02);
  - cena 9 (Lesvos, 2017-01-09) e 10 (2017-01-14): ok, mas 18 (2020-03-11) antes da 19 (2020-03-01);
  - cena 21 (2020-09-13) antes da 22 (2020-09-10);
  - **cena final 32 (Lesvos, 2020-03-01) depois da 31 (2025-02-11)**: o marcador salta de 2025 de volta
    a 2020 no fecho. É o salto mais visível.

## O que fazer

1. Posição do marcador = função **monótona** do tempo, nunca do ano da cena isolado. Proposta: o marcador
   vai para a data da cena (dia do ano → `frac` dentro da linha do ano), mas só avança:
   `pos = max(pos_anterior, pos_da_data)`; entre ticks, interpola suave até lá.
2. Cenas fora de ordem dentro do mesmo ano (1↔2, 18↔19, 21↔22) ficam paradas no ponto já alcançado,
   sem recuo. Avaliar se vale reordenar as cenas no `tour.json` em vez disso (a narrativa pode depender
   da ordem atual; conferir com `design/tour.md` antes de mexer).
3. Cena de fecho (32, imagem de 2020 como epílogo): o marcador fica em 2025 (ou vai até o fim da coluna),
   não volta. Marcar a cena como epílogo no JSON (ex.: `"epilogo": true`) e o `tlTick` ignorar o ano dela.
4. O ano aceso (`.agora`) segue a posição do marcador, não o ano da cena, para os dois nunca discordarem.
5. Teste em `testes/`: rodar o tour com `?rapido=N`, amostrar `tlMark.style.top` a cada tick e afirmar
   que a sequência é não decrescente; idem para o ano em `.tl-ano.agora`.
6. Conferir no celular (linha do tempo horizontal, `@media` em `tour.js:104`): lá o eixo é `left`, mesma regra.
