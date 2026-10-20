/** Il Coach e il pianificatore usano prima il modello scelto dall'utente su Vercel. */
export const DEFAULT_GEMINI_MODEL='gemini-3.5-flash-lite';
export function candidateGeminiModels(selected:string|undefined):string[]{
 const value=(selected||'').trim().replace(/^models\//,'');
 return [...new Set([value||DEFAULT_GEMINI_MODEL,DEFAULT_GEMINI_MODEL])];
}
