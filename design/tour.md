# Tour: histórias e imagens (design/tour.md)

Conferência de cada frase, número, imagem, lugar e cerca do tour. A fonte dos dados do tour é `design/tour.json`; `script/monta_tour.py` valida cada frase contra o texto do post citado (cada trecho tem de ser literal, ≤100 caracteres, sem nome de organização) e gera `tour/dados.js` e `tour/img/*.webp`; `script/monta_mapa.py` gera `tour/mapa.js`.

## Decisões do usuário que governam o tour

- Visão geral 2016–2025, em ordem cronológica, 12 episódios (Idomeni, Calais, Belgrado e o inverno de 2017, Mediterrâneo, Bósnia, março de 2020 no Evros/Edirne/Lesvos, Moria, os muros de 2021, Ucrânia, Pylos, Samos, memória).
- Legendas em **inglês original**: trechos literais dos posts (ou de `chronological_list_of_events.md`), só cortados, `traducao: false`. Interface em inglês.
- **Sem nomes de organizações ou ONGs** na tela: só fatos (lugar, data, número) e o link do post como fonte. Quando a frase original nomeia uma ONG, o nome foi cortado ou a frase trocada. O guarda de `monta_tour.py` recusa uma lista de nomes.
- Crédito de foto: exibido só quando o post dá o nome de uma pessoa; créditos de organizações ou veículos ficam aqui e em `credito_org` do JSON, e o link do post mostra o crédito original. (Ponto fraco: o crédito de organização não aparece na tela.)
- Mapa (pedido posterior): fronteiras como traço principal, ver a seção do mapa abaixo.

## Tom (ajuste do usuário: "é uma história trágica para a humanidade")

O tour não é espetáculo.
- **Música** (`tour/som.js`): sem pulso nem cadência. Bordão em lá, cordas sintéticas longas atrás de um filtro que respira, quatro acordes (lá menor 7, fá, ré menor, mi) trocando a cada quatro cenas com glissando de 7 s, uma nota longa e macia a cada 7 a 13 s. Nas cenas de morte e naufrágio (`silencio: true`: bote vazio, coletes, mar bravo, Pylos, Berlim, coletes de Lesvos) as cordas e as notas somem e fica só o bordão baixo. O fim é uma nota que se apaga em 6 s, depois 5 s de preto antes de devolver a página. Mestre com passa-altas, compressor e limitador.
- **Ritmo**: cada cena de foto fica 5 s (a última, 7 s), fusões de 1,4 s, Ken Burns de 2,5% de zoom na cena inteira (parado com `prefers-reduced-motion`). Nenhum corte rápido. Ficou entre o 'mais lento' pedido (5 a 7 s) e a meta de ~180 s: 5 s por foto.
- **Convite**: "This tour contains accounts of death and suffering at Europe's borders." antes de "Press to start".
- **Imagens**: nenhuma de corpo ou ferido; prefiro lugares, objetos deixados, barcos, cercas, tendas. Nenhuma criança identificável.
- **Números** de mortos e desaparecidos com exatidão e sem adjetivo, sempre do texto do post.
- **Fecho**: o mapa inteiro com as fronteiras cercadas acesas de 2016 a 2025, depois a cena de memória (aterro de coletes salva-vidas de Lesvos, 7 s) e 5 s de silêncio.

## Duração

33 cenas de foto = 167 s; 13 cenas de mapa = 46 s; mais 5 s de silêncio final: cerca de 218 s (3:38), acima dos ~180 s previstos pelo acréscimo dos mapas.

## Cenas


### Episódio 1

**1. `idomeni-fronteira`** · 2016-04-11 · Idomeni, Greece · April 2016
- Frase: "Tensions are still high in Idomeni after yesterday’s events, which left around 300 refugees hurt." (97 caracteres, literal)
- Fonte: `posts/2016-04-12-ays-daily-digest-11-4-2016-8e8297bf418b.md`
- Número/fato e segunda via: "around 300 refugees hurt" (post de 11/4). Segunda via: o resumo de abril em chronological_list_of_events.md fala em 250 feridos no mesmo episódio; mesma ordem de grandeza, a diferença fica registrada.
- Imagem `assets/8e8297bf418b/1*eRSLNKJj_XPdZaoxa6oaAg.jpeg`: Policiais macedônios atrás da cerca de arame (legenda do post: "Macedonian police on the border with Greece"). Rostos de policiais de capacete e máscara, nenhum refugiado.
- Lugar: Idomeni [22.51, 41.13] (lon, lat). Trecho do post: Legenda "Photo taken by refugees stranded in Idomeni"; texto "Tensions are still high in Idomeni". Mapa: fronteira `GRC-MKD`, vista [22.5, 41.0, 18].

**2. `idomeni-gas`** · 2016-05-18 · Idomeni, Greece · May 2016
- Frase: "Refugees and police clash in Idomeni." (37 caracteres, literal)
- Fonte: `posts/2016-05-19-ays-daily-news-digest-18-5-2016-9955d403ddb2.md`
- Número/fato e segunda via: Frase é o primeiro período do subtítulo do post de 18/5. Sem número.
- Imagem `assets/9955d403ddb2/0*wlNEDZljV0RpWbOK.`: Fumaça de gás lacrimogêneo sobre as barracas (legenda "Tear gas in Idomeni. Photo by refugee inside the camp."). Sem pessoas.
- Lugar: Idomeni [22.51, 41.13] (lon, lat). Trecho do post: Legenda e título.

**3. `idomeni-tempestade`** · 2016-05-02 · Idomeni, Greece · May 2016
- Frase: "Heavy rain storms and strong winds have destroyed many tents and people’s belongings." (85 caracteres, literal)
- Fonte: `posts/2016-05-02-ays-daily-news-digest-2-5-2016-58a670bbfe2a.md`
- Número/fato e segunda via: Texto do post de 2/5. Segunda via: o mesmo post dá "46,900 stranded in Greece" e "21,100 in northern Greece".
- Imagem `assets/58a670bbfe2a/1*Dgxce9_SfbzFiDsumllPzg.jpeg`: Barraca arrebentada pela tempestade; marca d'água "David Lohmueller", o mesmo crédito da legenda da foto vizinha do post ("Storm destroys tents in Idomeni"). Sem pessoas. Crédito exibido: David Lohmueller.
- Lugar: Idomeni [22.51, 41.13] (lon, lat). Trecho do post: "bad weather conditions took their toll on #Idomeni".


