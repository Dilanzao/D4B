import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';

import { APP_VERSION, CONSENT_POLICY_VERSION, PIX_KEY } from './config/app.js';
import { creatureCatalog, getCreatureById, getCreatureName } from './data/creatures.js';
import { normalizeResourceText } from './data/feedingResources.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { destroyDashboardCharts, mountDashboardCharts, renderDashboard } from './components/dashboard.js';
import { renderSimulationEditor } from './components/simulationStepper.js';
import { renderSimulationGallery } from './components/simulationGallery.js';
import { renderSalesHistory } from './components/salesHistory.js';
import { renderModal } from './components/modals.js';
import { renderHomeHub } from './components/homeHub.js';
import { renderGlobalSales } from './components/globalSales.js';
import { renderGlobalInventory } from './components/globalInventory.js';
import { adSlot, escapeHtml, icon, imageTag, t } from './components/common.js';
import { renderCraftsHome } from './modules/crafts/components/craftsHome.js';
import { renderCraftProjectEditor } from './modules/crafts/components/craftProjectEditor.js';
import { renderCraftInventory } from './modules/crafts/components/craftInventory.js';
import { renderCraftSales } from './modules/crafts/components/craftSales.js';
import {
  state, subscribe, emit, setLanguage, setSimulations, setSales, setConsent, setDashboardFilters,
  setGlobalFilters, setGlobalSalesFilter, setInventoryFilter, setResourceCatalog, setCraftProjects,
  setCraftBatches, setCraftInventory, setCraftSales, setActivities, openModal, closeModal, showToast
} from './state/store.js';
import { normalizeSimulation, normalizeSale } from './services/storageService.js';
import {
  normalizeCraftProject, normalizeIngredient, normalizeCraftBatch, normalizeInventoryItem,
  normalizeCraftSale, normalizeActivity
} from './modules/crafts/services/craftStorageService.js';
import { cancelSaleSync, syncSale } from './services/salesService.js';
import { applyConsent } from './services/consentService.js';
import { findResourceCatalogItem, getEmbeddedResourceCatalog, loadDofusDudeResourceCatalog, searchResourceCatalog } from './services/resourceCatalogService.js';
import { getRememberedResourceXp, rememberResourceXp } from './services/resourceXpMemoryService.js';
import { calculateSimulation, calculateSaleProfit } from './utils/calculations.js';
import { calculateCraftProject, calculateCraftSale, mergeInventory } from './modules/crafts/utils/craftCalculations.js';
import { searchCraftItems, fetchCraftItemDetails } from './modules/crafts/services/dofusDudeCraftService.js';
import { parseKamas, formatNumber } from './utils/currency.js';
import { createId, nowIso, toIsoLocalDateTime } from './utils/identifiers.js';
import { includesNormalized } from './utils/textSearch.js';
import { validateStep } from './utils/validation.js';
import { installRouter, navigatePath, navigateTo } from './router/router.js';

const app = document.querySelector('#app');
const pendingRoute = (() => { try { const value = sessionStorage.getItem('d4b_pending_route'); if (value) sessionStorage.removeItem('d4b_pending_route'); return value; } catch { return null; } })();
if (pendingRoute && pendingRoute.startsWith('/')) history.replaceState(null, '', pendingRoute);

let craftSearchTimer = null;
let craftSearchController = null;

function escapeSelectorValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function focusSelectorFor(element) {
  if (!(element instanceof HTMLElement) || !app.contains(element)) return null;
  if (element.id) return `#${globalThis.CSS?.escape ? globalThis.CSS.escape(element.id) : escapeSelectorValue(element.id)}`;
  const attributes = [
    'data-field','data-resource-field','data-resource-draft','data-resource-picker-search','data-sale-field',
    'data-sales-filter','data-dashboard-filter','data-consent-field','data-resource-new','data-craft-field',
    'data-craft-ingredient-field','data-craft-item-search','data-craft-sale-field','data-inventory-adjust-field',
    'data-global-sales-filter','data-inventory-filter'
  ];
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
    selectionEnd: typeof element.selectionEnd === 'number' ? element.selectionEnd : null,
    scrollLeft: element.scrollLeft || 0
  };
}

function restoreFocusSnapshot(snapshot) {
  if (!snapshot) return false;
  const element = app.querySelector(snapshot.selector);
  if (!element) return false;
  element.focus({ preventScroll: true });
  element.scrollLeft = snapshot.scrollLeft || 0;
  if (typeof element.setSelectionRange === 'function' && snapshot.selectionStart !== null) {
    const length = String(element.value ?? '').length;
    element.setSelectionRange(Math.min(snapshot.selectionStart, length), Math.min(snapshot.selectionEnd ?? snapshot.selectionStart, length));
  }
  return true;
}

function newSimulation(base = {}) {
  const hasTarget = Object.prototype.hasOwnProperty.call(base, 'targetLevel');
  return normalizeSimulation({
    id: base.id || createId('simulation'), name: base.name || '', creatureType: base.creatureType || 'Mascote',
    creatureId: base.creatureId || '', creatureCanonicalName: base.creatureCanonicalName || '',
    creatureImageUrl: base.creatureImageUrl || './assets/placeholders/creature-fallback.svg',
    originLevel: base.originLevel ?? 0, currentXp: base.currentXp ?? 0, xpBonusPercent: base.xpBonusPercent ?? 0,
    targetLevel: hasTarget ? base.targetLevel : 100, upMethod: base.upMethod ?? '', marketFoodPrice: base.marketFoodPrice ?? 0,
    bagPrice: base.bagPrice ?? 0, combinedRationSource: base.combinedRationSource || 'vitaminizedFood',
    resourceLines: Array.isArray(base.resourceLines) ? structuredClone(base.resourceLines) : [], originCost: base.originCost ?? 0,
    additionalCosts: base.additionalCosts ?? 0, estimatedSalePrice: base.estimatedSalePrice ?? 0,
    estimatedSaleChannel: base.estimatedSaleChannel || 'Mercado HDV', createdAt: base.createdAt || nowIso(), updatedAt: nowIso()
  });
}

function createEditorState(simulation, mode = 'new') {
  const copy = structuredClone(simulation || newSimulation());
  if (mode === 'duplicate') {
    copy.id = createId('simulation');
    copy.name = copy.name ? `${copy.name} — ${t(state,'common.copySuffix')}` : '';
    copy.createdAt = nowIso(); copy.updatedAt = nowIso(); copy.status = 'ready'; copy.lastSaleAt = null;
  }
  return { mode, step:1, maxReached:1, simulation:copy, errors:{}, resourcesOpen:copy.upMethod==='combined', creatureQuery:'', resourceQuery:'', resourceComboOpen:false, selectedResourceId:'', resourceDraft:{xp:0,quantity:1,unitPrice:0,custom:false}, comboOpen:false, activeOption:0 };
}

