import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, BookOpen, Camera, Check, ChefHat, Clock3, Heart,
  Home as HomeIcon, Image as ImageIcon, Languages, ListChecks,
  Menu, Plus, Search, ShoppingCart, Sparkles, Trash2, Users,
  Utensils, X
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import './styles.css';
import './refinements.css';
import './community.css';
import './planner-v3.css';
import './shopping-v4.css';

const DEFAULT_CATEGORIES = [
  'Breakfast','Snacks','Desserts','Lunch','Dinner','Pre-Workout','Pre-Game',
  'Late Snack','Smoothies','Juices','Drinks – Non-Alcoholic','Drinks – Alcoholic'
];
const PLAN_CATEGORIES = [
  'Everyday','Vacation','Work Week','Weekend','Meal Prep','Family',
  'Sports / Competition','Weight Management','Holiday / Special Occasion'
];

const T = {
  en: {
    home:'Home', recipes:'Recipes', scan:'Scan', planner:'Planner', shopping:'Shopping', family:'Family',
    tagline:'Real food. A healthier you. Together.', goodMorning:'Good morning,', healthyMeals:'Healthy meals. Happier days.',
    search:'Search recipes, ingredients or meals...', popular:'Popular Recipes', seeAll:'See all', explore:'Explore recipes',
    myRecipes:'My Recipes', sharedRecipes:'Shared Recipes', ingredients:'Ingredients', instructions:'Instructions', nutrition:'Nutrition',
    addShopping:'Add to Shopping', addedShopping:'Added to Shopping', addMealPlan:'Add to Meal Plan', backRecipes:'Back to recipes',
    serving:'serving', servings:'servings', scanRecipe:'Scan a Recipe', recipeName:'Recipe name', meal:'Meal categories', notes:'Notes',
    saveRecipe:'Review & Save Recipe', attribution:'Shared recipe attribution', sharedNotice:'This recipe will be saved to My Recipes and added to Shared Recipes.',
    anonymous:'Keep me anonymous', showName:'Show my name with this recipe', duplicateTitle:'Similar recipe found',
    duplicateText:'This recipe is over 90% similar to an existing Shared Recipe.', useExisting:'Use existing recipe', saveVariant:'Save as new variant',
    variant:'Similar variant', shoppingTitle:'Shopping', buildShopping:'Build shopping list', mealPlanner:'Meal Planner',
    plannerIntro:'Plan any date range, including vacations and recurring weekly routines.', newPlan:'New plan', planName:'Plan name',
    planType:'Plan type', start:'Start', finish:'Finish', recurring:'Recurring weekly plan', addMeal:'Add meal',
    selectDayShop:'Add this day to shopping', allDays:'All days in this plan', selectedDays:'selected day(s)', chooseDate:'Choose a date',
    repeatWeekly:'Repeat weekly through this plan', selectPlans:'Select meal plans to include', selectPlansHelp:'Choose one or more meal plans. If you selected individual days in a plan, only those days are included.',
    need:'Need', buy:'Buy', exactAmount:'Buy exact amount', commercialSize:'Commercial size', includedPlans:'Included meal plans',
    manualRecipes:'Individually selected recipes', noPlans:'No meal plans selected', noShopping:'Your shopping list is waiting.'
  },
  pt: {
    home:'Início', recipes:'Receitas', scan:'Escanear', planner:'Planejamento', shopping:'Compras', family:'Família',
    tagline:'Comida de verdade. Uma vida mais saudável. Juntos.', goodMorning:'Bom dia,', healthyMeals:'Refeições saudáveis. Dias mais felizes.',
    search:'Buscar receitas, ingredientes ou refeições...', popular:'Receitas Populares', seeAll:'Ver todas', explore:'Explorar receitas',
    myRecipes:'Minhas Receitas', sharedRecipes:'Receitas Compartilhadas', ingredients:'Ingredientes', instructions:'Modo de preparo', nutrition:'Nutrição',
    addShopping:'Adicionar às Compras', addedShopping:'Adicionado às Compras', addMealPlan:'Adicionar ao Planejamento', backRecipes:'Voltar às receitas',
    serving:'porção', servings:'porções', scanRecipe:'Escanear uma Receita', recipeName:'Nome da receita', meal:'Categorias da refeição', notes:'Observações',
    saveRecipe:'Revisar e Salvar Receita', attribution:'Identificação na receita compartilhada', sharedNotice:'Esta receita será salva em Minhas Receitas e adicionada às Receitas Compartilhadas.',
    anonymous:'Manter meu nome anônimo', showName:'Mostrar meu nome nesta receita', duplicateTitle:'Receita semelhante encontrada',
    duplicateText:'Esta receita é mais de 90% semelhante a uma Receita Compartilhada existente.', useExisting:'Usar receita existente', saveVariant:'Salvar como nova variação',
    variant:'Variação semelhante', shoppingTitle:'Compras', buildShopping:'Criar lista de compras', mealPlanner:'Planejamento de Refeições',
    plannerIntro:'Planeje qualquer período, incluindo férias e rotinas semanais recorrentes.', newPlan:'Novo plano', planName:'Nome do plano',
    planType:'Tipo do plano', start:'Início', finish:'Fim', recurring:'Plano semanal recorrente', addMeal:'Adicionar refeição',
    selectDayShop:'Adicionar este dia às compras', allDays:'Todos os dias deste plano', selectedDays:'dia(s) selecionado(s)', chooseDate:'Escolha uma data',
    repeatWeekly:'Repetir semanalmente durante este plano', selectPlans:'Selecione os planos para incluir', selectPlansHelp:'Escolha um ou mais planos. Se você selecionou dias específicos, apenas esses dias serão incluídos.',
    need:'Precisa', buy:'Comprar', exactAmount:'Comprar quantidade exata', commercialSize:'Tamanho comercial', includedPlans:'Planos incluídos',
    manualRecipes:'Receitas selecionadas individualmente', noPlans:'Nenhum plano selecionado', noShopping:'Sua lista de compras está vazia.'
  }
};

