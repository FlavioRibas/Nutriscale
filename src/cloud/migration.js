import {importLocalRecipes,loadRecipeCatalogue,loadTags} from './recipes.js';

export function findLocalPrototypeRecipes(){
  try{
    return (JSON.parse(localStorage.getItem('nutriscale_recipes')||'[]')||[]).filter(recipe=>!recipe.cloudSynced);
  }catch{
    return [];
  }
}

export function recipeImportDecisionKey(userId){
  return `nutriscale_recipe_import_${userId}`;
}

export function getRecipeImportDecision(userId){
  return localStorage.getItem(recipeImportDecisionKey(userId));
}

export function recordRecipeImportDecision(userId,decision){
  localStorage.setItem(recipeImportDecisionKey(userId),decision);
}

export async function importPrototypeRecipes(userId,recipes){
  const count=await importLocalRecipes(recipes);
  recordRecipeImportDecision(userId,'imported');
  return count;
}

export async function hydrateRecipeCache(userId){
  const [recipes,tags]=await Promise.all([loadRecipeCatalogue(),loadTags()]);
  localStorage.setItem('nutriscale_recipes',JSON.stringify(recipes));
  localStorage.setItem('nutriscale_categories',JSON.stringify([...new Set(tags.map(tag=>tag.label_en).filter(Boolean))]));
  localStorage.setItem(`nutriscale_cloud_hydrated_${userId}`,'1');
  return {recipes,tags};
}