### Episódio 2

**4. `idomeni-onibus`** · 2016-05-24 · Idomeni, Greece · 24 May 2016
- Frase: "By 5pm, about 2,000 people were taken by busses to other camps in Greece." (73 caracteres, literal)
- Fonte: `posts/2016-05-24-idomeni-special-around-2-000-people-moved-out-from-the-camp-during-the-first-day-of-eviction-f10d33b84e4d.md`
- Número/fato e segunda via: "about 2,000 people" tirados de ônibus até as 17h no primeiro dia (24/5). Segunda via: o mesmo post diz que o campo tinha "around 8,000 people" e que 4.000 sairiam até o dia seguinte; o post de 26/5 conta 6.138 restantes, "down from 8,199" (8.199 - 6.138 = 2.061, coerente com 2.000).
- Imagem `assets/f10d33b84e4d/1*Cc5ddkbdEdo8nwKL5Qxtrg.jpeg`: Ônibus alinhados vistos por uma fresta de lona; ninguém identificável. Sem crédito no post.
- Lugar: Idomeni [22.51, 41.13] (lon, lat). Trecho do post: Título "Idomeni Special" e "the improvised refugee camp in Idomeni, at the Greek — Macedonian border".

**5. `idomeni-vagiochori`** · 2016-05-25 · Idomeni, Greece · 25 May 2016
- Frase: "6,138 refugees remained inside Idomeni after the first day of the evacuation, down from 8,199." (94 caracteres, literal)
- Fonte: `posts/2016-05-26-ays-news-digest-idomeni-evacuation-continues-c62090d33878.md`
- Número/fato e segunda via: "6,138 refugees ... down from 8,199" (post de 25/5). Segunda via: o post de 24/5 diz que o campo tinha "around 8,000 people" e que cerca de 2.000 saíram no primeiro dia (8.199 - 6.138 = 2.061).
- Imagem `assets/c62090d33878/0*FhwO_XpOBBZUItDC.jpg`: Barracas do novo campo atrás de cerca de arame (legenda "New Vagiochori camp. Photo Credit: Giorgos Christides"). A frase original sobre Vagiochori foi trocada porque começava com "reportedly" (o corte tirava a ressalva). Crédito exibido: Giorgos Christides.
- Lugar: Idomeni [22.51, 41.13] (lon, lat). Trecho do post: Legenda e seção "Idomeni Evacuation".


### Episódio 3

**6. `calais-fogo`** · 2016-10-26 · Calais, France · October 2016
- Frase: "Large fires broke out in Calais yesterday night and continued on today" (70 caracteres, literal)
- Fonte: `posts/2016-10-27-children-left-without-shelter-after-large-fires-in-the-jungle-dd9301cff389.md`
- Número/fato e segunda via: Post de 26/10. Segunda via: o resumo de outubro em chronological_list_of_events.md ("final destruction of the Calais Jungle").
- Imagem `assets/dd9301cff389/0*Y-iKmWuZhXXzwLbp.`: Silhuetas ao longe diante de fumaça e fogo, à noite; foto de abertura do post, sem legenda. Ninguém identificável. Recorte: [0, 0.13, 1, 0.87].
- Lugar: Calais [1.86, 50.95] (lon, lat). Trecho do post: Título "Calais children with nowhere to sleep". Mapa sem linha de fronteira, vista [2.0, 50.5, 14].

**7. `calais-conteineres`** · 2016-10-26 · Calais, France · October 2016
- Frase: "today’s and yesterday’s fires destroyed community centers, restaurants, and shelters" (84 caracteres, literal)
- Fonte: `posts/2016-10-27-children-left-without-shelter-after-large-fires-in-the-jungle-dd9301cff389.md`
- Número/fato e segunda via: Post de 26/10; o sujeito da frase original é uma organização, cortado.
- Imagem `assets/dd9301cff389/0*JahmGYRaxP4cg-mY.jpg`: Restos queimados e contêineres; crédito da foto é de uma organização (não exibido). Crédito de organização (não exibido): Hummingbird Project.
- Lugar: Calais [1.86, 50.95] (lon, lat). Trecho do post: Texto sobre as estruturas destruídas no Jungle.

**8. `calais-demolicao`** · 2016-10-28 · Calais, France · demolition, day 4
- Frase: "Vulnerable children slept under bridges, outside warehouses and in the Jungle camp itself" (89 caracteres, literal)
- Fonte: `posts/2016-10-29-ays-daily-news-digest-28-10-political-ping-pong-costing-the-most-vulnerable-ones-c57f67499f43.md`
- Número/fato e segunda via: Post de 28/10. Segunda via: o post de 24/10 cita "more than a 1000" menores registrados no censo, coerente com "children" ao relento.
- Imagem `assets/c57f67499f43/1*EcPJDnxyyGaHsHy0jB0D1Q.jpeg`: Esqueleto de bicicleta e barracões queimados (legenda "Calais Jungle demolition, day 4 (Photo: Abdul Afzali)"). Sem pessoas. Crédito exibido: Abdul Afzali.
- Lugar: Calais [1.86, 50.95] (lon, lat). Trecho do post: Legenda.


### Episódio 4

**9. `belgrado-armazem`** · 2017-01-09 · Belgrade, Serbia · January 2017
- Frase: "Inside the abandoned buildings near the train station." (54 caracteres, literal)
- Fonte: `posts/2017-01-09-ays-digest-09-01-if-you-are-cold-count-on-europe-to-steal-your-blanket-fd5399d4cd48.md`
- Número/fato e segunda via: É a legenda da foto, literal.
- Imagem `assets/fd5399d4cd48/1*U5uibhDz-gaCQ7e6C40b7A.jpeg`: Interior escuro de armazém abandonado com fogueira ao fundo, silhuetas distantes (Igor Čoko). Crédito exibido: Igor Čoko.
- Lugar: Belgrade [20.46, 44.82] (lon, lat). Trecho do post: Legenda: "near the train station", e o post trata do frio em Belgrado. Mapa: fronteira `HUN-SRB`, vista [20.5, 44.5, 16].

