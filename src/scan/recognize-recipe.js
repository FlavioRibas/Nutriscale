import {getSupabase} from '../cloud/supabaseClient.js';
import {normalizeScannedRecipe} from './recipe-schema.js';

function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error||new Error('Could not read recipe image'));
    reader.readAsDataURL(blob);
  });
}

async function normalizeImageForVision(file){
  const supported=['image/jpeg','image/png','image/webp','image/gif'];
  if(supported.includes((file.type||'').toLowerCase())) return file;
  // iPhone libraries commonly return HEIC/HEIF. Safari can decode these locally,
  // while vision APIs generally expect JPEG/PNG/WebP/GIF, so convert before upload.
  let bitmap;
  try{
    bitmap=await createImageBitmap(file);
    const maxSide=2200;
    const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    const jpeg=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not convert this photo to JPEG.')),'image/jpeg',0.92));
    return jpeg;
  }catch(error){
    throw new Error('This photo format could not be prepared for recognition. Please choose a JPEG, PNG, or a screenshot of the recipe.');
  }finally{bitmap?.close?.();}
}

export async function recognizeRecipeImage(file,{language='en'}={}){
  if(!file) throw new Error('Choose a recipe image first.');
  if(!file.type?.startsWith('image/')) throw new Error('KinPlate currently accepts recipe images for visual recognition.');
  const supabase=await getSupabase();
  if(!supabase) throw new Error('KinPlate cloud connection is not available.');
  const prepared=await normalizeImageForVision(file);
  const imageDataUrl=await blobToDataUrl(prepared);
  const {data,error}=await supabase.functions.invoke('recognize-recipe',{body:{imageDataUrl,language}});
  if(error){
    const context=error?.context;
    if(context?.json){try{const details=await context.json();throw new Error(details?.error||details?.message||error.message);}catch(parsed){if(parsed instanceof Error&&parsed.message!==error.message)throw parsed;}}
    throw error;
  }
  if(!data?.recipe) throw new Error(data?.error||'No recipe was recognized.');
  return {...data,recipe:normalizeScannedRecipe(data.recipe)};
}

export function scannedRecipeToPrototypeForm(recipe,current={}){
  const ingredients=(recipe.ingredients||[]).map(i=>{
    const qty=i.quantity??'';
    const unit=i.unit||'';
    const metric=i.metricQuantity!=null?[`(${i.metricQuantity}`,i.metricUnit?`${i.metricUnit})`:')'].join(' '):'';
    return [qty,unit,i.name,i.preparation,metric].filter(Boolean).join(' ').trim();
  }).filter(Boolean).join('\n');
  const instructions=(recipe.instructions||[]).map(i=>i.text).filter(Boolean).join('\n\n');
  const extra=[
    recipe.yield?.text?`Yield: ${recipe.yield.text}`:'',
    ...(recipe.garnish||[]).map(x=>`Garnish: ${x}`),
    ...(recipe.tips||[]).map(x=>`Tip: ${x}`),
    ...(recipe.makeAhead||[]).map(x=>`Make ahead: ${x}`),
    ...(recipe.notes||[])
  ].filter(Boolean);
  return {...current,title:recipe.title||current.title||'',servings:recipe.servings||current.servings||1,categories:recipe.categories?.length?recipe.categories:current.categories||['Dinner'],rawIngredients:ingredients,instructions,notes:extra.join('\n')};
}
