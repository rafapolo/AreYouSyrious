# Lugares nos posts: método, cobertura e descartes

Gera `map-data.js` (usado por `map.html`) com `python3 script/lugares.py`. Só biblioteca padrão, offline, determinístico
(~30 s). `python3 script/lugares.py --confere` valida só o gazetteer.

## Método

1. **Gazetteer versionado**: `design/lugares.json`, 427 entradas (304 cidades, 49 países, 30 campos, 20 pontos de fronteira, 14 ilhas,
   8 mares, 2 regiões). Cada uma tem nome, variantes ("Lesvos"/"Lesbos", "Bihać"/"Bihac", "Idomeni"/"Eidomeni"), país, `lon`/`lat`
   e `fonte`. A lista saiu dos cabeçalhos `#### Country` dos digests e das menções mais frequentes (contagem de palavras
   capitalizadas por post).
2. **Coordenadas, sempre de fonte, nunca de memória.**
   - Cidades e ilhas: título do Wikipedia em inglês (coordenadas do Wikidata, CC0), conferidas contra o Natural Earth
     *populated places* 1:10m (domínio público): onde os dois existem, a distância é < 0,25° (exceções verificadas à mão:
     Rhodes, a ilha contra a cidade; Augusta, Sicília contra EUA; Dimitrovgrad, Sérvia contra Rússia).
   - Moria, Nea Kavala, Pazarkule, Gruškovje-Macelj, Bardonecchia, Zeebrugge: item do Wikidata (Q30752848, Q12287988, Q6000881,
     Q108790308, Q9039, Q184383).
   - Países: ponto representativo do maior polígono dentro do quadro (Natural Earth 1:50m).
   - Nome de página do Wikipedia que cai em outro lugar é erro conhecido (o título "Kara Tepe" é do Uzbequistão): toda coordenada foi
     conferida contra o país esperado (≤ 4° de alguma cidade do país no Natural Earth).
   - Os pontos de seção do tipo `mar` não têm fonte de ponto único: usam o ponto do artigo do Wikipedia como âncora aproximada.
3. **Detecção** (`script/lugares.py`): cada post é limpo (links viram o texto, URLs e imagens saem, acentos e `ł/đ/ı/ß` normalizados,
   o rodapé "Converted Medium Post" sai) e a busca é por palavra inteira, nas formas escrita e MAIÚSCULA (cabeçalhos `#### LESVOS`).
   - **Contexto** (`ctx`/`sem`): variantes ambíguas só valem se o post também cita palavras do contexto (Lipa e Bira só com Bósnia/Bihać;
     Kos, Samos, Rhodes com Grécia/Egeu; Tripoli da Líbia só com Libya/Libyan, e a do Líbano com Lebanon sem Libya).
   - **Sufixos proibidos** (`nao_depois`): "Dublin Regulation/III/system", "Geneva Convention", "Rome Statute"...
   - **Frases** para homônimos de palavras comuns: "in Nice", "to Split", "Lake Van".
   - **Ruído removido** antes da busca: "Aegean Boat Report", "Refugee Support Aegean", "SOS Mediterranee" (nomes de organizações que
     dariam ~700 posts falsos ao Egeu e ao Mediterrâneo).
   - **Extras** (`extras`): campos e travessias sem coordenada verificável moram sob a cidade mais próxima, com contexto próprio:
     Bira, Lipa, Vučjak, Borići sob Bihać; Miral sob Velika Kladuša; Vial sob Chios; Pikpa e Kara Tepe sob Mytilene; Cutro e Steccato
     di Cutro sob Crotone; Oulx sob Bardonecchia; Kapıkule sob Edirne; Pournara sob Nicosia; Opatovac sob Tovarnik.
4. **Granularidade**: um post entra em todos os lugares específicos que cita. **País é só o último recurso**: se o post não cita
   nenhum lugar específico, entra nos países que cita (anel no mapa, não ponto).
5. **Fotos**: até 3 por (lugar, post), nesta ordem: imagens da seção do digest que cita o lugar, a capa do post, as demais. Só imagens
   locais que têm miniatura em `thumbs/` (as de facebook/scontent não existem no repositório).
6. **Saída**: `window.AYS_LUGARES = {posts, imgs, lugares}`; cada lugar leva `pp = [[índice do post, índices das imagens]]` em ordem
   cronológica. Posts e imagens são tabelas únicas, para o arquivo não repetir título nem caminho (2,0 MB; 0,7 MB com gzip).