**10. `lesvos-neve`** · 2017-01-09 · Lesvos, Greece · January 2017
- Frase: "Lesvos. 14 cm of snow and still falling." (40 caracteres, literal)
- Fonte: `posts/2017-01-09-ays-digest-09-01-if-you-are-cold-count-on-europe-to-steal-your-blanket-fd5399d4cd48.md`
- Número/fato e segunda via: Legenda literal (Eric Kempson).
- Imagem `assets/fd5399d4cd48/1*YQRYoC5WfnnF-itUcI6igg.jpeg`: Caixas de roupa de bebê cobertas de neve. Sem pessoas. Crédito exibido: Eric Kempson.
- Lugar: Lesvos [26.5, 39.14] (lon, lat). Trecho do post: Legenda "Lesvos".

**11. `belgrado-fronteiras`** · 2017-01-14 · Belgrade, Serbia · January 2017
- Frase: "There are more than 8,500 stuck in Serbia now." (46 caracteres, literal)
- Fonte: `posts/2017-01-15-ays-daily-digest-14-01-2017-more-than-100-people-have-drowned-in-the-mediterranean-sea-91159c2a8308.md`
- Número/fato e segunda via: "more than 8,500 stuck in Serbia", post de 14/1/2017. Segunda via: o post de 9/1 diz "more than 7,500 people currently stranded" em Serbia, com capacidade de acolhimento ~6.000; mesma ordem.
- Imagem `assets/91159c2a8308/1*u_nb_HntNQ6sXmDGm3jiZA.jpeg`: Pichação "THE PROBLEM is BORDERS" em Belgrado, com uma figura de costas ao longe (Igor Čoko). Rosto não identificável. Crédito exibido: Igor Čoko.
- Lugar: Belgrade [20.46, 44.82] (lon, lat). Trecho do post: Legenda "Photo by Igor Čoko. Belgrade." e seção "Serbia".


### Episódio 5

**12. `mar-bote-vazio`** · 2018-01-15 · Central Mediterranean · January 2018
- Frase: "An empty dinghy found in the Mediterranean. 15/1/18." (52 caracteres, literal)
- Fonte: `posts/2018-01-16-ays-daily-digest-15-01-18-suicide-attacks-in-baghdad-show-iraq-is-no-safe-third-country-78c842933eb6.md`
- Número/fato e segunda via: Legenda literal. Segunda via: o texto do post repete "After coming across an empty dinghy in the Mediterranean, they still have found no bodies or survivors".
- Imagem `assets/78c842933eb6/1*c1vSsXRSWYyOGvOao0u5jg.jpeg`: Mar aberto com o bote vazio ao longe. Marca d'água da fotógrafa/organização cortada em script/monta_tour.py (recorte). Recorte: [0, 0, 1, 0.86]. Crédito de organização (não exibido): SOS Mediterranee.
- Lugar: Off Libya [13.2, 33.5] (lon, lat). Trecho do post: Legenda da capa: "...37 nautical miles off Libya". Coordenada aproximada (33,5 N, 13,2 L): 37 milhas ao norte da costa líbia; é do tour, não do post. Mapa sem linha de fronteira, vista [14, 35.0, 24].

**13. `mar-coletes`** · 2018-02-17 · Mediterranean · February 2018
- Frase: "people are still risking their lives in the Mediterranean to reach a place of safety" (84 caracteres, literal)
- Fonte: `posts/2018-02-18-ays-daily-digest-17-02-18-children-denied-school-on-the-greek-islands-17c148c899ff.md`
- Número/fato e segunda via: Sem número. Corte do início da frase.
- Imagem `assets/17c148c899ff/1*9hYtkRGFzdQGlyFqGa38lg.jpeg`: Bote preto encalhado e coletes alaranjados numa margem. Sem pessoas. Crédito é de uma organização (não exibido). Crédito de organização (não exibido): Refugee Rescue.
- Lugar: Mediterranean [12.0, 35.0] (lon, lat). Trecho do post: Seção "Sea": "people are still risking their lives in the Mediterranean".

**14. `mar-ondas`** · 2018-05-03 · Central Mediterranean · April 2018
- Frase: "100 people died in the sea in April" (35 caracteres, literal)
- Fonte: `posts/2018-05-04-ays-daily-digest-3-5-2018-protests-surrounding-tsiprass-visit-to-lesvos-2ffade346e81.md`
- Número/fato e segunda via: "100 people died in the sea in April" (post de 3/5/2018). Sem segunda via no arquivo (chronological_list_of_events.md não traz o número); registrado como número de uma só fonte.
- Imagem `assets/2ffade346e81/1*cTSuai1fMb8BeuBU2uOQBg.jpeg`: Ondas vistas do convés; corte à direita tira a boia com texto. Sem pessoas. Recorte: [0, 0, 0.78, 1]. Crédito de organização (não exibido): Sea-Watch.
- Lugar: Near Malta [14.51, 35.9] (lon, lat). Trecho do post: "According to Sea Watch near Malta, the sea is very bad these days". Coordenada: Malta.


### Episódio 6

**15. `vucjak-tendas`** · 2019-11-03 · Vučjak, Bosnia and Herzegovina · October 2019
- Frase: "bringing the population to 2,400 in October, vastly exceeding capacity" (70 caracteres, literal)
- Fonte: `posts/2019-11-03-ays-special-documenting-human-rights-violations-in-vučjak-camp-923607ace85d.md`
- Número/fato e segunda via: "2,400 in October". Segunda via: o post de 21/10/2019 diz "approximately 2400 people living in tents" depois de 1700 transferidos em 16/10.
- Imagem `assets/923607ace85d/1*3y7Yq3NcA5_KTmXy0WayYw.jpeg`: Fileiras de tendas brancas na encosta verde; duas figuras de costas ao longe (Thom Davies). Crédito exibido: Thom Davies.
- Lugar: Bihać [15.87, 44.81] (lon, lat). Trecho do post: Título/legenda "Vučjak camp near Bihać". Mapa: fronteira `BIH-HRV`, vista [16.5, 44.0, 16].

