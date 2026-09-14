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

function canvasToJpeg(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(
    blob=>blob?resolve(blob):reject(new Error('Could not convert this photo to JPEG.')),
    'image/jpeg',0.92
  ));
}

async function decodeWithImageElement(file){
  const url=URL.createObjectURL(file);
  try{
    const image=new Image();
    image.decoding='async';
    await new Promise((resolve,reject)=>{
      image.onload=resolve;
      image.onerror=()=>reject(new Error('The browser could not decode this photo.'));
      image.src=url;
    });
    return image;
  }finally{
    // Keep the object URL alive until the caller has drawn the image.
  }
}

function makeCanvas(width,height){
  const maxSide=2200;
  const scale=Math.min(1,maxSide/Math.max(width,height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));
  canvas.height=Math.max(1,Math.round(height*scale));
  return canvas;
}

async function normalizeImageForVision(file){
  const supported=['image/jpeg','image/png','image/webp','image/gif'];
  const type=(file.type||'').toLowerCase();
  if(supported.includes(type)) return file;

  // iPhone libraries can provide HEIC/HEIF. Different Safari versions expose
  // different decoders, so try createImageBitmap first and an <img> fallback.
  let bitmap;
  try{
    bitmap=await createImageBitmap(file);
    const canvas=makeCanvas(bitmap.width,bitmap.height);
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    return await canvasToJpeg(canvas);
  }catch(bitmapError){
    let url;
    try{
      url=URL.createObjectURL(file);
      const image=new Image();
      image.decoding='async';
      await new Promise((resolve,reject)=>{
        image.onload=resolve;
        image.onerror=()=>reject(bitmapError||new Error('The browser could not decode this photo.'));
        image.src=url;
      });
      const canvas=makeCanvas(image.naturalWidth||image.width,image.naturalHeight||image.height);
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      return await canvasToJpeg(canvas);
    }catch{
      throw new Error('This photo format could not be prepared for recognition. Please choose a JPEG, PNG, or a screenshot of the recipe.');
    }finally{
      if(url) URL.revokeObjectURL(url);
    }
  }finally{
    bitmap?.close?.();
  }
}

async function readFunctionError(error){
  const response=error?.context;
  if(response&&typeof response.clone==='function'){
    try{
      const details=await response.clone().json();
      const providerMessage=details?.details?.error?.message;
      return providerMessage||details?.error||details?.message||error?.message||'Recipe recognition failed.';
    }catch{}
  }
  return error?.message||String(error);
}

export async function recognizeRecipeImage(file,{language='en'}={}){
  if(!file) throw new Error('Choose a recipe image first.');
  if(!file.type?.startsWith('image/')) throw new Error('KinPlate currently accepts recipe images for visual recognition.');

  const supabase=await getSupabase();
  if(!supabase) throw new Error('KinPlate cloud connection is not available.');

  const {data:sessionData,error:sessionError}=await supabase.auth.getSession();
  if(sessionError) throw new Error(sessionError.message||'Could not verify your KinPlate session.');
  const accessToken=sessionData?.session?.access_token;
  if(!accessToken) throw new Error('Your KinPlate session has expired. Please sign in again before scanning a recipe.');

  const prepared=await normalizeImageForVision(file);
  const imageDataUrl=await blobToDataUrl(prepared);

  const {data,error}=await supabase.functions.invoke('recognize-recipe',{
    body:{imageDataUrl,language},
    headers:{Authorization:`Bearer ${accessToken}`}
  });
  if(error) throw new Error(await readFunctionError(error));
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