## Cobertura (3.145 posts)

| | posts | % |
|---|---|---|
| com ao menos um lugar específico | 3.091 | 98,3 |
| só com país (fallback) | 23 | 0,7 |
| **com ao menos um lugar (específico ou país)** | **3.114** | **99,0** |
| sem nenhum | 31 | 1,0 |

Posts com 0, 1, 2, 3+ lugares: 31, 108, 105, 2.901. Por ano a cobertura é de 100% em 2016, 2017, 2022, 2023, 2024 e 2025, e
de 95% a 99,9% de 2018 a 2021. Dos 400 lugares que têm ao menos um post, os mais citados: Lesvos 2.054, Mediterranean Sea 1.732,
Athens 1.366, Moria 1.322, Samos 1.245, Chios 1.211, Calais 1.169, Aegean Sea 1.120, Paris 988, Mytilene 634.

**Os 31 posts sem lugar** (25 em 2019) são resumos semanais em persa/árabe/croata ("AYS خلاصه هفتگی", "Hrvatska “izgubila” djecu…")
e cartas/ensaios sem topônimo ("AYS SPECIAL: Christmas letter to fellow humans", "I will come to you, river"). Não há nome latino a
casar; a curva achatou: a rodada que levou de 98,2% a 99,0% foi sobretudo o fallback de país.

## Os 30 nomes frequentes que ficaram de fora

Contagem aproximada de posts com o nome capitalizado.

| nome | posts | por quê |
|---|---|---|
| Canary Islands / Canaries / Gran Canaria / Tenerife / Fuerteventura / Arguineguín | ~430 | fora do quadro do mapa (lon −15,4; o quadro vai de −12 a 64) |
| Northern Greece | 214 | região sem ponto; os posts entram pelas cidades e pelo país |
| Aegean Islands, Greek Islands | 188, 154 | idem |
| Northern France | 150 | idem |
| Balkan(s) / Balkan Route / Western Balkans | ~650 | região vaga; cada post entra pelos lugares específicos |
| Calabria | 129 | região italiana; entra por Crotone, Reggio Calabria etc. |
| Souda | 124 | ambíguo (campo em Chios, mas também baía em Creta); sem coordenada verificada |
| La Chapelle | 134 | bairro de Paris; os posts já entram por Paris |
| Attica / Attika | 115 | região grega; entra por Athens/Piraeus |
| Kent | 123 | condado; entra por Dover/Folkestone/Manston |
| Sahara | 107 | região vasta, sem ponto útil |
| Skala | 101 | ambíguo (várias localidades com esse nome) |
| Porin | 94 | não identificado com segurança (pode ser pessoa ou lugar); sem coordenada |
| Una Sana | 73 | cantão da Bósnia; casa com Bihać e Velika Kladuša |
| Exarchia | 81 | bairro de Atenas; entra por Athens |
| Victoria Square | 78 | praça de Atenas; entra por Athens |
| Softex | 67 | campo perto de Tessalônica, sem coordenada verificada |
| Katsikas | 64 | campo perto de Ioannina, sem coordenada verificada |
| Bavaria, Saxony | 70, 68 | estados alemães, sem ponto |
| Guardamar | 61 | ocorre sobretudo como nome de embarcação/serviço de salvamento; não é o lugar |
| Scotland | 56 | país constituinte, sem ponto útil |
| Mary, Gay, York, Reading | — | homônimos de nomes comuns, impossíveis de separar por regra |

## Outros descartes

Ver `descartados` em `design/lugares.json`: Brest da França (só a da Bielorrússia entra, com contexto), cidades afegãs (lon > 64),
Ellebæk, Kærshovedgård, Sjælsmark, Principovac, Ključ, Trnovi (sem coordenada conferida em fonte pública), organizações que
carregam topônimo no nome, tratados com nome de cidade. Entradas do gazetteer sem nenhum post (por exemplo Luxembourg como cidade)
simplesmente não saem em `dados.js`.

## Pontos fracos

- Nome citado não é lugar da história: "Berlin" numa lista de cidades de uma conferência conta como post. Contagem é de
  menção, não de relevância.
- Sobreposição visual: campo e cidade vizinhos (Idomeni, Gevgelija, Cherso) se cobrem; o índice em lista resolve.
- Variantes só em alfabeto latino; os resumos em persa/árabe não são lidos.
