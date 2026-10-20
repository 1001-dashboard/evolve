# Evolve 1.2 – QA report

## Automatismi eseguiti nell'ambiente di preparazione

- Parsing e transpiling sintattico TypeScript/TSX di 72 sorgenti Next.js: **PASS** (0 errori di sintassi).
- `npm run test:ux`: **PASS** (72 esercizi, 216 passaggi, regressioni UX v0.5).
- `npm run test:release`: **PASS** (test precedenti, sicurezza strutturale, date, percorsi, Coach, fallback Gemini e nuovi test UX).
- `npm run test:usability`: **PASS**, 42 assert su flusso Coach, conferma esplicita, guida, collegamenti, etichette e stili responsive.
- Chrome headless con CSS effettivo su **pagine di prova**, per Coach e Piano, larghezze 1440, 820 e 390 px: **PASS**, zero overflow orizzontali nei 6 casi.
- Nessuna nuova migrazione SQL. `next.config.ts` invariato con `basePath: '/evolve'`.

## Controlli da completare sul proprio progetto

- `npm run typecheck` e `npm run build`: non verificabili qui: `npm install` si è interrotto dopo 18 secondi, senza scaricare Next/React.
- Navigazione React end-to-end reale, accesso, risposta Gemini, generazione e salvataggio del piano su Supabase, errori del proxy Aruba: non testati nell'ambiente di preparazione.
- Test con utente non guidato (capire l'app senza spiegazioni) **non svolto**. La fruibilità va confermata con una prova reale e feedback osservabile.

## Scenari manuali consigliati dopo il deploy

1. Senza istruzioni, aprire Evolve e capire in meno di 30 secondi dove descrivere un problema.
2. Scrivere un dubbio, creare una proposta, cambiarne una frequenza e confermare; verificare in Piano dopo ricarica.
3. Aprire Oggi e distinguere chiaramente impegni approvati da suggerimenti opzionali.
4. Aprire Allenamento e Meal Prep passando da Il mio piano senza cercarli tra 13 voci.
5. Su telefono (360–430 px) aprire Coach e Genera: dopo la risposta verificare lo scorrimento alla bozza, la modifica e la conferma.
