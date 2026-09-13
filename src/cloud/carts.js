import {getSupabase} from './supabaseClient.js';

async function client(){
  const supabase=await getSupabase();
  if(!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function loadShoppingCarts(userId){
  const supabase=await client();
  const {data,error}=await supabase
    .from('shopping_lists')
    .select(`id,name,created_at,updated_at,
      shopping_list_sources(id,source_type,meal_plan_id,recipe_id,start_date,end_date,selected_dates),
      shopping_list_items(id,display_name,required_quantity,required_unit,recommended_purchase_quantity,recommended_purchase_unit,recommended_package_count,recommendation_text,is_checked)`)
    .eq('owner_id',userId)
    .order('updated_at',{ascending:false});
  if(error) throw error;
  return data||[];
}

export async function createShoppingCart(userId,{name='Shopping List',planSources=[],recipeIds=[],items=[]}={}){
  const supabase=await client();
  const {data:list,error}=await supabase
    .from('shopping_lists')
    .insert({owner_id:userId,name})
    .select('id,name,created_at,updated_at')
    .single();
  if(error) throw error;

  const sources=[
    ...planSources.map(source=>({
      shopping_list_id:list.id,
      source_type:'meal_plan',
      meal_plan_id:source.planId,
      start_date:source.startDate||null,
      end_date:source.endDate||null,
      selected_dates:Array.isArray(source.selectedDates)&&source.selectedDates.length?source.selectedDates:null
    })),
    ...recipeIds.map(recipeId=>({shopping_list_id:list.id,source_type:'recipe',recipe_id:recipeId}))
  ];
  if(sources.length){
    const {error:sourcesError}=await supabase.from('shopping_list_sources').insert(sources);
    if(sourcesError) throw sourcesError;
  }

  if(items.length){
    const rows=items.map(item=>({
      shopping_list_id:list.id,
      display_name:item.name||item.display_name||'Item',
      required_quantity:item.quantity??item.required_quantity??null,
      required_unit:item.unit||item.required_unit||null,
      recommended_purchase_quantity:item.recommended_purchase_quantity??null,
      recommended_purchase_unit:item.recommended_purchase_unit||null,
      recommended_package_count:item.recommended_package_count??null,
      recommendation_text:item.recommendation_text||null,
      is_checked:Boolean(item.is_checked)
    }));
    const {error:itemsError}=await supabase.from('shopping_list_items').insert(rows);
    if(itemsError) throw itemsError;
  }
  return list;
}

export async function setShoppingItemChecked(userId,itemId,isChecked){
  const supabase=await client();
  const {error}=await supabase
    .from('shopping_list_items')
    .update({is_checked:Boolean(isChecked)})
    .eq('id',itemId)
    .in('shopping_list_id',supabase.from('shopping_lists').select('id').eq('owner_id',userId));
  if(error) throw error;
}

export async function renameShoppingCart(userId,cartId,name){
  const supabase=await client();
  const {error}=await supabase.from('shopping_lists').update({name}).eq('id',cartId).eq('owner_id',userId);
  if(error) throw error;
}

export async function deleteShoppingCart(userId,cartId){
  const supabase=await client();
  const {error}=await supabase.from('shopping_lists').delete().eq('id',cartId).eq('owner_id',userId);
  if(error) throw error;
}
