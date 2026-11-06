#!/usr/bin/env python3
"""Monta o tour: valida design/tour.json contra os posts, gera tour/img/*.webp e tour/dados.js.

Uso: python3 script/monta_tour.py [--so-validar]
Dependência: Pillow (só para redimensionar as imagens).
"""
import json, re, sys, unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TOUR = RAIZ / "design" / "tour.json"
SAIDA = RAIZ / "tour"
LARGURA = 1280
QUALIDADE = 78
MIN_LARGURA = 480          # nunca amplia; abaixo disso a imagem não serve
LIMITE_FRASE = 100
LIMITE_PESO = 6 * 1024 * 1024
ONGS = ["MSF", "UNHCR", "IOM", "Frontex", "Red Cross", "Sea-Watch", "Sea Watch", "SOS", "Open Arms",
        "Alarm Phone", "Amnesty", "Human Rights Watch", "HRW", "BVMN", "I Have Rights", "Care4Calais",
        "Refugee Info Bus", "InfoBus", "Help Refugees", "Doctors Without Borders", "Save the Children",
        "UNICEF", "Aquarius", "Refugee Rescue", "Maydayterraneo", "Hummingbird"]


def norma(t):
    t = unicodedata.normalize("NFC", t)
    t = t.replace("\\", "")
    t = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", t)   # [texto](url) -> texto
    t = t.replace("&amp;", "&")
    return re.sub(r"\s+", " ", t).strip()


def texto_do_post(nome):
    return norma((RAIZ / "posts" / nome).read_text(encoding="utf-8"))


def pares_do_mapa():
    t = (SAIDA / "mapa.js").read_text(encoding="utf-8")
    return set(re.findall(r'"p":"([A-Z]{3}-[A-Z]{3})"', t))


PARES = set()


def valida(cenas):
    global PARES
    PARES = pares_do_mapa()
    erros = []
    for c in cenas:
        t = texto_do_post(c["fonte"])
        fr = norma(c["frase"])
        for pedaço in [p.strip() for p in fr.split("…") if p.strip()]:
            if pedaço not in t:
                erros.append(f"{c['id']}: frase não está literal em {c['fonte']}: {pedaço!r}")
        if len(c["frase"]) > LIMITE_FRASE:
            erros.append(f"{c['id']}: frase com {len(c['frase'])} caracteres")
        for o in ONGS:
            if re.search(r"\b" + re.escape(o) + r"\b", c["frase"] + " " + c["kicker"] + " " + c["credito"]):
                erros.append(f"{c['id']}: cita organização ({o})")
        if c.get("traducao"):
            erros.append(f"{c['id']}: traducao deveria ser false")
        lon, lat = c["coord"]
        if not (-12 <= lon <= 48 and 27 <= lat <= 62) or not c.get("lugar"):
            erros.append(f"{c['id']}: lugar/coord ausente ou fora do mapa")
        if c.get("mapa") and c["mapa"]["fronteira"] and c["mapa"]["fronteira"] not in PARES:
            erros.append(f"{c['id']}: fronteira {c['mapa']['fronteira']} sem linha em tour/mapa.js")
        if not (RAIZ / c["imagem"]).exists():
            erros.append(f"{c['id']}: imagem não existe {c['imagem']}")
    return erros


def imagens(cenas):
    from PIL import Image
    (SAIDA / "img").mkdir(parents=True, exist_ok=True)
    total = 0
    for i, c in enumerate(cenas):
        im = Image.open(RAIZ / c["imagem"])
        im = im.convert("RGB")
        if "recorte" in c:
            x0, y0, x1, y1 = c["recorte"]
            w, h = im.size
            im = im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))
        if im.width < MIN_LARGURA:
            raise SystemExit(f"{c['id']}: imagem estreita demais ({im.width}px)")
        if im.width > LARGURA:
            im = im.resize((LARGURA, round(im.height * LARGURA / im.width)), Image.LANCZOS)
        if im.height > 1400:
            im = im.resize((round(im.width * 1400 / im.height), 1400), Image.LANCZOS)
        destino = SAIDA / "img" / f"{i + 1:02d}-{c['id']}.webp"
        im.save(destino, "WEBP", quality=QUALIDADE, method=6)
        c["_arq"] = f"img/{destino.name}"
        c["_dim"] = list(im.size)
        total += destino.stat().st_size
    return total


def main():
    cenas = json.loads(TOUR.read_text(encoding="utf-8"))
    erros = valida(cenas)
    if erros:
        print("\n".join(erros)); sys.exit(1)
    print(f"{len(cenas)} cenas validadas, {sum(c['duracao_ms'] for c in cenas) / 1000:.0f} s")
    if "--so-validar" in sys.argv:
        return
    for f in (SAIDA / "img").glob("*.webp"):
        f.unlink()
    total = imagens(cenas)
    saida = []
    for c in cenas:
        saida.append({
            "id": c["id"], "ep": c["ep"], "ms": c["duracao_ms"], "data": c["data"], "kicker": c["kicker"],
            "frase": c["frase"], "fonte": c["fonte"], "img": c["_arq"], "dim": c["_dim"],
            "credito": c["credito"], "lugar": c["lugar"], "coord": c["coord"], "mapa": c.get("mapa"), "silencio": c.get("silencio", False), "legivel": c.get("legivel", False), "ajuste": c.get("ajuste", "cover"), "foco": c.get("foco", [0.5, 0.5]),
        })
    (SAIDA / "dados.js").write_text(
        "/* gerado por script/monta_tour.py a partir de design/tour.json: não editar */\n"
        "window.AYS_TOUR = " + json.dumps(saida, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"imagens: {total / 1024 / 1024:.2f} MB em {len(cenas)} arquivos")
    if total > LIMITE_PESO:
        print("ACIMA DO LIMITE DE 6 MB"); sys.exit(1)


if __name__ == "__main__":
    main()
