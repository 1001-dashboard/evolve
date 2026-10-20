# EVOLVE 1.1 - Relazione tecnica test

- Regressione v1.0 (`npm run test:release`): superata.
- Test Coach (`npm run test:coach`): superato. Controlli di schema, accesso per user_id, RLS, richiesta di conferma e 64 asserzioni sulla pianificazione giornaliera (lunedì-domenica, frequenze).
- Sintassi TypeScript/TSX: controllo senza errori sui file del progetto (transpileModule).
- Profilo: patch UI precedente incorporata e messaggio database legato al codice errore Supabase. Non è stata verificata l'esistenza reale delle tabelle del tuo account.
- Integrazione browser/Next.js: NON ESEGUITA nell'ambiente: npm offline segnala ENOTCACHED (mancano pacchetti registry).
- Supabase: RLS verificata nel testo della migrazione, non applicata ad un database reale.
- Test end-to-end Gemini → bozza → modifica → approvazione → persistenza: DA VERIFICARE IN PRODUZIONE.
- Verifica proxy Aruba e sporadica eccezione JavaScript: DA VERIFICARE SU CONSOLE BROWSER.

Non presentare questo rilascio come interamente collaudato finché non passano `npm run typecheck`, `npm run build`, test browser e prova database.

- Smoke-test CSS con Chromium headless su fixture HTML della nuova interfaccia: 1440, 820, 390 px; nessun overflow orizzontale. Questa verifica controlla solo CSS e impaginazione esemplificativa, NON l'app React in esecuzione.
