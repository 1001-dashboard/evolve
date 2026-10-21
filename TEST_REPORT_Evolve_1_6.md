# Evolve 1.6 — verifica tecnica

Data: 2026-10-21.

## Ambito

Patch compatibile con il repository GitHub `1001-dashboard/evolve` aggiornato alla
1.5.1, letta via connettore GitHub. File modificati sono circoscritti a:
`src/lib/adaptive-engine.ts`, `src/app/api/adaptive/route.ts`,
`src/components/adaptive-coach-client.tsx`, `src/app/(app)/adatta/page.tsx`,
`src/app/(app)/giornata/page.tsx`, `src/components/sidebar-nav.tsx`,
`src/app/adaptive.css` e `tests/check-adaptive.mjs`.

## Eseguito

- `node tests/check-adaptive.mjs`: **56 controlli superati** su durate, log
  contestualizzati, soglie, periodi, modalità Autonomo, permessi e percorsi.
- `tsc --strict --noEmit src/lib/adaptive-engine.ts`: **superato**.
- Parser TypeScript/TSX sui file modificati: **nessun errore sintattico**.
- Visualizzazione campione nel browser Chromium a 320, 360, 390, 768,
  1200 px: **nessuno scorrimento orizzontale**; pulsanti campione >=46 px.
- La modifica SQL è limitata a `evolve_coach_commitments.minutes`, filtrata per
  `user_id`, `id`, `status`, minuti precedenti e data ultima modifica.
  Non sono presenti nuove migrazioni né credenziali nel pacchetto.

## Non verificato

- Build completa Next.js con tutte le dipendenze e route del repository.
- Integrazione Supabase con un account reale, RLS in esercizio, flussi Android,
  gestione cookie tramite proxy Aruba e pagine live su Vercel.
- Valutazione clinica o scientifica dell'efficacia dei suggerimenti.

Per pubblicare: `npm install`, `npm run test:release`, `npm run typecheck`,
`npm run build` e collaudo sul dominio pubblico.

## Limitazioni deliberate

Le proposte sono deterministiche e basate sugli esiti inseriti: non sono modelli
che inferiscono stati psicologici né prescrizioni nutrizionali o atletiche.
Il flusso modifica solo la durata di un impegno approvato, dopo un'ulteriore
approvazione esplicita; il testo e la frequenza originali rimangono invariati.
