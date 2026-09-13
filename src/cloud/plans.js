import {hydrateMealPlansSafe,loadMealPlansSafe,queueMealPlanSyncSafe,saveMealPlansSafe} from './plansSafe.js';

export const loadMealPlans=loadMealPlansSafe;
export const saveMealPlans=saveMealPlansSafe;
export const hydrateMealPlans=hydrateMealPlansSafe;
export const queueMealPlanSync=queueMealPlanSyncSafe;
