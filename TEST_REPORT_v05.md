# Evolve v0.5 — registro test

Il termine alpha/beta/gamma/delta/omega/sigma in questo report identifica gruppi di test; **non** certificazioni formali.

| Gruppo | Controlli | Esito |
| --- | --- | --- |
| ALPHA | 34 file TS/TSX, basePath e logo statico | SUPERATO (analisi statica) |
| BETA | Guida c1a, varianti corte, lingue, benessere, alcol e lavoro | SUPERATO (unit test) |
| GAMMA | 6 categorie x 4 livelli x 3 esercizi, 216 step, required/quickRequired | SUPERATO (unit test); database dal vivo da testare |
| DELTA | Controlli su sorgenti, route e schema invariato | SUPERATO (controllo statico); regressione integrata da testare |
| OMEGA | Usabilità: passo numerato, esempio, input contestuale, stati del check-in e mobile | Ispezione statica; test browser da eseguire |
| SIGMA | Build di produzione, test browser reale e autenticazione Supabase/Aruba | Da eseguire dopo installazione dipendenze |

**Limite del test locale:** in questo ambiente `npm install --offline` fallisce per dipendenze non presenti in cache. Senza dipendenze non è possibile dichiarare completati `next build`, interazione browser o flussi autenticati.
