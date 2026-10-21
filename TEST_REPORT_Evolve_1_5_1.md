# Evolve 1.5.1 — Rapporto di verifica

## Ambito
Prima esperienza di un nuovo utente: presentazione, accesso, registrazione, conferma email, recupero password, avvio onboarding e installazione da Chrome Android. Patch additiva per la base v1.5.

## Controlli eseguiti
- `node tests/check-first-experience.mjs`: **24 controlli superati**, comprendono parsing TypeScript/TSX di 11 file, validazione della manifest PWA, link al basePath `/evolve`, corretto uso delle API Supabase di signup/login/reset, richiesta della conferma email, salvataggio password, nessuna navigazione client Next post-login, integrità strutturale dell'onboarding precedente.
- Chromium Headless: layout simulato della pagina registrazione a **320 / 360 / 390 / 768 / 1200 px**: nessun overflow orizzontale; pulsante primario 48 px, collegamento 44 px nella pagina campione.
- Le icone manifest 192 e 512 px sono state individuate nel progetto completo precedente; i nomi non sono cambiati.
- Patch senza modifiche ad Aruba, a `next.config.ts`, senza SQL e senza chiavi ambientali.

## Controlli NON eseguiti
- `npm run typecheck` e `npm run build`: dipendenze complete del repository non disponibili nella sandbox.
- Test di invio/conferma email o recupero password con Supabase reale, non avendo accesso alle sue impostazioni e alle caselle email.
- Collaudo end-to-end con proxy Aruba + Vercel e dispositivo Android reale.
- Test completo di isolamento dei dati fra due account: mantenute le policy esistenti, ma richiede test operativo.

## Note operative
- **Richiesto configurare i Redirect URLs Supabase**: `/evolve/auth/conferma` e `/evolve/auth/recupero` sul dominio pubblico corretto (www e non-www se usati).
- Flusso PKCE: preferire l'apertura dei link email nello stesso browser usato per iniziare l'operazione.
- Nessuna pretesa di uso offline: la manifest aggiunge metadati per la schermata Home; la disponibilità dell'installazione è verificabile solo dal browser.
- Non è possibile garantire la riuscita della build prima di verificare su Vercel.
