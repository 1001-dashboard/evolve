# EVOLVE 1.3 — QA / limitazioni

## Origine patch
Progettata per il branch `main` di `1001-dashboard/evolve`, versione rilevata `1.2.0` in `package.json` al 21/10/2026. `src/app/(app)/giornata/page.tsx` è l'unico file applicativo preesistente sostituito; tutti gli altri file della patch sono aggiunte. Non modifica proxy, auth, Supabase client, percorsi, training o mealprep.

## Controlli superati nell'ambiente di preparazione
- Compilazione sintattica con TypeScript `transpileModule`: 7 file `.ts` / `.tsx`, zero errori sintattici.
- Test delle settimane ISO: lunedì, domenica e passaggio d'anno.
- Test dei sette giorni mobili; data inesistente respinta.
- Test sui minuti validi delle sessioni (valori nulli/negativi/anomali ignorati).
- Suggerimenti di revisione su dati osservati: riposo, pasti, movimento, continuità.
- Ordine di precedenza delle indicazioni contestuali: energia bassa, allenamento già registrato, pasti non organizzati, impegni Coach.
- Presenza dei filtri `user_id` nelle letture e nelle scritture, validazione degli input con Zod.
- SQL con RLS, policy legate a `auth.uid()` e chiavi composte per utente/settimana.
- Convalida di una nota prima di confermare «Fatto oggi».
- CSS namespace `orch-*`, layout responsivo previsto a 820, 640 e 380 px, senza sovrascrivere le classi globali esistenti.

## Non ancora verificati
- `npm run typecheck`, `npm run build`, suite legacy `npm run test:release` con dipendenze installate.
- Test end-to-end del browser desktop/Android sulla release pubblicata.
- Verifica live delle tabelle con una sessione reale Supabase.
- Test di accessibilità automatici su browser e test di carico.

## Test manuale post deployment
1. Navigazione privata / redirect login.
2. GET overview per utente autenticato: solo dati propri.
3. Leggibilità su 360/390 px e nessuno scorrimento laterale.
4. Approvazione modifica volontaria, riapertura Oggi e spunta con nota.
5. Modifica della priorità nella stessa settimana: vecchi log eliminati se cambia l'azione.
6. Cambio settimana: la priorità non migra senza nuova conferma.
7. Test regressione Coach, Allenamento, Meal Prep, Profilo e login da Android.

## Rischi noti
- Se la migrazione SQL non è presente viene visualizzato un avviso; non viene forzata una creazione di record.
- Conteggi si basano sulla registrazione: non misurano tutte le attività reali.
- Il riepilogo è una nuova sezione sopra i widget preesistenti: i widget specialistici restano disponibili sotto.
