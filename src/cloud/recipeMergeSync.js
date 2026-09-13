import {saveRecipeToCloud} from './recipes.js';

// Multi-device safety: normal background synchronization only upserts recipes
// present on the current device. It never infers a cloud deletion from absence
// in local cache. Explicit recipe deletion remains a separate user action.
export async function mergeOwnedRecipes(localRecipes=[]){
  const owned=(Array.isArray(localRecipes)?localRecipes:[]).filter(recipe=>recipe.createdByCurrentUser!==false);
  for(const recipe of owned){
    await saveRecipeToCloud(recipe);
  }
}
