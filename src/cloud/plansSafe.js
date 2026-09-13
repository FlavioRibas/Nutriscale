import {getSupabase} from './supabaseClient.js';

const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid=value=>UUID_RE.test(String(value||''));
const plansKey=userId=>`nutriscale_plans_${userId}`;
const activePlanKey=userId=>`nutriscale_active_plan_${userId}`;

function normalizePlans(plans){
  return (Array.isArray(plans)?plans:[]).map(plan=>({
    ...plan,
    id:isUuid(plan.id)?plan.id:crypto.randomUUID(),
    meals:plan.meals||{}
  }));
}

export async function loadMealPlansSafe(userId){
  const supabase=await getSupabase();
  if(!supabase) return [];
  const {data,error}=await supabase.from('meal_plans')
    .select('id,name,plan_type,start_date,end_date,recurring_weekly,meal_plan_entries(recipe_id,planned_date)')
    .eq('owner_id',userId)
    .order('start_date',{ascending:true});
  if(error) throw error;
  return (data||[]).map(row=>{
    const meals={};
    (row.meal_plan_entries||[]).forEach(entry=>{
      meals[entry.planned_date]=[...(meals[entry.planned_date]||[]),entry.recipe_id];
    });
    return {id:row.id,name:row.name,type:row.plan_type,start:row.start_date,end:row.end_date,recurring:Boolean(row.recurring_weekly),meals};
  });
}

export async function saveMealPlansSafe(userId,plans){
  const supabase=await getSupabase();
  if(!supabase) return [];
  const normalized=normalizePlans(plans);
  const rows=normalized.map(plan=>({
    id:plan.id,
    owner_id:userId,
    name:plan.name||'Meal Plan',
    plan_type:plan.type||'Everyday',
    start_date:plan.start,
    end_date:plan.end,
    recurring_weekly:Boolean(plan.recurring)
  }));
  if(rows.length){
    const {error}=await supabase.from('meal_plans').upsert(rows,{onConflict:'id'});
    if(error) throw error;
  }
  for(const plan of normalized){
    const {data:existing,error:readError}=await supabase.from('meal_plan_entries').select('id').eq('meal_plan_id',plan.id);
    if(readError) throw readError;
    const existingIds=(existing||[]).map(row=>row.id);
    if(existingIds.length){
      const {error}=await supabase.from('meal_plan_entries').delete().in('id',existingIds);
      if(error) throw error;
    }
    const entries=[];
    Object.entries(plan.meals||{}).forEach(([date,recipeIds])=>{
      (recipeIds||[]).forEach(recipeId=>{
        if(isUuid(recipeId)) entries.push({meal_plan_id:plan.id,recipe_id:recipeId,planned_date:date});
      });
    });
    if(entries.length){
      const {error}=await supabase.from('meal_plan_entries').insert(entries);
      if(error) throw error;
    }
  }
  const cloud=await loadMealPlansSafe(userId);
  localStorage.setItem(plansKey(userId),JSON.stringify(cloud));
  return cloud;
}

export async function hydrateMealPlansSafe(userId){
  const cloud=await loadMealPlansSafe(userId);
  if(cloud.length){
    localStorage.setItem(plansKey(userId),JSON.stringify(cloud));
    const active=localStorage.getItem(activePlanKey(userId));
    if(!cloud.some(plan=>plan.id===active)) localStorage.setItem(activePlanKey(userId),cloud[0].id);
    return cloud;
  }
  let local=[];
  try{local=JSON.parse(localStorage.getItem(plansKey(userId))||'[]');}catch{}
  if(!local.length) return [];
  const saved=await saveMealPlansSafe(userId,local);
  if(saved[0]) localStorage.setItem(activePlanKey(userId),saved[0].id);
  return saved;
}

let timer;
export function queueMealPlanSyncSafe(userId,plans){
  clearTimeout(timer);
  timer=setTimeout(()=>saveMealPlansSafe(userId,plans).catch(error=>console.error('KinPlate meal plan sync failed',error)),600);
}
