export {getSupabase,isSupabaseConfigured} from './supabaseClient.js';
export {getCurrentSession,getCurrentProfile,updateCurrentProfile,sendMagicLink,signOut,onAuthStateChange} from './auth.js';
export {loadRecipeCatalogue,loadTags,saveRecipeToCloud,importLocalRecipes,reconcileOwnedRecipes} from './recipes.js';
export {findLocalPrototypeRecipes,getRecipeImportDecision,recordRecipeImportDecision,importPrototypeRecipes,hydrateRecipeCache} from './migration.js';
export {refreshRecipesFromCloud,queueRecipeSync,syncRecipesNow} from './recipeSync.js';
export {loadMealPlans,saveMealPlans,hydrateMealPlans,queueMealPlanSync} from './plans.js';
export {hydrateCurrentShoppingState,saveCurrentShoppingState,queueCurrentShoppingSync} from './shopping.js';
