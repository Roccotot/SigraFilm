#!/usr/bin/env python3
"""
Aggiorna la mappa di copertura e i numeri del sito a partire dall'inventario
del Support-Tool.

    python3 strumenti/aggiorna_mappa.py [percorso/del/Support-Tool/index.html]

Senza argomenti cerca una copia del Support-Tool accanto a questa cartella.

Dal file legge le righe "Coord" dei tre elenchi (cinema in VPN, cinema su
rete locale, arene estive) e riscrive dentro index.html:

  - le coordinate della mappa, fra i segnaposti MAPPA:INIZIO / MAPPA:FINE
  - i quattro numeri della sezione "Chi siamo"
  - i conteggi nella legenda della mappa e nell'occhiello della testata

Sul sito NON finiscono né i nomi né le città: solo un punto per struttura,
arrotondato a due decimali (circa un chilometro), così la mappa racconta il
territorio coperto senza indicare quale sala è cliente.
"""

from pathlib import Path
import re
import sys

RADICE = Path(__file__).resolve().parent.parent
PAGINA = RADICE / "index.html"

CANDIDATI = [
    RADICE.parent / "roccotot" / "support-tool" / "index.html",
    RADICE.parent / "Support-Tool" / "index.html",
    RADICE.parent / "support-tool" / "index.html",
]

INIZIO, FINE = "/* MAPPA:INIZIO */", "/* MAPPA:FINE */"
PASSO = 0.004          # scarto fra punti che cadrebbero esattamente sovrapposti


def sorgente() -> Path:
    if len(sys.argv) > 1:
        p = Path(sys.argv[1]).expanduser()
        if not p.is_file():
            sys.exit(f"File non trovato: {p}")
        return p
    for p in CANDIDATI:
        if p.is_file():
            return p
    sys.exit(
        "Non trovo l'index.html del Support-Tool. Passalo come argomento:\n"
        "  python3 strumenti/aggiorna_mappa.py ../Support-Tool/index.html\n"
        "Oppure clonalo accanto a questa cartella:\n"
        "  git clone https://github.com/Roccotot/Support-Tool ../Support-Tool"
    )


def elenchi(testo: str) -> dict:
    fuori = {}
    for nome in ("RAW", "RAW_NOVPN", "RAW_ESTIVI"):
        m = re.search(r"const\s+" + nome + r"\s*=\s*`(.*?)`", testo, re.S)
        if not m:
            sys.exit(f"Elenco {nome} non trovato nel Support-Tool.")
        fuori[nome] = m.group(1)
    return fuori


def coordinate(blocco: str) -> dict:
    """{(nome, città): (lat, lng)} — le chiavi servono solo a deduplicare."""
    fuori = {}
    for riga in blocco.splitlines():
        campi = riga.split("\t")
        etichetta = [x.strip() for x in campi[0].split(" - ")]
        if len(etichetta) == 3 and etichetta[2] == "Coord" and len(campi) >= 2:
            try:
                lat, lng = (float(x) for x in campi[1].split(","))
            except ValueError:
                continue
            fuori[(etichetta[0], etichetta[1])] = (lat, lng)
    return fuori


def sale(blocco: str) -> set:
    return {tuple(x.strip() for x in r.split("\t")[0].split(" - ")[:3])
            for r in blocco.splitlines()
            if len(r.split("\t")[0].split(" - ")) == 4}


def sparpaglia(punti):
    """Arrotonda e separa i punti che finirebbero esattamente uno sull'altro."""
    visti, fuori = {}, []
    for lat, lng in punti:
        chiave = (round(lat, 2), round(lng, 2))
        n = visti.get(chiave, 0)
        visti[chiave] = n + 1
        if n == 0:
            fuori.append(chiave)
        else:                                  # spirale corta attorno al punto
            import math
            ang = n * 2.399963                 # angolo aureo: distribuisce bene
            r = PASSO * (1 + n * 0.35)
            fuori.append((round(chiave[0] + r * math.cos(ang), 4),
                          round(chiave[1] + r * math.sin(ang), 4)))
    return fuori


def sostituisci(testo, vecchio_re, nuovo, cosa):
    nuovo_testo, n = re.subn(vecchio_re, nuovo, testo, count=1)
    if n != 1:
        sys.exit(f"Non riesco ad aggiornare {cosa} in index.html.")
    return nuovo_testo


def main():
    src = sorgente()
    print(f"Inventario letto da: {src}")
    b = elenchi(src.read_text(encoding="utf-8"))

    chiusi = {**coordinate(b["RAW"]), **coordinate(b["RAW_NOVPN"])}
    estivi = coordinate(b["RAW_ESTIVI"])
    n_sale = len(sale(b["RAW"]) | sale(b["RAW_NOVPN"]))

    pc = sparpaglia(chiusi.values())
    pe = sparpaglia(estivi.values())
    print(f"  cinema al chiuso : {len(pc)}")
    print(f"  arene estive     : {len(pe)}")
    print(f"  sale             : {n_sale}")

    def lista(punti):
        return "[" + ",".join(f"[{la},{ln}]" for la, ln in punti) + "]"

    dati = (f"{INIZIO}\n"
            f"  var CHIUSI = {lista(pc)};\n"
            f"  var ESTIVI = {lista(pe)};\n"
            f"  {FINE}")

    pagina = PAGINA.read_text(encoding="utf-8")
    if INIZIO not in pagina or FINE not in pagina:
        sys.exit(f"Segnaposti {INIZIO} / {FINE} non trovati in index.html")
    prima = pagina[:pagina.index(INIZIO)]
    dopo = pagina[pagina.index(FINE) + len(FINE):]
    pagina = prima + dati + dopo

    anni = 2026 - 1954
    for valore, etichetta in ((anni, "anni"), (len(pc), "chiusi"),
                              (len(pe), "estivi"), (n_sale, "sale")):
        pagina = sostituisci(
            pagina,
            r'(<div class="stat-number" data-dato="' + etichetta +
            r'" data-target=")\d+(")',
            lambda m, v=valore: m.group(1) + str(v) + m.group(2),
            f'il numero "{etichetta}"')

    pagina = sostituisci(
        pagina, r'(<b data-dato="legenda-chiusi">)\d+(</b>)',
        lambda m: m.group(1) + str(len(pc)) + m.group(2), "la legenda al chiuso")
    pagina = sostituisci(
        pagina, r'(<b data-dato="legenda-estivi">)\d+(</b>)',
        lambda m: m.group(1) + str(len(pe)) + m.group(2), "la legenda estivi")
    pagina = sostituisci(
        pagina, r'(<b data-dato="hero-sale">)\d+(</b>)',
        lambda m: m.group(1) + str(n_sale) + m.group(2), "le sale nella testata")
    pagina = sostituisci(
        pagina, r'(<span data-dato="totale-strutture">)\d+(</span>)',
        lambda m: m.group(1) + str(len(pc) + len(pe)) + m.group(2),
        "il totale delle strutture")

    PAGINA.write_text(pagina, encoding="utf-8")
    print("\nindex.html aggiornato: mappa, numeri e legenda.")


if __name__ == "__main__":
    main()
