import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';

import { APP_VERSION, CONSENT_POLICY_VERSION, PIX_KEY } from './config/app.js';
import { getCreatureById, getCreatureName } from './data/creatures.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { destroyDashboardCharts, mountDashboardCharts, renderDashboard } from './components/dashboard.js';
import { renderSimulationEditor } from './components/simulationStepper.js';
import { renderSimulationGallery } from './components/simulationGallery.js';
import { renderSalesHistory } from './components/salesHistory.js';
import { renderModal } from './components/modals.js';
import { adSlot, escapeHtml, icon, t } from './components/common.js';
import { state, subscribe, emit, setLanguage, setView, setSimulations, setSales, setConsent, setDashboardFilters, setResourceCatalog, openModal, closeModal, showToast } from './state/store.js';
import { normalizeSimulation, normalizeSale } from './services/storageService.js';
import { cancelSaleSync, syncSale } from './services/salesService.js';
import { applyConsent } from './services/consentService.js';
import { findResourceCatalogItem, getEmbeddedResourceCatalog, loadDofusDudeResourceCatalog } from './services/resourceCatalogService.js';
import { getRememberedResourceXp, rememberResourceXp } from './services/resourceXpMemoryService.js';
import { normalizeResourceText } from './data/feedingResources.js';
import { calculateSimulation, calculateSaleProfit } from './utils/calculations.js';
import { parseKamas } from './utils/currency.js';
import { createId, nowIso, toIsoLocalDateTime } from './utils/identifiers.js';
import { validateStep } from './utils/validation.js';

const app = document.querySelector('#app');
let liveRenderTimer = null;

function escapeSelectorValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function focusSelectorFor(element) {
  if (!(element instanceof HTMLElement) || !app.contains(element)) return null;
  if (element.id) return `#${globalThis.CSS?.escape ? globalThis.CSS.escape(element.id) : escapeSelectorValue(element.id)}`;
  const attributes = ['data-field','data-resource-field','data-resource-draft','data-resource-picker-search','data-sale-field','data-sales-filter','data-dashboard-filter','data-consent-field','data-resource-new'];
  for (const attribute of attributes) {
    if (!element.hasAttribute(attribute)) continue;
    let selector = `[${attribute}]`;
    const value = element.getAttribute(attribute);
    if (value) selector = `[${attribute}="${escapeSelectorValue(value)}"]`;
    if (element.dataset.id) selector += `[data-id="${escapeSelectorValue(element.dataset.id)}"]`;
    if ((element.type === 'radio' || element.type === 'checkbox') && element.value) selector += `[value="${escapeSelectorValue(element.value)}"]`;
    return selector;
  }
  return null;
}

function captureFocusSnapshot() {
  const element = document.activeElement;
  const selector = focusSelectorFor(element);
  if (!selector) return null;
  return {
    selector,
    inModal: Boolean(element.closest('.modal')),
    selectionStart: typeof element.selectionStart === 'number' ? element.selectionStart : null,
    selectionEnd: typeof element.selectionEnd === 'number' ? element.selectionEnd : null
  };
}

function restoreFocusSnapshot(snapshot) {
  if (!snapshot) return false;
  const element = app.querySelector(snapshot.selector);
  if (!element) return false;
  element.focus({ preventScroll: true });
  if (typeof element.setSelectionRange === 'function' && snapshot.selectionStart !== null) {
    const length = String(element.value ?? '').length;
    const start = Math.min(snapshot.selectionStart, length);
    const end = Math.min(snapshot.selectionEnd ?? start, length);
    element.setSelectionRange(start, end);
  }
  return true;
}

function scheduleLiveRender() {
  window.clearTimeout(liveRenderTimer);
  liveRenderTimer = window.setTimeout(() => emit(), 120);
}


