#!/usr/bin/env python3
"""Detecta lugares citados nos posts e gera mapa/dados.js para a página do mapa.

Uso:
  python3 script/lugares.py            # gera mapa/dados.js e imprime a cobertura
  python3 script/lugares.py --confere  # só valida design/lugares.json (coordenadas no quadro, ids únicos, variantes)

Entrada: posts/*.md e o gazetteer versionado design/lugares.json (nome, variantes, país, [lon, lat], contexto).
Saída:   mapa/dados.js (window.AYS_LUGARES). Só biblioteca padrão; offline e determinístico.
Método e cobertura: design/lugares.md.
"""
import json, re, sys, unicodedata
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
GAZ = RAIZ / "design" / "lugares.json"
SAIDA = RAIZ / "mapa" / "dados.js"
MAX_FOTOS = 3

_TROCAS = str.maketrans({"ł": "l", "Ł": "L", "đ": "d", "Đ": "D", "ı": "i", "İ": "I", "ø": "o", "Ø": "O", "ħ": "h", "Ħ": "H",
                         "æ": "ae", "Æ": "AE", "ß": "ss", "’": "'", "‘": "'"})


def norm(s):
    """Sem acentos e com letras especiais trocadas, para casar "Bihać" com "Bihac". Mantém o tamanho da linha."""
    s = s.translate(_TROCAS)
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def padrao(termos):
    """Regex de palavra inteira, com a variante como escrita ou toda em maiúsculas (cabeçalhos `#### LESVOS`)."""
    alts = set()
    for t in termos:
        t = norm(t)
        for v in (t, t.upper()):
            alts.add(r"\s+".join(re.escape(p) for p in v.split()))
    return re.compile(r"(?<![\w])(?:" + "|".join(sorted(alts, key=len, reverse=True)) + r")(?![\w])")


def le_gazetteer():
    g = json.loads(GAZ.read_text(encoding="utf-8"))
    for l in g["lugares"]:
        # regras: a principal e as "extras" (nomes de campos e travessias que ficam sob a cidade mais próxima), cada uma com o seu contexto
        regras = [l] + l.get("extras", [])
        l["_regras"] = [{"re": padrao(r["variantes"]), "ctx": padrao(r["ctx"]) if r.get("ctx") else None,
                         "sem": padrao(r["sem"]) if r.get("sem") else None,
                         "nd": re.compile(r"\s*(?:" + "|".join(r["nao_depois"]) + r")\b") if r.get("nao_depois") else None} for r in regras]
    # pré-filtro: uma única regex com todas as variantes diz quais lugares podem estar no post
    g["_todas"] = padrao([v for l in g["lugares"] for r in [l] + l.get("extras", []) for v in r["variantes"]])
    g["_por_variante"] = {}
    for l in g["lugares"]:
        for r in [l] + l.get("extras", []):
            for v in r["variantes"]:
                g["_por_variante"].setdefault(norm(v).upper(), set()).add(l["id"])
    g["_ruido"] = [re.compile(r"(?<![\w])" + re.escape(norm(r)) + r"(?![\w])", re.I) for r in g.get("ruido", [])]
    return g


def confere(g):
    x0, y0, x1, y1 = g["quadro"]
    erros, ids, vistos = [], set(), {}
    for l in g["lugares"]:
        if l["id"] in ids:
            erros.append(f"id repetido: {l['id']}")
        ids.add(l["id"])
        lon, lat = l["lon"], l["lat"]
        if not (x0 <= lon <= x1 and y0 <= lat <= y1):
            erros.append(f"{l['id']}: fora do quadro ({lon}, {lat})")
        if not l.get("fonte"):
            erros.append(f"{l['id']}: sem fonte da coordenada")
        for v in l["variantes"] + [v for e in l.get("extras", []) for v in e["variantes"]]:
            k = norm(v).lower()
            if k in vistos and vistos[k] != l["id"] and not (l.get("ctx") or l.get("sem") or l.get("extras")):
                erros.append(f"variante '{v}' em {l['id']} e {vistos[k]}")
            vistos.setdefault(k, l["id"])
    return erros


RE_IMG = re.compile(r"!\[[^\]]*\]\(([^)\s]+)")
RE_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
RE_URL = re.compile(r"https?://\S+")


def le_post(arq):
    txt = arq.read_text(encoding="utf-8")
    fm, corpo = "", txt
    if txt.startswith("---"):
        _, fm, corpo = txt.split("---", 2)
    titulo = re.search(r"^title:\s*(.+)$", fm, re.M)
    titulo = titulo.group(1).strip().strip('"').strip("'") if titulo else arq.stem
    desc = re.search(r"^description:\s*(.*)$", fm, re.M)
    desc = (desc.group(1).strip().strip('"') if desc else "").replace("…", "").strip()
    if len(desc) > 130:
        desc = desc[:130].rsplit(" ", 1)[0] + "…"
    capa = re.search(r"^\s+path:\s*\.\./assets/(\S+)", fm, re.M)
    return titulo, (capa.group(1) if capa else None), corpo, desc


def imagem_local(ref):
    m = re.match(r"\.\./assets/([0-9a-f]+/[^/]+)$", ref)
    return m.group(1) if m and (RAIZ / "thumbs" / "assets" / m.group(1)).exists() else None


def limpa(linha, g):
    linha = RE_IMG.sub("", linha) if linha.lstrip().startswith("![") else linha
    linha = RE_LINK.sub(r"\1", linha)
    linha = RE_URL.sub(" ", linha)
    linha = norm(linha)
    for r in g["_ruido"]:
        linha = r.sub(" ", linha)
    return linha