const IMG = {
  'Greek Yogurt Berry Bowl':'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=85',
  'Chicken Rice Meal Prep':'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85'
};

const starter = [
  {
    id:'starter-yogurt', title:'Greek Yogurt Berry Bowl', category:'Breakfast', categories:['Breakfast','Snacks'], servings:1,
    ingredients:[
      {name:'Greek yogurt',quantity:200,unit:'g'},
      {name:'Blueberries',quantity:80,unit:'g'},
      {name:'Granola',quantity:40,unit:'g'}
    ],
    instructions:'Add yogurt to a bowl. Top with blueberries and granola.', shared:true, createdByCurrentUser:true
  },
  {
    id:'starter-chicken', title:'Chicken Rice Meal Prep', category:'Lunch', categories:['Lunch'], servings:2,
    ingredients:[
      {name:'Chicken breast',quantity:400,unit:'g'},
      {name:'Rice',quantity:180,unit:'g'},
      {name:'Broccoli',quantity:300,unit:'g'}
    ],
    instructions:'Cook rice. Season and cook chicken. Steam broccoli. Portion into containers.', shared:true, createdByCurrentUser:true
  }
];

const img = r => IMG[r.title] || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85';
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const addDays = (s,n) => { const d=new Date(`${s}T12:00:00`); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dateRange = (s,e) => { const a=[]; if(!s||!e||e<s) return a; let x=s; while(x<=e&&a.length<180){a.push(x);x=addDays(x,1);} return a; };
const pretty = (s,lang) => new Intl.DateTimeFormat(lang==='pt'?'pt-BR':'en-CA',{weekday:'short',month:'short',day:'numeric'}).format(new Date(`${s}T12:00:00`));

function parseIngredientLine(line){
  const c=line.replace(/^[-•*]\s*/,'').trim();
  const m=c.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-zA-Z]+)?\s+(.+)$/);
  if(!m) return {name:c,quantity:1,unit:'unit'};
  const q=m[1].includes('/')?m[1].split('/').reduce((a,b)=>Number(a)/Number(b)):Number(m[1]);
  return {name:m[3].trim(),quantity:q,unit:m[2]||'unit'};
}
const words=s=>new Set((s||'').toLowerCase().replace(/[^a-z0-9à-ú ]/gi,' ').split(/\s+/).filter(x=>x.length>2));
function jac(a,b){const A=words(a),B=words(b);if(!A.size&&!B.size)return 1;const i=[...A].filter(x=>B.has(x)).length;return i/(new Set([...A,...B]).size||1);}
const sim=(a,b)=>.55*jac(a.ingredients.map(i=>i.name).join(' '),b.ingredients.map(i=>i.name).join(' '))+.45*jac(a.instructions,b.instructions);
function diffSummary(a,b){
  const A=new Set(a.ingredients.map(i=>i.name.toLowerCase())),B=new Set(b.ingredients.map(i=>i.name.toLowerCase()));
  const plus=[...A].filter(x=>!B.has(x)).slice(0,3),minus=[...B].filter(x=>!A.has(x)).slice(0,3),p=[];
  if(plus.length)p.push(`Uses ${plus.join(', ')} not found in the closest version.`);
  if(minus.length)p.push(`Omits or replaces ${minus.join(', ')}.`);
  if(jac(a.instructions,b.instructions)<.98)p.push('Preparation steps also differ.');
  return p.slice(0,2).join(' ')||'This version preserves different quantities or preparation details.';
}

