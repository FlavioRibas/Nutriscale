import {updateCurrentProfile} from './auth.js';

const nativeSet=Storage.prototype.setItem;

Storage.prototype.setItem=function(key,value){
  nativeSet.call(this,key,value);
  if(this!==localStorage) return;
  if(key!=='nutriscale_language') return;
  const userId=localStorage.getItem('nutriscale_current_user_id');
  if(!userId) return;
  updateCurrentProfile(userId,{preferredLanguage:value==='pt'?'pt-BR':'en'})
    .catch(error=>console.error('KinPlate language sync failed',error));
};