**16. `vucjak-agua-cortada`** · 2019-11-03 · Vučjak, Bosnia and Herzegovina · October 2019
- Frase: "On October 21st, local authorities ceased providing water to the camp." (70 caracteres, literal)
- Fonte: `posts/2019-11-03-ays-special-documenting-human-rights-violations-in-vučjak-camp-923607ace85d.md`
- Número/fato e segunda via: "On October 21st, local authorities ceased providing water to the camp." Literal.
- Imagem `assets/923607ace85d/1*HOTnYGlrWpJ_z3SwhtDFOA.jpeg`: Caixa d'água amarela pintada "WATER IS NOT FOR DRINK" sobre um prédio de tijolo (Thom Davies); duas pessoas pequenas, uma de costas. Crédito exibido: Thom Davies.
- Lugar: Bihać [15.87, 44.81] (lon, lat). Trecho do post: Mesmo post.

**17. `vucjak-tanques`** · 2019-11-03 · Vučjak, Bosnia and Herzegovina · 2019
- Frase: "Tanks filled with water daily in Vučjak. On them is written: “Please save water.”" (81 caracteres, literal)
- Fonte: `posts/2019-11-03-ays-special-documenting-human-rights-violations-in-vučjak-camp-923607ace85d.md`
- Número/fato e segunda via: Legenda literal.
- Imagem `assets/923607ace85d/1*AjUUXva5zycie7h6U6KMNw.jpeg`: Tanques azuis de água com a inscrição; três homens agachados, de costas (Thom Davies). Crédito exibido: Thom Davies.
- Lugar: Bihać [15.87, 44.81] (lon, lat). Trecho do post: Legenda.


### Episódio 7

**18. `evros-medidas`** · 2020-03-02 · Greek–Turkish border · March 2020
- Frase: "Emergency measures and live ammunition training at both land and sea borders with Turkey" (88 caracteres, literal)
- Fonte: `posts/2020-03-02-ays-weekend-digest-29-02-01-03-2020-greece-emergency-measures-and-live-ammo-training-at-border-73a737de9017.md`
- Número/fato e segunda via: Título da seção do post de 2/3/2020. Segunda via: o post de 11/3 descreve a tensão "between Turkey and Greece" no Evros.
- Imagem `assets/73a737de9017/1*KcBS7qVr351OPYALivh09w.jpeg`: Bandeira da UE atrás de arame farpado, a capa do post; a legenda original cita uma ONG, não usada.
- Lugar: Evros [26.36, 41.7] (lon, lat). Trecho do post: "in the Evros region and off the coast of Lesvos". Mapa: fronteira `GRC-TUR`, vista [26.5, 40.5, 14].

**19. `edirne-tendas`** · 2020-03-11 · Edirne, Turkey · March 2020
- Frase: "where approximately 9,000–20,000 people are stuck at the moment" (63 caracteres, literal)
- Fonte: `posts/2020-03-12-ays-daily-digest-11-03-2020-updates-from-the-ground-in-edirne-5af5bc8d25db.md`
- Número/fato e segunda via: "approximately 9,000–20,000 people are stuck" (post de 11/3/2020): faixa larga mantida com o "approximately". A frase sobre tendas foi trocada porque começava com "According to the first information".
- Imagem `assets/5af5bc8d25db/1*7AFxupMvH-KJ_bn55wXPBA.jpeg`: Barracas na areia à noite com uma figura embaçada ao longe. Crédito é do próprio AYS. Crédito de organização (não exibido): AYS.
- Lugar: Edirne [26.56, 41.68] (lon, lat). Trecho do post: "News from Edirne camp ... at the Turkish-Greek border".

**20. `moria-oliveiral`** · 2020-03-01 · Moria, Lesvos · March 2020
- Frase: "Over 15,000 people are living rough in tent city." (49 caracteres, literal)
- Fonte: `posts/2020-03-01-ays-special-lesvos-well-beyond-the-brink-this-is-what-we-know-so-far-7c11873e12f8.md`
- Número/fato e segunda via: "Over 15,000 people" (legenda do post de 1/3/2020). Segunda via: o post de 9/10/2019 conta 13.112 em Moria para uma capacidade de 3.000 e 15.333 em Lesvos; o texto do mesmo post fala em "past 20,000".
- Imagem `assets/7c11873e12f8/0*x-D7u77Oq9ARBBc5`: Roupa estendida numa cerca de arame com o acampamento ao fundo (@dfherman, mesma legenda). Trocou a vista ampla do mesmo post porque mostrava crianças em primeiro plano. Crédito exibido: Douglas F. Herman.
- Lugar: Moria [26.5, 39.14] (lon, lat). Trecho do post: Legenda "Olive Grove behind overcrowded Moria Camp, Lesvos".


### Episódio 8

**21. `moria-cinzas`** · 2020-09-10 · Moria, Lesvos · September 2020
- Frase: "Two days after the fire that destroyed Moria, people are still trying to salvage what they can" (94 caracteres, literal)
- Fonte: `posts/2020-09-11-ays-daily-digest-10-09-2020-moria-the-days-after-e762110f8ae1.md`
- Número/fato e segunda via: Post de 10/9/2020. Literal.
- Imagem `assets/e762110f8ae1/0*QGGu3ioVxBiBE0jZ.jpeg`: Árvores em chamas e roupas espalhadas no chão; sem pessoas (Angelos Christofilopoulos). Crédito exibido: Angelos Christofilopoulos.
- Lugar: Moria [26.5, 39.14] (lon, lat). Trecho do post: Título "Moria, the Days After". Mapa sem linha de fronteira, vista [26.0, 38.7, 12].