const VARIABLE_WEIGHT = ['chicken breast','chicken thigh','ground beef','beef','steak','pork','salmon','fish','shrimp','turkey','lamb'];
const PACKAGE_CATALOG = {
  granola:[250,300,500,750,1000], rice:[500,900,1000,2000,5000],
  'greek yogurt':[500,650,750,1000], yogurt:[500,650,750,1000],
  blueberries:[170,340,500], oats:[500,1000], flour:[1000,2500,5000],
  sugar:[1000,2000], pasta:[375,450,500,900,1000], cereal:[300,500,750,1000]
};
function normalizeToBase(quantity,unit){
  const u=(unit||'').toLowerCase();
  if(u==='kg') return {quantity:quantity*1000,unit:'g'};
  if(u==='l') return {quantity:quantity*1000,unit:'ml'};
  return {quantity,unit:u||'unit'};
}
function prettyQty(q,u){
  if(u==='g'&&q>=1000&&q%1000===0) return `${q/1000} kg`;
  if(u==='ml'&&q>=1000&&q%1000===0) return `${q/1000} L`;
  return `${Number(q.toFixed(2))} ${u}`;
}
function purchaseRecommendation(item){
  const name=item.name.toLowerCase();
  const base=normalizeToBase(item.quantity,item.unit);
  if(VARIABLE_WEIGHT.some(k=>name.includes(k))) return {exact:true,label:prettyQty(base.quantity,base.unit)};
  if(base.unit==='g'||base.unit==='ml'){
    const generic=base.unit==='g'?[100,200,250,300,375,400,450,500,650,750,900,1000,1500,2000,2500,5000]:[250,330,355,500,750,1000,1500,2000,4000];
    const key=Object.keys(PACKAGE_CATALOG).find(k=>name.includes(k));
    const sizes=(key?PACKAGE_CATALOG[key]:generic).slice().sort((a,b)=>a-b);
    const single=sizes.find(s=>s>=base.quantity);
    if(single) return {exact:false,label:prettyQty(single,base.unit),packages:1};
    const largest=sizes[sizes.length-1];
    const packages=Math.ceil(base.quantity/largest);
    return {exact:false,label:`${packages} × ${prettyQty(largest,base.unit)}`,packages};
  }
  if(base.unit==='unit'||base.unit==='units'||base.unit==='pc'||base.unit==='pcs') return {exact:false,label:`${Math.ceil(base.quantity)} units`,packages:Math.ceil(base.quantity)};
  return {exact:true,label:prettyQty(base.quantity,base.unit)};
}
function aggregateShopping(rs){
  const m=new Map();
  rs.forEach(r=>(r.ingredients||[]).forEach(i=>{
    const base=normalizeToBase(Number(i.quantity)||0,i.unit||'');
    const k=`${i.name.toLowerCase()}|${base.unit}`;
    const x=m.get(k)||{name:i.name,unit:base.unit,quantity:0};
    x.quantity+=base.quantity;m.set(k,x);
  }));
  return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name));
}

function Logo({t}){return <div className="brand"><div className="brand-mark"><span>◒</span><span>◓</span></div><div><div className="brand-name">NutriScale</div><div className="brand-tagline">{t.tagline}</div></div></div>;}

