# EVOLVE 1.1 — Coach operativo

## Cos'è cambiato

- **Coach**: parla di un problema reale, discute alternative brevi, poi premi **Prepara il piano**. Gemini genera una BOZZA strutturata (massimo 6 impegni), ognuno modificabile per tipo, istruzioni, durata, giorno e momento.
- **Conferma e attiva**: solo questo pulsante registra gli impegni nel database. Le proposte non vengono salvate in automatico. Un identificatore di approvazione evita duplicati nei retry.
- **Oggi e Il mio piano**: mostrano le attività concordate; puoi segnarle Fatto/Non oggi, sospenderle o concluderle. Allenamento, Meal Prep, Routine, Percorsi e Scenari mostrano le attività di loro pertinenza.
- **Navigazione**: 5 voci principali, strumenti specifici in menu espandibile.
- **Profilo**: layout corretti dalla 1.0.3 e messaggi d'errore Supabase più specifici.
- **Allenamento**: incorpora la patch 1.0.4 per data e ora retrodatate (funzione da collaudare su Vercel).

Nota tecnica: i percorsi/routine proposti dal Coach sono **impegni operativi**, visualizzati anche nei moduli dedicati; non creano automaticamente le lezioni predefinite del vecchio catalogo, né modificano i menu e le liste spesa già salvati. Allenamento e nutrizione mantengono i propri diari e generatori. Questa integrazione può essere ampliata dopo l'utilizzo reale.

## Installazione sicura (Windows + Vercel + Supabase)

1. Salva una copia della cartella Git esistente e del file locale `.env.local` (non condividere la chiave). Estrai questo ZIP sopra alla cartella del progetto Evolve, **senza cancellare `.git` o `.env.local`**.
2. Prima di pubblicare, in Supabase > SQL Editor esegui UNA VOLTA `supabase/migrations/202610200001_coach_operativo.sql`. È additiva e include RLS per account. Sono necessarie anche le migrazioni precedenti v0.4–1.0, se mai omesse.
3. Se il Profilo ancora non salva, esegui la query **di sola lettura** `diagnostics/check_supabase_profile.sql` e verifica `tabella_profilo`, `consenso_ai` e `policy_profilo`. Se mancano, aggiorna prima la migrazione v0.7; non eseguire SQL arbitrari.
4. Dalla cartella progetto su PowerShell:
   ```powershell
   npm install
   npm run test:release
   npm run test:ux
   npm run typecheck
   npm run build
   ```
5. Se passano, pubblica:
   ```powershell
   git add -A
   git commit -m "Evolve 1.1 Coach operativo"
   git push origin main
   ```
6. Aspetta Ready su Vercel, visita `https://danilorusciano.it/evolve/coach` e fai il test end-to-end sotto. **Non modificare il PHP Aruba o il basePath `/evolve`.**

## Collaudo end-to-end (l'applicazione deve essere online)

- Apri Coach e scrivi «Voglio prepararmi a un trasferimento, ho 15 minuti al giorno». Verifica che Gemini risponda brevemente e che **Prepara il piano** generi attività modificabili.
- Modifica una frequenza, un titolo e una descrizione. Premi **Conferma e attiva** una sola volta. Deve comparire un messaggio con conteggio reale.
- Apri Il mio piano: devono esserci solo le attività confermate. Ricarica la pagina e verifica la persistenza.
- Apri Oggi: le attività previste oggi compaiono; premi Fatto. Ricarica: non deve chiederle di nuovo oggi, e lo storico resta nel database.
- Metti in pausa un'attività dal Piano, ricarica e verifica che non sia prevista in Oggi.
- Apri Allenamento e Meal Prep: gli impegni concordati dei rispettivi tipi devono apparire nella sezione dedicata.
- Prova ripetutamente a inviare il medesimo approval_token se testi via API: non devono crearsi duplicati.
- Profilo: salva una modifica e ricarica. Se fallisce, annota il codice errore, senza esporre token o dati personali.
- In caso di errore intermittente su Aruba, verifica Console e Network (JS / RSC). Non possiamo diagnosticare quella eccezione senza il log del browser.

## Sicurezza e limiti

- Nuove tabelle con Row Level Security: ogni utente vede/modifica solo i propri dati.
- Il Coach AI non riceve dati fisici dal profilo automaticamente. Le preferenze generali vengono usate solo col consenso; il contenuto che scrivi in chat viene comunque inviato a Gemini per generare la risposta e il piano.
- L'AI può sbagliare. Esamina la proposta prima di approvarla: Evolve non diagnostica, non prescrive terapie o piani di riduzione dell'alcol.
- Calorie dell'allenamento stimate, non misurate; la 1.1 non compensa automaticamente l'alimentazione.
- Alcuni interventi richiedono controllo professionale, in particolare per condizioni cliniche o possibili dipendenze.

## Stato test della release

Vedi `TEST_REPORT_1.1.md`. In ambiente di sviluppo senza accesso al registro npm ho eseguito controlli sintattici e test Node non dipendenti dai servizi, ma **non** build Next.js completa, test browser reale o query Supabase reali. I comandi sopra verificano gli step mancanti prima del deploy.