**22. `moria-campo-novo`** · 2020-09-13 · Lesvos, Greece · September 2020
- Frase: "That means that more than 10,000 people will still be without shelter." (70 caracteres, literal)
- Fonte: `posts/2020-09-14-ays-daily-digest-weekend-12-13-09-2020-protests-of-former-moria-residents-are-met-with-tear-gas-347f42bfebd1.md`
- Número/fato e segunda via: Sentença do post de 14/9 (resumo de 12-13/9): campo novo com cerca de 200 tendas de seis lugares, "the camp will only have a total capacity of 2000 people". Segunda via: o post de 10/9 dá "about 12,000 people" sem abrigo e o de 9/9 "up to 13,000".
- Imagem `assets/347f42bfebd1/1*N2FgYAjUJNrmo1IPFGmOPQ.jpeg`: Vista aérea do campo novo, tendas brancas enfileiradas, sem pessoas (legenda "The new camp structure", Giogos Moutafis). Substituiu a foto de pessoas dormindo na calçada, que poderia ser lida como corpos. Crédito exibido: Giogos Moutafis.
- Lugar: Kara Tepe, Lesvos [26.55, 39.12] (lon, lat). Trecho do post: Texto: "a new camp has been set up, north of Kara Tepe at an old shooting range". Coordenada aproximada.

**23. `moria-charge`** · 2020-09-10 · Moria, Lesvos · September 2020
- Frase: "There were deadly fires in the camp before, as recently as March" (64 caracteres, literal)
- Fonte: `posts/2020-09-11-ays-daily-digest-10-09-2020-moria-the-days-after-e762110f8ae1.md`
- Número/fato e segunda via: "as recently as March" (post de 10/9). Segunda via: o post de 17/3/2020 "Fire in Moria kills one child".
- Imagem `assets/e762110f8ae1/0*1IPPqcEUVt6joFvk`: Charge de Tjeerd Royaards, "The EU, summarized in one cartoon": lareira com "Camp Moria" em chamas. Desenho; sem pessoas reais. Crédito exibido: Tjeerd Royaards (cartoon).
- Lugar: Moria [26.5, 39.14] (lon, lat). Trecho do post: Texto do post.


### Episódio 9

**24. `turquia-muro`** · 2021-08-22 · Turkey–Iran border · August 2021
- Frase: "A 243-kilometre (151-mile) concrete wall, topped with barbed wire and surrounded by trenches" (92 caracteres, literal)
- Fonte: `posts/2021-08-23-ays-weekend-digest-21-22-8-21-the-crisis-of-solidarity-at-the-polish-belarusian-border-cb2f9d162a68.md`
- Número/fato e segunda via: "243-kilometre ... wall". Segunda via no mesmo parágrafo: "534-kilometre frontier with Iran", "156 kilometres have already been built". Km não aparece na tela além do que a frase diz.
- Imagem `assets/cb2f9d162a68/0*clbOcyCoX87DB3MB`: Muro de concreto e veículo blindado em paisagem de montanhas, soldados ao longe (sem crédito).
- Lugar: Turkey–Iran border [44.1, 39.5] (lon, lat). Trecho do post: Seção "TURKEY — Closing up with more walls". Mapa: fronteira `IRN-TUR`, vista [43.5, 38.8, 18].

**25. `evros-muro`** · 2021-08-22 · Evros, Greece · August 2021
- Frase: "There are 11 cameras which can see 15km into Turkish territory" (62 caracteres, literal)
- Fonte: `posts/2021-08-23-ays-weekend-digest-21-22-8-21-the-crisis-of-solidarity-at-the-polish-belarusian-border-cb2f9d162a68.md`
- Número/fato e segunda via: Frase literal. Mesmo post: "the infamous 25–27 km fence".
- Imagem `assets/cb2f9d162a68/0*t2X_m3fJX-zyrXIe`: Muro de aço no Evros; o logotipo do veículo de imprensa foi cortado. Recorte: [0, 0, 0.82, 0.84]. Crédito de organização (não exibido): Ethnos.
- Lugar: Evros [26.36, 41.6] (lon, lat). Trecho do post: Seção "GREECE — More walls and fences…".

**26. `polonia-soldados`** · 2021-10-15 · Poland–Belarus border · October 2021
- Frase: "on Thursday, it legalized pushbacks of people on the move from its borders" (74 caracteres, literal)
- Fonte: `posts/2021-10-17-ays-news-digest-15-10-21-poland-legalizes-pushbacks-e7140651e8b0.md`
- Número/fato e segunda via: Literal (post de 15/10/2021). Segunda via: "eighth person died" na Polônia-Belarus em outubro (chronological_list_of_events.md) após o sétimo citado neste post.
- Imagem `assets/e7140651e8b0/0*uN3OYpu-AfH7hiTu.jpeg`: Soldados poloneses entrando em caminhões, legenda "Polish soldiers in front of the border guard headquarters in Michalowo, Poland on October 11"; corte à direita tira a marca vertical da agência. Rostos de militares, não de pessoas em risco. Recorte: [0, 0, 0.94, 1]. Crédito de organização (não exibido): CNN.
- Lugar: Michałowo, Poland [23.62, 53.04] (lon, lat). Trecho do post: Legenda: Michałowo. Mapa: fronteira `BLR-POL`, vista [24.0, 52.5, 16].


### Episódio 10

**27. `ucrania-mapa`** · 2022-03-04 · Ukraine border crossings · March 2022
- Frase: "500,000 children among the 1,368,864 people who have fled Ukraine to neighbouring countries" (91 caracteres, literal)
- Fonte: `posts/2022-03-05-ays-news-digest-04-03-2022-temporary-protection-directive-reveals-double-standard-refugee-law-55c4be103ac2.md`
- Número/fato e segunda via: "500,000 children among the 1,368,864 people who have fled Ukraine" (post de 4/3/2022). A frase com "more than 600 thousand ... arrived to Poland" foi trocada: no original há um "[from Belarus]" editorial que o corte removeria. Segunda via: a tabela da própria página (ver cena seguinte).
- Imagem `assets/55c4be103ac2/0*o2xE21glBeP0ghpw.jpeg`: Mapa "UKRAINE Border crossing points" (Humanitarian Data Exchange); a linha de crédito inferior foi cortada. Recorte: [0, 0, 1, 0.93]. Crédito de organização (não exibido): Humanitarian Data Exchange.
- Lugar: Ukraine–Poland border [23.0, 49.8] (lon, lat). Trecho do post: Seção "Updates from the borders". Mapa: fronteira `POL-UKR`, vista [26.0, 49.5, 18].