function openEditor(simulation, mode = 'new', { navigate = true } = {}) {
  state.simulationEditor = createEditorState(simulation, mode);
  if (navigate) navigateTo(mode === 'new' || mode === 'duplicate' ? 'pet-simulation-new' : 'pet-simulation-edit', mode === 'edit' ? { id: simulation.id } : {});
  else emit();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function newCraftProject(base = {}) {
  return normalizeCraftProject({
    id: base.id || createId('craft-project'), status: base.status || 'draft', desiredQuantity: base.desiredQuantity || 1,
    ingredients: base.ingredients || [], saleChannel: base.saleChannel || 'HDV', costingMethod: base.costingMethod || 'weighted_average',
    createdAt: base.createdAt || nowIso(), updatedAt: nowIso(), ...base
  });
}

function createCraftEditorState(project, mode = 'new') {
  const copy = structuredClone(project || newCraftProject());
  if (mode === 'duplicate') {
    copy.id = createId('craft-project'); copy.status = 'draft'; copy.createdAt = nowIso(); copy.updatedAt = nowIso(); copy.completedAt = null;
  }
  return { mode, project: copy, itemQuery: copy.ankamaId ? copy.itemNameSnapshot : '', searchOpen: false, errors: {} };
}

function openCraftEditor(project, mode = 'new', { navigate = true } = {}) {
  state.craftEditor = createCraftEditorState(project, mode);
  if (navigate) navigateTo(mode === 'edit' ? 'craft-project-edit' : 'craft-project-new', mode === 'edit' ? { id: project.id } : {});
  else emit();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateSimulationName(sim) {
  const creature = getCreatureById(sim.creatureId);
  return sim.name.trim() || `${creature?.canonicalName || sim.creatureCanonicalName} — ${sim.originLevel} → ${sim.targetLevel}`;
}

function renderPetSimulationsPage() {
  return `<section class="stack"><div class="breadcrumbs"><button data-action="route" data-route="home">${escapeHtml(t(state,'v3.nav.home'))}</button><span>›</span><button data-action="route" data-route="pets">${escapeHtml(t(state,'v3.nav.pets'))}</button><span>›</span><span aria-current="page">${escapeHtml(t(state,'nav.simulations'))}</span></div><div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.modules.pets.title'))}</span><h1>${escapeHtml(t(state,'simulations.title'))}</h1><p>${escapeHtml(t(state,'simulations.description'))}</p></div><button class="button primary" data-action="new-simulation">${icon('plus',17)} ${escapeHtml(t(state,'home.newSimulation'))}</button></div>${renderSimulationGallery(state)}</section>`;
}

function renderSettingsPage() {
  return `<section class="stack"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.nav.settings'))}</span><h1>${escapeHtml(t(state,'v3.nav.settings'))}</h1><p>${escapeHtml(t(state,'consent.text'))}</p></div></div><article class="card section"><button class="button secondary" data-action="open-consent">${escapeHtml(t(state,'footer.privacyPreferences'))}</button><button class="button secondary" data-action="open-information" data-section="about">${escapeHtml(t(state,'footer.transparency'))}</button></article></section>`;
}

function renderView() {
  const route = state.route?.name || 'home';
  if (route === 'home') return renderHomeHub(state);
  if (route === 'pets') return renderDashboard(state);
  if (route === 'pet-simulations') return renderPetSimulationsPage();
  if (route === 'pet-sales') return renderSalesHistory(state);
  if ((route === 'pet-simulation-new' || route === 'pet-simulation-edit') && state.simulationEditor) return renderSimulationEditor(state);
  if (route === 'crafts' || route === 'craft-projects') return renderCraftsHome(state);
  if ((route === 'craft-project-new' || route === 'craft-project-edit') && state.craftEditor) return renderCraftProjectEditor(state);
  if (route === 'craft-inventory') return renderCraftInventory(state);
  if (route === 'craft-sales') return renderCraftSales(state);
  if (route === 'global-sales') return renderGlobalSales(state);
  if (route === 'global-inventory') return renderGlobalInventory(state);
  if (route === 'settings') return renderSettingsPage();
  return renderHomeHub(state);
}

function renderCookieBanner() {
  if (state.consent?.decidedAt) return '';
  return `<aside class="cookie-banner" aria-label="${escapeHtml(t(state,'consent.title'))}"><div><strong>${escapeHtml(t(state,'consent.title'))}</strong><p class="small">${escapeHtml(t(state,'consent.text'))}</p></div><div class="cookie-actions"><button class="button secondary compact" data-action="consent-reject">${escapeHtml(t(state,'consent.reject'))}</button><button class="button secondary compact" data-action="open-consent">${escapeHtml(t(state,'consent.configure'))}</button><button class="button primary compact" data-action="consent-accept">${escapeHtml(t(state,'consent.acceptAll'))}</button></div></aside>`;
}

function render() {
  const focusSnapshot = captureFocusSnapshot();
  destroyDashboardCharts();
  document.documentElement.lang = state.language;
  document.title = `Dofus4Business v${APP_VERSION}`;
  const editorRoute = ['pet-simulation-new','pet-simulation-edit','craft-project-new','craft-project-edit'].includes(state.route?.name);
  app.innerHTML = `<div class="app-shell">${renderHeader(state)}<div class="container">${adSlot('ad-slot-header','header-ad',state)}</div><main id="main-content" class="main"><div class="container">${editorRoute?`<div class="page-grid"><div>${renderView()}</div><aside class="sidebar sticky">${adSlot('ad-slot-sidebar','sidebar-ad',state)}<article class="card section"><span class="eyebrow">${escapeHtml(t(state,'support.title'))}</span><p class="muted small" style="margin-top:8px">${escapeHtml(t(state,'support.text'))}</p><button class="button secondary" style="margin-top:12px" data-action="open-support">${icon('pix',17)} ${escapeHtml(t(state,'support.button'))}</button></article></aside></div>`:renderView()}</div></main>${renderFooter(state)}${renderModal(state)}${state.toast?`<div class="toast ${state.toast.tone==='error'?'error':''}" role="status">${escapeHtml(state.toast.message)}</div>`:''}${renderCookieBanner()}</div>`;
  requestAnimationFrame(() => {
    const shouldFocusModal = state.modal && !focusSnapshot?.inModal;
    if (shouldFocusModal) app.querySelector('.modal button,.modal input,.modal select')?.focus();
    else restoreFocusSnapshot(focusSnapshot);
    mountDashboardCharts(state);
  });
}

function hydrateRoute(route) {
  state.route = route;
  state.view = route.name;
  if (route.name === 'pet-simulation-new' && !state.simulationEditor) state.simulationEditor = createEditorState(newSimulation(), 'new');
  if (route.name === 'pet-simulation-edit') {
    const currentId = state.simulationEditor?.simulation?.id;
    if (currentId !== route.params.id || state.simulationEditor?.mode !== 'edit') {
      const simulation = state.simulations.find(item => item.id === route.params.id);
      state.simulationEditor = simulation ? createEditorState(simulation, 'edit') : null;
      if (!simulation) { showToast(t(state,'common.noResults'),'error'); navigateTo('pet-simulations',{}, { replace:true }); return; }
    }
  }
  if (!route.name.startsWith('pet-simulation')) state.simulationEditor = null;
  if (route.name === 'craft-project-new' && !state.craftEditor) state.craftEditor = createCraftEditorState(newCraftProject(), 'new');
  if (route.name === 'craft-project-edit') {
    const currentId = state.craftEditor?.project?.id;
    if (currentId !== route.params.id || state.craftEditor?.mode !== 'edit') {
      const project = state.craftProjects.find(item => item.id === route.params.id);
      state.craftEditor = project ? createCraftEditorState(project, 'edit') : null;
      if (!project) { showToast(t(state,'common.noResults'),'error'); navigateTo('craft-projects',{}, { replace:true }); return; }
    }
  }
  if (!route.name.startsWith('craft-project-')) state.craftEditor = null;
  emit();
}

applyConsent(state.consent);
subscribe(render);
installRouter(hydrateRoute);

async function refreshResourceCatalog(language = state.language, force = false) {
  setResourceCatalog({ items: state.resourceCatalog, status: 'loading', source: state.resourceCatalogSource });
  try {
    const catalog = await loadDofusDudeResourceCatalog(language, { force });
    setResourceCatalog({ items: catalog.items, status: 'ready', source: catalog.source, loadedAt: catalog.loadedAt, error: null });
  } catch (error) {
    setResourceCatalog({ items: getEmbeddedResourceCatalog(language), status: 'fallback', source: 'embedded', loadedAt: null, error: String(error?.message || error) });
  }
}
void refreshResourceCatalog(state.language);

function updateEditorField(field, rawValue, shouldRender = true) {
  const ed = state.simulationEditor; if (!ed) return; const sim = ed.simulation;
  const numeric = new Set(['originLevel','currentXp','xpBonusPercent','targetLevel','marketFoodPrice','bagPrice','originCost','additionalCosts','estimatedSalePrice']);
  if (numeric.has(field)) {
    if (['originLevel','currentXp','targetLevel'].includes(field)) sim[field] = Math.trunc(Number(rawValue || 0));
    else if (field === 'xpBonusPercent') sim[field] = Math.min(1000, Math.max(0, Number(String(rawValue).replace(',','.')) || 0));
    else sim[field] = parseKamas(rawValue);
  } else sim[field] = rawValue;
  if (field === 'originLevel' && sim.originLevel >= sim.targetLevel) sim.targetLevel = Math.min(100, sim.originLevel + 1);
  if (field === 'creatureType') { sim.creatureId=''; sim.creatureCanonicalName=''; sim.creatureImageUrl='./assets/placeholders/creature-fallback.svg'; ed.creatureQuery=''; ed.comboOpen=true; }
  ed.errors = {};
  if (shouldRender) emit();
}

function updateCraftField(field, rawValue, shouldRender = true) {
  const editor=state.craftEditor;if(!editor)return;const project=editor.project;
  const numeric=new Set(['desiredQuantity','marketUnitPrice','desiredSalePrice','additionalCosts']);
  project[field]=numeric.has(field)?parseKamas(rawValue):rawValue;
  if(field==='desiredQuantity')project.desiredQuantity=Math.max(1,Math.round(Number(rawValue)||1));
  project.updatedAt=nowIso();
  if(shouldRender)emit();
}

function saveConsent(patch) {
  state.consent = { ...state.consent, ...patch, version:CONSENT_POLICY_VERSION, essential:true, decidedAt:nowIso() };
  setConsent(state.consent); closeModal(); showToast(t(state,'consent.saved'));
}

function openInformation(section='about') {
  openModal({ type:'information', section });
  history.replaceState(null,'',`${location.pathname}#${section==='how'?'como-funciona':section}`);
}

function addActivity(input) {
  const activity=normalizeActivity(input);
  setActivities([activity,...state.activities].slice(0,500));
}

function updatePetCreatureListDom() {
  const editor=state.simulationEditor;const list=app.querySelector('#creature-options');if(!editor||!list)return;
  const query=editor.creatureQuery||'';
  const filtered=creatureCatalog.filter(creature=>creature.type===editor.simulation.creatureType&&[getCreatureName(creature,state.language),creature.canonicalName,...Object.values(creature.names||{})].some(name=>includesNormalized(name,query)));
  list.innerHTML=filtered.length?filtered.map((creature,index)=>`<button class="combobox-option" type="button" role="option" aria-selected="${creature.id===editor.simulation.creatureId}" data-action="select-creature" data-id="${creature.id}" data-index="${index}">${imageTag(creature.imageUrl,getCreatureName(creature,state.language))}<span><strong>${escapeHtml(getCreatureName(creature,state.language))}</strong><small class="muted">${escapeHtml(creature.type==='Mascote'?t(state,'simulation.pet'):t(state,'simulation.petsmount'))}</small></span></button>`).join(''):`<p class="small muted" style="padding:12px">${escapeHtml(t(state,'common.noResults'))}</p>`;
}

function updatePetResourceListDom() {
  const editor=state.simulationEditor;const list=app.querySelector('#resource-options');if(!editor||!list)return;
  const query=editor.resourceQuery||'';const filtered=searchResourceCatalog(state.resourceCatalog,query);
  const normalizedQuery=normalizeResourceText(query);const exact=filtered.some(item=>[item.name,item.canonicalName].some(name=>normalizeResourceText(name)===normalizedQuery));const custom=query.trim()&&!exact;
  list.innerHTML=filtered.map((item,index)=>`<button class="combobox-option" type="button" role="option" aria-selected="${item.id===editor.selectedResourceId}" data-action="select-resource" data-id="${escapeHtml(item.id)}" data-index="${index}">${item.imageUrl?`<img src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" width="42" height="42" onerror="this.hidden=true">`:`<span class="resource-option-placeholder">${icon('box',20)}</span>`}<span><strong>${escapeHtml(item.name)}</strong><small class="muted">${item.level?`${escapeHtml(t(state,'simulation.resourceLevel'))} ${item.level} · `:''}${item.xp?`${formatNumber(item.xp,state.language,3)} XP`:escapeHtml(t(state,'simulation.xpNeedsInput'))}</small></span></button>`).join('')+(custom?`<button class="combobox-option custom-option" type="button" role="option" data-action="select-custom-resource"><span class="resource-option-placeholder">${icon('plus',20)}</span><span><strong>${escapeHtml(t(state,'simulation.addCustomResourceOption'))}</strong><small class="muted">${escapeHtml(query.trim())}</small></span></button>`:'')+(!filtered.length&&!custom?`<p class="small muted" style="padding:12px">${escapeHtml(t(state,'common.noResults'))}</p>`:'');
}

function craftSearchMarkup() {
  const search=state.craftSearch;
  if(search.status==='loading')return `<div class="combobox-empty">${escapeHtml(t(state,'common.loading'))}</div>`;
  if(search.error)return `<div class="combobox-empty error-text">${escapeHtml(t(state,'v3.crafts.apiUnavailable'))}</div>`;
  if(!search.results.length)return `<div class="combobox-empty">${escapeHtml(search.query?t(state,'common.noResults'):t(state,'v3.crafts.searchHint'))}</div>`;
  return search.results.map(item=>`<button type="button" class="combobox-option item-option" data-action="select-craft-item" data-id="${item.ankamaId}" data-category="${escapeHtml(item.category)}">${imageTag(item.imageUrl,item.name,'combobox-thumb')}<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(t(state,'simulation.levelShort'))} ${formatNumber(item.level)}</small></span></button>`).join('');
}

function updateCraftSearchListDom() {
  const list=app.querySelector('#craft-item-options');if(list){list.hidden=false;list.innerHTML=craftSearchMarkup();}
}

function scheduleCraftSearch(query) {
  window.clearTimeout(craftSearchTimer);craftSearchController?.abort();
  state.craftSearch={query,status:query.trim().length>=2?'loading':'idle',results:query.trim().length>=2?state.craftSearch.results:[],error:null};
  updateCraftSearchListDom();
  if(query.trim().length<2)return;
  craftSearchTimer=window.setTimeout(async()=>{
    craftSearchController=new AbortController();
    try{const results=await searchCraftItems(query,state.language,{limit:50,signal:craftSearchController.signal});state.craftSearch={query,status:'ready',results,error:null};updateCraftSearchListDom();}
    catch(error){if(error?.name==='AbortError')return;state.craftSearch={query,status:'error',results:[],error:String(error?.message||error)};updateCraftSearchListDom();}
  },280);
}

async function selectCraftItem(ankamaId) {
  const editor=state.craftEditor;if(!editor)return;
  const summary=state.craftSearch.results.find(item=>String(item.ankamaId)===String(ankamaId))||{ankamaId};
  editor.itemQuery=summary.name||editor.itemQuery;editor.searchOpen=false;emit();
  try{
    const detail=await fetchCraftItemDetails(summary,state.language);
    const quantity=Math.max(1,editor.project.desiredQuantity||1);
    editor.project={...editor.project,ankamaId:detail.ankamaId,itemNameSnapshot:detail.name,itemImageSnapshot:detail.imageUrl,itemTypeSnapshot:detail.type,itemLevelSnapshot:detail.level,ingredients:(detail.recipe||[]).map(item=>normalizeIngredient({ankamaId:item.ankamaId,nameSnapshot:item.name,imageSnapshot:item.imageUrl,typeSnapshot:item.type,quantityPerUnit:item.quantity,totalQuantity:item.quantity*quantity,unitMarketPrice:state.craftPrices?.[item.ankamaId]||0,acquisitionMode:'buy'})),updatedAt:nowIso()};
    editor.itemQuery=detail.name;emit();
  }catch{showToast(t(state,'v3.crafts.apiUnavailable'),'error');}
}

async function loadSubrecipe(ingredientId) {
  const editor=state.craftEditor;const line=editor?.project.ingredients.find(item=>item.id===ingredientId);if(!line?.ankamaId)return;
  try{const detail=await fetchCraftItemDetails({ankamaId:line.ankamaId,type:line.typeSnapshot},state.language);line.subRecipe=(detail.recipe||[]).map(item=>normalizeIngredient({ankamaId:item.ankamaId,nameSnapshot:item.name,imageSnapshot:item.imageUrl,typeSnapshot:item.type,quantityPerUnit:item.quantity,totalQuantity:item.quantity,unitMarketPrice:state.craftPrices?.[item.ankamaId]||0,acquisitionMode:'buy'}));emit();}
  catch{showToast(t(state,'v3.crafts.apiUnavailable'),'error');}
}

function saveCraftProject() {
  const editor=state.craftEditor;if(!editor)return;const project=editor.project;
  if(!project.ankamaId||!project.itemNameSnapshot){showToast(t(state,'v3.crafts.chooseItemFirst'),'error');return;}
  const calc=calculateCraftProject(project);const saved=normalizeCraftProject({...project,status:project.status==='draft'?'planned':project.status,financialCost:calc.financialCost,economicCost:calc.economicCost,accountingCost:calc.accountingCost,replacementCost:calc.economicCost,updatedAt:nowIso()});
  const exists=state.craftProjects.some(item=>item.id===saved.id);setCraftProjects(exists?state.craftProjects.map(item=>item.id===saved.id?saved:item):[saved,...state.craftProjects]);addActivity({module:'crafts',action:exists?'craft_project_updated':'craft_project_created',itemName:saved.itemNameSnapshot,itemImage:saved.itemImageSnapshot,entityId:saved.id,route:`/crafts/projetos/${encodeURIComponent(saved.id)}`,value:calc.financialCost});state.craftEditor=null;navigateTo('crafts');showToast(t(state,'v3.crafts.saveProject'));
}

function completeCraftProject(projectId, forSale=false) {
  const project=state.craftProjects.find(item=>item.id===projectId);if(!project)return;const calc=calculateCraftProject(project);
  if(!project.ingredients.length||calc.missingPrices.length){showToast(t(state,'v3.crafts.missingPrices',{count:calc.missingPrices.length||project.ingredients.length}),'error');return;}
  const batch=normalizeCraftBatch({projectId:project.id,ankamaId:project.ankamaId,itemNameSnapshot:project.itemNameSnapshot,itemImageSnapshot:project.itemImageSnapshot,itemTypeSnapshot:project.itemTypeSnapshot,producedQuantity:project.desiredQuantity,remainingQuantity:project.desiredQuantity,financialCost:calc.financialCost,economicCost:calc.economicCost,accountingCost:calc.accountingCost,unitCost:Math.round(calc.unitAccountingCost),desiredSalePrice:project.desiredSalePrice,status:forSale?'awaiting_sale':'in_stock',createdAt:nowIso()});
  let inventory=[...state.craftInventory];
  const existing=inventory.find(item=>String(item.ankamaId)===String(batch.ankamaId));const merged=normalizeInventoryItem({...mergeInventory(existing,batch),id:existing?.id||createId('inventory'),updatedAt:nowIso()});inventory=existing?inventory.map(item=>item.id===existing.id?merged:item):[merged,...inventory];
  for(const ingredient of calc.ingredients){const used=Math.min(ingredient.useStockQuantity||0,ingredient.totalQuantity||0);if(!used)continue;inventory=inventory.map(item=>String(item.ankamaId)===String(ingredient.ankamaId)?normalizeInventoryItem({...item,quantity:Math.max(0,item.quantity-used),updatedAt:nowIso()}):item);}
  setCraftBatches([batch,...state.craftBatches]);setCraftInventory(inventory);setCraftProjects(state.craftProjects.map(item=>item.id===project.id?normalizeCraftProject({...item,status:'finalized',completedAt:nowIso(),financialCost:calc.financialCost,economicCost:calc.economicCost,accountingCost:calc.accountingCost,updatedAt:nowIso()}):item));addActivity({module:'crafts',action:'craft_completed',itemName:project.itemNameSnapshot,itemImage:project.itemImageSnapshot,entityId:batch.id,route:'/crafts/estoque',value:calc.accountingCost});closeModal();navigateTo('craft-inventory');showToast(t(state,'v3.crafts.completeProduction'));
}

function confirmCraftSale() {
  const modal=state.modal;const item=state.craftInventory.find(row=>row.id===modal.inventoryItemId);if(!item)return;const draft=modal.draft;const quantity=Math.max(1,Math.round(Number(draft.quantity)||1));
  if(quantity>item.availableQuantity||Number(draft.unitSalePrice)<=0){showToast(t(state,'toast.invalidStep'),'error');return;}
  const relatedBatches=state.craftBatches.filter(batch=>(item.batchIds||[]).includes(batch.id)&&batch.remainingQuantity>0).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const sourceBatch=relatedBatches[0]||null;
  const calc=calculateCraftSale({...draft,quantity,unitCost:item.weightedUnitCost});
  const sale=normalizeCraftSale({...draft,inventoryItemId:item.id,sourceId:item.id,batchId:sourceBatch?.id||null,projectId:sourceBatch?.projectId||null,ankamaId:item.ankamaId,itemNameSnapshot:item.itemNameSnapshot,itemImageSnapshot:item.itemImageSnapshot,itemTypeSnapshot:item.itemTypeSnapshot,quantity,unitCost:item.weightedUnitCost,...calc,createdAt:nowIso()});
  const updated=normalizeInventoryItem({...item,quantity:item.quantity-quantity,soldQuantity:item.soldQuantity+quantity,forSale:item.quantity-quantity>0?item.forSale:false,updatedAt:nowIso()});
  let remainingToAllocate=quantity;
  const batches=state.craftBatches.map(batch=>{
    if(!relatedBatches.some(row=>row.id===batch.id)||remainingToAllocate<=0)return batch;
    const allocated=Math.min(remainingToAllocate,batch.remainingQuantity);remainingToAllocate-=allocated;
    const remainingQuantity=Math.max(0,batch.remainingQuantity-allocated);
    return normalizeCraftBatch({...batch,remainingQuantity,soldQuantity:batch.soldQuantity+allocated,status:remainingQuantity===0?'sold':batch.status,updatedAt:nowIso()});
  });
  setCraftSales([sale,...state.craftSales]);setCraftBatches(batches);setCraftInventory(state.craftInventory.map(row=>row.id===item.id?updated:row));addActivity({module:'crafts',action:'craft_sale_registered',itemName:item.itemNameSnapshot,itemImage:item.itemImageSnapshot,entityId:sale.id,route:'/vendas',value:sale.realizedProfit});closeModal();showToast(t(state,'sales.registered'));
}

function confirmInventoryAdjust() {
  const modal=state.modal;const item=state.craftInventory.find(row=>row.id===modal.id);if(!item)return;const quantity=Math.max(0,Math.round(Number(modal.draft.quantity)||0));const reserved=Math.min(quantity,Math.max(0,Math.round(Number(modal.draft.reservedQuantity)||0)));const updated=normalizeInventoryItem({...item,quantity,reservedQuantity:reserved,desiredSalePrice:parseKamas(modal.draft.desiredSalePrice),updatedAt:nowIso()});setCraftInventory(state.craftInventory.map(row=>row.id===item.id?updated:row));addActivity({module:'crafts',action:'inventory_adjusted',itemName:item.itemNameSnapshot,itemImage:item.itemImageSnapshot,entityId:item.id,route:'/crafts/estoque',value:updated.quantity*updated.weightedUnitCost});closeModal();showToast(t(state,'common.save'));
}

function handleAction(button) {
  const action=button.dataset.action;if(!action)return;
  if(action==='route'){navigateTo(button.dataset.route);return;}
  if(action==='navigate-path'){navigatePath(button.dataset.path);return;}
  if(action==='navigate'){const mapping={dashboard:'pets',simulations:'pet-simulations',sales:'pet-sales'};navigateTo(mapping[button.dataset.view]||'home');return;}
  if(action==='global-module-filter'){setGlobalFilters({module:button.dataset.module});return;}
  if(action==='new-simulation'){openEditor(newSimulation(),'new');return;}
  if(action==='edit-simulation'){closeModal();const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openEditor(sim,'edit');return;}
  if(action==='duplicate-simulation'){closeModal();const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openEditor(sim,'duplicate');return;}
  if(action==='exit-editor'){state.simulationEditor=null;navigateTo('pets');return;}
  if(action==='go-step'){const target=Number(button.dataset.step),ed=state.simulationEditor;if(target<=ed.maxReached){if(target>ed.step){const errors=validateStep(ed.simulation,ed.step,calculateSimulation(ed.simulation));if(Object.keys(errors).length){ed.errors=errors;showToast(t(state,'toast.invalidStep'),'error');return;}}ed.step=target;ed.errors={};emit();}return;}
  if(action==='prev-step'){state.simulationEditor.step=Math.max(1,state.simulationEditor.step-1);state.simulationEditor.errors={};emit();return;}
  if(action==='next-step'){const ed=state.simulationEditor,calc=calculateSimulation(ed.simulation),errors=validateStep(ed.simulation,ed.step,calc);if(Object.keys(errors).length){ed.errors=errors;showToast(t(state,'toast.invalidStep'),'error');return;}ed.step=Math.min(5,ed.step+1);ed.maxReached=Math.max(ed.maxReached,ed.step);ed.errors={};emit();return;}
  if(action==='save-simulation'){const ed=state.simulationEditor,calc=calculateSimulation(ed.simulation);let errors={},firstInvalid=5;for(let step=1;step<=4;step++){const current=validateStep(ed.simulation,step,calc);if(Object.keys(current).length&&firstInvalid===5)firstInvalid=step;errors={...errors,...current};}if(Object.keys(errors).length){ed.errors=errors;ed.step=firstInvalid;showToast(t(state,'toast.invalidStep'),'error');return;}const creature=getCreatureById(ed.simulation.creatureId);const saved={...ed.simulation,name:generateSimulationName(ed.simulation),creatureCanonicalName:creature.canonicalName,creatureImageUrl:creature.imageUrl,unassociatedCreature:false,updatedAt:nowIso()};const exists=state.simulations.some(x=>x.id===saved.id);setSimulations(exists?state.simulations.map(x=>x.id===saved.id?saved:x):[saved,...state.simulations]);state.simulationEditor=null;navigateTo('pets');showToast(exists?t(state,'toast.simulationUpdated'):t(state,'toast.simulationSaved'));return;}
  if(action==='select-creature'){const ed=state.simulationEditor,c=getCreatureById(button.dataset.id);if(c){ed.simulation.creatureId=c.id;ed.simulation.creatureCanonicalName=c.canonicalName;ed.simulation.creatureImageUrl=c.imageUrl;ed.creatureQuery=getCreatureName(c,state.language);ed.comboOpen=false;ed.errors={};emit();}return;}
  if(action==='select-method'){state.simulationEditor.simulation.upMethod=button.dataset.method==='resources'?'combined':button.dataset.method;state.simulationEditor.resourcesOpen=state.simulationEditor.simulation.upMethod==='combined'||state.simulationEditor.resourcesOpen;state.simulationEditor.errors={};emit();return;}
  if(action==='set-xp-bonus'){state.simulationEditor.simulation.xpBonusPercent=Math.min(1000,Math.max(0,Number(button.dataset.value)||0));state.simulationEditor.errors={};emit();return;}
  if(action==='toggle-resources'){state.simulationEditor.resourcesOpen=!state.simulationEditor.resourcesOpen;emit();return;}
  if(action==='select-resource'){const editor=state.simulationEditor;const item=findResourceCatalogItem(state.resourceCatalog,{resourceId:button.dataset.id});if(item){const rememberedXp=getRememberedResourceXp(item);editor.selectedResourceId=item.id;editor.resourceQuery=item.name;editor.resourceComboOpen=false;editor.resourceDraft={...(editor.resourceDraft||{}),xp:rememberedXp||item.xp||0,quantity:editor.resourceDraft?.quantity||1,unitPrice:editor.resourceDraft?.unitPrice||0,custom:false};emit();}return;}
  if(action==='select-custom-resource'){const editor=state.simulationEditor;const rememberedXp=getRememberedResourceXp({resourceName:editor.resourceQuery});editor.selectedResourceId='__custom__';editor.resourceComboOpen=false;editor.resourceDraft={...(editor.resourceDraft||{}),xp:rememberedXp||editor.resourceDraft?.xp||0,quantity:editor.resourceDraft?.quantity||1,unitPrice:editor.resourceDraft?.unitPrice||0,custom:true};emit();return;}
  if(action==='add-selected-resource'){const editor=state.simulationEditor,draft=editor.resourceDraft||{},isCustom=editor.selectedResourceId==='__custom__'||draft.custom,item=isCustom?null:findResourceCatalogItem(state.resourceCatalog,{resourceId:editor.selectedResourceId}),name=isCustom?String(editor.resourceQuery||'').trim():(item?.canonicalName||item?.name||''),displayName=isCustom?name:(item?.name||name),xp=Number(draft.xp),quantity=Math.max(0,Math.trunc(Number(draft.quantity)||0)),unitPrice=parseKamas(draft.unitPrice),error=button.closest('.collapsible-content')?.querySelector('[data-resource-error]');if((!isCustom&&!item)||!name||!Number.isFinite(xp)||xp<=0||quantity<=0){if(error)error.textContent=t(state,isCustom?'simulation.invalidCustomResource':'simulation.invalidResource');return;}const duplicate=editor.simulation.resourceLines.some(line=>(item?.ankamaId&&String(line.resourceAnkamaId)===String(item.ankamaId))||(item?.id&&line.resourceId===item.id)||normalizeResourceText(line.resourceName||line.customName||'')===normalizeResourceText(name));if(duplicate){if(error)error.textContent=t(state,'simulation.duplicateResource');return;}rememberResourceXp(item||{resourceName:name},xp);editor.simulation.resourceLines.push({id:createId('resource'),resourceId:item?.id||`custom-${createId('item')}`,resourceAnkamaId:item?.ankamaId??null,resourceName:name,resourceDisplayName:displayName,resourceImageUrl:item?.imageUrl||'',resourceLevel:item?.level??null,xpUnit:xp,customXp:xp,xpSource:item?.xpSource||'manual',custom:isCustom,quantity,unitPrice});editor.resourceQuery='';editor.selectedResourceId='';editor.resourceComboOpen=false;editor.resourceDraft={xp:0,quantity:1,unitPrice:0,custom:false};if(error)error.textContent='';emit();return;}
  if(action==='delete-resource'){state.simulationEditor.simulation.resourceLines=state.simulationEditor.simulation.resourceLines.filter(x=>x.id!==button.dataset.id);emit();return;}
  if(action==='fill-resource-required'){const ed=state.simulationEditor,calc=calculateSimulation(ed.simulation),computed=calc.resources.lines.find(x=>x.id===button.dataset.id),line=ed.simulation.resourceLines.find(x=>x.id===button.dataset.id);if(computed&&line&&computed.quantityNeededAlone>0){line.quantity=computed.quantityNeededAlone;emit();}return;}
  if(action==='refresh-resource-catalog'){void refreshResourceCatalog(state.language,true);return;}
  if(action==='simulation-details'){openModal({type:'simulation-details',id:button.dataset.id});return;}
  if(action==='delete-simulation'){const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openModal({type:'confirm',title:t(state,'simulations.deleteTitle'),text:t(state,'simulations.deleteText'),confirmAction:'delete-simulation',id:sim.id});return;}
  if(action==='register-sale'){const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim){const calc=calculateSimulation(sim);openModal({type:'register-sale',simulationId:sim.id,draft:{originCost:calc.originCost,upCost:calc.upCost+calc.additionalCosts,salePrice:calc.salePrice,saleChannel:sim.estimatedSaleChannel,soldAt:toIsoLocalDateTime()}});}return;}
  if(action==='confirm-sale'){confirmPetSale();return;}
  if(action==='sale-details'){openModal({type:'sale-details',id:button.dataset.id});return;}
  if(action==='delete-sale'){const sale=state.sales.find(x=>x.id===button.dataset.id);if(sale)openModal({type:'confirm',title:t(state,'sales.deleteTitle'),text:t(state,'sales.deleteText'),confirmAction:'delete-sale',id:sale.id});return;}
  if(action==='retry-sale'){const sale=state.sales.find(x=>x.id===button.dataset.id);if(sale&&sale.syncStatus==='failed'){const updated={...sale,syncStatus:'pending'};setSales(state.sales.map(x=>x.id===sale.id?updated:x));showToast(t(state,'sales.retryStarted'));startSync(updated);}return;}
  if(action==='duplicate-sale-simulation'){const sale=state.sales.find(x=>x.id===button.dataset.id);if(sale)openEditor(newSimulation({creatureId:sale.creatureId,creatureType:sale.creatureType,creatureCanonicalName:sale.creatureCanonicalName,creatureImageUrl:sale.creatureImageUrl,originLevel:sale.originLevel,targetLevel:sale.targetLevel,xpBonusPercent:sale.xpBonusPercent||0,upMethod:sale.upMethod,resourceLines:sale.resourceDetails,originCost:sale.originCost,estimatedSalePrice:sale.salePrice,estimatedSaleChannel:sale.saleChannel}),'duplicate');return;}
  if(action==='new-craft-project'){openCraftEditor(newCraftProject(),'new');return;}
  if(action==='edit-craft-project'){closeModal();const project=state.craftProjects.find(item=>item.id===button.dataset.id);if(project)openCraftEditor(project,'edit');return;}
  if(action==='select-craft-item'){void selectCraftItem(button.dataset.id);return;}
  if(action==='load-subrecipe'){void loadSubrecipe(button.dataset.id);return;}
  if(action==='remove-craft-ingredient'){state.craftEditor.project.ingredients=state.craftEditor.project.ingredients.filter(item=>item.id!==button.dataset.id);emit();return;}
  if(action==='save-craft-project'){saveCraftProject();return;}
  if(action==='exit-craft-editor'){state.craftEditor=null;navigateTo('crafts');return;}
  if(action==='craft-project-details'){openModal({type:'craft-project-details',id:button.dataset.id});return;}
  if(action==='complete-craft-project'){const project=state.craftProjects.find(item=>item.id===button.dataset.id)||state.craftEditor?.project;if(project)openModal({type:'complete-craft-project',id:project.id,draft:{forSale:false}});return;}
  if(action==='confirm-complete-craft'){completeCraftProject(state.modal.id,Boolean(state.modal.draft?.forSale));return;}
  if(action==='toggle-inventory-sale'){const item=state.craftInventory.find(row=>row.id===button.dataset.id);if(item){const updated=normalizeInventoryItem({...item,forSale:!item.forSale,updatedAt:nowIso()});setCraftInventory(state.craftInventory.map(row=>row.id===item.id?updated:row));addActivity({module:'crafts',action:'craft_for_sale',itemName:item.itemNameSnapshot,itemImage:item.itemImageSnapshot,entityId:item.id,route:'/crafts/estoque',value:updated.desiredSalePrice*updated.availableQuantity});}return;}
  if(action==='register-craft-sale'){const item=state.craftInventory.find(row=>row.id===button.dataset.id);if(item)openModal({type:'register-craft-sale',inventoryItemId:item.id,draft:{quantity:1,unitSalePrice:item.desiredSalePrice||0,channel:'HDV',otherCosts:0,buyer:'',server:'',notes:'',saleDate:toIsoLocalDateTime()}});return;}
  if(action==='confirm-craft-sale'){confirmCraftSale();return;}
  if(action==='inventory-adjust'){const item=state.craftInventory.find(row=>row.id===button.dataset.id);if(item)openModal({type:'inventory-adjust',id:item.id,draft:{quantity:item.quantity,reservedQuantity:item.reservedQuantity,desiredSalePrice:item.desiredSalePrice}});return;}
  if(action==='confirm-inventory-adjust'){confirmInventoryAdjust();return;}
  if(action==='global-sale-details'){openModal({type:button.dataset.module==='pets'?'sale-details':'craft-sale-details',id:button.dataset.id});return;}
  if(action==='open-support'){openModal({type:'support'});return;}
  if(action==='open-information'){openInformation(button.dataset.section||'about');return;}
  if(action==='information-section'){state.modal={...state.modal,section:button.dataset.section};history.replaceState(null,'',`${location.pathname}#${button.dataset.section==='how'?'como-funciona':button.dataset.section}`);emit();return;}
  if(action==='open-consent'){openModal({type:'consent',draft:{...state.consent}});return;}
  if(action==='consent-accept'){saveConsent({preferences:true,analytics:true,advertising:true});return;}
  if(action==='consent-reject'){saveConsent({preferences:false,analytics:false,advertising:false});return;}
  if(action==='consent-save'){saveConsent(state.modal?.draft||state.consent);return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='confirm-modal'){const m=state.modal;if(m.confirmAction==='delete-simulation'){setSimulations(state.simulations.filter(x=>x.id!==m.id));showToast(t(state,'toast.simulationDeleted'));}if(m.confirmAction==='delete-sale'){const removed=state.sales.find(x=>x.id===m.id);cancelSaleSync(m.id);const remaining=state.sales.filter(x=>x.id!==m.id);setSales(remaining);if(removed&&!remaining.some(x=>x.simulationId===removed.simulationId))setSimulations(state.simulations.map(sim=>sim.id===removed.simulationId?{...sim,status:'ready',updatedAt:nowIso()}:sim));showToast(t(state,'toast.saleDeleted'));}closeModal();return;}
  if(action==='copy-pix'){void copyPix();return;}
  if(action==='toggle-language'){const menu=app.querySelector('[data-language-menu]');menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));return;}
  if(action==='set-language'){const language=button.dataset.language;if(state.simulationEditor?.simulation?.creatureId){state.simulationEditor.creatureQuery=getCreatureName(getCreatureById(state.simulationEditor.simulation.creatureId),language);}setLanguage(language);void refreshResourceCatalog(language);return;}
  if(action==='toggle-mobile'){const nav=app.querySelector('[data-mobile-nav]');nav.hidden=!nav.hidden;button.setAttribute('aria-expanded',String(!nav.hidden));return;}
}

