"use client";
import { useRouter } from 'next/navigation';
import { browserSupabase } from '@/lib/supabase/browser';
export function SignOutButton(){const router=useRouter();return <button className="btn-secondary text-xs" onClick={async()=>{await browserSupabase().auth.signOut();router.replace('/login');router.refresh()}}>Esci</button>}