**28. `ucrania-tabela`** · 2022-03-04 · Ukraine · March 2022
- Frase: "Refugee arrivals from Ukraine (since 24 February 2022), By Country and By Date" (78 caracteres, literal)
- Fonte: `posts/2022-03-05-ays-news-digest-04-03-2022-temporary-protection-directive-reveals-double-standard-refugee-law-55c4be103ac2.md`
- Número/fato e segunda via: Legenda literal da tabela. Número da tabela conferido por soma: 756.303+157.004+133.876+103.254+101.529+63.192+53.300+406 = 1.368.864, igual ao do texto. A tabela mostra Polônia com 756.303 em 4/3.
- Imagem `assets/55c4be103ac2/0*nCj-gTf50pgPyRDC.png`: Captura da tabela do ACNUR (rodapé cortado), sem pessoas. Recorte: [0, 0, 1, 0.95]. Crédito de organização (não exibido): UNHCR.
- Lugar: Ukraine–Poland border [23.0, 49.8] (lon, lat). Trecho do post: Legenda "Refugee arrivals from Ukraine (since 24 February 2022)".

**29. `ucrania-charge`** · 2022-03-04 · European Union · March 2022
- Frase: "worrying elements that set in law the discrimination we have witnessed and reported" (83 caracteres, literal)
- Fonte: `posts/2022-03-05-ays-news-digest-04-03-2022-temporary-protection-directive-reveals-double-standard-refugee-law-55c4be103ac2.md`
- Número/fato e segunda via: Corte da frase "...but contains worrying elements that set in law the discrimination we have witnessed and reported taking place against non white people". Sem número.
- Imagem `assets/55c4be103ac2/0*5kJoZfFlFsrVGPBM.jpeg`: Charge "Border control" de Emad Hajjaj (Cartoon Movement, 2/3/2022): cancela com escala de tons de pele. Crédito exibido: Emad Hajjaj (cartoon). Crédito de organização (não exibido): Cartoon Movement.
- Lugar: Ukraine–Poland border [23.0, 49.8] (lon, lat). Trecho do post: Texto do post e legenda.


### Episódio 11

**30. `pylos-barco`** · 2023-06-14 · Off Pylos, Greece · June 2023
- Frase: "It is thought that approximately 750 people were onboard the vessel, including around 100 children" (98 caracteres, literal)
- Fonte: `posts/2023-06-15-ays-news-digest-14-6-23-foul-play-as-hundreds-dead-after-greek-shipwreck-tragedy-ed5fdf891640.md`
- Número/fato e segunda via: "It is thought that approximately 750 people were onboard ... around 100 children": a ressalva fica (98 caracteres). Segunda via: o post de 14/7 diz "at least 600 people are still missing".
- Imagem `assets/ed5fdf891640/0*sNLzdj7Cmnuf_a3K.jpg`: Foto aérea do barco de pesca lotado, divulgada pela guarda costeira; centenas de pessoas minúsculas, nenhuma identificável. Pessoas em risco, vistas de muito longe; avaliado e mantido. Crédito de organização (não exibido): Hellenic Coast Guard.
- Lugar: Off Pylos [21.0, 36.4] (lon, lat). Trecho do post: "47 nautical miles off the coast of the island of Pylos". Coordenada aproximada do tour. Mapa sem linha de fronteira, vista [22.0, 37.5, 14].

**31. `pylos-berlim`** · 2023-07-14 · Berlin · July 2023
- Frase: "One month after the shipwreck off Pylos in Greece, from which at least 600 people are still missing" (99 caracteres, literal)
- Fonte: `posts/2023-07-15-ays-news-digest-14-07-23-a-month-after-the-pylos-shipwreck-d32d041a6bca.md`
- Número/fato e segunda via: "at least 600 people are still missing" (post de 14/7/2023). Segunda via: o post de 15/6 ("Up to 500 people may have died ... more than 100 people rescued ... 750 aboard").
- Imagem `assets/d32d041a6bca/1*M-lqTXqN5wiAgMdeIvZecA.jpeg`: Coluna da Vitória de Berlim com uma faixa; sem pessoas. O post diz "Protests also took place in Thessaloniki and Berlin".
- Lugar: Berlin [13.35, 52.52] (lon, lat). Trecho do post: Texto do post (Berlim).


### Episódio 12

**32. `samos-cerca`** · 2025-02-11 · Samos, Greece · February 2025 · the archive’s last post
- Frase: "Barbed-wire fences, internal fences and checkpoints create a prison-like environment." (85 caracteres, literal)
- Fonte: `posts/2025-02-11-phone-is-company-how-the-authorities-routinely-and-forcibly-remove-the-phones-of-people-on-the-37d25ea7c5ee.md`
- Número/fato e segunda via: Frase literal do post de 11/2/2025, o último do arquivo. Segunda via: o mesmo post fala de 59 depoentes.
- Imagem `assets/37d25ea7c5ee/0*dSQUlmQfbVxVgJmz`: Vista do centro de Samos através de uma cerca (© Sam Jubb). Crédito exibido: Sam Jubb.
- Lugar: Samos [26.98, 37.755] (lon, lat). Trecho do post: Legenda "Exterior view of the Samos CCAC". Mapa sem linha de fronteira, vista [26.5, 38.2, 15].

**33. `lesvos-coletes`** · 2020-03-01 · Lesvos, Greece · 2020
- Frase: "“Life-jacket Graveyard” near Molyvos, Lesvos." (45 caracteres, literal)
- Fonte: `posts/2020-03-01-ays-special-lesvos-well-beyond-the-brink-this-is-what-we-know-so-far-7c11873e12f8.md`
- Número/fato e segunda via: Legenda literal. Cena de memória: coletes deixados em Lesvos. Sem número.
- Imagem `assets/7c11873e12f8/0*uV5n6NBhodA77OOI`: Aterro de coletes salva-vidas (@dfherman). Objetos deixados; nenhuma pessoa. Crédito exibido: Douglas F. Herman.
- Lugar: Molyvos, Lesvos [26.17, 39.37] (lon, lat). Trecho do post: Legenda "near Molyvos, Lesvos". Mapa sem linha de fronteira, vista [26, 43.3, 74].

