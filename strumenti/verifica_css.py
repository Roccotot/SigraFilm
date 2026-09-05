#!/usr/bin/env python3
"""
Controlla che il foglio di stile di index.html sia integro.

    python3 strumenti/verifica_css.py

Nasce da un guasto vero: una modifica ha cancellato per intero il blocco
RESPONSIVE, e il sito ha mostrato per ore il layout da schermo grande sui
telefoni, tagliato a destra. Nessuna prova se n'era accorta, perché tutte
misuravano il comportamento e nessuna la struttura.

Verifica tre cose che un errore del genere rompe sempre:
  - le graffe si chiudono (una in più o in meno fa scartare al browser
    tutto quello che segue, senza alcun errore visibile);
  - ci sono tutte le media query attese;
  - ci sono le regole dei componenti che senza stile finirebbero in mezzo al
    testo invece che al loro posto.

La terza voce è nata al secondo guasto: la prima versione controllava solo
graffe e media query, e non si accorse che era sparita l'intera sezione delle
azioni flottanti. La barra Chiama/WhatsApp/Email è finita online come tre
link sottolineati in mezzo al piè di pagina.
"""

from pathlib import Path
import re
import sys

PAGINA = Path(__file__).resolve().parent.parent / "index.html"

ATTESE = [
    "@media (max-width: 980px)",              # griglie che passano a due colonne
    "@media (max-width: 820px)",              # telefono: menu, barra azioni, tasto chiamata
    "@media (max-width: 520px)",              # schermi molto stretti
    "@media (min-width: 900px)",              # griglia asimmetrica della galleria
    "@media (prefers-reduced-motion: reduce)",
    "@media print",
]

# Componenti che senza le loro regole non scompaiono: restano in pagina
# senza stile, in mezzo al contenuto. Sono i guasti che si notano di più.
REGOLE = [
    "#to-top",          # pulsante torna in cima
    ".quickbar",        # barra Chiama / WhatsApp / Email su telefono
    ".quickbar a",
    ".nav-drawer",      # menu a tendina
    ".nav-tel",         # tasto chiamata su telefono
    ".pulviscolo",      # strato dei granelli luminosi
    ".lb-btn",          # comandi dell'ingranditore foto
    ".g-item",          # riquadri della galleria
    ".footer-legal",    # dati d'impresa
    ".diag",            # pannello di diagnosi
]


def main():
    s = PAGINA.read_text(encoding="utf-8")
    m = re.search(r"<style>(.*?)</style>", s, re.S)
    if not m:
        sys.exit("Nessun blocco <style> in index.html")

    css = re.sub(r"/\*.*?\*/", "", m.group(1), flags=re.S)   # via i commenti
    guasti = []

    aperte, chiuse = css.count("{"), css.count("}")
    if aperte != chiuse:
        guasti.append(f"graffe sbilanciate: {aperte} aperte, {chiuse} chiuse")

    for q in ATTESE:
        if q not in css:
            guasti.append(f"manca {q}")

    for r in REGOLE:
        # cerca il selettore a inizio riga seguito da graffa o da virgola
        if not re.search(r"(?m)^\s*" + re.escape(r) + r"\s*[{,]", css):
            guasti.append(f"manca la regola {r}")

    if guasti:
        print("Foglio di stile NON integro:")
        for g in guasti:
            print(f"  - {g}")
        sys.exit(1)

    print(f"Foglio di stile integro: {aperte} blocchi, {len(ATTESE)} media query "
          f"e {len(REGOLE)} componenti al loro posto.")


if __name__ == "__main__":
    main()
