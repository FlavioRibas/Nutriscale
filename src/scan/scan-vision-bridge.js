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
  if(!form)throw new Error('Recipe review form is not available.');
  const mapped=scannedRecipeToPrototypeForm(recipe,{});
  const inputs=form.querySelectorAll('input');
  const textareas=form.querySelectorAll('textarea');
  const title=[...inputs].find(x=>x.type==='text'&&!x.placeholder?.includes('Name shown'));
  const servings=[...inputs].find(x=>x.type==='number');
  if(title)setNativeValue(title,mapped.title||'');
  if(servings&&recipe.servings!=null)setNativeValue(servings,String(mapped.servings));
  if(textareas[0])setNativeValue(textareas[0],mapped.rawIngredients||'');
  if(textareas[1])setNativeValue(textareas[1],mapped.instructions||'');
  const notes=[...inputs].find(x=>x!==title&&x.type==='text'&&!x.placeholder?.includes('Name shown'));
  if(notes)setNativeValue(notes,mapped.notes||'');
}

async function onImage(file){
  if(!file||busy)return;
  busy=true;
  const language=localStorage.getItem('nutriscale_language')||'en';
  status(language==='pt'?'Foto selecionada. Analisando com KinPlate Vision…':'Photo selected. Analyzing with KinPlate Vision…');
  try{
    const {recipe}=await recognizeRecipeImage(file,{language});
    fillReviewForm(recipe);
    const uncertainty=recipe.uncertainties?.length||0;
    status(language==='pt'?`Receita reconhecida. Revise os campos${uncertainty?` — ${uncertainty} item(ns) precisam de atenção.`:'.'}`:`Recipe recognized. Review the fields${uncertainty?` — ${uncertainty} item(s) need attention.`:'.'}`,'success');
  }catch(error){
    console.error('KinPlate Vision scan failed',error);
    const detail=error?.message||String(error);
    status(language==='pt'?`Não foi possível reconhecer a imagem: ${detail}`:`Recognition failed: ${detail}`,'error');
  }finally{busy=false;}
}

export function installVisionScanBridge(){
  if(installed)return;installed=true;
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.closest('.scan-options'))return;
    const file=input.files?.[0];
    if(!file)return;
    // Prevent the legacy Tesseract handler from running. Vision is now the only
    // primary image-recognition path for the Scan controls.
    event.preventDefault();
    event.stopImmediatePropagation();
    onImage(file);
  },true);
}

installVisionScanBridge();
