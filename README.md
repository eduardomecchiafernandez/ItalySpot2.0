# ItalySpot 2.0

Portale interattivo e leggero per esplorare i monumenti italiani: una mappa MapLibre per la navigazione e modelli 3D originali caricati da Sketchfab o da file GLB locali tramite React Three Fiber.

## Stack principale

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 3 + Framer Motion per UI e animazioni
- React Three Fiber + Drei per la scena 3D
- MapLibre GL per la mappa interattiva
- PostgreSQL + Prisma come database locale dei monumenti

## Setup rapido

Prerequisiti: Node.js 18+, npm 9+, PostgreSQL attivo, (opzionale) un token API Sketchfab per scaricare i modelli originali in locale.

```bash
cp .env.example .env.local
# modifica DATABASE_URL in base alle tue credenziali Postgres

npm install
npx prisma migrate dev --name init
npx prisma db seed
# (opzionale) Scarica i modelli GLB con licenza CC direttamente da Sketchfab
# export SKETCHFAB_TOKEN=...
npm run models:fetch
npm run dev
```

L’app sarà disponibile su [http://localhost:3000](http://localhost:3000).

> I modelli originali vengono caricati direttamente da Sketchfab tramite iframe. Se vuoi servirli da locale (per lavorare offline o evitare richieste a terze parti) puoi lanciare `npm run models:fetch` con un token Sketchfab e troverai i file in `public/models/original`.

## Script utili

- `npm run dev` – avvia il server di sviluppo Next.js
- `npm run build` – build di produzione
- `npm start` – avvia la build prodotta
- `npm run lint` – esegue ESLint
- `npm run format` / `npm run format:write` – controlla o applica Prettier
- `npm run prisma:generate` – rigenera il client Prisma (utile dopo aggiornamenti allo schema)
- `npm run models:fetch` – scarica i GLB originali dai modelli Sketchfab (serve `SKETCHFAB_TOKEN`)

### Modelli 3D originali da Sketchfab

1. Genera un token personale da [https://sketchfab.com/settings/password](https://sketchfab.com/settings/password) e impostalo come variabile d’ambiente `SKETCHFAB_TOKEN`.
2. Lancia `npm run models:fetch` per salvare i file `.glb` in `public/models/original`.
3. Se vuoi servirli direttamente dall’app (anziché dall’iframe ufficiale) aggiorna il campo `modelUrl` del monumento — via seed, API `/api/import` o Prisma Studio — puntando a `/models/original/<slug>.glb`.
4. In assenza del file locale, il viewer continuerà ad integrare l’embed ufficiale di Sketchfab grazie allo `sketchfabUid`.

## API interne

| Endpoint                | Metodo | Descrizione                                                                           |
| ----------------------- | ------ | ------------------------------------------------------------------------------------- |
| `/api/monuments`        | GET    | Restituisce la lista sintetica dei monumenti (id, name, slug, lat, lon, city, region) |
| `/api/monuments/[slug]` | GET    | Dettaglio completo del monumento, inclusi `modelUrl` e `sketchfabUid` per il viewer 3D |
| `/api/import`           | POST   | Script backend per importare/aggiornare monumenti da Wikidata/OpenStreetMap           |

Per l’import è necessario inviare un payload JSON con la lista di monumenti:

```jsonc
{
  "monuments": [
    {
      "name": "Colosseo",
      "slug": "colosseo",
      "city": "Roma",
      "region": "Lazio",
      "modelUrl": "/models/colosseum.glb",
      "sketchfabUid": "a416564e36fb450594c45b1bce119188"
    },
  ],
}
```

Il backend arricchisce automaticamente descrizione, epoca e coordinate recuperandole da Wikidata/OSM, quindi salva/aggiorna i dati nel database.

## Struttura essenziale

```
italyspot-2.0/
├─ public/models/           # Modelli GLB facoltativi scaricati da Sketchfab (script models:fetch)
├─ prisma/schema.prisma     # Schema Prisma per la tabella monument
├─ src/pages/               # Pagine Next.js (map index + dettaglio 3D)
├─ src/components/          # Componenti UI e React Three Fiber
├─ src/lib/api.ts           # Funzioni per interrogare Wikidata e OpenStreetMap
├─ src/server/              # Accesso centralizzato a Prisma
├─ src/data/monuments.ts    # Seed di monumenti base
└─ scripts/generate-models.mjs # Script per rigenerare i modelli low-poly
```

## Note progettuali

- La home mostra la mappa dell’Italia basata su MapLibre con marker animati: cliccando un monumento si apre l’`AvatarCard` con descrizione e link al viewer 3D dedicato (`/monument/[slug]`).
- Le pagine dettaglio caricano il modello `.glb` (se presente in locale) oppure integrano automaticamente l’iframe ufficiale di Sketchfab sfruttando lo `sketchfabUid`; è previsto un fallback statico se WebGL non è disponibile.
- Tailwind segue la palette beige/ocra/verde salvia, con Playfair Display per i titoli e Inter per il testo.
- Prisma gestisce i dati locali; il seed ora carica undici monumenti completi di coordinate e `sketchfabUid`.

## Deploy su Vercel

Per il deploy su Vercel:

1. Configura la variabile d’ambiente `DATABASE_URL` (puoi usare un database Postgres esterno come Neon o Supabase).
2. Esegui le migrazioni con `npx prisma migrate deploy`.
3. (Opzionale) Avvia lo script `npm run prisma:generate` come step di build.

L’app è pensata per essere deployata in modalità serverless; le API interne vengono gestite da Next.js e possono usare l’edge runtime se necessario.
