import {getSupabase} from './supabaseClient.js';

let syncTimer=null;

async function currentUser(){
  const supabase=await getSupabase();
  if(!supabase) throw new Error('Supabase is not configured.');
  const {data:{user},error}=await supabase.auth.getUser();
  if(error) throw error;
  if(!user) throw new Error('You must be signed in.');
  return {supabase,user};
}

export async function loadAppPreferences(){
  const {user}=await currentUser();
  const data=user.user_metadata||{};
  return {
    activePlanId:typeof data.kinplate_active_plan_id==='string'?data.kinplate_active_plan_id:null,
    language:data.preferred_language==='pt-BR'?'pt':'en'
  };
}

export async function saveAppPreferences({activePlanId,language}={}){
  const {supabase,user}=await currentUser();
  const current=user.user_metadata||{};
  const next={...current};
  if(typeof activePlanId==='string'&&activePlanId) next.kinplate_active_plan_id=activePlanId;
  if(language==='pt'||language==='en') next.preferred_language=language==='pt'?'pt-BR':'en';
  const {data,error}=await supabase.auth.updateUser({data:next});
  if(error) throw error;
  return data?.user?.user_metadata||next;
}

export function queueAppPreferenceSync(preferences,onError=console.error){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>saveAppPreferences(preferences).catch(onError),500);
}

export async function hydrateAppPreferences(userId){
  const prefs=await loadAppPreferences();
  if(prefs.language) localStorage.setItem('nutriscale_language',prefs.language);
  if(prefs.activePlanId) localStorage.setItem(`nutriscale_active_plan_${userId}`,prefs.activePlanId);
  return prefs;
}
