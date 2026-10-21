# Evolve 1.5 — Report test

**Ambito:** patch incrementale, non un test end-to-end di produzione.

- Test logici/sintattici `node tests/check-onboarding.mjs`: **98 controlli passati** nel pacchetto di sviluppo.
- Otto aree, sette durate, limiti numerici e test delle regole di autonomia verificati.
- Verificata la presenza di autenticazione, filtraggio `user_id`, RLS e token di approvazione idempotente nelle API.
- Test CSS tramite Chromium su una pagina di prova con classi CSS reali: **320, 360, 390, 768 e 1200 px**; nessun overflow orizzontale; opzioni alte almeno 71 px su telefono.
- `next.config.ts` e file Aruba non sono inclusi nella patch: preservato il basePath `/evolve` esistente.
- Inclusi i precedenti fix 1.4.1 per la riga TypeScript Andamento e la navigazione tramite menu/logo, utili se non ancora applicati.

## Da verificare dopo estrazione nel repository

- `npm run typecheck`, `npm run build` e `npm run test:release` con le dipendenze effettive: **non eseguiti in questo ambiente**.
- Policy Supabase e salvataggio reale di due account differenti.
- Navigazione Android su dominio Aruba / Vercel, login e creazione piano.
- Prestazioni ed eventuali errori del reverse proxy RSC.

## Cautele

La stima di autonomia non e' diagnostica. Le attività nuove sono attivate **solo dopo conferma**; cambiare livello non modifica gli impegni concordati. SQL additivo senza cancellazioni.