## Mapa

As fotos não têm GPS: a amostra do coordenador (400) e uma amostra própria (400 JPEG sorteados, 9 com algum EXIF e 0 com GPS) concordam; o Medium remove o EXIF. O lugar vem do texto do post, na coluna "Trecho do post" de cada cena acima, e a coordenada é do tour, marcada à mão: Idomeni 41,13 N 22,51 L; Calais 50,95 N 1,86 L; Belgrado 44,82 N 20,46 L; Lesvos/Moria 39,14 N 26,50 L; Bihać 44,81 N 15,87 L; Evros/Kastanies 41,70 N 26,36 L; Edirne 41,68 N 26,56 L; fronteira Turquia–Irã 39,5 N 44,1 L; Michałowo 53,04 N 23,62 L; fronteira Ucrânia–Polônia 49,8 N 23,0 L; Pylos 36,4 N 21,0 L ("47 nautical miles off" Pylos: o ponto é aproximado); Samos 37,755 N 26,98 L; Molyvos 39,37 N 26,17 L. Os pontos "Off Libya" (33,5 N 13,2 L), "Mediterranean" e Malta são aproximados e valem só como situação geral.

- **Dados**: Natural Earth (domínio público), países 1:50m e linhas de fronteira terrestre 1:50m, recortados para lon -12..60, lat 27..62, simplificados (0,02° nas linhas, 0,012° na terra) e embutidos em `tour/mapa.js` (~39 kB). Ceuta e Melilla vêm do 1:10m, porque o 1:50m não as tem. Crédito "Borders: Natural Earth (public domain)" no canto do mapa. Nada de MapLibre nem de tiles: SVG puro.
- O campo NAME das linhas do 1:50m vem vazio; o par de países de cada linha é achado espacialmente em `script/monta_mapa.py` (uma linha que junta três países é partida em pares).
- A fronteira externa da UE/Schengen (UE-27 mais Noruega, Suíça, Islândia e Liechtenstein, composição atual) tem traço um pouco mais marcado. Terra quase apagada.
- **O trecho aceso é a linha de fronteira do Natural Earth entre os dois países, não o traçado exato da cerca.** Cor fria (azul-acinzentado), sem vermelho.
- Os trechos acendem no ano em que o arquivo registra a cerca pela primeira vez (cumulativo). Só entram pares com fonte no arquivo; Croácia–Bósnia (pushbacks) aparece sem acender, porque o arquivo fala de pushbacks e não de cerca ali. Nenhum número de quilômetros de cerca aparece na tela.
- Em cada episódio a câmera aproxima, com zoom lento (viewBox), de um quadro regional (Bálcãs, Egeu, Canal da Mancha, Mediterrâneo central, Cáucaso, Polônia–Ucrânia), nunca da fronteira solta: a fronteira em foco aparece com os países vizinhos, nomeados em versalete discreto, e 1 ou 2 mares, só os que estão no quadro e sem se sobrepor. Ponto atual aceso e os anteriores apagados; não há linhas de rota. No fecho o mapa inteiro mostra todos os pontos (incluindo o Mediterrâneo central e a Polônia) com o ano ao lado, e as cercas acendendo de 2016 a 2025; Ceuta e Melilla ganham um anel e o nome. Em celular em pé o fecho usa um quadro mais fechado (lon 20, span 64) para os pontos não saírem da tela.
- A suíte confere: quadro regional (span >= 10 graus), 2 nomes ou mais dentro do quadro, nenhum elemento de rota, 1 ponto atual, e no fecho todos os pontos dentro da faixa, um ano por ponto e Ceuta e Melilla acesas.

### Cercas e muros acesos (par, ano, trecho que sustenta)