function App(){
  const currentUserId=localStorage.getItem('nutriscale_current_user_id')||'anonymous';
  const currentUserName=localStorage.getItem('nutriscale_current_user_name')||'Family';
  const userKey=key=>`${key}_${currentUserId}`;
  const [language,setLanguage]=useState(()=>localStorage.getItem('nutriscale_language')||'en');
  const t=T[language];
  const [recipes,setRecipes]=useState(()=>JSON.parse(localStorage.getItem('nutriscale_recipes')||'null')||starter);
  const [categories,setCategories]=useState(()=>[...new Set([...DEFAULT_CATEGORIES,...(JSON.parse(localStorage.getItem('nutriscale_categories')||'[]'))])]);
  const [screen,setScreen]=useState('home');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState([]);
  const [activeRecipe,setActiveRecipe]=useState(null);
  const [activeTab,setActiveTab]=useState('ingredients');
  const [scope,setScope]=useState('mine');
  const [ocrStatus,setOcrStatus]=useState('');
  const [form,setForm]=useState({title:'',categories:['Breakfast'],servings:1,rawIngredients:'',instructions:'',notes:'',attributionAllowed:false,contributorName:''});
  const [duplicate,setDuplicate]=useState(null);
  const [pending,setPending]=useState(null);
  const defaultStart=today();
  const [plans,setPlans]=useState(()=>JSON.parse(localStorage.getItem(userKey('nutriscale_plans'))||'null')||[{id:'default-plan',name:'My Weekly Plan',type:'Everyday',start:defaultStart,end:addDays(defaultStart,6),recurring:true,meals:{}}]);
  const [activePlanId,setActivePlanId]=useState(()=>localStorage.getItem(userKey('nutriscale_active_plan'))||'default-plan');
  const [mealModal,setMealModal]=useState(null);
  const [shoppingSelections,setShoppingSelections]=useState(()=>JSON.parse(localStorage.getItem(userKey('nutriscale_plan_shopping_selections'))||'{}'));
  const [shoppingPlanIds,setShoppingPlanIds]=useState(()=>JSON.parse(localStorage.getItem(userKey('nutriscale_shopping_plan_ids'))||'[]'));

  const activePlan=plans.find(p=>p.id===activePlanId)||plans[0];
  const persistRecipes=n=>{setRecipes(n);localStorage.setItem('nutriscale_recipes',JSON.stringify(n));localStorage.setItem('nutriscale_categories',JSON.stringify(categories));};
  const persistPlans=n=>{setPlans(n);localStorage.setItem(userKey('nutriscale_plans'),JSON.stringify(n));};
  const updatePlan=p=>persistPlans(plans.map(x=>x.id===p.id?p:x));
  const filtered=useMemo(()=>{const q=query.toLowerCase();return recipes.filter(r=>[r.title,(r.categories||[r.category]).join(' '),r.instructions,...r.ingredients.map(i=>i.name)].join(' ').toLowerCase().includes(q));},[recipes,query]);

  const selectedPlanShopping=useMemo(()=>{
    const rs=[];
    shoppingPlanIds.forEach(planId=>{
      const plan=plans.find(p=>p.id===planId); if(!plan)return;
      const chosen=shoppingSelections[planId]||[];
      const dates=chosen.length?chosen:dateRange(plan.start,plan.end);
      dates.forEach(d=>(plan.meals?.[d]||[]).forEach(id=>{const r=recipes.find(x=>x.id===id);if(r)rs.push(r);}));
    });
    return aggregateShopping(rs);
  },[shoppingPlanIds,shoppingSelections,plans,recipes]);
  const manualShopping=useMemo(()=>aggregateShopping(recipes.filter(r=>selected.includes(r.id))),[recipes,selected]);
  const shoppingList=useMemo(()=>aggregateShopping([
    ...shoppingPlanIds.flatMap(planId=>{
      const plan=plans.find(p=>p.id===planId); if(!plan)return[];
      const chosen=shoppingSelections[planId]||[];
      const dates=chosen.length?chosen:dateRange(plan.start,plan.end);
      return dates.flatMap(d=>(plan.meals?.[d]||[]).map(id=>recipes.find(x=>x.id===id)).filter(Boolean));
    }),
    ...recipes.filter(r=>selected.includes(r.id))
  ]),[shoppingPlanIds,shoppingSelections,plans,recipes,selected]);

  useEffect(()=>{
    const initial={nutriscale:true,screen:'home',recipeId:null};
    window.history.replaceState(initial,'',window.location.href);
    const onPop=e=>{
      const s=e.state;
      if(!s?.nutriscale)return;
      setScreen(s.screen||'home');
      setActiveRecipe(s.recipeId?recipes.find(r=>r.id===s.recipeId)||null:null);
      setActiveTab('ingredients');
    };
    window.addEventListener('popstate',onPop);
    return()=>window.removeEventListener('popstate',onPop);
  },[recipes]);

  function pushState(nextScreen,recipe=null){
    window.history.pushState({nutriscale:true,screen:nextScreen,recipeId:recipe?.id||null},'',window.location.href);
  }
  function navigate(next){
    setActiveRecipe(null);setActiveTab('ingredients');setScreen(next);pushState(next,null);
  }
  function openRecipe(recipe){
    setActiveRecipe(recipe);setActiveTab('ingredients');pushState(screen,recipe);
  }
  function appBack(){
    if(window.history.state?.nutriscale) window.history.back();
    else {setActiveRecipe(null);setScreen('recipes');}
  }
  function changeLanguage(v){setLanguage(v);localStorage.setItem('nutriscale_language',v);}

  async function handleOCR(file){
    if(!file)return;setOcrStatus(language==='pt'?'Lendo imagem...':'Reading image...');
    try{const r=await Tesseract.recognize(file,language==='pt'?'por':'eng');setForm(f=>({...f,rawIngredients:`${f.rawIngredients}\n${r.data.text}`.trim()}));setOcrStatus(language==='pt'?'OCR concluído. Revise antes de salvar.':'OCR complete. Review before saving.');}
    catch{setOcrStatus(language==='pt'?'Falha no OCR.':'OCR failed.');}
  }
  function saveRecipe(e){
    e.preventDefault();
    const r={id:crypto.randomUUID(),title:form.title||'Untitled Recipe',category:form.categories[0]||'Breakfast',categories:form.categories,servings:Number(form.servings)||1,ingredients:form.rawIngredients.split('\n').map(x=>x.trim()).filter(Boolean).map(parseIngredientLine),instructions:form.instructions,notes:form.notes,shared:true,createdByCurrentUser:true,attributionAllowed:form.attributionAllowed,contributorName:form.attributionAllowed?form.contributorName.trim():''};
    const matches=recipes.map(x=>({recipe:x,score:sim(r,x)})).filter(x=>x.score>=.9).sort((a,b)=>b.score-a.score);
    if(matches.length){setPending(r);setDuplicate(matches[0]);}else finalize(r);
  }
  function finalize(r,m=null){
    const n=m?{...r,variantOf:m.recipe.id,variantSummary:diffSummary(r,m.recipe)}:r;
    persistRecipes([n,...recipes]);
    setForm({title:'',categories:['Breakfast'],servings:1,rawIngredients:'',instructions:'',notes:'',attributionAllowed:false,contributorName:''});
    setDuplicate(null);setPending(null);setScope('mine');setScreen('recipes');pushState('recipes',null);
  }
  function addMeal(recipe,date,repeat){
    const meals={...(activePlan.meals||{})};
    const dates=repeat?dateRange(date,activePlan.end).filter((_,i)=>i%7===0):[date];
    dates.forEach(d=>meals[d]=[...(meals[d]||[]),recipe.id]);
    updatePlan({...activePlan,meals});setMealModal(null);
  }
  function removeMeal(date,id){const meals={...(activePlan.meals||{})};meals[date]=(meals[date]||[]).filter(x=>x!==id);updatePlan({...activePlan,meals});}
  function toggleShopDate(planId,date){
    const current=shoppingSelections[planId]||[];
    const next=current.includes(date)?current.filter(x=>x!==date):[...current,date];
    const all={...shoppingSelections,[planId]:next};setShoppingSelections(all);localStorage.setItem(userKey('nutriscale_plan_shopping_selections'),JSON.stringify(all));
  }
  function toggleShoppingPlan(id){
    const next=shoppingPlanIds.includes(id)?shoppingPlanIds.filter(x=>x!==id):[...shoppingPlanIds,id];
    setShoppingPlanIds(next);localStorage.setItem(userKey('nutriscale_shopping_plan_ids'),JSON.stringify(next));
  }
  function buildPlanShopping(){
    const ids=shoppingPlanIds.includes(activePlan.id)?shoppingPlanIds:[...shoppingPlanIds,activePlan.id];
    setShoppingPlanIds(ids);localStorage.setItem(userKey('nutriscale_shopping_plan_ids'),JSON.stringify(ids));navigate('shopping');
  }
  function newPlan(){
    const s=today(),p={id:crypto.randomUUID(),name:'New Meal Plan',type:'Everyday',start:s,end:addDays(s,6),recurring:false,meals:{}};
    persistPlans([...plans,p]);setActivePlanId(p.id);localStorage.setItem(userKey('nutriscale_active_plan'),p.id);
  }
  function selectPlan(id){setActivePlanId(id);localStorage.setItem(userKey('nutriscale_active_plan'),id);}

  const nav=[
    {id:'home',label:t.home,icon:HomeIcon},{id:'recipes',label:t.recipes,icon:BookOpen},
    {id:'scan',label:t.scan,icon:Plus,primary:true},{id:'planner',label:t.planner,icon:ListChecks},
    {id:'shopping',label:t.shopping,icon:ShoppingCart}
  ];

  return <div className="shell">
    <TopBar nav={nav} screen={screen} navigate={navigate} t={t} language={language} changeLanguage={changeLanguage}/>
    {activeRecipe ? <main className="content narrow-content">
      <button className="back-button" onClick={appBack}><ArrowLeft size={18}/>{t.backRecipes}</button>
      <RecipeDetail r={activeRecipe} t={t} tab={activeTab} setTab={setActiveTab} selected={selected.includes(activeRecipe.id)} toggle={()=>setSelected(s=>s.includes(activeRecipe.id)?s.filter(x=>x!==activeRecipe.id):[...s,activeRecipe.id])} addPlan={()=>setMealModal({recipe:activeRecipe,date:activePlan.start,mode:'date'})}/>
    </main> : <main className="content">
      {screen==='home'&&<Home recipes={recipes} query={query} setQuery={setQuery} open={openRecipe} navigate={navigate} t={t} userName={currentUserName}/>} 
      {screen==='recipes'&&<Recipes recipes={filtered} scope={scope} setScope={setScope} query={query} setQuery={setQuery} open={openRecipe} selected={selected} setSelected={setSelected} deleteRecipe={id=>persistRecipes(recipes.filter(r=>r.id!==id))} t={t}/>} 
      {screen==='scan'&&<Scan form={form} setForm={setForm} categories={categories} saveRecipe={saveRecipe} handleOCR={handleOCR} ocrStatus={ocrStatus} t={t}/>} 
      {screen==='planner'&&<Planner recipes={recipes} plans={plans} activePlan={activePlan} selectPlan={selectPlan} newPlan={newPlan} updatePlan={updatePlan} openMeal={date=>setMealModal({date,mode:'picker'})} removeMeal={removeMeal} shoppingSelections={shoppingSelections} toggleShopDate={toggleShopDate} buildShopping={buildPlanShopping} t={t} language={language}/>} 
      {screen==='shopping'&&<Shopping list={shoppingList} plans={plans} shoppingPlanIds={shoppingPlanIds} toggleShoppingPlan={toggleShoppingPlan} shoppingSelections={shoppingSelections} t={t} recipes={recipes} selected={selected} setSelected={setSelected}/>} 
    </main>}
    <BottomNav nav={nav} screen={screen} navigate={navigate}/>
    {mealModal&&<MealModal modal={mealModal} setModal={setMealModal} recipes={recipes} activePlan={activePlan} addMeal={addMeal} t={t} language={language}/>} 
    {duplicate&&pending&&<Duplicate match={duplicate} pending={pending} t={t} close={()=>{setDuplicate(null);setPending(null);}} useExisting={()=>{openRecipe(duplicate.recipe);setDuplicate(null);setPending(null);}} saveVariant={()=>finalize(pending,duplicate)}/>} 
  </div>;
}

