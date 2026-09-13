import {getSupabase} from './supabaseClient.js';

const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid=value=>UUID_RE.test(String(value||''));
const plansKey=userId=>`nutriscale_plans_${userId}`;
const activePlanKey=userId=>`nutriscale_active_plan_${userId}`;
const shoppingSelectionsKey=userId=>`nutriscale_plan_shopping_selections_${userId}`;
const shoppingPlanIdsKey=userId=>`nutriscale_shopping_plan_ids_${userId}`;

function normalizeLocalPlans(plans){
  const idMap=new Map();
  const normalized=(Array.isArray(plans)?plans:[]).map(plan=>{
    const nextId=isUuid(plan.id)?plan.id:crypto.randomUUID();
    idMap.set(plan.id,nextId);
    return {...plan,id:nextId,meals:plan.meals||{}};
  });
  return {plans:normalized,idMap};
}

function migrateScopedReferences(userId,idMap){
  const active=localStorage.getItem(activePlanKey(userId));
  if(active&&idMap.has(active)) localStorage.setItem(activePlanKey(userId),idMap.get(active));

  try{
    const selections=JSON.parse(localStorage.getItem(shoppingSelectionsKey(userId))||'{}');
    const next={};
    Object.entries(selections).forEach(([id,dates])=>{next[idMap.get(id)||id]=dates;});
    localStorage.setItem(shoppingSelectionsKey(userId),JSON.stringify(next));
  }catch{}

  try{
    const ids=JSON.parse(localStorage.getItem(shoppingPlanIdsKey(userId))||'[]');
    localStorage.setItem(shoppingPlanIdsKey(userId),JSON.stringify(ids.map(id=>idMap.get(id)||id)));
  }catch{}
}

export async function loadMealPlans(userId){
  const supabase=await getSupabase();
  if(!supabase) return [];
  const {data,error}=await supabase
    .from('meal_plans')
    .select('id,name,plan_type,start_date,end_date,recurring_weekly,meal_plan_entries(id,recipe_id,planned_date,meal_slot,servings)')
    .eq('owner_id',userId)
    .order('start_date',{ascending:true});
  if(error) throw error;
  return (data||[]).map(row=>{
    const meals={};
    (row.meal_plan_entries||[]).forEach(entry=>{
      meals[entry.planned_date]=[...(meals[entry.planned_date]||[]),entry.recipe_id];
    });
    return {
      id:row.id,
      name:row.name,
      type:row.plan_type,
      start:row.start_date,
      end:row.end_date,
      recurring:Boolean(row.recurring_weekly),
      meals
    };
  });
}

export async function saveMealPlans(userId,plans){
  const supabase=await getSupabase();
  if(!supabase) return;
  const normalized=normalizeLocalPlans(plans);
  if(normalized.idMap.size) migrateScopedReferences(userId,normalized.idMap);
  const rows=normalized.plans.map(plan=>({
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

  const {data:remote,error:remoteError}=await supabase.from('meal_plans').select('id').eq('owner_id',userId);
  if(remoteError) throw remoteError;
  const keep=new Set(rows.map(row=>row.id));
  for(const row of remote||[]){
    if(!keep.has(row.id)){
      const {error}=await supabase.from('meal_plans').delete().eq('id',row.id);
      if(error) throw error;
    }
  }

  for(const plan of normalized.plans){
    const {error:deleteError}=await supabase.from('meal_plan_entries').delete().eq('meal_plan_id',plan.id);
    if(deleteError) throw deleteError;
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
  return normalized.plans;
}

export async function hydrateMealPlans(userId){
  const cloud=await loadMealPlans(userId);
  if(cloud.length){
    localStorage.setItem(plansKey(userId),JSON.stringify(cloud));
    const active=localStorage.getItem(activePlanKey(userId));
    if(!cloud.some(plan=>plan.id===active)) localStorage.setItem(activePlanKey(userId),cloud[0].id);
    return cloud;
  }

  let local=[];
  try{local=JSON.parse(localStorage.getItem(plansKey(userId))||'[]');}catch{}
  if(!local.length){
    const start=new Date();
    const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const end=new Date(start);end.setDate(end.getDate()+6);
    local=[{id:crypto.randomUUID(),name:'My Weekly Plan',type:'Everyday',start:iso(start),end:iso(end),recurring:true,meals:{}}];
  }
  const saved=await saveMealPlans(userId,local);
  localStorage.setItem(plansKey(userId),JSON.stringify(saved));
  localStorage.setItem(activePlanKey(userId),saved[0].id);
  return saved;
}

let syncTimer;
export function queueMealPlanSync(userId,plans){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>saveMealPlans(userId,plans).catch(error=>console.error('KinPlate meal plan sync failed',error)),500);
}
