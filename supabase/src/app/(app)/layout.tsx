import { redirect } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
export default async function AppLayout({children}:{children:React.ReactNode}){const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();if(!user)redirect('/login');return <Shell email={user.email??''}>{children}</Shell>}