function newSimulation(base = {}) {
  const hasTarget = Object.prototype.hasOwnProperty.call(base,'targetLevel');
  return normalizeSimulation({
    id: base.id || createId('simulation'), name: base.name || '', creatureType: base.creatureType || 'Mascote',
    creatureId: base.creatureId || '', creatureCanonicalName: base.creatureCanonicalName || '',
    creatureImageUrl: base.creatureImageUrl || './assets/placeholders/creature-fallback.svg',
    originLevel: base.originLevel ?? 0, currentXp: base.currentXp ?? 0, xpBonusPercent: base.xpBonusPercent ?? 0, targetLevel: hasTarget ? base.targetLevel : 100,
    upMethod: base.upMethod ?? '', marketFoodPrice: base.marketFoodPrice ?? 0, bagPrice: base.bagPrice ?? 0,
    combinedRationSource: base.combinedRationSource || 'vitaminizedFood', resourceLines: Array.isArray(base.resourceLines) ? structuredClone(base.resourceLines) : [],
    originCost: base.originCost ?? 0, additionalCosts: base.additionalCosts ?? 0,
    estimatedSalePrice: base.estimatedSalePrice ?? 0, estimatedSaleChannel: base.estimatedSaleChannel || 'Mercado HDV',
    createdAt: base.createdAt || nowIso(), updatedAt: nowIso()
  });
}

function openEditor(simulation, mode = 'new') {
  const copy = structuredClone(simulation || newSimulation());
  if (mode === 'duplicate') {
    copy.id = createId('simulation'); copy.name = copy.name ? `${copy.name} — ${t(state,'common.copySuffix')}` : '';
    copy.createdAt = nowIso(); copy.updatedAt = nowIso(); copy.status = 'ready'; copy.lastSaleAt = null;
  }
  state.simulationEditor = { mode, step:1, maxReached:1, simulation:copy, errors:{}, resourcesOpen:copy.upMethod==='combined', creatureQuery:'', resourceQuery:'', resourceComboOpen:false, selectedResourceId:'', resourceDraft:{xp:0,quantity:1,unitPrice:0,custom:false}, comboOpen:false, activeOption:0 };
  state.view='editor'; emit(); window.scrollTo({top:0,behavior:'smooth'});
}

function generateSimulationName(sim) {
  const creature=getCreatureById(sim.creatureId);
  return sim.name.trim() || `${creature?.canonicalName || sim.creatureCanonicalName} — ${sim.originLevel} → ${sim.targetLevel}`;
}

function renderView() {
  if(state.view==='dashboard')return renderDashboard(state);
  if(state.view==='simulations')return `<section class="stack"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state,'nav.simulations'))}</span><h1>${escapeHtml(t(state,'simulations.title'))}</h1><p>${escapeHtml(t(state,'simulations.description'))}</p></div><button class="button primary" data-action="new-simulation">${icon('plus',17)} ${escapeHtml(t(state,'home.newSimulation'))}</button></div>${renderSimulationGallery(state)}</section>`;
  if(state.view==='sales')return renderSalesHistory(state);
  if(state.view==='editor'&&state.simulationEditor)return renderSimulationEditor(state);
  return renderDashboard(state);
}

function renderCookieBanner() {
  if(state.consent?.decidedAt)return '';
  return `<aside class="cookie-banner" aria-label="${escapeHtml(t(state,'consent.title'))}"><div><strong>${escapeHtml(t(state,'consent.title'))}</strong><p class="small">${escapeHtml(t(state,'consent.text'))}</p></div><div class="cookie-actions"><button class="button secondary compact" data-action="consent-reject">${escapeHtml(t(state,'consent.reject'))}</button><button class="button secondary compact" data-action="open-consent">${escapeHtml(t(state,'consent.configure'))}</button><button class="button primary compact" data-action="consent-accept">${escapeHtml(t(state,'consent.acceptAll'))}</button></div></aside>`;
}

function render() {
  const focusSnapshot = captureFocusSnapshot();
  destroyDashboardCharts();
  document.documentElement.lang=state.language;
  document.title=`Dofus4Business v${APP_VERSION}`;
  app.innerHTML=`<div class="app-shell">${renderHeader(state)}<div class="container">${adSlot('ad-slot-header','header-ad',state)}</div><main id="main-content" class="main"><div class="container">${state.view==='editor'?`<div class="page-grid"><div>${renderView()}</div><aside class="sidebar sticky">${adSlot('ad-slot-sidebar','sidebar-ad',state)}<article class="card section"><span class="eyebrow">${escapeHtml(t(state,'support.title'))}</span><p class="muted small" style="margin-top:8px">${escapeHtml(t(state,'support.text'))}</p><button class="button secondary" style="margin-top:12px" data-action="open-support">${icon('pix',17)} ${escapeHtml(t(state,'support.button'))}</button></article></aside></div>`:renderView()}</div></main>${renderFooter(state)}${renderModal(state)}${state.toast?`<div class="toast ${state.toast.tone==='error'?'error':''}" role="status">${escapeHtml(state.toast.message)}</div>`:''}${renderCookieBanner()}</div>`;
  requestAnimationFrame(()=>{
    const shouldFocusModal = state.modal && !focusSnapshot?.inModal;
    if (shouldFocusModal) app.querySelector('.modal button,.modal input,.modal select')?.focus();
    else restoreFocusSnapshot(focusSnapshot);
    mountDashboardCharts(state);
  });
}

