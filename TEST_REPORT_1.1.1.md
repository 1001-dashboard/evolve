# Evolve 1.1.1 — rapporto test

## Diagnosi verificata
La stringa `Generazione del piano non disponibile (HTTP 404)` e' prodotta dal server Evolve quando **Gemini** ritorna HTTP 404 nel percorso `api/coach/plan-draft`. Non equivale al fallimento HTTP 404 del router Next.js/Aruba. La chat e il generatore prima usavano fallback modello diversi.

## Correzioni
- `candidateGeminiModels`: usa per primo `GEMINI_MODEL`, su HTTP 404 tenta `gemini-3.5-flash-lite`.
- `makeFallbackDraft`: produce una bozza con regole trasparenti da messaggi espliciti, senza presentarla come AI.
- `coach-client`: comunica fallback e non salva senza conferma.
- `COACH_PROMPT` e `practicalGuard`: prevengono intervista infinita.
- `shouldBridgeToAction`: per i normali casi di pianificazione, interrompe risposte esclusivamente esplorative al secondo turno in poi; esclusioni per alcuni indicatori di emergenza o rischio sanitario.

## Test realmente eseguiti
- `npm run test:release`: PASS (con modulo TypeScript disponibile nell'ambiente di test).
- `node tests/check-ux.mjs`: PASS.
- Sintassi TS/TSX: PASS sui file sorgente.
- Nuovo test resilienza: PASS con esempi Ibiza, lavoro, lingua, casa, stanchezza, meal prep, allenamento, alcol; fallback senza salvataggi autonomi.
- Configurazione `basePath: /evolve`: preservata.

## Non verificato
- `npm run build` e type-check Next.js (pacchetti node_modules completi non disponibili).
- La chiave Gemini del progetto dell'utente e le quote o disponibilita' del relativo modello.
- Supabase con credenziali reali e autorizzazioni RLS sul progetto attivo.
- Test end-to-end in browser dietro Aruba.

Pubblicare soltanto dopo `npm run build` con esito positivo; valutare manualmente una generazione AI e una bozza di riserva.