| Fronteira | Par NE | Ano aceso | Post | Trecho |
|---|---|---|---|---|
| Hungria–Sérvia | `HUN-SRB` | 2016 | `2016-04-28-ays-daily-news-digest-28-4-2016-7dec5fc22b9a.md` | "approaching the Hungarian border fence from the Serbian side"; 2016-07-01: "after Hungary built a fence to seal its border with Serbia" (set. 2015, anterior ao arquivo) |
| Hungria–Croácia | `HRV-HUN` | 2016 | `2016-10-02-ays-daily-digest-2-10-humanity-wins-in-hungary-26455e44497f.md` | "its current 500km razor wire fence that runs alongside its border with Croatia and Serbia" |
| Grécia–Macedônia do Norte (Idomeni) | `GRC-MKD` | 2016 | `2016-05-09-ays-daily-news-digest-9-5-2016-2cea79ea10d1.md` | "approached the barbed wire fence at the border between Greece and Macedonia" |
| Eslovênia–Croácia | `HRV-SVN` | 2016 | `2016-08-17-ays-digest-16-8-slovenia-and-bulgaria-trying-to-cut-off-refugee-routes-as-more-people-move-towards-e1a0f6f049ed.md` | legenda "Slovenian military is now reinforcing the razor wire fence on its border with Croatia"; 2016-06-19: "Slovenia is still fenced"; 2018-05-19: cerca "placed ... in 2015" |
| Bulgária–Turquia | `BGR-TUR` | 2016 | `2016-09-15-ays-news-digest-14-9-refugee-squat-notara-26-is-open-again-5d8c700a38c2.md` | "joint inspection of a fence equipped with razor wire at the Bulgarian border village" (fronteira com a Turquia); 2017-04-16: "Extension to Bulgaria-Turkey border fence" |
| Grécia–Turquia (Evros) | `GRC-TUR` | 2018 | `2018-05-07-ays-daily-digest-06-05-2018-a-syrian-man-caught-up-in-a-racist-attack-is-fighting-for-his-life-in-a3969af7f825.md` | "Greece created a barbed wire fence along the Evros River which borders with Turkey" (seis anos antes, ou seja 2012, antes do arquivo; 2018 é o primeiro registro). Depois: 2019-12 "new fence on the Evros border", 2020-10 "We are building the fence in Evros", 2021-08 "25–27 km fence" |
| Sérvia–Macedônia do Norte | `MKD-SRB` | 2020 | `2020-08-19-ays-daily-digest-18-08-20-why-women-are-hit-even-harder-by-the-lockdown-3c85c782fd7a.md` | "Serbia has erected a wire fence on the border with Northern Macedonia." |
| Turquia–Irã | `IRN-TUR` | 2021 | `2021-08-23-ays-weekend-digest-21-22-8-21-the-crisis-of-solidarity-at-the-polish-belarusian-border-cb2f9d162a68.md` | "A 243-kilometre (151-mile) concrete wall, topped with barbed wire ... along its 534-kilometre frontier with Iran. ... 156 kilometres have already been built" |
| Polônia–Belarus | `BLR-POL` | 2021 | `2021-10-17-ays-news-digest-15-10-21-poland-legalizes-pushbacks-e7140651e8b0.md` | "replace the temporary barbed wire that currently stands along much of the border"; o muro de €350m é só plano (não desenhado como cerca além do ano 2021) |
| Lituânia–Belarus | `BLR-LTU` | 2021 | `2021-11-06-ays-digest-5-11-21-protest-continues-in-tripoli-76b203487cda.md` | "Lithuania starts border fence build"; 2022-09-01: "completed its 550km long border fence to Belarus" |
| Letônia–Belarus | `BLR-LVA` | 2022 | `2022-09-17-ays-digest-17-09-22-murder-in-the-aegean-b74caf71c797.md` | "Border fence under construction in Latvia"; 2023-12-29: "newly-completed border fence along the 172 km Belarusian border". 2021-08-12 só diz que a Letônia "seems to be following the classic script ... including erection of fences", ambíguo, por isso 2022 |
| Ceuta (Espanha–Marrocos) | `Ceuta` | 2017 | `2017-02-21-ays-daily-digest-20-02-discrimination-expulsion-and-denial-of-rights-is-this-the-best-we-can-do-267df132530b.md` | "After about 500 migrants breached the fence between Morocco and the Spanish enclave of Ceuta"; 2018-01-10: "the 8-kilometre border at Ceuta, by climbing the border fences" |
| Melilla (Espanha–Marrocos) | `Melilla` | 2017 | `2017-10-04-ays-daily-digest-2-10-2017-spain-sentended-for-illegal-border-practices-36761f13f3a0.md` | "crossed the fence in Melilla" (fato de 2014 julgado em 2017); 2018-03-30: "the fence which surrounds the city"; 2018-10-22: "heavily fortified fences surrounding the Spanish enclave of Melilla" |

Fora, por falta de fonte no arquivo (busca por fence/wall/wire/barbed perto dos nomes dos dois países): Bulgária–Grécia (só uma menção a comparar extensão de cerca, 2018), Hungria–Romênia, Bulgária–Sérvia, Croácia–Bósnia (só pushbacks), Áustria (só um bispo recusando terra para uma cerca em 2016). Macedônia do Norte–Sérvia só aparece a partir de 2020.

## Descartado

- **Fotos com rosto identificável** (adultos ou crianças): protesto em Atenas de 9/4/2016 (capa do primeiro post), homens cozinhando na neve em Belgrado, família na floresta à noite (Polônia–Belarus), fila de Palanca na fronteira Moldova–Ucrânia (perfis visíveis e colete da ONU), captura 'Leaving the Jungle', crianças do Idomeni (carinho, trilhos, água), menina atingida por gás, imagens de Moria com crianças no mato, homem agachado com as mãos no rosto em Moria, guarda de fronteira com pessoas detidas no mato.
- **Fotos de lugar errado**: no post de 2/3/2020 as barracas queimadas e os bosques são do norte da França, não do Evros; no post de Calais de 27/10 havia um barco encalhado numa praia rochosa que não é Calais. Ficaram só a bandeira da UE com arame (capa do post) e imagens com legenda do lugar.
- **Marcas de organizações nos pixels**: o bote vazio (assinatura no canto, cortada), o muro do Evros (logotipo de jornal, cortado), os soldados poloneses (marca vertical da agência, cortada), a tabela do ACNUR e o mapa (rodapés cortados), fotos de navios de resgate com logotipo (descartadas).
- **Frases sem conferência de segunda via**: "100 people died in the sea in April" (só um post); "At least 576 children ... since 2014" foi descartada porque o resumo de outubro/2016 do arquivo fala em 600 crianças só em 2016 (definições diferentes); a cena do trilho vazio de Idomeni tinha só 540 px; a foto do catraca em Samos mostra rostos.
- **Frases com erro de digitação ou nome de ONG** no original: legenda "1200 police depoloyed" (trocada); "through through" (trocada); frases com Aquarius, Sea-Watch, InfoBus, MSF foram cortadas ou não usadas.

## Peso

index.html: 1.288.620 -> 1.288.771 bytes; timeline.html: 155.150 -> 155.301 bytes (só o botão e dois `<script defer>`). Em repouso a página carrega tour.js + som.js (~32 kB, adiados). Ao começar o tour carrega dados.js (21 kB) + mapa.js (40 kB) + 33 imagens webp (~3,1 MB); nada disso é embutido no HTML.

## Pontos fracos conhecidos

- A duração passa dos ~180 s por causa dos mapas.
- Crédito de organização não aparece na tela.
- A cena 'Calais/fogo' usa a foto de abertura do post, sem legenda; a ligação está registrada acima.
- `post.html` não abre por file:// (busca o .md com fetch); os links de fonte do tour só funcionam servidos por http. Limitação já existente do site.
- A foto aérea do barco em Pylos mostra centenas de pessoas em risco, minúsculas; avaliada e mantida.
- A coordenada do Mediterrâneo central é aproximada.
- Os números de 'Pylos' e 'Moria' variam entre posts (registrado).
- O mapa 50m é grosseiro nas pequenas fronteiras (Kosovo, Ceuta) e as cercas acesas são fronteiras, não traçados.
- Sem verificação auditiva da música em hardware real: a suíte só confirma que o AudioContext nasce depois do gesto.
