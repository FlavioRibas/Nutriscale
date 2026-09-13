import {loadRecipeCatalogue} from './recipes.js';
import {mergeOwnedRecipes} from './recipeMergeSync.js';

let syncTimer=null;

export async function refreshRecipesFromCloud(){
  const recipes=await loadRecipeCatalogue();
  localStorage.setItem('nutriscale_recipes',JSON.stringify(recipes));
  return recipes;
}

export function queueRecipeSync(recipes,onError=console.error){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(async()=>{
    try{await mergeOwnedRecipes(recipes);}catch(error){onError(error);}
  },500);
}

export async function syncRecipesNow(recipes){
  clearTimeout(syncTimer);
  await mergeOwnedRecipes(recipes);
}