applyConsent(state.consent);
subscribe(render);render();

async function refreshResourceCatalog(language=state.language, force=false) {
  setResourceCatalog({ items: state.resourceCatalog, status: 'loading', source: state.resourceCatalogSource });
  try {
    const catalog = await loadDofusDudeResourceCatalog(language, { force });
    if (state.simulationEditor?.selectedResourceId && state.simulationEditor.selectedResourceId !== '__custom__') {
      const selected = findResourceCatalogItem(catalog.items, { resourceId: state.simulationEditor.selectedResourceId });
      if (selected) state.simulationEditor.resourceQuery = selected.name;
    }
    setResourceCatalog({ items: catalog.items, status: 'ready', source: catalog.source, loadedAt: catalog.loadedAt, error: null });
  } catch (error) {
    const fallback = getEmbeddedResourceCatalog(language);
    if (state.simulationEditor?.selectedResourceId && state.simulationEditor.selectedResourceId !== '__custom__') {
      const selected = findResourceCatalogItem(fallback, { resourceId: state.simulationEditor.selectedResourceId });
      if (selected) state.simulationEditor.resourceQuery = selected.name;
    }
    setResourceCatalog({ items: fallback, status: 'fallback', source: 'embedded', loadedAt: null, error: String(error?.message || error) });
  }
}

void refreshResourceCatalog(state.language);

function updateEditorField(field,rawValue,shouldRender=true) {
  const ed=state.simulationEditor;if(!ed)return;const sim=ed.simulation;
  const numeric=new Set(['originLevel','currentXp','xpBonusPercent','targetLevel','marketFoodPrice','bagPrice','originCost','additionalCosts','estimatedSalePrice']);
  if(numeric.has(field)){
    if(['originLevel','currentXp','targetLevel'].includes(field))sim[field]=Math.trunc(Number(rawValue||0));
    else if(field==='xpBonusPercent')sim[field]=Math.min(1000,Math.max(0,Number(String(rawValue).replace(',','.'))||0));
    else sim[field]=parseKamas(rawValue);
  }else sim[field]=rawValue;
  if(field==='originLevel'&&sim.originLevel>=sim.targetLevel)sim.targetLevel=Math.min(100,sim.originLevel+1);
  if(field==='creatureType'){sim.creatureId='';sim.creatureCanonicalName='';sim.creatureImageUrl='./assets/placeholders/creature-fallback.svg';ed.creatureQuery='';ed.comboOpen=true;}
  ed.errors={};if(shouldRender)emit();
}

function saveConsent(patch) {
  setConsent({...patch,version:CONSENT_POLICY_VERSION,essential:true,decidedAt:nowIso()});
  closeModal();showToast(t(state,'consent.saved'));
}

function openInformation(section='about') {
  openModal({type:'information',section});
  const hash=section==='how'?'como-funciona':section;
  history.replaceState(null,'',`#${hash}`);
}