function confirmPetSale() {
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
  let copied=false;try{await navigator.clipboard.writeText(PIX_KEY);copied=true;}catch{const input=document.createElement('textarea');input.value=PIX_KEY;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();copied=document.execCommand('copy');input.remove();}if(copied)showToast(t(state,'common.copied'));
}

app.addEventListener('focusin',event=>{
  if(event.target.matches('[data-field="creatureQuery"]')&&state.simulationEditor&&!state.simulationEditor.comboOpen){state.simulationEditor.comboOpen=true;emit();return;}
  if(event.target.matches('[data-resource-picker-search]')&&state.simulationEditor&&!state.simulationEditor.resourceComboOpen){state.simulationEditor.resourceComboOpen=true;emit();return;}
  if(event.target.matches('[data-craft-item-search]')&&state.craftEditor){state.craftEditor.searchOpen=true;const list=app.querySelector('#craft-item-options');if(list)list.hidden=false;}
});

app.addEventListener('click',event=>{
  if(event.target.classList.contains('modal-backdrop')){closeModal();return;}
  const actionNode=event.target.closest('[data-action]');if(actionNode)handleAction(actionNode);
  if(!event.target.closest('.language')){const menu=app.querySelector('[data-language-menu]');if(menu)menu.hidden=true;}
});

