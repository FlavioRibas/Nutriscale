import {getSupabase,isSupabaseConfigured} from './supabaseClient.js';

export {isSupabaseConfigured};

export async function getCurrentSession(){
  const supabase=await getSupabase();
  if(!supabase) return {session:null,error:null};
  const {data,error}=await supabase.auth.getSession();
  return {session:data?.session||null,error};
}

export async function getCurrentProfile(userId){
  const supabase=await getSupabase();
  if(!supabase||!userId) return {profile:null,error:null};
  const {data,error}=await supabase
    .from('profiles')
    .select('id,display_name,preferred_language')
    .eq('id',userId)
    .maybeSingle();
  return {profile:data||null,error};
}

export async function updateCurrentProfile(userId,{displayName,preferredLanguage}={}){
  const supabase=await getSupabase();
  if(!supabase||!userId) return {profile:null,error:null};
  const changes={};
  if(typeof displayName==='string'&&displayName.trim()) changes.display_name=displayName.trim();
  if(typeof preferredLanguage==='string'&&preferredLanguage.trim()) changes.preferred_language=preferredLanguage.trim();
  if(!Object.keys(changes).length) return getCurrentProfile(userId);
  const {data,error}=await supabase.from('profiles').update(changes).eq('id',userId).select('id,display_name,preferred_language').maybeSingle();
  return {profile:data||null,error};
}

export async function sendMagicLink({name,email,preferredLanguage='en'}){
  const supabase=await getSupabase();
  if(!supabase) return {error:new Error('Supabase is not configured.')};
  return supabase.auth.signInWithOtp({
    email:email.trim(),
    options:{
      shouldCreateUser:true,
      emailRedirectTo:window.location.origin+window.location.pathname,
      data:{name:name.trim(),preferred_language:preferredLanguage}
    }
  });
}

export async function signOut(){
  const supabase=await getSupabase();
  if(!supabase) return {error:null};
  return supabase.auth.signOut();
}

export async function onAuthStateChange(callback){
  const supabase=await getSupabase();
  if(!supabase) return ()=>{};
  const {data}=supabase.auth.onAuthStateChange((event,session)=>callback(event,session));
  return ()=>data.subscription.unsubscribe();
}