function handleAction(button) {
  const action=button.dataset.action;if(!action)return;
  if(action==='navigate'){state.simulationEditor=null;setView(button.dataset.view);return;}
  if(action==='new-simulation'){openEditor(newSimulation(),'new');return;}
  if(action==='edit-simulation'){closeModal();const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openEditor(sim,'edit');return;}
  if(action==='duplicate-simulation'){closeModal();const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openEditor(sim,'duplicate');return;}
  if(action==='exit-editor'){state.simulationEditor=null;setView('dashboard');return;}
  if(action==='go-step'){const target=Number(button.dataset.step),ed=state.simulationEditor;if(target<=ed.maxReached){if(target>ed.step){const errors=validateStep(ed.simulation,ed.step,calculateSimulation(ed.simulation));if(Object.keys(errors).length){ed.errors=errors;showToast(t(state,'toast.invalidStep'),'error');return;}}ed.step=target;ed.errors={};emit();}return;}
  if(action==='prev-step'){state.simulationEditor.step=Math.max(1,state.simulationEditor.step-1);state.simulationEditor.errors={};emit();return;}
  if(action==='next-step'){const ed=state.simulationEditor,calc=calculateSimulation(ed.simulation),errors=validateStep(ed.simulation,ed.step,calc);if(Object.keys(errors).length){ed.errors=errors;showToast(t(state,'toast.invalidStep'),'error');return;}ed.step=Math.min(5,ed.step+1);ed.maxReached=Math.max(ed.maxReached,ed.step);ed.errors={};emit();return;}
  if(action==='save-simulation'){
    const ed=state.simulationEditor,calc=calculateSimulation(ed.simulation);let errors={},firstInvalid=5;
    for(let step=1;step<=4;step++){const current=validateStep(ed.simulation,step,calc);if(Object.keys(current).length&&firstInvalid===5)firstInvalid=step;errors={...errors,...current};}
    if(Object.keys(errors).length){ed.errors=errors;ed.step=firstInvalid;showToast(t(state,'toast.invalidStep'),'error');return;}
    const creature=getCreatureById(ed.simulation.creatureId);const saved={...ed.simulation,name:generateSimulationName(ed.simulation),creatureCanonicalName:creature.canonicalName,creatureImageUrl:creature.imageUrl,unassociatedCreature:false,updatedAt:nowIso()};const exists=state.simulations.some(x=>x.id===saved.id);
    setSimulations(exists?state.simulations.map(x=>x.id===saved.id?saved:x):[saved,...state.simulations]);state.simulationEditor=null;state.view='dashboard';showToast(exists?t(state,'toast.simulationUpdated'):t(state,'toast.simulationSaved'));return;
  }
  if(action==='select-creature'){const ed=state.simulationEditor,c=getCreatureById(button.dataset.id);if(c){ed.simulation.creatureId=c.id;ed.simulation.creatureCanonicalName=c.canonicalName;ed.simulation.creatureImageUrl=c.imageUrl;ed.creatureQuery=getCreatureName(c,state.language);ed.comboOpen=false;ed.errors={};emit();}return;}
  if(action==='select-method'){
    state.simulationEditor.simulation.upMethod=button.dataset.method==='resources'?'combined':button.dataset.method;
    state.simulationEditor.resourcesOpen=state.simulationEditor.simulation.upMethod==='combined'||state.simulationEditor.resourcesOpen;
    state.simulationEditor.errors={};emit();return;
  }
  if(action==='set-xp-bonus'){state.simulationEditor.simulation.xpBonusPercent=Math.min(1000,Math.max(0,Number(button.dataset.value)||0));state.simulationEditor.errors={};emit();return;}
  if(action==='toggle-resources'){state.simulationEditor.resourcesOpen=!state.simulationEditor.resourcesOpen;emit();return;}
  if(action==='select-resource'){
    const editor=state.simulationEditor;
    const item=findResourceCatalogItem(state.resourceCatalog,{resourceId:button.dataset.id});
    if(item){
      const rememberedXp=getRememberedResourceXp(item);
      editor.selectedResourceId=item.id;
      editor.resourceQuery=item.name;
      editor.resourceComboOpen=false;
      editor.resourceDraft={...(editor.resourceDraft||{}),xp:rememberedXp||item.xp||0,quantity:editor.resourceDraft?.quantity||1,unitPrice:editor.resourceDraft?.unitPrice||0,custom:false};
      emit();
    }
    return;
  }
  if(action==='select-custom-resource'){
    const editor=state.simulationEditor;
    const rememberedXp=getRememberedResourceXp({resourceName:editor.resourceQuery});
    editor.selectedResourceId='__custom__';
    editor.resourceComboOpen=false;
    editor.resourceDraft={...(editor.resourceDraft||{}),xp:rememberedXp||editor.resourceDraft?.xp||0,quantity:editor.resourceDraft?.quantity||1,unitPrice:editor.resourceDraft?.unitPrice||0,custom:true};
    emit();return;
  }
  if(action==='add-selected-resource'){
    const editor=state.simulationEditor;
    const draft=editor.resourceDraft||{};
    const isCustom=editor.selectedResourceId==='__custom__'||draft.custom;
    const item=isCustom?null:findResourceCatalogItem(state.resourceCatalog,{resourceId:editor.selectedResourceId});
    const name=isCustom?String(editor.resourceQuery||'').trim():(item?.canonicalName||item?.name||'');
    const displayName=isCustom?name:(item?.name||name);
    const xp=Number(draft.xp);
    const quantity=Math.max(0,Math.trunc(Number(draft.quantity)||0));
    const unitPrice=parseKamas(draft.unitPrice);
    const error=button.closest('.collapsible-content')?.querySelector('[data-resource-error]');
    if((!isCustom&&!item)||!name||!Number.isFinite(xp)||xp<=0||quantity<=0){if(error)error.textContent=t(state,isCustom?'simulation.invalidCustomResource':'simulation.invalidResource');return;}
    const duplicate=editor.simulation.resourceLines.some((line)=>{
      if(item?.ankamaId&&String(line.resourceAnkamaId)===String(item.ankamaId))return true;
      if(item?.id&&line.resourceId===item.id)return true;
      return normalizeResourceText(line.resourceName||line.customName||'')===normalizeResourceText(name);
    });
    if(duplicate){if(error)error.textContent=t(state,'simulation.duplicateResource');return;}
    const reference=item||{resourceName:name};
    rememberResourceXp(reference,xp);
    if(item){
      const catalogItem=state.resourceCatalog.find((entry)=>entry.id===item.id);
      if(catalogItem){catalogItem.xp=xp;catalogItem.xpSource=catalogItem.xpSource||'memory';}
    }
    editor.simulation.resourceLines.push({
      id:createId('resource'),
      resourceId:item?.id||`custom-${createId('item')}`,
      resourceAnkamaId:item?.ankamaId??null,
      resourceName:name,
      resourceDisplayName:displayName,
      resourceImageUrl:item?.imageUrl||'',
      resourceLevel:item?.level??null,
      xpUnit:xp,
      customXp:xp,
      xpSource:item?.xpSource||'manual',
      custom:isCustom,
      quantity,
      unitPrice
    });
    editor.resourceQuery='';
    editor.selectedResourceId='';
    editor.resourceComboOpen=false;
    editor.resourceDraft={xp:0,quantity:1,unitPrice:0,custom:false};
    if(error)error.textContent='';
    emit();return;
  }
  if(action==='delete-resource'){state.simulationEditor.simulation.resourceLines=state.simulationEditor.simulation.resourceLines.filter(x=>x.id!==button.dataset.id);emit();return;}
  if(action==='fill-resource-required'){const ed=state.simulationEditor,calc=calculateSimulation(ed.simulation),computed=calc.resources.lines.find(x=>x.id===button.dataset.id),line=ed.simulation.resourceLines.find(x=>x.id===button.dataset.id);if(computed&&line&&computed.quantityNeededAlone>0){line.quantity=computed.quantityNeededAlone;emit();}return;}
  if(action==='refresh-resource-catalog'){void refreshResourceCatalog(state.language,true);return;}
  if(action==='simulation-details'){openModal({type:'simulation-details',id:button.dataset.id});return;}
  if(action==='delete-simulation'){const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openModal({type:'confirm',title:t(state,'simulations.deleteTitle'),text:t(state,'simulations.deleteText'),confirmAction:'delete-simulation',id:sim.id});return;}
  if(action==='register-sale'){const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim){const calc=calculateSimulation(sim);openModal({type:'register-sale',simulationId:sim.id,draft:{originCost:calc.originCost,upCost:calc.upCost+calc.additionalCosts,salePrice:calc.salePrice,saleChannel:sim.estimatedSaleChannel,soldAt:toIsoLocalDateTime()}});}return;}
  if(action==='confirm-sale'){confirmSale();return;}
  if(action==='sale-details'){openModal({type:'sale-details',id:button.dataset.id});return;}
  if(action==='delete-sale'){const sale=state.sales.find(x=>x.id===button.dataset.id);if(sale)openModal({type:'confirm',title:t(state,'sales.deleteTitle'),text:t(state,'sales.deleteText'),confirmAction:'delete-sale',id:sale.id});return;}
  if(action==='retry-sale'){const sale=state.sales.find(x=>x.id===button.dataset.id);if(sale&&sale.syncStatus==='failed'){const updated={...sale,syncStatus:'pending'};setSales(state.sales.map(x=>x.id===sale.id?updated:x));showToast(t(state,'sales.retryStarted'));startSync(updated);}return;}
  if(action==='duplicate-sale-simulation'){const sale=state.sales.find(x=>x.id===button.dataset.id);if(sale)openEditor(newSimulation({creatureId:sale.creatureId,creatureType:sale.creatureType,creatureCanonicalName:sale.creatureCanonicalName,creatureImageUrl:sale.creatureImageUrl,originLevel:sale.originLevel,targetLevel:sale.targetLevel,xpBonusPercent:sale.xpBonusPercent||0,upMethod:sale.upMethod,resourceLines:sale.resourceDetails,originCost:sale.originCost,estimatedSalePrice:sale.salePrice,estimatedSaleChannel:sale.saleChannel}),'duplicate');return;}
  if(action==='open-support'){openModal({type:'support'});return;}
  if(action==='open-information'){openInformation(button.dataset.section||'about');return;}
  if(action==='information-section'){state.modal={...state.modal,section:button.dataset.section};const hash=button.dataset.section==='how'?'como-funciona':button.dataset.section;history.replaceState(null,'',`#${hash}`);emit();return;}
  if(action==='open-consent'){openModal({type:'consent',draft:{...state.consent}});return;}
  if(action==='consent-accept'){saveConsent({preferences:true,analytics:true,advertising:true});return;}
  if(action==='consent-reject'){saveConsent({preferences:false,analytics:false,advertising:false});return;}
  if(action==='consent-save'){saveConsent(state.modal?.draft||state.consent);return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='confirm-modal'){const m=state.modal;if(m.confirmAction==='delete-simulation'){setSimulations(state.simulations.filter(x=>x.id!==m.id));showToast(t(state,'toast.simulationDeleted'));}if(m.confirmAction==='delete-sale'){const removed=state.sales.find(x=>x.id===m.id);cancelSaleSync(m.id);const remaining=state.sales.filter(x=>x.id!==m.id);setSales(remaining);if(removed&&!remaining.some(x=>x.simulationId===removed.simulationId))setSimulations(state.simulations.map(sim=>sim.id===removed.simulationId?{...sim,status:'ready',updatedAt:nowIso()}:sim));showToast(t(state,'toast.saleDeleted'));}closeModal();return;}
  if(action==='copy-pix'){copyPix();return;}
  if(action==='toggle-language'){const menu=app.querySelector('[data-language-menu]');menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));return;}
  if(action==='set-language'){const language=button.dataset.language;if(state.simulationEditor?.simulation?.creatureId){const creature=getCreatureById(state.simulationEditor.simulation.creatureId);state.simulationEditor.creatureQuery=getCreatureName(creature,language);}setLanguage(language);void refreshResourceCatalog(language);return;}
  if(action==='toggle-mobile'){const nav=app.querySelector('[data-mobile-nav]');nav.hidden=!nav.hidden;button.setAttribute('aria-expanded',String(!nav.hidden));return;}
}

