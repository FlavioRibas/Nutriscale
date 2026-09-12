import {getSupabase} from './supabaseClient.js';

const slugify=(value='')=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'tag';

async function currentUser(){
  const supabase=await getSupabase();
  if(!supabase) throw new Error('Supabase is not configured.');
  const {data:{user},error}=await supabase.auth.getUser();
  if(error) throw error;
  if(!user) throw new Error('You must be signed in.');
  return {supabase,user};
}

export async function syncTagsFromLabels(labels=[]){
  const {supabase,user}=await currentUser();
  const unique=[...new Set(labels.map(x=>String(x||'').trim()).filter(Boolean))];
  for(const label of unique){
    const slug=slugify(label);
    const {data,error}=await supabase.from('tags').select('id').eq('slug',slug).maybeSingle();
    if(error) throw error;
    if(data) continue;
    const created=await supabase.from('tags').insert({slug,label_en:label,tag_group:'custom',is_system:false,created_by:user.id});
    if(created.error && created.error.code!=='23505') throw created.error;
  }
}
