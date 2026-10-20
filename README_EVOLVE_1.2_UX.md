# Evolve 1.2 — UX orientata al risultato

Versione completa costruita sulla 1.1.1 (fix Coach Gemini incluso). La release **non richiede nuove migrazioni SQL** rispetto alla 1.1.

## Il senso delle 5 schermate principali

| Schermata | Quando la apro | Cosa trovo |
|---|---|---|
| Oggi | Voglio sapere cosa fare oggi | Attività concordate; a seguire check-in e micro-routine facoltative |
| Coach: parti da qui | Ho un problema, un dubbio o un obiettivo | Dialogo breve → proposta → modifica → approvazione |
| Il mio piano | Voglio consultare o sospendere gli impegni | Attività approvate; strumenti specialistici; percorsi guidati in area facoltativa |
| Risultati | Voglio vedere cosa ho fatto | Progressi dei percorsi guidati e collegamenti ai registri specialistici |
| Il mio profilo | Voglio aggiornare preferenze e priorità | Dati facoltativi per la personalizzazione |

La nuova pagina **Come funziona?** spiega i passaggi e offre collegamenti diretti a tutte le funzioni. Le sezioni allenamento, meal prep e scenari restano accessibili da «Strumenti specifici» e dal Piano. Sono conservati tutti i percorsi e i dati esistenti.

## Il percorso ideale da provare

1. Apri **Profilo**, salva quello che vuoi condividere. Il Coach riceve le preferenze solo se hai autorizzato l'uso dei dati generali.
2. Apri **Coach** e scrivi: «Ho paura di non essere più all'altezza come station manager. Voglio capire che cosa posso allenare nei prossimi 14 giorni».
3. Dopo la risposta, premi **Crea una proposta di piano**, senza dover conversare all'infinito.
4. Verifica ogni voce, elimina quella che non vuoi fare, modifica frequenza e durata.
5. Premi **Conferma e attiva**: solo da qui Evolve prova a salvare le attività in Supabase.
6. Apri **Oggi** per trovarle oppure **Il mio piano** per controllare lo storico. Le mini-routine automatiche sono dichiarate facoltative.
7. Per un allenamento già svolto apri **Allenamento**; per organizzare i pranzi apri **Meal prep e spesa**.

## Pubblicazione

1. Fai copia della cartella locale funzionante e del file `.env.local`.
2. Estrai lo ZIP sopra la cartella del progetto Git senza cancellare `.git` e `.env.local`.
3. Da quella cartella:

   ```powershell
   npm install
   npm run test:release
   npm run test:ux
   npm run typecheck
   npm run build
   ```

4. **Pubblica solo se non ci sono errori**:

   ```powershell
   git add -A
   git commit -m "Evolve 1.2 UX percorso guidato"
   git push origin main
   ```

5. Dopo Vercel Ready visita `https://danilorusciano.it/evolve/guida` e `https://danilorusciano.it/evolve/coach`.

Non modificare Aruba né Supabase per questa release. Le migrazioni della 1.1 devono essere già state applicate per salvare piani e attività.

## Limiti funzionali dichiarati

- Le proposte del Coach sono impegni, **non schede atletiche clinicamente personalizzate** né diete prescritte.
- Le metriche dei percorsi guidati, degli allenamenti e dei piani concordati hanno ancora registri distinti.
- L'applicazione reale dietro Aruba e Supabase va collaudata dopo il deployment; i test visivi del pacchetto utilizzano una pagina di prova con il CSS reale.
- Questa release migliora l'usabilità, non garantisce risultati di coaching.
