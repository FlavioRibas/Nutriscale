import {getSupabase} from '../cloud/supabaseClient.js';
import {normalizeScannedRecipe} from './recipe-schema.js';

function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error||new Error('Could not read recipe image'));
    reader.readAsDataURL(file);
  });
}

export async function recognizeRecipeImage(file,{language='en'}={}){
  if(!file) throw new Error('Choose a recipe image first.');
  if(!file.type?.startsWith('image/')) throw new Error('KinPlate currently accepts recipe images for visual recognition.');
  const supabase=await getSupabase();
  if(!supabase) throw new Error('KinPlate cloud connection is not available.');
  const imageDataUrl=await fileToDataUrl(file);
  const {data,error}=await supabase.functions.invoke('recognize-recipe',{body:{imageDataUrl,language}});
  if(error) throw error;
  if(!data?.recipe) throw new Error(data?.error||'No recipe was recognized.');
  return {...data,recipe:normalizeScannedRecipe(data.recipe)};
}

export function scannedRecipeToPrototypeForm(recipe,current={}){
  const ingredients=(recipe.ingredients||[]).map(i=>{
    const qty=i.quantity??'';
    const unit=i.unit||'';
    return [qty,unit,i.name,i.preparation].filter(Boolean).join(' ').trim();
  }).filter(Boolean).join('\n');
  const instructions=(recipe.instructions||[]).map(i=>i.text).filter(Boolean).join('\n\n');
  const extra=[
    ...(recipe.garnish||[]).map(x=>`Garnish: ${x}`),
    ...(recipe.tips||[]).map(x=>`Tip: ${x}`),
    ...(recipe.makeAhead||[]).map(x=>`Make ahead: ${x}`),
    ...(recipe.notes||[])
  ];
  return {...current,title:recipe.title||current.title||'',servings:recipe.servings||current.servings||1,categories:recipe.categories?.length?recipe.categories:current.categories||['Dinner'],rawIngredients:ingredients,instructions,notes:extra.join('\n')};
}