def varre(g):
    posts, achados = [], []   # achados[i] = {id_lugar: [imagens em ordem de relevância]}
    for arq in sorted((RAIZ / "posts").glob("*.md")):
        titulo, capa, corpo, desc = le_post(arq)
        linhas = [l for l in corpo.splitlines() if not l.startswith("_Converted")]
        # seções: uma nova a cada cabeçalho; as imagens de uma seção são as do lugar que ela cita
        secoes, atual = [], {"linhas": [], "imgs": []}
        for l in [f"# {titulo}"] + linhas:
            if re.match(r"#{1,4}\s", l) and atual["linhas"]:
                secoes.append(atual)
                atual = {"linhas": [], "imgs": []}
            for ref in RE_IMG.findall(l):
                im = imagem_local(ref)
                if im:
                    atual["imgs"].append(im)
            atual["linhas"].append(limpa(l, g))
        secoes.append(atual)
        todo = "\n".join(l for s in secoes for l in s["linhas"])
        capa_ok = capa if capa and (RAIZ / "thumbs" / "assets" / capa).exists() else None
        todas = [i for s in secoes for i in s["imgs"]]
        cands = set()
        for m in g["_todas"].finditer(todo):
            cands |= g["_por_variante"].get(re.sub(r"\s+", " ", m.group(0)).upper(), set())

        def acha(fallback):
            ach = {}
            for lug in g["lugares"]:
                if lug["id"] not in cands or bool(lug.get("fallback")) != fallback:
                    continue
                regras = [r for r in lug["_regras"] if not (r["ctx"] and not r["ctx"].search(todo)) and not (r["sem"] and r["sem"].search(todo))]
                if not regras:
                    continue
                fotos, achou = [], False
                for s in secoes:
                    txt = "\n".join(s["linhas"])
                    if any(not (r["nd"] and r["nd"].match(txt, m.end())) for r in regras for m in r["re"].finditer(txt)):
                        achou = True
                        fotos += [i for i in s["imgs"] if i not in fotos]
                if not achou:
                    continue
                for i in ([capa_ok] if capa_ok else []) + todas:
                    if len(fotos) >= MAX_FOTOS:
                        break
                    if i not in fotos:
                        fotos.append(i)
                ach[lug["id"]] = fotos[:MAX_FOTOS]
            return ach

        # país só como último recurso: para o post que não cita nenhum lugar específico
        ach = acha(False) or acha(True)
        posts.append((arq.stem, arq.stem[:10], titulo, desc))
        achados.append(ach)
    return posts, achados


def main():
    g = le_gazetteer()
    erros = confere(g)
    if erros:
        sys.exit("gazetteer inválido:\n  " + "\n  ".join(erros))
    if "--confere" in sys.argv:
        print(f"ok: {len(g['lugares'])} lugares, todos dentro do quadro {g['quadro']}")
        return
    posts, achados = varre(g)
    por_lugar = {l["id"]: [] for l in g["lugares"]}
    for i, ach in enumerate(achados):
        for lid, fotos in ach.items():
            por_lugar[lid].append((i, fotos))
    usados = sorted({i for l in por_lugar.values() for i, _ in l})
    remap = {old: new for new, old in enumerate(usados)}
    imgs, img_ix = [], {}
    saida_l = []
    for l in g["lugares"]:
        pp = por_lugar[l["id"]]
        if not pp:
            continue
        lista = []
        for i, fotos in pp:                      # os posts já vêm em ordem de data (nome do arquivo começa pela data)
            ix = []
            for f in fotos:
                if f not in img_ix:
                    img_ix[f] = len(imgs); imgs.append(f)
                ix.append(img_ix[f])
            lista.append([remap[i]] + ix)
        saida_l.append({"id": l["id"], "n": l["nome"], "p": l["pais"], "t": l["tipo"], "x": l["lon"], "y": l["lat"],
                        "c": len(pp), "pp": lista})
    saida_l.sort(key=lambda l: -l["c"])
    obj = {"v": 1, "quadro": g["quadro"], "posts": [list(posts[i]) for i in usados], "imgs": imgs, "lugares": saida_l}
    SAIDA.parent.mkdir(exist_ok=True)
    SAIDA.write_text("/* gerado por script/lugares.py a partir de posts/ e design/lugares.json: não editar.\n   posts: [arquivo sem .md, data, título, resumo]; "
                     "imgs: caminhos em thumbs/assets/; lugares[].pp: [índice do post, até 3 índices de imagem]. */\n"
                     "window.AYS_LUGARES = " + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    # relatório
    n = len(posts)
    com = len(usados)
    print(f"lugares no gazetteer: {len(g['lugares'])}; com ao menos um post: {len(saida_l)}")
    print(f"posts: {n}; com ao menos um lugar: {com} ({100 * com / n:.1f}%)")
    dist = Counter(len(a) for a in achados)
    print("lugares por post (0,1,2,3+):", dist[0], dist[1], dist[2], sum(v for k, v in dist.items() if k >= 3))
    por_ano = Counter(); tot_ano = Counter()
    for (stem, d, t, _), a in zip(posts, achados):
        tot_ano[d[:4]] += 1
        if a:
            por_ano[d[:4]] += 1
    print("por ano:", " ".join(f"{y}:{por_ano[y]}/{tot_ano[y]}" for y in sorted(tot_ano)))
    print("mais citados:", ", ".join(f"{l['n']} {l['c']}" for l in saida_l[:25]))
    print("sem nenhum post:", ", ".join(l["nome"] for l in g["lugares"] if not por_lugar[l["id"]]) or "nenhum")
    print(f"{SAIDA.relative_to(RAIZ)}: {SAIDA.stat().st_size // 1024} kB, {len(imgs)} imagens distintas")


if __name__ == "__main__":
    main()
