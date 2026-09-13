import {getCurrentSession} from './cloud/auth.js';
import {hydrateAppPreferences,queueAppPreferenceSync} from './cloud/preferences.js';

let userId=null;
let lastSnapshot='';

function snapshot(){
  if(!userId) return '';
  return JSON.stringify({
    activePlanId:localStorage.getItem(`nutriscale_active_plan_${userId}`)||null,
    language:localStorage.getItem('nutriscale_language')||'en'
  });
}

async function prepare(){
  try{
    const {session}=await getCurrentSession();
    if(session?.user?.id){
      userId=session.user.id;
      localStorage.setItem('nutriscale_current_user_id',userId);
      await hydrateAppPreferences(userId);
      lastSnapshot=snapshot();
    }
  }catch(error){
    console.error('KinPlate preference preload failed',error);
  }

  await import('./bootstrap.jsx');

  window.setInterval(()=>{
    const currentUser=localStorage.getItem('nutriscale_current_user_id');
    if(currentUser&&currentUser!==userId){userId=currentUser;lastSnapshot=snapshot();}
    if(!userId) return;
    const next=snapshot();
    if(next&&next!==lastSnapshot){
      lastSnapshot=next;
      try{queueAppPreferenceSync(JSON.parse(next),error=>console.error('KinPlate preference sync failed',error));}catch{}
    }
  },1000);
}

prepare();
