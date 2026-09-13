import {loadShoppingCarts,createShoppingCart,setShoppingItemChecked,deleteShoppingCart} from './cloud/carts.js';

const key=(base,userId)=>`${base}_${userId}`;
const safeJson=(value,fallback)=>{try{return JSON.parse(value||'')??fallback;}catch{return fallback;}};
const dateRange=(s,e)=>{const out=[];if(!s||!e||e<s)return out;let d=new Date(`${s}T12:00:00`),end=new Date(`${e}T12:00:00`);while(d<=end&&out.length<180){out.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1);}return out;};
function normalize(q,u){u=(u||'unit').toLowerCase();if(u==='kg')return{quantity:q*1000,unit:'g'};if(u==='l')return{quantity:q*1000,unit:'ml'};return{quantity:q,unit:u};}
function aggregate(recipes){const map=new Map();for(const r of recipes)for(const i of r.ingredients||[]){const b=normalize(Number(i.quantity)||0,i.unit);const k=`${String(i.name).toLowerCase()}|${b.unit}`;const x=map.get(k)||{name:i.name,quantity:0,unit:b.unit};x.quantity+=b.quantity;map.set(k,x);}return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name)));}
function currentBuilder(userId){
  const plans=safeJson(localStorage.getItem(key('nutriscale_plans',userId)),[]);
  const planIds=safeJson(localStorage.getItem(key('nutriscale_shopping_plan_ids',userId)),[]);
  const selections=safeJson(localStorage.getItem(key('nutriscale_plan_shopping_selections',userId)),{});
  const recipes=safeJson(localStorage.getItem('nutriscale_recipes'),[]);
  const picked=[];
  const planSources=[];
  for(const planId of planIds){const p=plans.find(x=>x.id===planId);if(!p)continue;const dates=(selections[planId]||[]);planSources.push({planId,startDate:p.start,endDate:p.end,selectedDates:dates});for(const d of (dates.length?dates:dateRange(p.start,p.end)))for(const id of p.meals?.[d]||[]){const r=recipes.find(x=>x.id===id);if(r)picked.push(r);}}
  const selectedTitles=[...document.querySelectorAll('.manual-recipe-options input:checked')].map(input=>input.closest('label')?.querySelector('strong')?.textContent?.trim()).filter(Boolean);
  const recipeIds=[];
  for(const title of selectedTitles){const r=recipes.find(x=>x.title===title);if(r){recipeIds.push(r.id);picked.push(r);}}
  return {planSources,recipeIds,items:aggregate(picked)};
}
function fmtDate(value){if(!value)return'';try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(value));}catch{return value;}}
let panel=null;let busy=false;
async function render(){
  const userId=localStorage.getItem('nutriscale_current_user_id');
  const card=document.querySelector('.shopping-card');
  if(!userId||!card){panel?.remove();panel=null;return;}
  if(!panel){panel=document.createElement('section');panel.className='kinplate-saved-carts premium-card';card.insertAdjacentElement('afterend',panel);}
  panel.innerHTML='<div class="saved-cart-head"><div><span class="eyebrow">Cloud shopping</span><h2>Saved carts</h2></div><button class="primary-button kp-save-cart"><span>＋</span> Save current cart</button></div><div class="kp-cart-status">Loading saved carts…</div>';
  panel.querySelector('.kp-save-cart').onclick=async()=>{if(busy)return;busy=true;const btn=panel.querySelector('.kp-save-cart');btn.disabled=true;btn.textContent='Saving…';try{const state=currentBuilder(userId);const label=`Shopping ${new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date())}`;await createShoppingCart(userId,{name:label,...state});await render();}catch(error){panel.querySelector('.kp-cart-status').textContent=`Could not save cart: ${error.message||error}`;}finally{busy=false;}};
  try{
    const carts=(await loadShoppingCarts(userId)).filter(c=>c.name!=='KinPlate Current Shopping');
    if(!carts.length){panel.querySelector('.kp-cart-status').innerHTML='<p>No saved carts yet. Save the current shopping list to keep it across devices.</p>';return;}
    const wrap=document.createElement('div');wrap.className='kp-cart-list';
    for(const cart of carts){const article=document.createElement('article');article.className='kp-cart';const items=cart.shopping_list_items||[];article.innerHTML=`<div class="kp-cart-title"><div><strong>${cart.name}</strong><small>${fmtDate(cart.updated_at)} · ${items.length} item${items.length===1?'':'s'}</small></div><button class="delete-button kp-delete-cart" title="Delete saved cart">×</button></div><div class="kp-saved-items"></div>`;const itemsBox=article.querySelector('.kp-saved-items');for(const item of items){const row=document.createElement('label');row.className=`kp-saved-item ${item.is_checked?'checked':''}`;row.innerHTML=`<input type="checkbox" ${item.is_checked?'checked':''}><span><strong>${item.display_name}</strong><small>${item.required_quantity??''} ${item.required_unit??''}</small></span>`;row.querySelector('input').onchange=async e=>{row.classList.toggle('checked',e.target.checked);try{await setShoppingItemChecked(userId,item.id,e.target.checked);}catch(error){e.target.checked=!e.target.checked;row.classList.toggle('checked',e.target.checked);}};itemsBox.appendChild(row);}article.querySelector('.kp-delete-cart').onclick=async()=>{if(!confirm(`Delete “${cart.name}”?`))return;await deleteShoppingCart(userId,cart.id);await render();};wrap.appendChild(article);}panel.querySelector('.kp-cart-status').replaceWith(wrap);
  }catch(error){panel.querySelector('.kp-cart-status').textContent=`Could not load saved carts: ${error.message||error}`;}
}
let timer;
const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{const hasShopping=document.querySelector('.shopping-card');if(hasShopping&&!document.querySelector('.kinplate-saved-carts'))render();if(!hasShopping&&panel){panel.remove();panel=null;}},120);});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>setTimeout(render,250));
