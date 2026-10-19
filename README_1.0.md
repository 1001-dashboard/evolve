# EVOLVE 1.0 — Release completa

Questa release estende **la v0.7 funzionante** con **Allenamento universale** e **Meal Prep**. Non elimina coach, profilo, scenari, piani, diario, progressi o autenticazione. Il `basePath: /evolve` rimane invariato. Non sostituire i file su Aruba.

## INSTALLAZIONE (conserva dati e repository)

1. Fai una copia della cartella locale Evolve attuale.
2. Estrai i file di questo ZIP **nella stessa cartella git** sovrascrivendo i file, senza eliminare `.git` o `.env.local`.
3. Supabase SQL Editor: lancia **solo** `supabase/migrations/202610190004_training_mealprep.sql` (presuppone le migrazioni 001–003 della v0.7 già installate).
4. Dal terminale nella cartella del progetto:

```powershell
npm install
npm run test:release
npm run test:ux
npm run build
```

5. Se passano, pubblica:

```powershell
git add -A
git commit -m "Evolve 1.0 Training and Meal Prep"
git push origin main
```

6. Quando Vercel mostra Ready: visita `/evolve/allenamento` e `/evolve/mealprep`. Testa autenticazione, inserimento e lettura degli allenamenti, salvataggio e riapertura del piano settimanale.

## FUNZIONI

- Allenamento: 10 categorie di attività; distanza, durata, sforzo, kcal macchina e stimate (distinte); storico 100 sessioni; vogate/SPM sul vogatore.
- Meal Prep: da 1 a 7 pranzi; 1–6 porzioni; ricette originali; preferenza pranzi freddi; esclusioni, dispensa, lista aggregata; piano settimana salvato.
- Regole di sicurezza: niente compensazione automatica integrale kcal; nessuna prescrizione clinica; conservazione dei pasti e differenza fra gusto e sicurezza di cottura.
- Persistenza: Supabase con policy RLS per utente e check auth API.

## LIMITI REALI

Non contiene connessione automatica a macchine fitness, prezzi attuali dei supermercati, stime kcal validate individualmente, dietoterapia, allenamenti medici personalizzati, né scheduling push. Il budget impostato non genera un totale prezzi fittizio. Meal Prep suggerisce porzioni standard da verificare rispetto al tuo fabbisogno. Allenamento e nutrizione condividono il profilo applicativo ma **non esiste ancora** un algoritmo clinico di ricalcolo della dieta in tempo reale: costruirlo come tale senza adeguati controlli sarebbe fuorviante.

Il manuale 2M1K fornito dall'utente ispira il metodo per preparazioni, spesa, raffreddamento, stoccaggio e rigenerazione; non è copiato nel prodotto. Le tabelle delle temperature di resa gastronomica non sono automaticamente temperature sicure di cottura.