function confirmSale() {
  const modal=state.modal,sim=state.simulations.find(x=>x.id===modal.simulationId);if(!sim)return;const draft=modal.draft;
  if(!draft.soldAt||draft.salePrice<=0||draft.originCost<0||draft.upCost<0||!['Mercado HDV','Outro Jogador'].includes(draft.saleChannel)){showToast(t(state,'toast.invalidStep'),'error');return;}
  const soldDate=new Date(draft.soldAt);if(Number.isNaN(soldDate.getTime())){showToast(t(state,'toast.invalidStep'),'error');return;}
  const calc=calculateSaleProfit(draft);const sale=normalizeSale({id:createId('sale'),simulationId:sim.id,simulationName:sim.name,creatureId:sim.creatureId,creatureCanonicalName:sim.creatureCanonicalName,creatureType:sim.creatureType,creatureImageUrl:sim.creatureImageUrl,originLevel:sim.originLevel,targetLevel:sim.targetLevel,xpBonusPercent:sim.xpBonusPercent||0,upMethod:sim.upMethod,resourceDetails:structuredClone(sim.resourceLines),originCost:draft.originCost,upCost:draft.upCost,salePrice:draft.salePrice,saleChannel:draft.saleChannel,fee:calc.fee,profit:calc.profit,soldAt:soldDate.toISOString(),syncStatus:'pending',apiRegistered:false,apiRow:null,syncStarted:false,createdAt:nowIso()});
  setSales([sale,...state.sales]);setSimulations(state.simulations.map(x=>x.id===sim.id?{...x,status:'sold',lastSaleAt:sale.createdAt,updatedAt:nowIso()}:x));closeModal();showToast(t(state,'sales.registered'));startSync(sale);
}

