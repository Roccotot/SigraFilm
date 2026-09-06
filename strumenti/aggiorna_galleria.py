#!/usr/bin/env python3
"""
Aggiorna la galleria del sito a partire dalle immagini in caroselli/.

Per ogni foto originale (.jpg/.jpeg/.png) genera due versioni WebP —
una per la griglia e una per l'ingrandimento — e riscrive il blocco
della galleria dentro index.html.

    python3 strumenti/aggiorna_galleria.py

Le didascalie si scrivono in caroselli/didascalie.txt, una per riga:

    C1.jpg = Sala cinema · impianto di proiezione

Le foto senza didascalia ne ricevono una ricavata dal nome del file.
L'ordine in pagina è quello alfabetico dei nomi: la prima occupa il
riquadro grande. Rinominare i file cambia l'ordine.
"""

from pathlib import Path
import html
import re
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Manca Pillow. Installalo con:  pip install pillow")

RADICE     = Path(__file__).resolve().parent.parent
CAROSELLI  = RADICE / "caroselli"
PAGINA     = RADICE / "index.html"
DIDASCALIE = CAROSELLI / "didascalie.txt"

ESTENSIONI = {".jpg", ".jpeg", ".png"}
LARG_GRIGLIA, QUAL_GRIGLIA = 720, 78      # miniatura nella griglia
LARG_GRANDE,  QUAL_GRANDE  = 1400, 80     # versione ingrandita

INIZIO = "<!-- GALLERIA:INIZIO -->"
FINE   = "<!-- GALLERIA:FINE -->"


def ordine_naturale(p: Path):
    """C2 prima di C10, non dopo."""
    return [int(t) if t.isdigit() else t.lower()
            for t in re.split(r"(\d+)", p.name)]


def foto_originali():
    if not CAROSELLI.is_dir():
        sys.exit(f"Cartella non trovata: {CAROSELLI}")
    return sorted(
        (f for f in CAROSELLI.iterdir()
         if f.is_file() and f.suffix.lower() in ESTENSIONI),
        key=ordine_naturale,
    )


def leggi_didascalie():
    testo = {}
    if DIDASCALIE.is_file():
        for riga in DIDASCALIE.read_text(encoding="utf-8").splitlines():
            riga = riga.strip()
            if not riga or riga.startswith("#") or "=" not in riga:
                continue
            nome, _, didascalia = riga.partition("=")
            testo[nome.strip()] = didascalia.strip()
    return testo


# Parole che un nome di file generato da telefono o macchina fotografica porta
# con sé e che non dicono nulla di quello che si vede
RUMORE = {"whatsapp", "image", "images", "img", "dsc", "dscn", "pxl", "photo",
          "foto", "immagine", "screenshot", "schermata", "at", "copia", "copy"}

RIPIEGO = "Installazione Sigra Film"


def didascalia_di(foto, tabella):
    """Il testo sotto la foto, che è anche quello letto da chi non vede."""
    if foto.name in tabella:
        return tabella[foto.name]

    # Dal nome del file: "sala_grande-2.jpg" -> "Sala grande 2"
    parole = [x for x in re.split(r"[\s_\-.]+", foto.stem) if x]
    utili = [x for x in parole if not x.isdigit() and x.lower() not in RUMORE]

    # "WhatsApp Image 2026-08-27 at 20.28.37" non descrive niente: meglio una
    # riga neutra che un nome di file esposto sul sito e letto ad alta voce
    # dagli screen reader. Resta il segnale per scriverne una vera.
    if not utili:
        return RIPIEGO

    grezzo = " ".join(parole)
    return grezzo[:1].upper() + grezzo[1:]


def genera(foto, larghezza, qualita, suffisso):
    """Crea la versione ridotta se manca o se l'originale è più recente."""
    uscita = foto.with_name(f"{foto.stem}-{suffisso}.webp")
    if uscita.exists() and uscita.stat().st_mtime >= foto.stat().st_mtime:
        with Image.open(uscita) as im:
            return uscita, im.size, False

    with Image.open(foto) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")   # raddrizza le foto da telefono
        larg = min(larghezza, im.width)
        alt  = round(im.height * larg / im.width)
        ridotta = im.resize((larg, alt), Image.LANCZOS)
        # Il salvataggio non riporta i dati EXIF: niente GPS né modello del telefono online
        ridotta.save(uscita, format="WEBP", quality=qualita, method=6)
    return uscita, (larg, alt), True


def pulisci(originali):
    """Elimina le versioni ridotte rimaste orfane."""
    attese = set()
    for f in originali:
        attese.add(f"{f.stem}-{LARG_GRIGLIA}.webp")
        attese.add(f"{f.stem}-{LARG_GRANDE}.webp")
    rimosse = []
    for f in CAROSELLI.glob("*.webp"):
        if f.name not in attese:
            f.unlink()
            rimosse.append(f.name)
    return rimosse


def blocco_html(voci):
    righe = [INIZIO]
    for i, (foto, mini, dim_mini, grande, didascalia) in enumerate(voci):
        d = html.escape(didascalia, quote=True)
        primo = ' loading="eager"' if i == 0 else ' loading="lazy"'
        righe += [
            f'      <button class="g-item" type="button" data-full="caroselli/{grande.name}"'
            f' data-full-fallback="caroselli/{foto.name}" data-caption="{d}">',
            f'        <picture>',
            f'          <source type="image/webp" srcset="caroselli/{mini.name}">',
            f'          <img src="caroselli/{foto.name}" alt="{d}"'
            f' width="{dim_mini[0]}" height="{dim_mini[1]}"{primo} decoding="async">',
            f'        </picture>',
            f'        <span class="g-caption">{d} <span class="zoom" aria-hidden="true">⤢</span></span>',
            f'      </button>',
        ]
    righe.append(f"      {FINE}")
    return "\n".join(righe)


def main():
    originali = foto_originali()
    if not originali:
        sys.exit(f"Nessuna immagine in {CAROSELLI} (estensioni ammesse: "
                 f"{', '.join(sorted(ESTENSIONI))})")

    tabella = leggi_didascalie()
    voci, nuove = [], 0
    for foto in originali:
        mini,   dim_mini, fatta1 = genera(foto, LARG_GRIGLIA, QUAL_GRIGLIA, LARG_GRIGLIA)
        grande, _,        fatta2 = genera(foto, LARG_GRANDE,  QUAL_GRANDE,  LARG_GRANDE)
        nuove += fatta1 + fatta2
        voci.append((foto, mini, dim_mini, grande, didascalia_di(foto, tabella)))
        marca = "nuova" if (fatta1 or fatta2) else "già pronta"
        print(f"  {foto.name:<28} {marca}")

    rimosse = pulisci(originali)
    for nome in rimosse:
        print(f"  rimossa versione orfana: {nome}")

    pagina = PAGINA.read_text(encoding="utf-8")
    if INIZIO not in pagina or FINE not in pagina:
        sys.exit(f"Segnaposti {INIZIO} / {FINE} non trovati in index.html")

    prima = pagina[:pagina.index(INIZIO)]
    dopo  = pagina[pagina.index(FINE) + len(FINE):]
    aggiornata = prima + blocco_html(voci).lstrip() + dopo

    if aggiornata == pagina:
        print(f"\n{len(voci)} immagini — index.html era già aggiornato.")
    else:
        PAGINA.write_text(aggiornata, encoding="utf-8")
        print(f"\n{len(voci)} immagini in galleria — index.html aggiornato.")
    if nuove:
        print(f"{nuove} versioni WebP generate.")


if __name__ == "__main__":
    main()
