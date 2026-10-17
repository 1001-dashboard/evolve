# Evolve 0.2 — Coach personale AI

Progetto Next.js + Supabase + Gemini API. Interfaccia in italiano con asset derivati dal kit grafico fornito. **MVP privato, non un prodotto clinico né pronto per un lancio pubblico.**

## Stato delle funzionalità

- Homepage italiana responsive con presentazione del prodotto.
- Account email/password tramite Supabase Auth.
- Dashboard Oggi con contatori basati sui dati salvati, accesso a Coach, Azioni e Diario.
- Coach con API Gemini REST lato server e cronologia Supabase.
- Creazione di azioni concordate e revisione collegata al diario.
- Diario per umore, alimentazione, alcol, concentrazione e riflessioni.
- Progressi: conteggi effettivi e rapporto delle azioni completate.
- Menu desktop/mobile, immagini brand, layout migliorato, elementi con focus accessibile.

**Non ancora disponibili:** notifiche proattive, onboarding completo, suggerimenti di azione strutturati automaticamente dal modello, cancellazione account/dati dalla UI, rate limit distribuito, trattamento avanzato dati sanitari, consenso GDPR dedicato, integrazione calendario, test end-to-end e PWA offline. La chat attuale restituisce la risposta completa anziché streaming token per token.

## Prima installazione

1. Crea un progetto su https://supabase.com/dashboard e conserva la password del database.
2. Apri **SQL Editor** e incolla il contenuto di `supabase/migrations/202610170001_init.sql`, poi clicca **Run** (una sola volta su un progetto nuovo).
3. In **Authentication > Providers > Email**, abilita Email; lascia la conferma email attiva per sicurezza.
4. In **Project Settings > API Keys** copia la publishable/anon key, e in **Project Settings > API** copia l'URL progetto. Non usare la chiave `service_role`.
5. In https://aistudio.google.com/apikey crea una chiave Gemini. Verifica il modello disponibile e la quota del tuo account sul portale ufficiale.
6. Rinomina `.env.example` in `.env.local`, poi inserisci:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://NOME-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=LA_TUA_CHIAVE_PUBLISHABLE
GEMINI_API_KEY=LA_TUA_CHIAVE_PRIVATA
GEMINI_MODEL=gemini-3.5-flash-lite
```

Se il modello predefinito non è disponibile sul tuo account, sostituisci `GEMINI_MODEL` con un identificativo effettivamente abilitato con quota gratuita nel tuo AI Studio. Non aggiungere un metodo di pagamento senza prima verificare condizioni e costi.

7. Installa Node.js 22 LTS o successivo, poi da terminale nella cartella progetto:

```bash
npm install
npm run typecheck
npm run dev
```

Apri http://localhost:3000. Se `npm run typecheck` o `npm run build` falliscono, risolvi gli errori prima di procedere.

## GitHub: push manuale guidato

1. Vai su https://github.com/new e crea un repository **privato** `evolve` e scegli **Create repository** senza inizializzare README o .gitignore.
2. Estrai lo ZIP. Apri il terminale *nella cartella che contiene `package.json`*.
3. Esegui uno per volta:

```bash
git init
git add .
git commit -m "Evolve v0.2 UI italiana e Gemini"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/evolve.git
git push -u origin main
```

Sostituisci `TUO_USERNAME`. GitHub può chiederti di autenticarti con browser o Git Credential Manager. Se `git` non è installato, installa Git for Windows. **Prima del push controlla che `.env.local` non sia in Git**: `git status --short` e `git ls-files | findstr env` (Windows). `.env.example` è sicuro perché contiene segnaposto.

## Vercel: collegamento a GitHub

1. Vai su https://vercel.com/new, collega GitHub se necessario.
2. **Import** il repository `evolve`.
3. Framework **Next.js**; root directory `./`.
4. In **Environment Variables**, imposta le quattro variabili dell'esempio con i tuoi valori reali, su Production (eventualmente anche Preview/Development).
5. Premi **Deploy**. Controlla i Build Logs. Se il build fallisce, non considerare il deployment riuscito.
6. Copia l'URL `https://nome-progetto.vercel.app` risultante.

## Supabase: configurazione URL

1. Supabase > Authentication > URL Configuration.
2. Imposta **Site URL** al dominio Vercel.
3. Aggiungi nelle **Redirect URLs** il dominio Vercel e per sviluppo `http://localhost:3000/**` se necessario.
4. Verifica la mail di iscrizione, accedi, usa Coach, crea un'azione, completa un'azione e aggiungi la riflessione nel diario.

## Controlli funzionali consigliati

- Prova smartphone e desktop; usa tastiera per tabulare su input, menu e bottoni.
- Prova login, logout, refresh e permanenza dei dati.
- Prova un secondo utente: non deve visualizzare i dati del primo.
- Invia un messaggio Coach e controlla la risposta, anche dopo refresh.
- Verifica errore se Gemini key non è configurata e il messaggio di limite per codice 429.
- Controlla Vercel Logs se una chiamata fallisce.
- Controlla eventuali avvisi e query in Supabase.

## Privacy: attenzione alla quota AI gratuita

Google dichiara che sul tier Gemini gratuito i contenuti possono essere usati per migliorare i suoi prodotti. Evolve invia la chat e un breve riepilogo di titoli azione/obiettivi, **non allega in automatico le note del diario**, ma se inserisci dati personali sensibili nella chat li trasmetterà comunque. Per questo non raccomandiamo il tier gratuito per dati sanitari identificabili o utilizzo pubblico. Prima di ampliarlo servono privacy review, informativa, consensi quando richiesti, gestione cancellazione/esportazione e configurazione API con tutela dei dati adeguata. Non inserire documenti clinici, nomi, indirizzi, dettagli medici o altre informazioni sensibili nei test.

## Limiti verifica

Questo archivio è stato verificato a livello di struttura/file e controlli statici locali. In questo ambiente non è stato possibile completare `npm install` e una build end-to-end, né connettere effettivamente Vercel, Supabase e Gemini, che richiedono le credenziali e i servizi dell'utente.


## Novità v0.3 — Alimentazione e correzione compilazione

- Server Supabase con cookie tipizzati; fix TypeScript.
- Sezione **Alimentazione**: ricette da ingredienti e stima **indicativa** da foto tramite Gemini multimodale, con consenso esplicito.
- Foto non archiviate nell’app o nel database; il provider riceve la foto per l’analisi.
- I risultati vengono salvati nel diario solo su richiesta.
- Il modello predefinito è configurabile via `GEMINI_MODEL`; verifica l’effettiva disponibilità gratuita su Google AI Studio.
- Immagini JPEG/PNG/WebP fino a 3,5 MB; possibili limitazioni Vercel sul body HTTP.
- Le kcal stimate sono **intervalli orientativi**, non misure attendibili per una dieta clinica.
- In produzione, per dati sanitari o sensibili, rivalutare l’utilizzo della quota gratuita del provider e completare una valutazione privacy.

**Aggiornamento di un progetto esistente:** sostituisci i file con quelli dello ZIP (non cancellare `.git`), esegui `npm install`, `npm run build`, poi `git add . && git commit -m "Evolve v0.3" && git push origin main`.

**Nessuna nuova tabella SQL** è richiesta: la funzione Salva nel diario usa `diary_entries` già esistente.
