#!/usr/bin/env python3
"""
Controlla che il foglio di stile di index.html sia integro.

    python3 strumenti/verifica_css.py

Nasce da un guasto vero: una modifica ha cancellato per intero il blocco
RESPONSIVE, e il sito ha mostrato per ore il layout da schermo grande sui
telefoni, tagliato a destra. Nessuna prova se n'era accorta, perché tutte
misuravano il comportamento e nessuna la struttura.

Controlla anche che i tag di blocco si chiudano con il tag giusto: una
<figure> chiusa con </div> il browser la corregge in silenzio, quindi il
sito sembra a posto mentre l'HTML è rotto — è già successo.

Verifica quattro cose che un errore del genere rompe sempre:
  - le graffe si chiudono (una in più o in meno fa scartare al browser
    tutto quello che segue, senza alcun errore visibile);
  - ci sono tutte le media query attese;
  - ci sono le regole dei componenti che senza stile finirebbero in mezzo al
    testo invece che al loro posto;
  - i tag di blocco aperti e chiusi si pareggiano.

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
    "@media (min-width: 700px)",              # carosello: due lastre per volta
    "@media (min-width: 1080px)",             # carosello: tre lastre per volta
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
    ".carosello",       # carosello della galleria
    ".carosello-pista",
    ".car-btn",         # comandi del carosello
    ".g-item",          # lastre della galleria
    ".gamma-quadro",    # gamma Barco su fondo nero
    ".laser-card",      # schede degli aggiornamenti laser
    ".laser-foto",
    ".footer-legal",    # dati d'impresa
    ".diag",            # pannello di diagnosi
]


# Tag di blocco che, chiusi con quello sbagliato, il browser sistema da sé
# senza dire niente
TAG = ["section", "figure", "article", "picture", "dl", "nav", "footer", "main"]


def tag_sbilanciati(html: str) -> list:
    fuori = []
    for t in TAG:
        apre = len(re.findall(rf"<{t}[\s>]", html))
        chiude = len(re.findall(rf"</{t}>", html))
        if apre != chiude:
            fuori.append(f"<{t}>: {apre} aperti, {chiude} chiusi")
    return fuori


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

    guasti += tag_sbilanciati(re.sub(r"<!--.*?-->", "", s, flags=re.S))

    if guasti:
        print("Pagina NON integra:")
        for g in guasti:
            print(f"  - {g}")
        sys.exit(1)

    print(f"Pagina integra: {aperte} blocchi di stile, {len(ATTESE)} media query, "
          f"{len(REGOLE)} componenti e {len(TAG)} tipi di tag bilanciati.")


if __name__ == "__main__":
    main()