app.addEventListener('change',event=>{
  const field=event.target.dataset.field;if(field)updateEditorField(field,event.target.value,true);
  const resourceField=event.target.dataset.resourceField;if(resourceField&&state.simulationEditor){const line=state.simulationEditor.simulation.resourceLines.find(x=>x.id===event.target.dataset.id);if(line){if(resourceField==='quantity')line.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));else if(resourceField==='unitPrice')line.unitPrice=parseKamas(event.target.value);else if(resourceField==='customXp'){line.customXp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);line.xpUnit=line.customXp;line.xpSource='manual';rememberResourceXp(line,line.customXp);}emit();}}
  const resourceDraftField=event.target.dataset.resourceDraft;if(resourceDraftField&&state.simulationEditor){const draft=state.simulationEditor.resourceDraft||(state.simulationEditor.resourceDraft={xp:0,quantity:1,unitPrice:0,custom:false});if(resourceDraftField==='xp')draft.xp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);else if(resourceDraftField==='quantity')draft.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));else if(resourceDraftField==='unitPrice')draft.unitPrice=parseKamas(event.target.value);emit();}
  const saleField=event.target.dataset.saleField;if(saleField&&state.modal?.type==='register-sale'){state.modal.draft[saleField]=['originCost','upCost','salePrice'].includes(saleField)?parseKamas(event.target.value):event.target.value;emit();}
  const craftField=event.target.dataset.craftField;if(craftField)updateCraftField(craftField,event.target.value,true);
  const ingredientField=event.target.dataset.craftIngredientField;if(ingredientField&&state.craftEditor){const line=state.craftEditor.project.ingredients.find(item=>item.id===event.target.dataset.id);if(line){if(['unitMarketPrice','useStockQuantity'].includes(ingredientField))line[ingredientField]=parseKamas(event.target.value);else line[ingredientField]=event.target.value;line.totalQuantity=line.quantityPerUnit*state.craftEditor.project.desiredQuantity;emit();}}
  const craftSaleField=event.target.dataset.craftSaleField;if(craftSaleField&&state.modal?.type==='register-craft-sale'){state.modal.draft[craftSaleField]=['quantity','unitSalePrice','otherCosts'].includes(craftSaleField)?parseKamas(event.target.value):event.target.value;emit();}
  const inventoryAdjustField=event.target.dataset.inventoryAdjustField;if(inventoryAdjustField&&state.modal?.type==='inventory-adjust'){state.modal.draft[inventoryAdjustField]=parseKamas(event.target.value);emit();}
  const completeField=event.target.dataset.craftCompleteField;if(completeField&&state.modal?.type==='complete-craft-project'){state.modal.draft[completeField]=event.target.checked;}
  const salesFilter=event.target.dataset.salesFilter;if(salesFilter){state.salesFilter={...(state.salesFilter||{}),[salesFilter]:event.target.value};emit();}
  const dashboardFilter=event.target.dataset.dashboardFilter;if(dashboardFilter)setDashboardFilters({[dashboardFilter]:event.target.value});
  const globalSalesFilter=event.target.dataset.globalSalesFilter;if(globalSalesFilter)setGlobalSalesFilter({[globalSalesFilter]:event.target.value});
  const globalDashboardFilter=event.target.dataset.globalDashboardFilter;if(globalDashboardFilter)setGlobalFilters({[globalDashboardFilter]:event.target.value});
  const inventoryFilter=event.target.dataset.inventoryFilter;if(inventoryFilter)setInventoryFilter({[inventoryFilter]:event.target.value});
  const consentField=event.target.dataset.consentField;if(consentField&&state.modal?.type==='consent')state.modal.draft={...state.modal.draft,[consentField]:event.target.checked};
});

