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
strumenti/aggiorna_mappa.py     riallinea mappa e numeri all'inventario
.github/workflows/galleria.yml  fa rigenerare la galleria da sola su GitHub
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

## La mappa di copertura

La sezione «Dove operiamo» mostra un punto per ogni struttura seguita —
🎬 al chiuso, ☀️ arene estive — **senza nomi, senza città e con le coordinate
arrotondate a circa un chilometro**. Racconta il territorio coperto, non quali
sale sono clienti.

I dati arrivano dall'inventario del
[Support-Tool](https://github.com/Roccotot/Support-Tool). Quando l'inventario
cambia, per riallineare mappa e numeri del sito:

```bash
git clone https://github.com/Roccotot/Support-Tool ../Support-Tool   # una volta sola
python3 strumenti/aggiorna_mappa.py ../Support-Tool/index.html
```

Lo script riscrive da solo, dentro `index.html`, le coordinate della mappa, i
quattro numeri della sezione «Chi siamo» e i conteggi della legenda. Poi basta
committare `index.html`.

La mappa usa Leaflet (da CDN) e le mattonelle di OpenStreetMap, caricati solo
quando la sezione sta per entrare in vista. Le mattonelle OSM sono chiare:
vengono portate sul fondo scuro del sito con un filtro CSS applicato al solo
piano delle mattonelle, così i marcatori restano dei colori giusti.

Non serve nessuna chiave: OpenStreetMap chiede solo l'attribuzione, che compare
in basso a destra sulla mappa. Se un domani il traffico crescesse molto, la
policy d'uso di OSM chiede di passare a un fornitore di mattonelle proprio.

Se la CDN non risponde, al posto della mappa compare una riga di testo con il
totale delle strutture.

## Le altre immagini

- `img/logo_sigra.png` — il logo, usato nell'intestazione, nel piè di pagina
  e come icona della scheda del browser.
- `img/banner_cinema*.{jpg,webp}` — lo sfondo della testata.
- `img/Logos-1280px-2-1.{jpg,webp}` — la tabella dei marchi.

Se sostituisci una di queste, rigenera anche le versioni `-960` / `-1600` /
`.webp` che le affiancano, oppure chiedi e si aggiorna il codice.
