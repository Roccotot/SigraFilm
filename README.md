\# Sigra Film – Ticketing semplice



\## Requisiti

\- Node 18+



\## Setup locale

```bash

cp .env.example .env

npm install

npx prisma migrate dev --name init

npm run seed

npm run dev

```



Credenziali di prova:

\- Admin: `admin` / `admin123` (o quelle impostate in .env)

\- Cinema: `cinema\_demo` / `cinema123`



\## Deploy su Vercel

1\. Fai push su GitHub.

2\. Su Vercel: \*New Project\* → importa la repo.

3\. Variabili ambiente (Project Settings → Environment Variables):

&nbsp;  - `JWT\_SECRET` (stringa casuale lunga)

&nbsp;  - `ADMIN\_USERNAME`, `ADMIN\_PASSWORD`

&nbsp;  - `DATABASE\_URL` \*\*(usa un Postgres/Supabase)\*\*

4\. Cambia `prisma/schema.prisma` per usare `postgresql` su Supabase:

```prisma

datasource db {

&nbsp; provider = "postgresql"

&nbsp; url      = env("DATABASE\_URL")

}

```

5\. Esegui una migrazione (puoi creare una \*deployment hook\* o lanciare una migrazione da locale puntando al DB remoto):

```bash

\# locale ma con DATABASE\_URL del DB remoto

npx prisma migrate deploy

```



\## Sicurezza e note

\- Cambia subito `ADMIN\_PASSWORD` e `JWT\_SECRET`.

\- Le password sono hashate con bcrypt.

\- Le pagine usano SSR per leggere l’utente dal cookie.

\- Le API proteggono le operazioni admin.



\## Personalizzazioni

\- Aggiungi campi al Ticket (foto, allegati, contatti…).

\- Filtri/ricerca nel pannello admin.

\- Notifiche email/Telegram all’arrivo di un ticket.



