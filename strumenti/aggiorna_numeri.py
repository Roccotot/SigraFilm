#!/usr/bin/env python3
"""
Aggiorna i numeri del sito a partire dall'inventario del Support-Tool.

    python3 strumenti/aggiorna_numeri.py [percorso/del/Support-Tool/index.html]

Senza argomenti cerca una copia del Support-Tool accanto a questa cartella.

Dal file legge le righe "Coord" dei tre elenchi (cinema in VPN, cinema su
rete locale, arene estive), che valgono una per struttura, e riscrive dentro
index.html i quattro numeri della sezione "Chi siamo" e le sale contate
nell'occhiello della testata.

Si chiamava aggiorna_mappa.py e riscriveva anche le coordinate della mappa di
copertura: la mappa non c'è più. Dal Support-Tool non esce nulla che dica
quali sale sono clienti, solo dei conteggi.
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
        "  python3 strumenti/aggiorna_numeri.py ../Support-Tool/index.html\n"
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

    n_chiusi, n_estivi = len(chiusi), len(estivi)
    print(f"  cinema al chiuso : {n_chiusi}")
    print(f"  arene estive     : {n_estivi}")
    print(f"  sale             : {n_sale}")

    pagina = PAGINA.read_text(encoding="utf-8")

    anni = 2026 - 1954
    for valore, etichetta in ((anni, "anni"), (n_chiusi, "chiusi"),
                              (n_estivi, "estivi"), (n_sale, "sale")):
        pagina = sostituisci(
            pagina,
            r'(<div class="stat-number" data-dato="' + etichetta +
            r'" data-target=")\d+(")',
            lambda m, v=valore: m.group(1) + str(v) + m.group(2),
            f'il numero "{etichetta}"')

    pagina = sostituisci(
        pagina, r'(<b data-dato="hero-sale">)\d+(</b>)',
        lambda m: m.group(1) + str(n_sale) + m.group(2), "le sale nella testata")
    PAGINA.write_text(pagina, encoding="utf-8")
    print("\nindex.html aggiornato: i quattro numeri e le sale in testata.")


if __name__ == "__main__":
    main()
