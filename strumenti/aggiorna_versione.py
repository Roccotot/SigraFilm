#!/usr/bin/env python3
"""
Marca index.html con la data e l'ora di pubblicazione.

    python3 strumenti/aggiorna_versione.py

Serve a capire in un istante quale copia della pagina sta vedendo un browser:
se il numero in fondo al sito non è quello appena pubblicato, quel browser sta
servendo una versione vecchia dalla cache.

La data viene scritta in tre punti, tutti da qui, così non possono discordare:
il commento a inizio file, l'attributo data-versione su <html> e la riga
visibile nel piè di pagina.
"""

from datetime import datetime, timezone
from pathlib import Path
import re
import sys

PAGINA = Path(__file__).resolve().parent.parent / "index.html"


def main():
    versione = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    s = PAGINA.read_text(encoding="utf-8")

    sostituzioni = [
        (r"<!-- versione [^>]*-->", f"<!-- versione {versione} UTC -->", "il commento"),
        (r'(<html lang="it" data-versione=")[^"]*(")', rf"\g<1>{versione}\g<2>", "l'attributo su <html>"),
        (r'(<span class="footer-ver" id="versione">)[^<]*(</span>)',
         rf"\g<1>v. {versione} UTC\g<2>", "la riga nel piè di pagina"),
    ]

    for cerca, metti, cosa in sostituzioni:
        s, n = re.subn(cerca, metti, s, count=1)
        if n != 1:
            sys.exit(f"Non trovo dove scrivere {cosa} in index.html")

    PAGINA.write_text(s, encoding="utf-8")
    print(f"Versione marcata: {versione} UTC")


if __name__ == "__main__":
    main()
