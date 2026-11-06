#!/usr/bin/env python3
"""Gera tour/mapa.js: fronteiras (linhas de fronteira terrestre do Natural Earth, domínio público) recortadas para a
Europa e o Mediterrâneo, simplificadas, e a terra quase apagada, para o mapa do tour. Rodar só quando mudar o recorte.

Uso: python3 script/monta_mapa.py [pasta com os shapefiles do Natural Earth]
Dependências (só para gerar): geopandas, shapely. Fonte: https://www.naturalearthdata.com (1:50m; 1:10m só para
Ceuta e Melilla, que o 1:50m não tem).
Cada linha do Natural Earth liga dois países; o par é achado espacialmente (o campo NAME vem vazio no 1:50m).
"""
import io, json, re, sys, urllib.request, zipfile
from pathlib import Path
import geopandas as gpd
from shapely.geometry import box, LineString, MultiLineString
from shapely.ops import linemerge

RAIZ = Path(__file__).resolve().parent.parent
PASTA = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/ne_ays")
URL = "https://naciscdn.org/naturalearth/%s/cultural/ne_%s_admin_0_%s.zip"
LON0, LON1, LAT0, LAT1 = -12, 60, 27, 62
KX, KY = 14, 20                       # unidades por grau: x = (lon+12)*14, y = (62-lat)*20
UE = set("AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE"
         " NOR CHE ISL LIE".split())
# Pares com cerca ou barreira registrada no arquivo; o ano é o primeiro em que um post a registra (ver design/tour.md)
CERCAS = {"HUN-SRB": 2016, "HRV-HUN": 2016, "GRC-MKD": 2016, "HRV-SVN": 2016, "BGR-TUR": 2016, "GRC-TUR": 2018,
          "MKD-SRB": 2020, "IRN-TUR": 2021, "BLR-POL": 2021, "BLR-LTU": 2021, "BLR-LVA": 2022}


def baixa(escala, nome):
    PASTA.mkdir(parents=True, exist_ok=True)
    alvo = PASTA / f"ne_{escala}_admin_0_{nome}.shp"
    if not alvo.exists():
        d = urllib.request.urlopen(URL % (escala, escala, nome), timeout=120).read()
        zipfile.ZipFile(io.BytesIO(d)).extractall(PASTA)
    return gpd.read_file(alvo)


def d_path(g, tol, topo=False):
    g = g.simplify(tol, preserve_topology=topo) if tol else g
    partes = []
    geoms = getattr(g, "geoms", [g])
    for ln in geoms:
        if ln.is_empty:
            continue
        sub = ln.geoms if hasattr(ln, "geoms") else [ln]
        for s in sub:
            cs = list(s.coords) if s.geom_type == "LineString" else list(s.exterior.coords)
            if len(cs) < 2:
                continue
            pts = [(round((x - LON0) * KX), round((LAT1 - y) * KY)) for x, y in cs]
            seg, ant = f"M{pts[0][0]} {pts[0][1]}", pts[0]
            for p in pts[1:]:
                if p != ant:
                    seg += f"l{p[0]-ant[0]} {p[1]-ant[1]}"; ant = p
            partes.append(seg)
    return "".join(partes)


def main():
    caixa = box(LON0, LAT0, LON1, LAT1)
    paises = baixa("50m", "countries")
    linhas = baixa("50m", "boundary_lines_land")
    paises = paises[paises.intersects(caixa)].copy()
    paises["geometry"] = paises.geometry.intersection(caixa)
    terra = d_path(paises.unary_union.buffer(0), 0.012, True)
    cod = "ADM0_A3" if "ADM0_A3" in paises.columns else "ISO_A3"
    linhas = linhas[linhas.intersects(caixa)].copy()
    linhas["geometry"] = linhas.geometry.intersection(caixa)
    saida = []
    for _, l in linhas.iterrows():
        g = l.geometry
        if g.is_empty or g.length == 0:
            continue
        v = paises[paises.geometry.buffer(0.08).intersects(g)]
        viz = []
        for _, p in v.iterrows():
            zona = p.geometry.buffer(0.08)
            if g.intersection(zona).length / g.length > 0.15:
                viz.append((p[cod], zona))
        for i in range(len(viz)):
            for j in range(i + 1, len(viz)):
                pedaco = g.intersection(viz[i][1]).intersection(viz[j][1])
                if pedaco.is_empty or pedaco.length < 0.05:
                    continue
                par = sorted([viz[i][0], viz[j][0]])
                saida.append({"p": "-".join(par), "e": int((par[0] in UE) != (par[1] in UE)), "d": d_path(pedaco, 0.02)})
    achados = {s["p"] for s in saida}
    falta = [c for c in CERCAS if c not in achados]
    if falta:
        raise SystemExit(f"pares de cerca sem linha no Natural Earth: {falta}")
    # Ceuta e Melilla: só no 1:10m
    l10 = baixa("10m", "boundary_lines_land")
    extra = {}
    for nome, (x, y) in {"Ceuta": (-5.31, 35.89), "Melilla": (-2.94, 35.29)}.items():
        c = box(x - 0.12, y - 0.12, x + 0.12, y + 0.12)
        g = l10[l10.intersects(c)].geometry.intersection(c)
        g = g[~g.is_empty]
        extra[nome] = {"ano": 2017, "d": d_path(MultiLineString([s for gg in g for s in getattr(gg, "geoms", [gg])]), 0)}
    obj = {"kx": KX, "ky": KY, "lon0": LON0, "lat1": LAT1, "w": (LON1 - LON0) * KX, "h": (LAT1 - LAT0) * KY,
           "terra": terra, "lin": saida, "cercas": CERCAS, "extra": extra}
    out = RAIZ / "tour" / "mapa.js"
    out.write_text("/* gerado por script/monta_mapa.py. Natural Earth (domínio público): países 1:50m e linhas de fronteira "
                   "1:50m (Ceuta e Melilla: 1:10m).\n   Cada linha é a fronteira entre dois países, não o traçado de uma cerca. */\n"
                   "window.AYS_MAPA = " + json.dumps(obj, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"{len(saida)} linhas, {sum(s['e'] for s in saida)} externas à UE/Schengen, {out.stat().st_size // 1024} kB")


if __name__ == "__main__":
    main()
