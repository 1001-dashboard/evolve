# Evolve 1.4 — rapporto QA

## Origine e perimetro
Patch incrementale rispetto al repository `1001-dashboard/evolve` v1.2 osservato il 21 ottobre 2026, utilizzabile anche sopra la patch 1.3. Raccoglie metriche osservabili da registri esistenti senza modificare le relative API. Aggiunge soltanto una tabella opzionale per lo storico del peso. La pagina `progressi` conserva le metriche precedenti e aggiunge il collegamento Andamento 360.

## Superati
- 37 controlli automatici (`node tests/check-outcomes.mjs`), usando compilazione sintattica TS/TSX con TypeScript e invocazione reale del motore aggregatore.
- Date ISO corrette, incluso giorno inesistente, 29 febbraio e passaggio di anno.
- Ultimi 7 giorni, volume allenamenti, giorni attivi, medie energia/sonno calcolate soltanto su dati registrati, meal prep con sovrapposizione settimanale, registrazioni peso e condizioni senza dati.
- Verifica statica di tutti i registri Supabase richiesti, filtri per utente in lettura/scrittura ed eliminazione, schema SQL con RLS e policy separate SELECT/INSERT/UPDATE/DELETE.
- Rendering CSS della pagina campione con browser Chromium headless a 320, 360, 390, 768, 1200 px: `scrollWidth <= clientWidth` a tutte le larghezze; riquadri leggibili.
- Evitati suggerimenti clinici e punteggi fittizi; stime di calorie non utilizzate nel conteggio dei progressi.

## Non eseguiti
- `npm run test:release`, `npm run typecheck`, `npm run build` nel repository completo: moduli npm del progetto non presenti in questo runtime.
- Browser E2E sull'app React reale con login, Supabase e proxy Aruba.
- Penetration test/security audit esterno; le verifiche su RLS sono statiche, non costituiscono prova di isolamento in produzione.
- Verifica completa su dati con oltre 500 allenamenti/60 giorni, possibile limite di aggregazione.

## Checklist post deploy
1. Accesso /evolve/progressi: pagina precedente invariata, nuovo pulsante Andamento 360.
2. /evolve/andamento: confronto 7/30 giorni; dati storici coerenti con Diario Allenamento e Meal Prep.
3. Crea una pesata facoltativa, aggiorna la pagina, verifica il dato; aggiorna la stessa data; elimina la misura.
4. Esporta CSV con il pulsante dedicato e verifica che non contenga altri dati personali.
5. Accedi con account differente e verifica che non compaiano pesate o registri di un altro utente.
6. Mobile Android: nessuna pagina ridotta a una colonna microscopica, nessun overflow orizzontale, input e tasti leggibili.
7. Riapri Coach, Routine, Allenamento, Meal Prep e /evolve/giornata.
