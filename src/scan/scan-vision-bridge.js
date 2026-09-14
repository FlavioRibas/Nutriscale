import {recognizeRecipeImage,scannedRecipeToPrototypeForm} from './recognize-recipe.js';

let installed=false;
let busy=false;

function status(text,kind='working'){
  let el=document.getElementById('kinplate-vision-status');
  if(!el){
    el=document.createElement('div');
    el.id='kinplate-vision-status';
    el.className='status-note kinplate-vision-status';
    const scan=document.querySelector('.scan-options');
    scan?.insertAdjacentElement('afterend',el);
  }
  el.dataset.kind=kind;
  el.textContent=text;
}

function setNativeValue(element,value){
  const setter=Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value')?.set;
  setter?.call(element,value);
  element.dispatchEvent(new Event('input',{bubbles:true}));
  element.dispatchEvent(new Event('change',{bubbles:true}));
}

function fillReviewForm(recipe){
  const form=document.querySelector('.recipe-form');
  if(!form)return;
  const mapped=scannedRecipeToPrototypeForm(recipe,{});
  const inputs=form.querySelectorAll('input');
  const textareas=form.querySelectorAll('textarea');
  const title=[...inputs].find(x=>x.type==='text'&&!x.placeholder?.includes('Name shown'));
  const servings=[...inputs].find(x=>x.type==='number');
  if(title)setNativeValue(title,mapped.title||'');
  if(servings)setNativeValue(servings,String(mapped.servings||1));
  if(textareas[0])setNativeValue(textareas[0],mapped.rawIngredients||'');
  if(textareas[1])setNativeValue(textareas[1],mapped.instructions||'');
  const notes=[...inputs].find(x=>x!==title&&x.type==='text'&&!x.placeholder?.includes('Name shown'));
  if(notes)setNativeValue(notes,mapped.notes||'');
}

async function onImage(file){
  if(!file||busy)return;
  busy=true;
  const language=localStorage.getItem('nutriscale_language')||'en';
  status(language==='pt'?'Analisando a receita com KinPlate Vision…':'Analyzing the recipe with KinPlate Vision…');
  try{
    const {recipe}=await recognizeRecipeImage(file,{language});
    fillReviewForm(recipe);
    const uncertainty=recipe.uncertainties?.length||0;
    status(language==='pt'?`Receita reconhecida. Revise os campos${uncertainty?` — ${uncertainty} item(ns) precisam de atenção.`:'.'}`:`Recipe recognized. Review the fields${uncertainty?` — ${uncertainty} item(s) need attention.`:'.'}`,'success');
  }catch(error){
    console.error('KinPlate Vision scan failed',error);
    status(language==='pt'?'Não foi possível reconhecer esta imagem. Tente novamente.':'KinPlate could not recognize this image. Please try again.','error');
  }finally{busy=false;}
}

export function installVisionScanBridge(){
  if(installed)return;installed=true;
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.closest('.scan-options'))return;
    const file=input.files?.[0];
    if(!file)return;
    event.stopImmediatePropagation();
    onImage(file);
  },true);
}

installVisionScanBridge();
