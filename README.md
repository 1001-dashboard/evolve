# Evolve — Personal AI Coach (MVP)

Prima versione reale, non un mockup. Next.js App Router + Supabase Auth/Postgres + OpenAI via Vercel AI SDK.

## Funzionalità implementate
- Registrazione e login Supabase Email/Password
- Home con dati personali reali
- Chat AI con streaming e conversazioni persistenti
- Inserimento di azioni da chat con conferma manuale
- Azioni completate/saltate e revisione collegata al diario
- Diario con riflessioni, umore, alimentazione, alcol e concentrazione
- RLS per isolamento dei dati utenti
- Layout responsive

## Non ancora implementato
- Onboarding completo, obiettivi modificabili via UI, report di trend, notifiche proattive, PWA offline/installabile, export/cancellazione dati da UI, rate limiting distribuito e revisione clinica indipendente.
- Questo è un **MVP tecnico da usare in ambiente privato/test**, non un prodotto clinico né pronto per distribuzione pubblica di dati sanitari. Effettuare privacy review, security review e test prima di un rilascio generalizzato.

## Setup
1. Crea un progetto Supabase e abilita Email/Password in Authentication.
2. Esegui `supabase/migrations/202610170001_init.sql` nel SQL Editor Supabase.
3. Copia `.env.example` in `.env.local` e inserisci URL e anon/publishable key Supabase e OPENAI_API_KEY. **Non usare service_role nel frontend.**
4. Esegui `npm install` e poi `npm run dev`.
5. Apri `http://localhost:3000`, crea il tuo account. Se Supabase richiede conferma email, verifica l'indirizzo prima di accedere.
6. Per Vercel: importa il repository, configura le stesse tre variabili in Settings > Environment Variables e distribuisci. Configura in Supabase Authentication > URL Configuration il dominio Vercel (Site URL / redirect consentiti secondo il flusso scelto).

## Sicurezza e limiti
- Non caricare `.env.local` su GitHub.
- L'app non usa service role. API con auth server-side e RLS.
- Costi OpenAI dipendono da modello e token. Imposta budget e limiti prima di renderla pubblica.
- Le chat AI sono salvate al completamento dello stream; se l'utente interrompe la connessione, una risposta incompleta potrebbe non essere persistita.
- L'AI può sbagliare: non seguire suggerimenti clinici, dietetici terapeutici o di disintossicazione.
- Nessuna raccolta automatica di misure cliniche. I diari sull'alcol sono testo libero in questa versione.
- Prima di un uso multiutente pubblico: aggiungere rate limiting, cancellazione/esportazione GDPR, politiche di conservazione, consenso esplicito ove richiesto e analisi di conformità.

## Quick checks
`npm run typecheck`
`npm run build`

## Deploy GitHub
Estrai lo ZIP in una cartella vuota, crea un repository GitHub e pusha **i contenuti della cartella**, non lo ZIP. Poi collega il repository a Vercel.
