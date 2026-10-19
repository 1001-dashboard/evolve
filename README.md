# Evolve v0.5 — Esperienza guidata e logo robusto

**Aggiornamento della versione v0.4 già funzionante.** La configurazione `/evolve` e la migrazione Supabase rimangono inalterate.

- Logo originale importato come asset statico compilato, con fallback leggibile in caso di errore di caricamento.
- I percorsi hanno istruzioni concrete in **tre passaggi**, esempi espandibili, campi coerenti con la categoria ed una versione breve per le giornate difficili.
- Le risposte finiscono nel campo `note` della tabella `evolve_checkins`; nessuna nuova tabella o migrazione.
- I progressi di riepilogo sono ora dopo la scheda dell'esercizio, non prima: la priorità è l'azione.
- Stati `Fatto`, `Troppo difficile` e `Non oggi` rimangono, con correzione della registrazione giornaliera già possibile.
- La navigazione evidenzia la pagina attiva; CSS e layout mobile sono stati migliorati.
- Test locali disponibili: `npm run test:ux` (dopo `npm install`); vedi `TEST_REPORT_v05.md`.

**Installazione rapida:** leggi `LEGGIMI_PRIMA_v05.txt`. La sezione seguente descrive la base v0.4 e rimane per documentare database e API.

---

# Evolve v0.4 — Personal Change Engine

## Che cosa cambia

Evolve non e' piu' centrato sulla conversazione con un pseudo-coach.
Il cuore e' un *motore di percorsi*:

1. Scegli un ambito e descrivi in breve l'obiettivo.
2. Visualizzi l'esercizio di oggi con una versione piu' facile se necessario.
3. Confermi **Fatto / Troppo difficile / Non oggi**, con nota facoltativa.
4. La piattaforma conserva i risultati in Supabase e adatta la difficolta' dopo esiti ripetuti.
5. Routine e progressi mostrano azioni reali, non valutazioni inventate dall'AI.

Percorsi inclusi: benessere/peso, rapporto con l'alcol (solo auto-osservazione e alternative non cliniche), lingue, leadership/operations, cambiamento/trasferimento, abitudine generica. Quattro livelli con varianti di esercizi. Vengono mantenuti login, diario, alimentazione, azioni e coach di supporto.

## Correzione del 404 su Vercel e Aruba

Nel repository GitHub pubblicato il 19 ottobre 2026, `next.config.ts` era vuoto (`const nextConfig = {}`). Poiche' il proxy Aruba inoltra a `/evolve`, Vercel restituiva 404 anche direttamente.

Questo archivio contiene:

```ts
const nextConfig: NextConfig = {
  basePath: '/evolve',
  trailingSlash: false,
  images: { unoptimized: true },
};
```

Le immagini pubbliche usano `/evolve/brand/...` e `/evolve/icons/...`; le chiamate fetch usano `/evolve/api/...`. `next/link` e `next/navigation` aggiungono automaticamente basePath ai percorsi interni.

**IMPORTANTE:** non basta caricare il file su Aruba. L'app Next.js deve essere pubblicata nuovamente su Vercel dal repository GitHub. Se il proxy Aruba attuale raggiunge Vercel e restituisce una pagina Next.js 404, lascialo invariato per la prima prova.

## Aggiornare il codice (senza perdere il repository Git)

1. Fai una copia di sicurezza della cartella locale del repository `evolve`.
2. Estrai **il contenuto** di questo ZIP nella cartella che contiene gia' `package.json` e `.git`. Sovrascrivi i file con lo stesso nome; non cancellare `.git` o `.env.local`.
3. Nell'archivio v0.4 non e' presente `src/middleware.ts` per evitare comportamenti imprevisti durante il test di instradamento. Se nella tua cartella locale e' rimasto un vecchio `src/middleware.ts`, rimuovilo *solo dal progetto locale da pubblicare* (fai prima una copia). L'accesso Supabase continuera' a essere controllato dalle route protette.
4. Apri un terminale **nella cartella `evolve`**, poi:

```powershell
npm install
npm run build
```

Solo se la build termina senza errori:

