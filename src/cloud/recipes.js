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

export async function loadRecipeCatalogue(){
  const {supabase,user}=await currentUser();
  const {data,error}=await supabase.from('recipes').select(`
    id,owner_id,title,servings,instructions,visibility,attribution,attribution_name,
    difference_summary,similar_to_recipe_id,similarity_score,created_at,updated_at,
    recipe_tags(tag_id,tags(id,slug,label_en,label_pt_br,tag_group)),
    recipe_ingredients(id,display_name,quantity,unit,preparation,sort_order),
    recipe_private_notes(note,user_id)
  `).order('updated_at',{ascending:false});
  if(error) throw error;
  return (data||[]).map(r=>{
    const tags=(r.recipe_tags||[]).map(x=>x.tags).filter(Boolean);
    const categories=tags.map(t=>t.label_en);
    const ownNote=(r.recipe_private_notes||[]).find(n=>n.user_id===user.id)?.note||'';
    return {
      id:r.id,
      title:r.title,
      category:categories[0]||'Breakfast',
      categories,
      servings:Number(r.servings)||1,
      ingredients:(r.recipe_ingredients||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(i=>({name:i.display_name,quantity:Number(i.quantity)||0,unit:i.unit||'unit',preparation:i.preparation||''})),
      instructions:r.instructions||'',
      notes:ownNote,
      shared:r.visibility==='shared',
      createdByCurrentUser:r.owner_id===user.id,
      attributionAllowed:r.attribution==='named',
      contributorName:r.attribution==='named'?(r.attribution_name||''):'',
      variantOf:r.similar_to_recipe_id||null,
      variantSummary:r.difference_summary||'',
      similarityScore:r.similarity_score==null?null:Number(r.similarity_score),
      cloudSynced:true
    };
  });
}

export async function loadTags(){
  const {supabase}=await currentUser();
  const {data,error}=await supabase.from('tags').select('id,slug,label_en,label_pt_br,tag_group,is_system,created_by').order('label_en');
  if(error) throw error;
  return data||[];
}

async function ensureTag(supabase,userId,label){
  const slug=slugify(label);
  let {data,error}=await supabase.from('tags').select('id,slug,label_en').eq('slug',slug).maybeSingle();
  if(error) throw error;
  if(data) return data;
  const inserted=await supabase.from('tags').insert({slug,label_en:label,tag_group:'custom',is_system:false,created_by:userId}).select('id,slug,label_en').single();
  if(inserted.error){
    const retry=await supabase.from('tags').select('id,slug,label_en').eq('slug',slug).single();
    if(retry.error) throw inserted.error;
    return retry.data;
  }
  return inserted.data;
}

export async function saveRecipeToCloud(recipe){
  const {supabase,user}=await currentUser();
  const isUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recipe.id||'');
  const id=isUuid?recipe.id:crypto.randomUUID();
  const payload={
    id,owner_id:user.id,title:recipe.title||'Untitled Recipe',servings:Number(recipe.servings)||1,
    instructions:recipe.instructions||'',visibility:recipe.shared===false?'private':'shared',
    attribution:recipe.attributionAllowed?'named':'anonymous',
    attribution_name:recipe.attributionAllowed?(recipe.contributorName||user.user_metadata?.name||null):null,
    difference_summary:recipe.variantSummary||null,
    similar_to_recipe_id:/^[0-9a-f-]{36}$/i.test(recipe.variantOf||'')?recipe.variantOf:null,
    similarity_score:recipe.similarityScore??null
  };
  const up=await supabase.from('recipes').upsert(payload,{onConflict:'id'}).select('id').single();
  if(up.error) throw up.error;

  const delTags=await supabase.from('recipe_tags').delete().eq('recipe_id',id); if(delTags.error) throw delTags.error;
  for(const label of [...new Set(recipe.categories||[recipe.category].filter(Boolean))]){
    const tag=await ensureTag(supabase,user.id,label);
    const link=await supabase.from('recipe_tags').insert({recipe_id:id,tag_id:tag.id}); if(link.error) throw link.error;
  }

  const delIngredients=await supabase.from('recipe_ingredients').delete().eq('recipe_id',id); if(delIngredients.error) throw delIngredients.error;
  const ingredients=(recipe.ingredients||[]).map((i,index)=>({recipe_id:id,display_name:i.name||'Ingredient',quantity:Number(i.quantity)||null,unit:i.unit||null,preparation:i.preparation||null,sort_order:index}));
  if(ingredients.length){const ins=await supabase.from('recipe_ingredients').insert(ingredients); if(ins.error) throw ins.error;}

  if(recipe.notes){
    const note=await supabase.from('recipe_private_notes').upsert({recipe_id:id,user_id:user.id,note:recipe.notes},{onConflict:'recipe_id,user_id'}); if(note.error) throw note.error;
  } else {
    const note=await supabase.from('recipe_private_notes').delete().eq('recipe_id',id).eq('user_id',user.id); if(note.error) throw note.error;
  }
  return id;
}

export async function importLocalRecipes(recipes=[]){
  let imported=0;
  for(const recipe of recipes){await saveRecipeToCloud({...recipe,id:crypto.randomUUID(),createdByCurrentUser:true}); imported++;}
  return imported;
}

export async function reconcileOwnedRecipes(localRecipes=[]){
  const {supabase,user}=await currentUser();
  const owned=localRecipes.filter(r=>r.createdByCurrentUser!==false);
  const localIds=new Set();
  for(const recipe of owned){
    const id=await saveRecipeToCloud(recipe);
    localIds.add(id);
  }
  const {data,error}=await supabase.from('recipes').select('id').eq('owner_id',user.id);
  if(error) throw error;
  const removed=(data||[]).map(r=>r.id).filter(id=>!localIds.has(id));
  if(removed.length){const del=await supabase.from('recipes').delete().in('id',removed); if(del.error) throw del.error;}
}