function startSync(sale) {
  const started={...sale,syncStarted:true};setSales(state.sales.map(item=>item.id===sale.id?started:item));
  syncSale(started,patch=>setSales(state.sales.map(item=>item.id===sale.id?{...item,...patch}:item)),patch=>setSales(state.sales.map(item=>item.id===sale.id?{...item,...patch}:item)));
}

async function copyPix() {
  let copied=false;try{await navigator.clipboard.writeText(PIX_KEY);copied=true;}catch{const input=document.createElement('textarea');input.value=PIX_KEY;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();copied=document.execCommand('copy');input.remove();}
  if(copied)showToast(t(state,'common.copied'));
}

app.addEventListener('pointerdown',event=>{if(event.target.closest('[data-action]'))window.clearTimeout(liveRenderTimer);},true);

app.addEventListener('focusin',event=>{
  if(event.target.matches('[data-field="creatureQuery"]')&&state.simulationEditor&&!state.simulationEditor.comboOpen){state.simulationEditor.comboOpen=true;emit();return;}
  if(event.target.matches('[data-resource-picker-search]')&&state.simulationEditor&&!state.simulationEditor.resourceComboOpen){state.simulationEditor.resourceComboOpen=true;emit();}
});

app.addEventListener('click',event=>{
  if(event.target.classList.contains('modal-backdrop')){closeModal();return;}
  const actionNode=event.target.closest('[data-action]');
  if(actionNode)handleAction(actionNode);
  if(!event.target.closest('.language')){const menu=app.querySelector('[data-language-menu]');if(menu)menu.hidden=true;}
  if(state.simulationEditor?.resourceComboOpen&&!event.target.closest('.resource-combobox')&&!event.target.closest('[data-action="select-resource"]')&&!event.target.closest('[data-action="select-custom-resource"]')){
    state.simulationEditor.resourceComboOpen=false;emit();
  }
});

