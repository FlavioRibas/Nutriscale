import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Languages,Leaf,LogIn,Mail,UserRound} from 'lucide-react';
import './styles.css';
import './refinements.css';
import './auth-v1.css';
import './kinplate-brand.css';
import './shopping-cloud-ui.css';
import './shopping-cloud-ui.js';
import './scan/scan-vision-bridge.js';
import {getCurrentProfile,getCurrentSession,onAuthStateChange,sendMagicLink,isSupabaseConfigured} from './cloud/auth.js';
import {findLocalPrototypeRecipes,getRecipeImportDecision,recordRecipeImportDecision,importPrototypeRecipes,hydrateRecipeCache} from './cloud/migration.js';
import {queueRecipeSync} from './cloud/recipeSync.js';
import {syncTagsFromLabels} from './cloud/tags.js';
import {hydrateMealPlans,queueMealPlanSync} from './cloud/plans.js';
import {hydrateCurrentShoppingState,queueCurrentShoppingSync} from './cloud/shopping.js';

const rootElement=document.getElementById('root');
const root=createRoot(rootElement);
let appStarted=false;
let storagePatched=false;

function currentShoppingState(userId){
  let planIds=[];let selections={};let recipeIds=[];
  try{planIds=JSON.parse(localStorage.getItem(`nutriscale_shopping_plan_ids_${userId}`)||'[]');}catch{}
  try{selections=JSON.parse(localStorage.getItem(`nutriscale_plan_shopping_selections_${userId}`)||'{}');}catch{}
  try{recipeIds=JSON.parse(localStorage.getItem(`nutriscale_shopping_recipe_ids_${userId}`)||'[]');}catch{}
  return {planIds,selections,recipeIds};
}

function patchStorageSync(){
  if(storagePatched) return;
  storagePatched=true;
  const nativeSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
    nativeSet.call(this,key,value);
    if(this!==localStorage) return;
    const userId=localStorage.getItem('nutriscale_current_user_id');
    if(key==='nutriscale_recipes'){
      try{queueRecipeSync(JSON.parse(value||'[]'));}catch(error){console.error('KinPlate recipe sync failed',error);}
    }
    if(key==='nutriscale_categories'){
      try{syncTagsFromLabels(JSON.parse(value||'[]')).catch(error=>console.error('KinPlate tag sync failed',error));}catch(error){console.error(error);}
    }
    if(userId&&key===`nutriscale_plans_${userId}`){
      try{queueMealPlanSync(userId,JSON.parse(value||'[]'));}catch(error){console.error('KinPlate meal plan sync failed',error);}
    }
    if(userId&&(key===`nutriscale_shopping_plan_ids_${userId}`||key===`nutriscale_plan_shopping_selections_${userId}`||key===`nutriscale_shopping_recipe_ids_${userId}`)){
      queueCurrentShoppingSync(userId,currentShoppingState(userId));
    }
  };
}

async function startApp(user){
  if(appStarted) return;
  appStarted=true;

  const {profile}=await getCurrentProfile(user.id);
  const fallbackName=user.user_metadata?.name||user.email?.split('@')[0]||'Family';
  const displayName=(profile?.display_name||fallbackName).trim();

  localStorage.setItem('nutriscale_current_user_id',user.id);
  localStorage.setItem('nutriscale_current_user_name',displayName);
  if(profile?.preferred_language){
    localStorage.setItem('nutriscale_language',profile.preferred_language==='pt-BR'?'pt':'en');
  }

  await hydrateRecipeCache(user.id);
  await hydrateMealPlans(user.id);
  await hydrateCurrentShoppingState(user.id);
  patchStorageSync();
  root.unmount();
  await import('./main3.jsx');
}

