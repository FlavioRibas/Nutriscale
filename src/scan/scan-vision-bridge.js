import {recognizeRecipeImage,scannedRecipeToPrototypeForm} from './recognize-recipe.js';

let installed=false;
let busy=false;

function ensureStatus(id,parent,position='beforebegin'){
  let el=document.getElementById(id);
  if(!el&&parent){
    el=document.createElement('div');
    el.id=id;
    el.className='status-note kinplate-vision-status';
    parent.insertAdjacentElement(position,el);
  }
  return el;
}

function status(text,kind='working'){
  const scan=document.querySelector('.scan-options');
  const form=document.querySelector('.recipe-form');
  const targets=[
    ensureStatus('kinplate-vision-status',scan,'afterend'),
    ensureStatus('kinplate-vision-review-status',form,'beforebegin')
  ].filter(Boolean);
  targets.forEach(el=>{
    el.dataset.kind=kind;
    el.textContent=text;
    el.hidden=false;
  });
}

function setNativeValue(element,value){
  const prototype=element instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(prototype,'value')?.set;
  if(!setter) throw new Error('Recipe form could not be updated.');
  setter.call(element,value);
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
  status(language==='pt'?'Foto selecionada. Preparando para reconhecimento…':'Photo selected. Preparing for recognition…');
  try{
    const {recipe}=await recognizeRecipeImage(file,{language});
    status(language==='pt'?'Receita encontrada. Preenchendo a revisão…':'Recipe found. Filling the review form…');
    fillReviewForm(recipe);
    const uncertainty=recipe.uncertainties?.length||0;
    status(
      language==='pt'
        ?`Receita reconhecida. Revise os campos${uncertainty?` — ${uncertainty} item(ns) precisam de atenção.`:'.'}`
        :`Recipe recognized. Review the fields${uncertainty?` — ${uncertainty} item(s) need attention.`:'.'}`,
      'success'
    );
  }catch(error){
    console.error('KinPlate Vision scan failed',error);
    const detail=error?.message||String(error);
    status(
      language==='pt'?`Não foi possível reconhecer a imagem: ${detail}`:`Recognition failed: ${detail}`,
      'error'
    );
  }finally{
    busy=false;
  }
}

function captureFileEvent(event){
  const input=event.target;
  if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.closest('.scan-options'))return;
  const file=input.files?.[0];
  if(!file)return;

  // Stop the legacy Tesseract path before React receives the same file event.
  event.preventDefault();
  event.stopImmediatePropagation();
  onImage(file);
}

export function installVisionScanBridge(){
  if(installed)return;
  installed=true;
  // Some iOS/Safari variants dispatch input before change for file pickers.
  // Listening to both makes the scan path deterministic; `busy` prevents duplicates.
  document.addEventListener('input',captureFileEvent,true);
  document.addEventListener('change',captureFileEvent,true);
}

installVisionScanBridge();
