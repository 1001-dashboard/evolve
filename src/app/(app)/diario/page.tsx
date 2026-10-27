import '@/app/nutrition-journal.css';
import {serverSupabase} from '@/lib/supabase/server';
import {DiaryClient} from '@/components/diary-client';
import {NutritionJournalClient} from '@/components/nutrition-journal-client';
/** Keep free-text diary entries intact; add factual cross-domain summary from the food journal. */
export default async function Diary(){
 const sb=await serverSupabase();const {data:{user}}=await sb.auth.getUser();
 const {data}=user?await sb.from('diary_entries').select('id,kind,note,mood,created_at')
  .eq('user_id',user.id).order('created_at',{ascending:false}).limit(100):{data:[]};
 return <><DiaryClient initial={data??[]}/><NutritionJournalClient mode="diary"/></>;
}