function AuthShell(){
  const [session,setSession]=useState(null);
  const [checking,setChecking]=useState(true);
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [language,setLanguage]=useState(()=>localStorage.getItem('nutriscale_language')||'en');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [importRecipes,setImportRecipes]=useState([]);
  const [showImport,setShowImport]=useState(false);
  const [importing,setImporting]=useState(false);

  const copy=useMemo(()=>language==='pt'?{
    title:'Bem-vindo ao KinPlate',subtitle:'Entre com seu nome e e-mail. Enviaremos um link seguro para entrar — sem senha.',name:'Nome',email:'E-mail',send:'Enviar link de acesso',check:'Verifique sua caixa de entrada e spam. Se o link não chegar, aguarde cerca de um minuto antes de solicitar outro.',importTitle:'Importar suas receitas existentes?',importText:n=>`Encontramos ${n} receita(s) salvas neste navegador. Você decide se deseja adicioná-las à sua conta KinPlate.`,importButton:'Importar minhas receitas',skip:'Não importar agora',working:'Importando…',config:'O projeto Supabase ainda não está configurado neste build.'
  }:{
    title:'Welcome to KinPlate',subtitle:'Sign in with your name and email. We will send you a secure sign-in link — no password needed.',name:'Name',email:'Email',send:'Send sign-in link',check:'Check your inbox and spam folder. If the link does not arrive, wait about a minute before requesting another one.',importTitle:'Import your existing recipes?',importText:n=>`We found ${n} recipe(s) saved in this browser. You choose whether to add them to your KinPlate account.`,importButton:'Import my recipes',skip:'Not now',working:'Importing…',config:'The Supabase development project is not configured in this build.'
  },[language]);

  useEffect(()=>{
    let unsubscribe=()=>{};
    (async()=>{
      const current=await getCurrentSession();
      setSession(current.session);
      setChecking(false);
      unsubscribe=await onAuthStateChange((_event,next)=>setSession(next));
    })();
    return()=>unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session?.user) return;
    const user=session.user;
    const decision=getRecipeImportDecision(user.id);
    const local=findLocalPrototypeRecipes();
    if(!decision&&local.length){setImportRecipes(local);setShowImport(true);return;}
    startApp(user).catch(error=>{setMessage(error.message||String(error));setChecking(false);});
  },[session]);

  async function requestLink(e){
    e.preventDefault();setBusy(true);setMessage('');
    localStorage.setItem('nutriscale_language',language);
    const {error}=await sendMagicLink({name,email,preferredLanguage:language==='pt'?'pt-BR':'en'});
    setBusy(false);setMessage(error?(error.message||String(error)):copy.check);
  }

  async function doImport(){
    if(!session?.user) return;
    setImporting(true);setMessage('');
    try{
      await importPrototypeRecipes(session.user.id,importRecipes);
      setShowImport(false);
      await startApp(session.user);
    }catch(error){setMessage(error.message||String(error));setImporting(false);}
  }

  async function skipImport(){
    if(!session?.user) return;
    recordRecipeImportDecision(session.user.id,'skipped');
    setShowImport(false);
    await startApp(session.user);
  }

  if(checking) return <div className="auth-page"><div className="auth-card premium-card"><div className="auth-brand"><Leaf size={28}/><strong>KinPlate</strong></div><p>Connecting…</p></div></div>;
  if(showImport) return <div className="auth-page"><div className="auth-card premium-card"><div className="auth-brand"><Leaf size={28}/><strong>KinPlate</strong></div><span className="eyebrow">One-time setup</span><h1>{copy.importTitle}</h1><p>{copy.importText(importRecipes.length)}</p><div className="import-summary"><strong>{importRecipes.length}</strong><span>{language==='pt'?'receitas encontradas':'recipes found'}</span></div>{message&&<div className="auth-message">{message}</div>}<button className="primary-button full-button" disabled={importing} onClick={doImport}>{importing?copy.working:copy.importButton}</button><button className="secondary-button full-button" disabled={importing} onClick={skipImport}>{copy.skip}</button><p className="auth-small">Nothing is uploaded until you choose Import.</p></div></div>;
  if(session?.user) return <div className="auth-page"><div className="auth-card premium-card"><p>Loading KinPlate…</p></div></div>;

  return <div className="auth-page"><div className="auth-layout"><section className="auth-welcome"><div className="auth-brand large"><Leaf size={34}/><strong>KinPlate</strong></div><span className="eyebrow">Feed the people you love.</span><h1>{copy.title}</h1><p>{copy.subtitle}</p><div className="auth-promise"><span>✓</span><div><strong>Private account</strong><p>Your meal plans and private notes stay yours.</p></div></div><div className="auth-promise"><span>✓</span><div><strong>Flexible recipes</strong><p>One recipe can have multiple tags such as Breakfast, Snack, Smoothie and Pre-Workout.</p></div></div></section><section className="auth-card premium-card"><label className="auth-language"><Languages size={17}/><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="pt">Português (BR)</option></select></label><div className="auth-brand mobile"><Leaf size={25}/><strong>KinPlate</strong></div><h2>{language==='pt'?'Entrar':'Sign in'}</h2>{!isSupabaseConfigured&&<div className="auth-message warning">{copy.config}</div>}<form onSubmit={requestLink}><label><span><UserRound size={16}/>{copy.name}</span><input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" placeholder={language==='pt'?'Seu nome':'Your name'}/></label><label><span><Mail size={16}/>{copy.email}</span><input value={email} onChange={e=>setEmail(e.target.value)} required type="email" autoComplete="email" placeholder="you@example.com"/></label><button className="primary-button full-button" disabled={busy||!isSupabaseConfigured}><LogIn size={18}/>{busy?(language==='pt'?'Enviando…':'Sending…'):copy.send}</button></form>{message&&<div className="auth-message">{message}</div>}<p className="auth-small">For testing, KinPlate uses a secure email magic link. No password is stored by KinPlate.</p></section></div></div>;
}

root.render(<AuthShell/>);