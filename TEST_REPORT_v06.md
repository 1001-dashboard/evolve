# Evolve v0.6 — test report

## Eseguiti e superati

- `npm run test:ux`: 40 file TypeScript/TSX senza errori di *parsing*, 72 esercizi v0.5, 216 step guidati, fallback logo, basePath, tre esiti check-in.
- `npm run test:plan`: 48 combinazioni di focus (8) × frequenza (6), date univoche e comprese nel ciclo di sette giorni, attività iniziale nel giorno dell'adesione, passaggio al ciclo successivo, restrizione degli esercizi alcol, presenza delle due API e basePath.
- Composizione focus Ibiza (trasferimento, spagnolo, gestione stazione) e rotazione settimanale.
- Migrazione SQL progettata per aggiungere soltanto due tabelle con RLS, senza modificare i dati precedenti. NON testata su un database Supabase reale.

## Non eseguiti (richiedono ambiente web/deploy)

- `npm run build` / typecheck completo: il registro npm non è raggiungibile da questo ambiente (`EAI_AGAIN`).
- Test end-to-end Vercel + Aruba + Supabase con autenticazione reale.
- Prove effettive di usability con persone e browser/mobile.

## Collaudo consigliato dopo deploy

1. Aprire `/evolve/oggi` e verificare login, navigazione e logo.
2. Aprire `/evolve/piano`, scegliere percorso già presente e iniziare assessment.
3. Scegliere *Ibiza: preparazione completa*, impostare 10 minuti e 3 giorni/settimana.
4. Salvare: verificare calendario di 3 attività alternate, incluse lingua, stazione e trasferimento.
5. Aprire Routine, registrare un esito; tornare sul piano e vedere il risultato.
6. Aprire un secondo account: nessun piano dell'altro utente deve essere accessibile.
7. Verificare Revisione settimanale (scrittura e ricarica) e possibilità di modificare l'assessment.
8. Verificare pausa percorso, pagina senza percorsi e UI smartphone.
9. Non esporre dati sanitari sensibili nel test. Evitare account e dati reali fino a verifica di sicurezza/privacy.
