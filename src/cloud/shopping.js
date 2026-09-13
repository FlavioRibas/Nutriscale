import {getSupabase} from './supabaseClient.js';

const CURRENT_LIST_NAME='KinPlate Current Shopping';
const selectionsKey=userId=>`nutriscale_plan_shopping_selections_${userId}`;
const planIdsKey=userId=>`nutriscale_shopping_plan_ids_${userId}`;
const recipeIdsKey=userId=>`nutriscale_shopping_recipe_ids_${userId}`;

async function getOrCreateCurrentList(userId){
  const supabase=await getSupabase();
  if(!supabase) return null;
  const {data,error}=await supabase
    .from('shopping_lists')
    .select('id,name')
    .eq('owner_id',userId)
    .eq('name',CURRENT_LIST_NAME)
    .order('updated_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error) throw error;
  if(data) return data;
  const {data:created,error:createError}=await supabase
    .from('shopping_lists')
    .insert({owner_id:userId,name:CURRENT_LIST_NAME})
    .select('id,name')
    .single();
  if(createError) throw createError;
  return created;
}

export async function saveCurrentShoppingState(userId,{planIds=[],selections={},recipeIds=[]}={}){
  const supabase=await getSupabase();
  if(!supabase) return;
  const list=await getOrCreateCurrentList(userId);
  if(!list) return;
  const {error:deleteError}=await supabase.from('shopping_list_sources').delete().eq('shopping_list_id',list.id);
  if(deleteError) throw deleteError;
  const rows=[
    ...(planIds||[]).map(planId=>({
      shopping_list_id:list.id,
      source_type:'meal_plan',
      meal_plan_id:planId,
      selected_dates:Array.isArray(selections?.[planId])&&selections[planId].length?selections[planId]:null
    })),
    ...(recipeIds||[]).map(recipeId=>({
      shopping_list_id:list.id,
      source_type:'recipe',
      recipe_id:recipeId
    }))
  ];
  if(rows.length){
    const {error}=await supabase.from('shopping_list_sources').insert(rows);
    if(error) throw error;
  }
  const {error:updateError}=await supabase.from('shopping_lists').update({name:CURRENT_LIST_NAME}).eq('id',list.id);
  if(updateError) throw updateError;
}

export async function hydrateCurrentShoppingState(userId){
  const supabase=await getSupabase();
  if(!supabase) return {planIds:[],selections:{},recipeIds:[]};
  const {data:list,error}=await supabase
    .from('shopping_lists')
    .select('id')
    .eq('owner_id',userId)
    .eq('name',CURRENT_LIST_NAME)
    .order('updated_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error) throw error;

  if(list){
    const {data:sources,error:sourcesError}=await supabase
      .from('shopping_list_sources')
      .select('source_type,meal_plan_id,recipe_id,selected_dates')
      .eq('shopping_list_id',list.id);
    if(sourcesError) throw sourcesError;
    const planIds=[];const selections={};const recipeIds=[];
    (sources||[]).forEach(source=>{
      if(source.source_type==='meal_plan'&&source.meal_plan_id){
        planIds.push(source.meal_plan_id);
        if(Array.isArray(source.selected_dates)&&source.selected_dates.length) selections[source.meal_plan_id]=source.selected_dates;
      }
      if(source.source_type==='recipe'&&source.recipe_id) recipeIds.push(source.recipe_id);
    });
    localStorage.setItem(planIdsKey(userId),JSON.stringify(planIds));
    localStorage.setItem(selectionsKey(userId),JSON.stringify(selections));
    localStorage.setItem(recipeIdsKey(userId),JSON.stringify(recipeIds));
    return {planIds,selections,recipeIds};
  }

  let planIds=[];let selections={};let recipeIds=[];
  try{planIds=JSON.parse(localStorage.getItem(planIdsKey(userId))||'[]');}catch{}
  try{selections=JSON.parse(localStorage.getItem(selectionsKey(userId))||'{}');}catch{}
  try{recipeIds=JSON.parse(localStorage.getItem(recipeIdsKey(userId))||'[]');}catch{}
  await saveCurrentShoppingState(userId,{planIds,selections,recipeIds});
  return {planIds,selections,recipeIds};
}

let syncTimer;
export function queueCurrentShoppingSync(userId,state){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>saveCurrentShoppingState(userId,state).catch(error=>console.error('KinPlate shopping sync failed',error)),500);
}