```powershell
git add -A
git commit -m "Evolve v0.4 percorsi routine e basePath"
git push origin main
```

5. Aspetta che su Vercel il nuovo deployment risulti **Ready**. Il progetto deve avere Framework **Next.js**, Root Directory `./`, Build Command Default o `npm run build`, Output Directory Default. Non modificare le 4 variabili Supabase/Gemini gia' impostate.
6. Verifica **prima Vercel**, poi il dominio Aruba:

```cmd
curl.exe -L -s -o NUL -w "HTTP: %{http_code}\n" https://evolve-roan.vercel.app/evolve
curl.exe -L -s -o NUL -w "HTTP: %{http_code}\n" https://danilorusciano.it/evolve
```

Ci aspettiamo `HTTP: 200` sulla pagina pubblica, poi `https://danilorusciano.it/evolve/login`.
Una build `Ready` non garantisce che l'alias Vercel punti al deployment giusto: se la prima verifica continua a mostrare 404, controlla **Vercel → Deployments → ultimo deployment → Domains** e assicurati che `evolve-roan.vercel.app` sia assegnato al deployment nuovo.

## Supabase — indispensabile per la nuova funzionalita'

Dopo aver messo in salvo i dati e prima di utilizzare Percorsi e Routine:

1. Apri Supabase del progetto Evolve → SQL Editor → New query.
2. Incolla *solo* `supabase/migrations/202610190001_change_engine.sql` e premi Run **una volta**.
3. Non rieseguire la migrazione iniziale del 17 ottobre su un database gia' popolato.
4. Le nuove tabelle sono `evolve_programs` e `evolve_checkins` con RLS per utente. Non vengono eliminati gli account, le azioni, le note, le sessioni o altri dati esistenti.

Se non esegui SQL, l'homepage e le vecchie sezioni possono ancora funzionare, ma Percorsi e Routine mostrano un avviso e non salvano.

## Test funzionali

- Pagina pubblica `/evolve`: deve mostrare la landing, logo e immagini.
- `/evolve/login`: login Supabase; poi `/evolve/oggi`.
- `/evolve/percorsi`: crea un percorso “Spagnolo al lavoro”.
- `/evolve/routine`: visualizza la missione e segna “Fatto”.
- Ricarica: deve essere rimasta registrata su Supabase.
- `/evolve/progressi`: mostra il check-in.
- Prova mettere in pausa, riattivare, cambiare percorso; prova smartphone.
- Prova `/evolve/alimentazione`, `/evolve/diario`, `/evolve/coach`: le vecchie API sono ora chiamate con `/evolve/api/...`.
- Controlla con un secondo account che i dati del primo non siano visibili.

## Limiti di questa versione

- I percorsi sono **modelli predefiniti personalizzati in base ai risultati**, non un piano clinico, e non costruiscono ancora automaticamente nuovi esercizi con Gemini.
- Un solo check-in per percorso per data (Europe/Rome), modificabile nello stesso giorno.
- La difficolta' aumenta dopo 3 completamenti consecutivi nello stesso livello. Due check-in consecutivi “Troppo difficile” possono ridurla; “Non oggi” non causa una penalizzazione.
- Non sono implementati notifiche, promemoria automatici, test end-to-end o backup automatici.
- In caso di consumo elevato/quotidiano di alcol, una riduzione autonoma e rapida puo' causare astinenza pericolosa. L'app **non** prescrive quantita' da ridurre. Serve una valutazione medica.
- Per privacy, evita dettagli sanitari sensibili sul tier Gemini gratuito. Dati dei percorsi e check-in sono conservati sul tuo Supabase; non vengono automaticamente inviati al modello.

## Verifiche effettuate nella preparazione ZIP

Controllata la struttura dell'archivio, il `basePath`, i percorsi relativi degli asset, il prefisso delle API, e la sintassi di tutti i file TypeScript/TSX con il compilatore TypeScript. **Non e' stato possibile completare una build `npm run build` nell'ambiente di preparazione** per indisponibilita' della rete npm. Esegui la compilazione sul PC prima del push e non pubblicare in caso di errori.
