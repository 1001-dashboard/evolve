import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };
export async function serverSupabase() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll() { return jar.getAll(); },
      setAll(toSet: CookieToSet[]) {
        try { toSet.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Cookies cannot be set from Server Components. Middleware refreshes sessions. */ }
      }
    } }
  );
}