function TopBar({nav,screen,navigate,t,language,changeLanguage}){return <header className="topbar"><Logo t={t}/><nav className="desktop-nav">{nav.filter(i=>!i.primary).map(i=>{const I=i.icon;return <button key={i.id} className={screen===i.id?'active':''} onClick={()=>navigate(i.id)}><I size={18}/>{i.label}</button>;})}</nav><div className="topbar-actions"><label className="language-switch"><Languages size={17}/><select value={language} onChange={e=>changeLanguage(e.target.value)}><option value="en">EN</option><option value="pt">PT-BR</option></select></label><button className="profile-button"><Users size={19}/><span>{t.family}</span></button></div></header>;}
function BottomNav({nav,screen,navigate}){return <nav className="bottom-nav">{nav.map(i=>{const I=i.icon;return <button key={i.id} className={`${screen===i.id?'active':''} ${i.primary?'scan-nav':''}`} onClick={()=>navigate(i.id)}><span className="nav-icon"><I size={i.primary?24:20}/></span><span>{i.label}</span></button>;})}</nav>;}
function Home({recipes,query,setQuery,open,navigate,t,userName}){return <div><section className="welcome-row"><div><p className="welcome-kicker">{t.goodMorning}</p><h1>{userName}</h1><p>{t.healthyMeals}</p></div><div className="family-avatar"><Users size={24}/></div></section><div className="search-box large-search"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></div><section className="category-grid">{['Breakfast','Lunch','Snacks','Dinner'].map((c,i)=><button key={c} className="category-card" onClick={()=>navigate('recipes')}><span>{['☀️','🥬','🍎','🍽️'][i]}</span><strong>{c}</strong></button>)}</section><section className="morning-feature premium-card"><div className="feature-copy"><span className="eyebrow">NutriScale pick</span><h2>Start your day well</h2><p>Simple, nutritious recipes for a healthier you and the people you love.</p><button className="primary-button" onClick={()=>navigate('recipes')}>{t.explore} →</button></div><div className="feature-photo"/></section><section className="section-block"><div className="section-heading"><h2>{t.popular}</h2><button className="text-button" onClick={()=>navigate('recipes')}>{t.seeAll}</button></div><div className="recipe-card-grid home-recipe-grid">{recipes.slice(0,5).map(r=><RecipeCard key={r.id} r={r} open={()=>open(r)}/>)}</div></section></div>;}
function RecipeCard({r,open}){return <article className="recipe-card" onClick={open}><div className="recipe-card-image" style={{backgroundImage:`url(${img(r)})`}}><button className="heart-button"><Heart size={18}/></button></div><div className="recipe-card-body"><span className="eyebrow">{(r.categories||[r.category]).slice(0,2).join(' · ')}</span><h3>{r.title}</h3>{r.variantOf&&<span className="variant-badge">Similar variant</span>}<div className="recipe-meta"><span><Clock3 size={15}/>30 min</span><span><Utensils size={15}/>{r.servings}</span></div></div></article>;}
function RecipeDetail({r,t,tab,setTab,selected,toggle,addPlan}){return <article className="recipe-detail premium-card"><div className="detail-image" style={{backgroundImage:`url(${img(r)})`}}/><div className="detail-body"><span className="eyebrow">{(r.categories||[r.category]).join(' · ')}</span><h1>{r.title}</h1>{r.variantSummary&&<div className="variant-note"><strong>{t.variant}</strong><p>{r.variantSummary}</p></div>}<div className="detail-tabs"><button className={tab==='ingredients'?'active':''} onClick={()=>setTab('ingredients')}>{t.ingredients}</button><button className={tab==='instructions'?'active':''} onClick={()=>setTab('instructions')}>{t.instructions}</button><button className={tab==='nutrition'?'active':''} onClick={()=>setTab('nutrition')}>{t.nutrition}</button></div><div className="detail-tab-content">{tab==='ingredients'&&<ul className="ingredient-list">{r.ingredients.map((i,n)=><li key={n}><span className="ingredient-check"><Check size={13}/></span><span>{i.name}</span><strong>{i.quantity} {i.unit}</strong></li>)}</ul>}{tab==='instructions'&&<div className="instructions-panel"><ChefHat size={23}/><p>{r.instructions}</p></div>}{tab==='nutrition'&&<div className="nutrition-panel"><Sparkles size={23}/><p>Nutrition details will appear here as verified nutrition data is added.</p></div>}</div><div className="detail-actions"><button className="secondary-button" onClick={toggle}><ShoppingCart size={18}/>{selected?t.addedShopping:t.addShopping}</button><button className="primary-button" onClick={addPlan}><ListChecks size={18}/>{t.addMealPlan}</button></div></div></article>;}
function Recipes({recipes,scope,setScope,query,setQuery,open,selected,setSelected,deleteRecipe,t}){const shown=scope==='shared'?recipes.filter(r=>r.shared!==false):recipes.filter(r=>r.createdByCurrentUser!==false);return <div><section className="page-title-row"><div><span className="eyebrow">Your kitchen library</span><h1>{t.recipes}</h1></div></section><div className="library-tabs"><button className={scope==='mine'?'active':''} onClick={()=>setScope('mine')}>{t.myRecipes}</button><button className={scope==='shared'?'active':''} onClick={()=>setScope('shared')}>{t.sharedRecipes}</button></div><div className="search-box"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></div><div className="recipe-card-grid catalog-grid" style={{marginTop:24}}>{shown.map(r=><div key={r.id}><RecipeCard r={r} open={()=>open(r)}/>{scope==='shared'&&<div className="shared-meta">{r.attributionAllowed&&r.contributorName?`Shared by ${r.contributorName}`:'Community contributed'}</div>}<div className="catalog-actions"><button className={`select-button ${selected.includes(r.id)?'selected':''}`} onClick={()=>setSelected(s=>s.includes(r.id)?s.filter(x=>x!==r.id):[...s,r.id])}><ShoppingCart size={16}/>{selected.includes(r.id)?'Selected':'For shopping'}</button>{scope==='mine'&&<button className="delete-button" onClick={()=>deleteRecipe(r.id)}><Trash2 size={16}/></button>}</div></div>)}</div></div>;}
function Scan({form,setForm,categories,saveRecipe,handleOCR,ocrStatus,t}){const toggle=c=>setForm({...form,categories:form.categories.includes(c)?form.categories.filter(x=>x!==c):[...form.categories,c]});return <div className="page-grid scan-layout"><section><h1>{t.scanRecipe}</h1><div className="scan-options"><label className="scan-option active"><Camera size={22}/><strong>Photo</strong><input type="file" accept="image/*" onChange={e=>handleOCR(e.target.files[0])}/></label><label className="scan-option"><ImageIcon size={22}/><strong>Upload</strong><input type="file" accept="image/*" onChange={e=>handleOCR(e.target.files[0])}/></label><div className="scan-option"><Menu size={22}/><strong>Paste text</strong></div></div>{ocrStatus&&<div className="status-note">{ocrStatus}</div>}</section><section className="premium-card form-card"><form onSubmit={saveRecipe} className="recipe-form"><label>{t.recipeName}<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>{t.meal}<div className="category-checks">{categories.map(c=><button type="button" key={c} className={form.categories.includes(c)?'active':''} onClick={()=>toggle(c)}>{form.categories.includes(c)&&<Check size={13}/>} {c}</button>)}</div></label><label>{t.servings}<input type="number" min="1" max="12" value={form.servings} onChange={e=>setForm({...form,servings:e.target.value})}/></label><label>{t.ingredients}<textarea rows="8" value={form.rawIngredients} onChange={e=>setForm({...form,rawIngredients:e.target.value})}/></label><label>{t.instructions}<textarea rows="5" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></label><label>{t.notes}<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="sharing-box"><strong>{t.attribution}</strong><p>{t.sharedNotice}</p><label className="consent-row"><input type="checkbox" checked={form.attributionAllowed} onChange={e=>setForm({...form,attributionAllowed:e.target.checked})}/><span>{form.attributionAllowed?t.showName:t.anonymous}</span></label>{form.attributionAllowed&&<input placeholder="Name shown with this recipe" value={form.contributorName} onChange={e=>setForm({...form,contributorName:e.target.value})}/>}</div><button className="primary-button full-button"><Plus size={19}/>{t.saveRecipe}</button></form></section></div>;}
function Planner({recipes,plans,activePlan,selectPlan,newPlan,updatePlan,openMeal,removeMeal,shoppingSelections,toggleShopDate,buildShopping,t,language}){const dates=dateRange(activePlan.start,activePlan.end),chosen=shoppingSelections[activePlan.id]||[];return <div><div className="plan-selector-row"><section className="page-title-row"><div><span className="eyebrow">Flexible planning for real life</span><h1>{t.mealPlanner}</h1><p>{t.plannerIntro}</p></div></section><div className="plan-top-actions"><div className="plan-switcher"><select value={activePlan.id} onChange={e=>selectPlan(e.target.value)}>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="secondary-button" onClick={newPlan}>+ {t.newPlan}</button></div></div></div><section className="premium-card plan-control-bar"><label>{t.planName}<input value={activePlan.name} onChange={e=>updatePlan({...activePlan,name:e.target.value})}/></label><label>{t.planType}<select value={activePlan.type} onChange={e=>updatePlan({...activePlan,type:e.target.value})}>{PLAN_CATEGORIES.map(x=><option key={x}>{x}</option>)}</select></label><label>{t.start}<input type="date" value={activePlan.start} onChange={e=>updatePlan({...activePlan,start:e.target.value})}/></label><label>{t.finish}<input type="date" value={activePlan.end} onChange={e=>updatePlan({...activePlan,end:e.target.value})}/></label><label className="recurring-toggle"><input type="checkbox" checked={activePlan.recurring} onChange={e=>updatePlan({...activePlan,recurring:e.target.checked})}/>{t.recurring}</label></section><div className="calendar-toolbar"><div><strong>{dates.length} days</strong><p>{chosen.length?`${chosen.length} ${t.selectedDays}`:t.allDays}</p></div><button className="primary-button" onClick={buildShopping}><ShoppingCart size={18}/>{t.buildShopping}</button></div><section className="planner-calendar">{dates.map(d=>{const rs=(activePlan.meals?.[d]||[]).map(id=>recipes.find(r=>r.id===id)).filter(Boolean);return <article key={d} className={`premium-card calendar-day ${chosen.includes(d)?'shopping-day':''}`}><div className="calendar-day-head"><div><small>{new Date(`${d}T12:00:00`).getFullYear()}</small><strong>{pretty(d,language)}</strong></div><button className={`day-shopping-toggle ${chosen.includes(d)?'active':''}`} title={t.selectDayShop} onClick={()=>toggleShopDate(activePlan.id,d)}>{chosen.includes(d)?'✓ ':''}<ShoppingCart size={16}/></button></div><div className="calendar-meals">{rs.length?rs.map((r,i)=><div className="calendar-meal" key={`${r.id}-${i}`}><span className="meal-thumb" style={{backgroundImage:`url(${img(r)})`}}/><span><small>{r.category}</small><strong>{r.title}</strong></span><button className="remove-meal" onClick={()=>removeMeal(d,r.id)}>×</button></div>):<p className="calendar-empty">No meals planned yet.</p>}</div><button className="calendar-add" onClick={()=>openMeal(d)}><Plus size={16}/>{t.addMeal}</button></article>;})}</section></div>;}
function MealModal({modal,setModal,recipes,activePlan,addMeal,t,language}){const[search,setSearch]=useState(''),[date,setDate]=useState(modal.date||activePlan.start),[repeat,setRepeat]=useState(activePlan.recurring);const dates=dateRange(activePlan.start,activePlan.end),shown=recipes.filter(r=>`${r.title} ${r.category}`.toLowerCase().includes(search.toLowerCase()));if(modal.mode==='picker')return <div className="modal-backdrop"><div className="meal-plan-modal"><button className="modal-close" onClick={()=>setModal(null)}><X size={19}/></button><h2>{t.addMeal} · {pretty(modal.date,language)}</h2><input className="recipe-picker-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/><div className="recipe-picker-list">{shown.map(r=><button className="recipe-picker-item" key={r.id} onClick={()=>addMeal(r,modal.date,repeat)}><span><strong>{r.title}</strong><small>{r.category}</small></span><Plus size={18}/></button>)}</div>{activePlan.recurring&&<label className="repeat-row"><input type="checkbox" checked={repeat} onChange={e=>setRepeat(e.target.checked)}/>{t.repeatWeekly}</label>}</div></div>;return <div className="modal-backdrop"><div className="meal-plan-modal"><button className="modal-close" onClick={()=>setModal(null)}><X size={19}/></button><span className="eyebrow">{t.addMealPlan}</span><h2>{t.chooseDate}</h2><div className="modal-recipe"><span className="meal-thumb" style={{backgroundImage:`url(${img(modal.recipe)})`}}/><strong>{modal.recipe.title}</strong></div><div className="date-options">{dates.map(d=><button key={d} className={date===d?'active':''} onClick={()=>setDate(d)}>{pretty(d,language)}</button>)}</div>{activePlan.recurring&&<label className="repeat-row"><input type="checkbox" checked={repeat} onChange={e=>setRepeat(e.target.checked)}/>{t.repeatWeekly}</label>}<div className="modal-actions"><button className="secondary-button" onClick={()=>setModal(null)}>Cancel</button><button className="primary-button" onClick={()=>addMeal(modal.recipe,date,repeat)}>Add</button></div></div></div>;}
function Shopping({list,plans,shoppingPlanIds,toggleShoppingPlan,shoppingSelections,t,recipes,selected,setSelected}){return <div><section className="page-title-row"><div><span className="eyebrow">{t.includedPlans}</span><h1>{t.shoppingTitle}</h1><p>{t.selectPlansHelp}</p></div></section><div className="shopping-source-layout"><aside className="premium-card shopping-source-panel"><h2>{t.selectPlans}</h2><div className="plan-shopping-options">{plans.map(p=>{const days=shoppingSelections[p.id]||[];return <label key={p.id} className="plan-shopping-option"><input type="checkbox" checked={shoppingPlanIds.includes(p.id)} onChange={()=>toggleShoppingPlan(p.id)}/><span><strong>{p.name}</strong><small>{p.type} · {days.length?`${days.length} ${t.selectedDays}`:t.allDays}</small></span></label>;})}</div><hr/><h3>{t.manualRecipes}</h3><div className="manual-recipe-options">{recipes.map(r=><label key={r.id} className="recipe-toggle"><input type="checkbox" checked={selected.includes(r.id)} onChange={()=>setSelected(s=>s.includes(r.id)?s.filter(x=>x!==r.id):[...s,r.id])}/><span><strong>{r.title}</strong><small>{r.category}</small></span></label>)}</div></aside><section className="premium-card shopping-card"><div className="shopping-summary-head"><div><span className="eyebrow">{t.includedPlans}</span><h2>{shoppingPlanIds.length} plan(s)</h2></div><ShoppingCart size={28}/></div>{!list.length?<div className="empty-state"><ShoppingCart size={38}/><h2>{t.noShopping}</h2></div>:<ul className="shopping-list">{list.map((i,n)=>{const buy=purchaseRecommendation(i);return <li key={`${i.name}-${n}`}><span className="shopping-check"/><div className="shopping-item-copy"><strong>{i.name}</strong><small>{t.need}: {prettyQty(i.quantity,i.unit)}</small></div><div className="commercial-buy"><small>{buy.exact?t.exactAmount:t.commercialSize}</small><strong>{buy.label}</strong></div></li>;})}</ul>}</section></div></div>;}
function Duplicate({match,pending,t,close,useExisting,saveVariant}){return <div className="modal-backdrop"><div className="meal-plan-modal"><button className="modal-close" onClick={close}><X size={19}/></button><span className="eyebrow">{Math.round(match.score*100)}% match</span><h2>{t.duplicateTitle}</h2><p>{t.duplicateText}</p><div className="variant-note"><strong>{t.variant}</strong><p>{diffSummary(pending,match.recipe)}</p></div><div className="modal-actions"><button className="secondary-button" onClick={useExisting}>{t.useExisting}</button><button className="primary-button" onClick={saveVariant}>{t.saveVariant}</button></div></div></div>;}

createRoot(document.getElementById('root')).render(<App/>);
