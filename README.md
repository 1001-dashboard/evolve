# EVOLVE 1.1 — guida rapida

**Inizia da [`README_EVOLVE_1.1.md`](README_EVOLVE_1.1.md)** per nuova migrazione, test e pubblicazione. La guida qui sotto documenta le versioni precedenti.

---

# Evolve v0.7 — Adaptive Life Coaching

Una base applicativa Next.js 15 / Supabase / Gemini per sostenere miglioramenti concreti nella vita quotidiana. L'obiettivo non è una chat motivazionale: il prodotto combina un profilo personale, attività piccole e verificabili, scenari preparatori e percorsi già presenti nelle versioni v0.4–v0.6.

## Novità v0.7

- **Profilo centrale (`/profilo`)**: nome, obiettivo, aree di vita, tempo quotidiano, stile di accompagnamento, abitudine-ancora, contesto; altezza, peso e data di nascita facoltativi. Modificabile e privato.
- **Check-in quotidiano (`/giornata`)**: energia, stato mentale percepito, tempo disponibile, sonno e nota facoltativa. La scala non è uno strumento diagnostico.
- **Daily Life Planner (`/giornata`)**: fino a tre azioni, con priorità iniziale, attività da un percorso pianificato compatibilmente col budget e prova di uno scenario «se-allora»; riduce il carico opzionale nelle giornate difficili. La mini-routine richiede di registrare un'azione concreta, non solo una spunta.
- **Scenario Engine (`/scenari`)**: modelli e scenari personalizzati per trasferimento, difficoltà linguistiche, lavoro, famiglia, benessere. Crea, modifica, metti in pausa, prova, registra feedback, elimina.
- **Coaching AI con consenso sul contesto**: i dati generali del profilo sono disponibili al coach Gemini **solo dopo opt-in** esplicito, disattivato per impostazione predefinita. I campi sanitari e i check-in non vengono inseriti automaticamente nel prompt.
- **Compatibilità**: mantiene `basePath:'/evolve'`, logo della v0.5, autenticazione, percorsi, pianificazione v0.6, alimentazione, diario e azioni.

## Avvio e deployment

Leggi `LEGGIMI_PRIMA_v07.txt`. La migrazione da eseguire è **solo** `supabase/migrations/202610190003_life_coaching.sql` se le migrazioni delle versioni precedenti sono già installate.

```powershell
npm install
npm run test:ux
npm run test:plan
npm run test:life
npm run test:daily
npm run build
```

Esegui la pubblicazione con git **solo dopo** il successo dei test e della build:

```powershell
git add -A
git commit -m "Evolve v0.7 Adaptive Life Coaching"
git push origin main
```

### Limitazioni

1. Il motore quotidiano **utilizza regole verificabili**, non genera piani clinici né valuta psicologicamente la persona.
2. La programmazione del calendario v0.6 e il motore di coaching situazionale v0.7 sono moduli distinti ma collegati. Se hai più percorsi attivi nello stesso giorno, il piano di oggi mostra soltanto un esercizio: gli altri rimangono disponibili nelle rispettive sezioni.
3. Evolve v0.7 non è ancora un programma completo di preparazione atletica con schede progressive, né un piano dietetico clinico. L'attuale sezione Alimentazione esistente resta disponibile.
4. Non è stata effettuata una build Next.js integrale nell'ambiente che ha generato lo ZIP: npm non poteva risolvere `registry.npmjs.org`. Non sono stati eseguiti test end-to-end con credenziali Supabase reali o su Aruba. Sono presenti test statici e logici eseguibili localmente.
5. Il consumo elevato abituale di alcol non deve essere gestito con una scaletta automatica di riduzione; è opportuno rivolgersi a un professionista sanitario per valutarne la sicurezza.
6. Questa versione non programma notifiche push automatiche; attività e check-in si eseguono aprendo la piattaforma.

## Architettura

- `src/lib/life/planner.ts`: selezione delle attività giornaliere, con limite di tempo e controllo di energia.
- `src/lib/life/data.ts`: lettura dei dati per utente, fallback se manca la migrazione SQL.
- `src/app/api/life/*`: API validate con Zod e sessione Supabase; tutte le modifiche sono filtrate per utente.
- `src/components/life-day-client.tsx`: check-in e attività con registrazione delle note.
- `src/components/life-scenarios-client.tsx`: scenari e feedback.
- `src/components/life-profile-client.tsx`: onboarding generale e consenso AI.
- `supabase/migrations/202610190003_life_coaching.sql`: cinque nuove tabelle con Row Level Security; non modifica o cancella le tabelle v0.6.

## Test di accettazione

1. Accedi e apri `/evolve/profilo`: compila almeno una priorità, salva, ricarica, verifica i dati.
2. Apri `/evolve/scenari`: crea uno scenario, modificalo, provalo, salva il feedback e mettilo in pausa.
3. Apri `/evolve/giornata`: registra energie basse e controlla che le attività opzionali siano alleggerite.
4. Registra un'azione reale nel campo della priorità, aggiorna e controlla che il testo resti presente.
5. Verifica `/evolve/piano`, `/evolve/routine`, `/evolve/percorsi`, `/evolve/alimentazione`, `/evolve/login`.
6. Controlla che `/evolve/oggi` apra `/evolve/giornata`.

