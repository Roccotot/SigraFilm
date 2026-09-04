# Sito Sigra Film

Sito statico pubblicato con GitHub Pages: <https://roccotot.github.io/SigraFilm/>

Tutto il sito è un solo file, `index.html`, con CSS e JavaScript incorporati.
Non serve compilare niente: quello che è nel ramo è quello che va online.

```
index.html                      la pagina (CSS e JS inclusi)
img/                            logo e immagini fisse
caroselli/                      le foto della galleria
  didascalie.txt                i testi sotto le foto
strumenti/aggiorna_galleria.py  rigenera la galleria
.github/workflows/galleria.yml  la fa rigenerare da sola su GitHub
```

## Aggiungere foto alla galleria

**Dal browser, senza installare niente:**

1. Vai in [`caroselli/`](../../tree/main/caroselli) su GitHub.
2. **Add file → Upload files**, trascina le foto, **Commit changes**.
3. Aspetta un minuto. Un'automazione genera le versioni leggere,
   aggiorna `index.html` e ricommitta da sola. Puoi seguirla nella
   scheda **Actions**.

Le foto compaiono in ordine alfabetico di nome file: **la prima occupa il
riquadro grande** della griglia. Per cambiare l'ordine basta rinominarle
(`C1.jpg`, `C2.jpg`, …).

Per togliere una foto: cancella l'originale (il `.jpg`). Le versioni
generate spariscono da sole.

### Le didascalie

Il testo che appare passando sopra una foto si scrive in
[`caroselli/didascalie.txt`](caroselli/didascalie.txt), una riga per foto:

```
C1.jpg = Sala cinema · impianto di proiezione
```

Una foto senza riga qui riceve una didascalia ricavata dal nome del file
(`arena_estiva-2.jpg` → «Arena estiva 2»), quindi conviene comunque
scriverla: è anche il testo che leggono i non vedenti e i motori di ricerca.

### Formati e dimensioni

Vanno bene `.jpg`, `.jpeg` e `.png`. **Carica pure i file grandi appena
scaricati dalla macchina fotografica**: lo script genera da solo una copia
da 720 px per la griglia e una da 1400 px per l'ingrandimento, e la pagina
carica solo quelle. Le foto scattate col telefono vengono raddrizzate
automaticamente in base all'orientamento.

I dati EXIF **non** finiscono online: le copie generate non li riportano,
quindi posizione GPS e modello del telefono restano fuori dal sito.

### Se preferisci farlo dal computer

```bash
pip install pillow
python3 strumenti/aggiorna_galleria.py
```

Poi committa `caroselli/` e `index.html`. Lo script è ripetibile: rilanciarlo
non rifà il lavoro già fatto.

## Le altre immagini

- `img/logo_sigra.png` — il logo, usato nell'intestazione, nel piè di pagina
  e come icona della scheda del browser.
- `img/banner_cinema*.{jpg,webp}` — lo sfondo della testata.
- `img/Logos-1280px-2-1.{jpg,webp}` — la tabella dei marchi.

Se sostituisci una di queste, rigenera anche le versioni `-960` / `-1600` /
`.webp` che le affiancano, oppure chiedi e si aggiorna il codice.