app.addEventListener('change',event=>{
  const field=event.target.dataset.field;
  if(field)updateEditorField(field,event.target.value,event.target.tagName==='SELECT'||event.target.type==='radio');

  const resourceField=event.target.dataset.resourceField;
  if(resourceField&&state.simulationEditor){
    const line=state.simulationEditor.simulation.resourceLines.find(x=>x.id===event.target.dataset.id);
    if(line){
      if(resourceField==='quantity')line.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));
      else if(resourceField==='unitPrice')line.unitPrice=parseKamas(event.target.value);
      else if(resourceField==='customXp'){
        line.customXp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);
        line.xpUnit=line.customXp;line.xpSource='manual';
        rememberResourceXp(line,line.customXp);
      }
      emit();
    }
  }

  const resourceDraftField=event.target.dataset.resourceDraft;
  if(resourceDraftField&&state.simulationEditor){
    const draft=state.simulationEditor.resourceDraft||(state.simulationEditor.resourceDraft={xp:0,quantity:1,unitPrice:0,custom:false});
    if(resourceDraftField==='xp')draft.xp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);
    else if(resourceDraftField==='quantity')draft.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));
    else if(resourceDraftField==='unitPrice')draft.unitPrice=parseKamas(event.target.value);
  }

  const saleField=event.target.dataset.saleField;
  if(saleField&&state.modal?.type==='register-sale'){state.modal.draft[saleField]=['originCost','upCost','salePrice'].includes(saleField)?parseKamas(event.target.value):event.target.value;if(event.target.tagName==='SELECT')emit();}
  const salesFilter=event.target.dataset.salesFilter;if(salesFilter){state.salesFilter={...(state.salesFilter||{}),[salesFilter]:event.target.value};emit();}
  const dashboardFilter=event.target.dataset.dashboardFilter;if(dashboardFilter)setDashboardFilters({[dashboardFilter]:event.target.value});
  const consentField=event.target.dataset.consentField;if(consentField&&state.modal?.type==='consent'){state.modal.draft={...state.modal.draft,[consentField]:event.target.checked};}
});