app.addEventListener('input',event=>{
  if(event.target.matches('[data-resource-picker-search]')&&state.simulationEditor){const editor=state.simulationEditor;editor.resourceQuery=event.target.value;editor.resourceComboOpen=true;editor.selectedResourceId='';editor.resourceDraft={...(editor.resourceDraft||{}),xp:0,custom:false};updatePetResourceListDom();return;}
  const field=event.target.dataset.field;if(field==='creatureQuery'&&state.simulationEditor){state.simulationEditor.creatureQuery=event.target.value;state.simulationEditor.comboOpen=true;updatePetCreatureListDom();return;}if(field&&state.simulationEditor){updateEditorField(field,event.target.value,false);return;}
  const resourceField=event.target.dataset.resourceField;if(resourceField&&state.simulationEditor){const line=state.simulationEditor.simulation.resourceLines.find(x=>x.id===event.target.dataset.id);if(line){if(resourceField==='quantity')line.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));else if(resourceField==='unitPrice')line.unitPrice=parseKamas(event.target.value);else if(resourceField==='customXp'){line.customXp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);line.xpUnit=line.customXp;line.xpSource='manual';rememberResourceXp(line,line.customXp);}return;}}
  const resourceDraftField=event.target.dataset.resourceDraft;if(resourceDraftField&&state.simulationEditor){const draft=state.simulationEditor.resourceDraft||(state.simulationEditor.resourceDraft={xp:0,quantity:1,unitPrice:0,custom:false});if(resourceDraftField==='xp')draft.xp=Math.max(0,Number(String(event.target.value).replace(',','.'))||0);else if(resourceDraftField==='quantity')draft.quantity=Math.max(1,Math.trunc(Number(event.target.value)||1));else if(resourceDraftField==='unitPrice')draft.unitPrice=parseKamas(event.target.value);return;}
  const saleField=event.target.dataset.saleField;if(saleField&&state.modal?.type==='register-sale'){state.modal.draft[saleField]=['originCost','upCost','salePrice'].includes(saleField)?parseKamas(event.target.value):event.target.value;return;}
  if(event.target.matches('[data-craft-item-search]')&&state.craftEditor){state.craftEditor.itemQuery=event.target.value;state.craftEditor.searchOpen=true;scheduleCraftSearch(event.target.value);return;}
  const craftField=event.target.dataset.craftField;if(craftField){updateCraftField(craftField,event.target.value,false);return;}
  const ingredientField=event.target.dataset.craftIngredientField;if(ingredientField&&state.craftEditor){const line=state.craftEditor.project.ingredients.find(item=>item.id===event.target.dataset.id);if(line){if(['unitMarketPrice','useStockQuantity'].includes(ingredientField))line[ingredientField]=parseKamas(event.target.value);else line[ingredientField]=event.target.value;}return;}
  const craftSaleField=event.target.dataset.craftSaleField;if(craftSaleField&&state.modal?.type==='register-craft-sale'){state.modal.draft[craftSaleField]=['quantity','unitSalePrice','otherCosts'].includes(craftSaleField)?parseKamas(event.target.value):event.target.value;return;}
  const inventoryAdjustField=event.target.dataset.inventoryAdjustField;if(inventoryAdjustField&&state.modal?.type==='inventory-adjust'){state.modal.draft[inventoryAdjustField]=parseKamas(event.target.value);return;}
  const globalSalesFilter=event.target.dataset.globalSalesFilter;if(globalSalesFilter==='search'){state.globalSalesFilter.search=event.target.value;return;}
  const inventoryFilter=event.target.dataset.inventoryFilter;if(inventoryFilter==='search'){state.inventoryFilter.search=event.target.value;return;}
  const filter=event.target.dataset.salesFilter;if(filter==='search'){state.salesFilter={...(state.salesFilter||{}),search:event.target.value};return;}
});

app.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&state.modal){closeModal();return;}
  if(state.modal&&event.key==='Tab'){const modal=app.querySelector('.modal');const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')];if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
  if(event.target.matches('[data-field="creatureQuery"]')&&event.key==='ArrowDown'){event.preventDefault();app.querySelector('#creature-options .combobox-option')?.focus();return;}
  if(event.target.matches('[data-resource-picker-search]')&&event.key==='ArrowDown'){event.preventDefault();app.querySelector('#resource-options .combobox-option')?.focus();return;}
  if(event.target.matches('[data-craft-item-search]')&&event.key==='ArrowDown'){event.preventDefault();app.querySelector('#craft-item-options .combobox-option')?.focus();return;}
  if(event.target.matches('.combobox-option')){const list=event.target.closest('[role="listbox"]');if(!list)return;const options=[...list.querySelectorAll('.combobox-option')],index=options.indexOf(event.target);if(event.key==='ArrowDown'){event.preventDefault();options[(index+1)%options.length]?.focus();}if(event.key==='ArrowUp'){event.preventDefault();options[(index-1+options.length)%options.length]?.focus();}}
});

const initialHash=location.hash.replace('#','');
if(initialHash==='como-funciona')requestAnimationFrame(()=>openInformation('how'));
