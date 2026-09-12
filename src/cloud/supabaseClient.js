const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientPromise;

export async function getSupabase(){
  if(!isSupabaseConfigured) return null;
  if(!clientPromise){
    clientPromise = import(/* @vite-ignore */ 'https://esm.sh/@supabase/supabase-js@2').then(({createClient})=>
      createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      })
    );
  }
  return clientPromise;
}