app.addEventListener('input',event=>{
  if(event.target.matches('[data-resource-picker-search]')&&state.simulationEditor){
    const editor=state.simulationEditor;
    editor.resourceQuery=event.target.value;
    editor.resourceComboOpen=true;
    editor.selectedResourceId='';
    editor.resourceDraft={...(editor.resourceDraft||{}),xp:0,custom:false};
    emit();return;
  }

  const field=event.target.dataset.field;
  if(field==='creatureQuery'&&state.simulationEditor){state.simulationEditor.creatureQuery=event.target.value;state.simulationEditor.comboOpen=true;emit();return;}
  if(field&&state.simulationEditor){updateEditorField(field,event.target.value,false);scheduleLiveRender();}

  const resourceField=event.target.dataset.resourceField;
  if(resourceField&&state.simulationEditor){
    const line=state.simulationEditor.simulation.resourceLines.find(x=>x.id===event.target.dataset.id);
    if(line){
      if(resourceField==='quantity')line.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));
      else if(resourceField==='unitPrice')line.unitPrice=parseKamas(event.target.value);
      else if(resourceField==='customXp'){
        line.customXp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);
        line.xpUnit=line.customXp;line.xpSource='manual';
        rememberResourceXp(line,line.customXp);
      }
      scheduleLiveRender();
    }
  }

  const resourceDraftField=event.target.dataset.resourceDraft;
  if(resourceDraftField&&state.simulationEditor){
    const draft=state.simulationEditor.resourceDraft||(state.simulationEditor.resourceDraft={xp:0,quantity:1,unitPrice:0,custom:false});
    if(resourceDraftField==='xp')draft.xp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);
    else if(resourceDraftField==='quantity')draft.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));
    else if(resourceDraftField==='unitPrice')draft.unitPrice=parseKamas(event.target.value);
  }

  const saleField=event.target.dataset.saleField;if(saleField&&state.modal?.type==='register-sale'){state.modal.draft[saleField]=['originCost','upCost','salePrice'].includes(saleField)?parseKamas(event.target.value):event.target.value;scheduleLiveRender();}
  const filter=event.target.dataset.salesFilter;if(filter==='search'){state.salesFilter={...(state.salesFilter||{}),search:event.target.value};emit();}
});
app.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&state.modal){closeModal();return;}
  if(state.modal&&event.key==='Tab'){
    const modal=app.querySelector('.modal');
    const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')];
    if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  }
  if(event.target.matches('[data-field="creatureQuery"]')&&event.key==='ArrowDown'){
    event.preventDefault();app.querySelector('#creature-options .combobox-option')?.focus();return;
  }
  if(event.target.matches('[data-resource-picker-search]')&&event.key==='ArrowDown'){
    event.preventDefault();app.querySelector('#resource-options .combobox-option')?.focus();return;
  }
  if(event.target.matches('[data-field="creatureQuery"]')&&event.key==='Escape'){
    state.simulationEditor.comboOpen=false;emit();return;
  }
  if(event.target.matches('[data-resource-picker-search]')&&event.key==='Escape'){
    state.simulationEditor.resourceComboOpen=false;emit();return;
  }
  if(event.target.matches('.combobox-option')){
    const list=event.target.closest('[role="listbox"]');
    const options=[...list.querySelectorAll('.combobox-option')];
    const index=options.indexOf(event.target);
    if(event.key==='ArrowDown'){event.preventDefault();options[(index+1)%options.length]?.focus();}
    if(event.key==='ArrowUp'){event.preventDefault();options[(index-1+options.length)%options.length]?.focus();}
    if(event.key==='Escape'){
      if(list.id==='resource-options')state.simulationEditor.resourceComboOpen=false;
      else state.simulationEditor.comboOpen=false;
      emit();
      requestAnimationFrame(()=>app.querySelector(list.id==='resource-options'?'[data-resource-picker-search]':'[data-field="creatureQuery"]')?.focus());
    }
  }
});

const initialHash=location.hash.replace('#','');
if(initialHash==='como-funciona')requestAnimationFrame(()=>openInformation('how'));
