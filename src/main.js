import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';
import './styles/ux.css';

import { APP_VERSION, BAG_ANKAMA_ID, CONSENT_POLICY_VERSION, PIX_KEY, RATION_ANKAMA_ID } from './config/app.js';
import { getCreatureById, getCreatureName } from './data/creatures.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { destroyDashboardCharts, mountDashboardCharts, renderDashboard } from './components/dashboard.js';
import { creatureOptionsMarkup, petSummaryMarkup, renderSimulationEditor, resourceOptionsMarkup } from './components/simulationStepper.js';
import { renderSimulationGallery } from './components/simulationGallery.js';
import { renderSalesHistory } from './components/salesHistory.js';
import { renderModal } from './components/modals.js';
import { renderPageHead } from './components/pageLayout.js';
import { renderHomeHub } from './components/homeHub.js';
import { renderGlobalSales } from './components/globalSales.js';
import { renderGlobalInventory } from './components/globalInventory.js';
import { renderLoginPage, renderRegisterPage, renderForgotPasswordPage, renderVerifyEmailPage, renderResetPasswordPage, renderAccountSettingsPage } from './components/accountPages.js';
import { adSlot, escapeHtml, icon, imageTag, t } from './components/common.js';
import { renderCraftsHome } from './modules/crafts/components/craftsHome.js';
import { renderCraftProjectEditor } from './modules/crafts/components/craftProjectEditor.js';
import { renderCraftInventory } from './modules/crafts/components/craftInventory.js';
import { renderCraftSales } from './modules/crafts/components/craftSales.js';
import {
  state, subscribe, emit, setLanguage, setSimulations, setSales, setConsent, setDashboardFilters,
  setGlobalFilters, setGlobalSalesFilter, setInventoryFilter, setResourceCatalog, setCraftProjects,
  setCraftBatches, setCraftInventory, setCraftSales, setActivities, openModal, closeModal, showToast,
  setAccount, setAccountUi, setServers, setCommunityPrices
} from './state/store.js';
import { normalizeSimulation, normalizeSale } from './services/storageService.js';
import {
  normalizeCraftProject, normalizeIngredient, normalizeCraftBatch, normalizeInventoryItem,
  normalizeCraftSale, normalizeActivity
} from './modules/crafts/services/craftStorageService.js';
import { cancelSaleSync, syncSale } from './services/salesService.js';
import { applyConsent } from './services/consentService.js';
import { findResourceCatalogItem, getEmbeddedResourceCatalog, loadDofusDudeResourceCatalog } from './services/resourceCatalogService.js';
import { getRememberedResourceXp, rememberResourceXp } from './services/resourceXpMemoryService.js';
import { calculateSimulation, calculateSaleProfit } from './utils/calculations.js';
import { calculateCraftProject, calculateCraftSale, mergeInventory } from './modules/crafts/utils/craftCalculations.js';
import { collectAncestorAnkamaIds, findIngredientById, flattenCalculatedIngredients } from './modules/crafts/utils/craftRecipeTree.js';
import { searchCraftItems, fetchCraftItemDetails } from './modules/crafts/services/dofusDudeCraftService.js';
import { parseKamas, formatNumber } from './utils/currency.js';
import { createId, nowIso, toIsoLocalDateTime } from './utils/identifiers.js';
import { validateSimulation } from './utils/validation.js';
import { petCreature, renderBuilderPage } from './modules/builder/builderPage.js';
import { banItem, deleteSaved, loadBreeds, loadGear, openSaved, rebuildWithOptions, saveCurrent, sendBuilderMessage, setBuilderOption, setForge, startOver, swapItem, toggleLock, updateSaved } from './modules/builder/builderController.js';
import { forgeLimit, itemName, UNIQUE_EXOS } from './modules/builder/gearSchema.js';
import { renderResourceExplorer } from './modules/pets/resourceExplorer.js';
import { AUTO_FOOD, BAG, RATION, foodAnkamaId, foodId, methodForPlan, normalizeAmount, normalizeFood, planResourceLines } from './modules/pets/petPlan.js';
import { ALL_FEED_IDS, applyPetCommunityPrices, emptyPetCommunity, getFoodPrice, setFoodPrice, simulationAnkamaIds } from './modules/pets/petCommunity.js';
import { loadPetPrices, savePetPrices } from './modules/pets/petPriceMemory.js';
import { createBackup, parseBackup, restoreBackup } from './services/backupService.js';
import { installRouter, navigatePath, navigateTo } from './router/router.js';
import { captureFocusSnapshot, restoreFocusSnapshot } from './utils/focusPreservation.js';
import { captureScrollSnapshot, restoreScrollSnapshot } from './utils/scrollPreservation.js';
import { accountApi } from './services/accountApiService.js';
import { clearAccountSession, saveAccountSession, updateStoredAccountUser } from './services/accountSessionService.js';
import { isAccountApiConfigured } from './config/accountApi.js';
import { applyCommunityPrices, collectDirtyIngredientPrices, collectRecipeAnkamaIds, findIngredientRecursive, markIngredientPriceEdited, setPriceSyncStatus } from './services/communityPriceService.js';

const app = document.querySelector('#app');
const pendingRoute = (() => { try { const value = sessionStorage.getItem('d4b_pending_route'); if (value) sessionStorage.removeItem('d4b_pending_route'); return value; } catch { return null; } })();
if (pendingRoute && pendingRoute.startsWith('/')) history.replaceState(null, '', pendingRoute);

let explorerTimer = null;
let craftSearchTimer = null;
let craftSearchController = null;
let lastRenderedRoutePath = null;

function newSimulation(base = {}) {
  const server = activeServerFor();
  const remembered = {};
  if (base.marketFoodPrice === undefined && state.petPrices.ration) remembered[RATION] = 'memory';
  if (base.bagPrice === undefined && state.petPrices.bag) remembered[BAG] = 'memory';
  const hasTarget = Object.prototype.hasOwnProperty.call(base, 'targetLevel');
  return normalizeSimulation({
    id: base.id || createId('simulation'), name: base.name || '', creatureType: base.creatureType || 'Mascote',
    creatureId: base.creatureId || '', creatureCanonicalName: base.creatureCanonicalName || '',
    creatureImageUrl: base.creatureImageUrl || '/assets/placeholders/creature-fallback.svg',
    originLevel: base.originLevel ?? 0, currentXp: base.currentXp ?? 0, xpBonusPercent: base.xpBonusPercent ?? 0,
    targetLevel: hasTarget ? base.targetLevel : 100, upMethod: base.upMethod ?? '', mainFood: base.mainFood ?? (base.upMethod ? '' : AUTO_FOOD), foods: structuredClone(base.foods || []), amounts: structuredClone(base.amounts || {}), priceSources: { ...remembered, ...(base.priceSources || {}) },
    serverId: base.serverId || state.account?.user?.serverId || '', serverNameSnapshot: base.serverNameSnapshot || server?.name || '',
    marketFoodPrice: base.marketFoodPrice ?? state.petPrices.ration, bagPrice: base.bagPrice ?? state.petPrices.bag, combinedRationSource: base.combinedRationSource || 'vitaminizedFood',
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
  return { mode, simulation:copy, errors:{}, creatureQuery:'', resourceQuery:'', resourceComboOpen:false, comboOpen:false };
}

function openEditor(simulation, mode = 'new', { navigate = true } = {}) {
  state.simulationEditor = createEditorState(simulation, mode);
  if (navigate) navigateTo(mode === 'new' || mode === 'duplicate' ? 'pet-simulation-new' : 'pet-simulation-edit', mode === 'edit' ? { id: simulation.id } : {});
  else emit();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function newCraftProject(base = {}) {
  const activeServer = state.account?.selectedServer || (state.servers||[]).find(server=>String(server.id)===String(state.account?.user?.serverId));
  return normalizeCraftProject({
    id: base.id || createId('craft-project'), status: base.status || 'draft', desiredQuantity: base.desiredQuantity || 1,
    ingredients: base.ingredients || [], saleChannel: base.saleChannel || 'HDV', costingMethod: 'simple',
    serverId: base.serverId || activeServer?.id || state.account?.user?.serverId || '',
    serverNameSnapshot: base.serverNameSnapshot || activeServer?.name || '',
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
  if (state.account?.user) queueMicrotask(() => refreshCommunityPrices());
}

function generateSimulationName(sim) {
  const creature = getCreatureById(sim.creatureId);
  return sim.name.trim() || `${creature?.canonicalName || sim.creatureCanonicalName} — ${sim.originLevel} → ${sim.targetLevel}`;
}

function renderPetSimulationsPage() {
  return `<section class="stack">${renderPageHead(state,{title:t(state,'v3.modules.pets.title'),tabs:'pets',actions:`<button class="button primary" data-action="new-simulation">${icon('plus',17)} ${escapeHtml(t(state,'home.newSimulation'))}</button>`})}${renderSimulationGallery(state)}</section>`;
}

function renderSettingsPage() {
  return `<section class="stack"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.nav.settings'))}</span><h1>${escapeHtml(t(state,'v3.nav.settings'))}</h1></div></div><article class="card section stack-tight"><h2>${escapeHtml(t(state,'backup.title'))}</h2><p class="muted">${escapeHtml(t(state,'backup.help'))}</p><div class="button-row"><button class="button primary" data-action="backup-export">${escapeHtml(t(state,'backup.export'))}</button><label class="button secondary backup-import">${escapeHtml(t(state,'backup.import'))}<input class="visually-hidden" type="file" accept="application/json,.json" data-backup-import></label></div></article><article class="card section button-row"><button class="button secondary" data-action="open-consent">${escapeHtml(t(state,'footer.privacyPreferences'))}</button><button class="button secondary" data-action="open-information" data-section="about">${escapeHtml(t(state,'footer.transparency'))}</button></article></section>`;
}

function renderView() {
  const route = state.route?.name || 'home';
  if (route === 'home') return renderHomeHub(state);
  if (route === 'pets') return renderDashboard(state);
  if (route === 'pet-simulations') return renderPetSimulationsPage();
  if (route === 'pet-resources') return renderResourceExplorer(state);
  if (route === 'pet-sales') return renderSalesHistory(state);
  if ((route === 'pet-simulation-new' || route === 'pet-simulation-edit') && state.simulationEditor) return renderSimulationEditor(state);
  if (route === 'crafts' || route === 'craft-projects') return renderCraftsHome(state);
  if ((route === 'craft-project-new' || route === 'craft-project-edit') && state.craftEditor) return renderCraftProjectEditor(state);
  if (route === 'craft-inventory') return renderCraftInventory(state);
  if (route === 'craft-sales') return renderCraftSales(state);
  if (route === 'global-sales') return renderGlobalSales(state);
  if (route === 'global-inventory') return renderGlobalInventory(state);
  if (route === 'builder') return renderBuilderPage(state);
  if (route === 'settings') return renderSettingsPage();
  if (route === 'login') return renderLoginPage(state);
  if (route === 'register') return renderRegisterPage(state);
  if (route === 'forgot-password') return renderForgotPasswordPage(state);
  if (route === 'verify-email') return renderVerifyEmailPage(state);
  if (route === 'reset-password') return renderResetPasswordPage(state);
  if (route === 'account-settings') return renderAccountSettingsPage(state);
  return renderHomeHub(state);
}

function renderCookieBanner() {
  if (state.consent?.decidedAt) return '';
  return `<aside class="cookie-banner" aria-label="${escapeHtml(t(state,'consent.title'))}"><div><strong>${escapeHtml(t(state,'consent.title'))}</strong><p class="small">${escapeHtml(t(state,'consent.text'))}</p></div><div class="cookie-actions"><button class="button secondary compact" data-action="consent-reject">${escapeHtml(t(state,'consent.reject'))}</button><button class="button secondary compact" data-action="open-consent">${escapeHtml(t(state,'consent.configure'))}</button><button class="button primary compact" data-action="consent-accept">${escapeHtml(t(state,'consent.acceptAll'))}</button></div></aside>`;
}

// Se um campo é confirmado ao clicar em um botão, recriar a tela entre o "pressionar" e o "soltar"
// faria o clique se perder. Nesse intervalo a renderização espera.
let pointerHeld = false;
let renderPending = false;
function releasePointer() {
  if (!pointerHeld) return;
  pointerHeld = false;
  if (renderPending) { renderPending = false; render(); }
}
app.addEventListener('pointerdown', event => {
  if (!event.target.closest('button,summary,label,a')) return;
  pointerHeld = true;
  window.setTimeout(releasePointer, 700);
}, true);
['pointerup', 'pointercancel'].forEach(name => window.addEventListener(name, () => window.setTimeout(releasePointer, 30), true));

function render() {
  if (pointerHeld) { renderPending = true; return; }
  const focusSnapshot = captureFocusSnapshot(app);
  const preserveScroll = lastRenderedRoutePath === state.route?.path;
  const scrollSnapshot = captureScrollSnapshot(app);
  destroyDashboardCharts();
  document.documentElement.lang = state.language;
  document.title = `Dofus4Business v${APP_VERSION}`;
  const editorRoute = ['pet-simulation-new','pet-simulation-edit','craft-project-new','craft-project-edit'].includes(state.route?.name);
  const sidebarAd = adSlot('ad-slot-sidebar','sidebar-ad',state);
  app.innerHTML = `<div class="app-shell">${renderHeader(state)}<div class="container">${adSlot('ad-slot-header','header-ad',state)}</div><main id="main-content" class="main"><div class="container">${editorRoute&&sidebarAd?`<div class="page-grid"><div>${renderView()}</div><aside class="sidebar sticky">${sidebarAd}</aside></div>`:editorRoute?`<div class="editor-wide">${renderView()}</div>`:renderView()}</div></main>${renderFooter(state)}${renderModal(state)}${state.toast?`<div class="toast ${state.toast.tone==='error'?'error':''}" role="status">${escapeHtml(state.toast.message)}</div>`:''}${renderCookieBanner()}</div>`;
  if (lastRenderedRoutePath !== null && !preserveScroll) window.scrollTo({ top: 0, behavior: 'instant' });
  lastRenderedRoutePath = state.route?.path || null;
  requestAnimationFrame(() => {
    const shouldFocusModal = state.modal && !focusSnapshot?.inModal;
    if (shouldFocusModal) app.querySelector('.modal button,.modal input,.modal select')?.focus();
    else restoreFocusSnapshot(app, focusSnapshot);
    if (preserveScroll) restoreScrollSnapshot(app, scrollSnapshot);
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
      if (project && state.account?.user) queueMicrotask(() => refreshCommunityPrices());
      if (!project) { showToast(t(state,'common.noResults'),'error'); navigateTo('craft-projects',{}, { replace:true }); return; }
    }
  }
  if (!route.name.startsWith('craft-project-')) state.craftEditor = null;
  if (route.name === 'verify-email' && state.accountUi.verificationStatus === 'idle') {
    const token = new URLSearchParams(globalThis.location?.search || '').get('token') || '';
    state.accountUi.verificationStatus = token ? 'loading' : 'error';
    state.accountUi.verificationMessage = token ? '' : t(state,'v310.account.verificationFailed');
    if (token) queueMicrotask(() => verifyEmailToken(token));
  }
  if (route.name === 'builder') void ensureGear();
  if (state.simulationEditor || route.name === 'pet-resources') queueMicrotask(() => refreshPetCommunity());
  if (route.name === 'account-settings' && state.account?.user) {
    state.accountUi.settings = {
      displayName: state.account.user.displayName || '',
      serverId: state.account.user.serverId || '',
      priceMode: state.account.user.priceMode || 'COMUNIDADE'
    };
  }
  emit();
}


async function ensureGear() {
  const builder = state.builder;
  if (builder.gear || builder.status === 'loading') return;
  builder.status = 'loading';
  try { [builder.gear, builder.breeds] = await Promise.all([loadGear(), loadBreeds().catch(() => [])]); builder.status = 'ready'; } catch { builder.status = 'error'; }
  emit();
  scrollBuilderLog();
}

function scrollBuilderLog() {
  requestAnimationFrame(() => requestAnimationFrame(() => { const log = app.querySelector('[data-builder-log]'); if (log) log.scrollTop = log.scrollHeight; }));
}

const emitBuilder = () => { emit(); scrollBuilderLog(); };

function handleBuilderAction(action, button) {
  const id = Number(button.dataset.id), index = Number(button.dataset.index), builder = state.builder;
  if (action === 'builder-send') void sendBuilderMessage(state, button.dataset.text, emitBuilder);
  else if (action === 'builder-reload') { void ensureGear(); emit(); }
  else if (action === 'builder-save') { saveCurrent(state); showToast(t(state, 'builder.saved')); }
  else if (action === 'builder-update') { if (updateSaved(state)) showToast(t(state, 'builder.saved')); }
  else if (action === 'builder-open') { openSaved(state, button.dataset.id); emit(); }
  else if (action === 'builder-delete') { deleteSaved(state, button.dataset.id); emit(); }
  else if (action === 'builder-lock') { toggleLock(state, id); emit(); }
  else if (action === 'builder-select') { builder.selected = builder.selected === index ? null : index; builder.showSwaps = false; builder.forging = false; builder.swapQuery = ''; builder.swapStat = ''; emit(); if (builder.selected !== null && window.innerWidth < 900) requestAnimationFrame(() => requestAnimationFrame(() => app.querySelector('.panel')?.scrollIntoView({ block: 'start' }))); }
  else if (action === 'builder-tab') { builder.tab = button.dataset.field; emit(); }
  else if (action === 'builder-forge-mode') { builder.forging = !builder.forging; emit(); }
  else if (action === 'builder-swap') { builder.showSwaps = !builder.showSwaps; emit(); }
  else if (action === 'builder-new') { startOver(state); emitBuilder(); }
  else if (action === 'builder-build') void rebuildWithOptions(state, emitBuilder);
  else if (action === 'builder-pick-breed') { builder.pickBreed = !builder.pickBreed; emit(); }
  else if (action === 'builder-option') { setBuilderOption(state, button.dataset.field, button.dataset.value); if (button.dataset.field === 'breed') builder.pickBreed = false; emit(); }
  else if (action === 'builder-forge-clear') { setForge(state, id, button.dataset.field, null); emit(); }
  else if (action === 'builder-use') { swapItem(state, index, id); emit(); }
  else if (action === 'builder-ban') void banItem(state, id, emitBuilder);
  else if (action === 'builder-pet') {
    const creature = petCreature(builder.gear.item(id));
    if (creature) openEditor(newSimulation({ creatureId: creature.id, creatureType: creature.type }), 'new');
  } else if (action === 'builder-craft') {
    const item = builder.gear?.item(id);
    if (!item) return;
    openCraftEditor(newCraftProject(), 'new');
    state.craftSearch = { query: '', status: 'idle', error: null, results: [{ ankamaId: id, name: itemName(item, state.language), category: 'equipment' }] };
    void selectCraftItem(id);
  }
}

function accountErrorMessage(error) {
  return String(error?.message || t(state,'common.noResults'));
}

function activeServerFor(user = state.account?.user) {
  const id = user?.serverId || '';
  return (state.servers || []).find(server => String(server.id) === String(id)) || null;
}

function applyAccountUser(user, patch = {}) {
  const selectedServer = activeServerFor(user);
  state.account = {
    ...state.account,
    ...patch,
    status: user ? 'authenticated' : 'anonymous',
    user: user || null,
    selectedServer
  };
  syncPetServer();
  if (user) {
    state.accountUi.settings = {
      displayName: user.displayName || '',
      serverId: user.serverId || '',
      priceMode: user.priceMode || 'COMUNIDADE'
    };
  }
}

async function loadAccountServers() {
  if (!isAccountApiConfigured()) return [];
  try {
    const data = await accountApi.listarServidores();
    const servers = Array.isArray(data.servers) ? data.servers : [];
    state.servers = servers;
    state.account.selectedServer = activeServerFor();
    const editing = state.simulationEditor?.simulation;
    if (editing?.serverId && !editing.serverNameSnapshot) editing.serverNameSnapshot = servers.find(server => String(server.id) === String(editing.serverId))?.name || '';
    emit();
    return servers;
  } catch {
    return [];
  }
}

async function restoreAccountSession() {
  if (!state.account?.sessionToken || !isAccountApiConfigured()) {
    state.account.status = 'anonymous';
    emit();
    return false;
  }
  try {
    const data = await accountApi.validarSessao(state.account.sessionToken);
    applyAccountUser(data.user, { expiresAt: data.expiresAt || state.account.expiresAt });
    saveAccountSession({
      sessionToken: state.account.sessionToken,
      expiresAt: data.expiresAt || state.account.expiresAt,
      rememberConnected: state.account.rememberConnected,
      user: data.user
    });
    emit();
    void refreshPetCommunity();
    return true;
  } catch {
    clearAccountSession();
    applyAccountUser(null, { sessionToken: '', expiresAt: null, rememberConnected: false });
    emit();
    return false;
  }
}

async function refreshCommunityPrices({ overwriteManual = false } = {}) {
  const project = state.craftEditor?.project;
  const token = state.account?.sessionToken;
  const serverId = project?.serverId || state.account?.user?.serverId;
  const ankamaIds = collectRecipeAnkamaIds(project?.ingredients || []);
  if (!project || !token || !serverId || !ankamaIds.length || !isAccountApiConfigured()) return false;
  state.communityPriceStatus = 'loading';
  emit();
  try {
    const data = await accountApi.consultarPrecosEmLote({
      sessionToken: token,
      serverId,
      priceMode: state.account.user?.priceMode || 'COMUNIDADE',
      ankamaIds
    });
    state.communityPrices = data.prices || {};
    state.communityPriceStatus = 'ready';
    applyCommunityPrices(project.ingredients, data.prices || {}, { overwriteManual });
    emit();
    return true;
  } catch (error) {
    state.communityPriceStatus = 'error';
    showToast(accountErrorMessage(error),'error');
    return false;
  }
}

function pricePayloadFor(line, project, origin = 'CRAFT') {
  return {
    ankamaId: line.ankamaId,
    itemNameSnapshot: line.nameSnapshot,
    itemCategory: line.typeSnapshot || '',
    quantity: 1,
    totalPrice: Number(line.unitMarketPrice) || 0,
    origin,
    projectId: project.id
  };
}

async function publishIngredientPrice(line) {
  const project = state.craftEditor?.project;
  const token = state.account?.sessionToken;
  const serverId = project?.serverId || state.account?.user?.serverId;
  if (!line?.priceDirty || !project || !token || !serverId || Number(line.unitMarketPrice) <= 0 || !isAccountApiConfigured()) return false;
  setPriceSyncStatus([line],'saving');
  emit();
  try {
    const data = await accountApi.registrarPrecosEmLote({
      sessionToken: token,
      serverId,
      siteVersion: APP_VERSION,
      prices: [pricePayloadFor(line, project, 'CRAFT')]
    });
    setPriceSyncStatus([line],'saved',data.registered || []);
    emit();
    return true;
  } catch (error) {
    setPriceSyncStatus([line],'error');
    emit();
    showToast(accountErrorMessage(error),'error');
    return false;
  }
}

async function flushDirtyIngredientPrices() {
  const project = state.craftEditor?.project;
  const lines = collectDirtyIngredientPrices(project?.ingredients || []);
  const token = state.account?.sessionToken;
  const serverId = project?.serverId || state.account?.user?.serverId;
  if (!lines.length || !project || !token || !serverId || !isAccountApiConfigured()) return true;
  setPriceSyncStatus(lines,'saving');
  emit();
  try {
    const data = await accountApi.registrarPrecosEmLote({
      sessionToken: token,
      serverId,
      siteVersion: APP_VERSION,
      prices: lines.map(line => pricePayloadFor(line,project,'CRAFT'))
    });
    setPriceSyncStatus(lines,'saved',data.registered || []);
    emit();
    return true;
  } catch (error) {
    setPriceSyncStatus(lines,'error');
    emit();
    showToast(accountErrorMessage(error),'error');
    return false;
  }
}

async function verifyEmailToken(token) {
  try {
    await accountApi.verificarEmail(token);
    state.accountUi.verificationStatus = 'success';
    state.accountUi.verificationMessage = '';
  } catch (error) {
    state.accountUi.verificationStatus = 'error';
    state.accountUi.verificationMessage = accountErrorMessage(error);
  }
  emit();
}

async function initializeAccounts() {
  state.account.apiConfigured = isAccountApiConfigured();
  await loadAccountServers();
  await restoreAccountSession();
}

applyConsent(state.consent);
subscribe(render);
installRouter(hydrateRoute);
void initializeAccounts();

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
  if (shouldRender && field === 'originLevel' && sim.originLevel >= sim.targetLevel) sim.targetLevel = Math.min(100, sim.originLevel + 1);
  ed.errors = {};
  if (shouldRender) emit(); else refreshPetSummary();
}

function refreshPetSummary() {
  const summary = app.querySelector('[data-pet-summary]');
  if (summary && state.simulationEditor) summary.innerHTML = petSummaryMarkup(state);
}

function rememberPetPrice(key, price) {
  if (key === 'ration' || key === 'bag') state.petPrices[key] = price;
  else if (price > 0) state.petPrices.resources[key] = price;
  else delete state.petPrices.resources[key];
  savePetPrices(state.petPrices, state.account?.user?.serverId || '');
}

function addFood(item, patch = {}) {
  const foods = state.simulationEditor.simulation.foods;
  const food = normalizeFood({ id: foodId(item), ankamaId: item.ankamaId, name: item.name, imageUrl: item.imageUrl, xp: item.xp, price: state.petPrices.resources[item.ankamaId] || 0, ...patch });
  if (food.id === RATION || foods.some(row => row.id === food.id)) return;
  foods.push(food);
  if (food.price) state.simulationEditor.simulation.priceSources[food.id] = 'memory';
  applyPetCommunityPrices(state.simulationEditor.simulation, petCommunityFor(state.simulationEditor.simulation));
  if (food.ankamaId != null && !petCommunityFor(state.simulationEditor.simulation)[food.ankamaId]) void refreshPetCommunity();
}

function updateFood(target) {
  const sim = state.simulationEditor?.simulation;
  if (!sim) return;
  const { id, foodField: field } = target.dataset;
  if (field === 'xp') {
    const food = sim.foods.find(row => row.id === id);
    if (!food) return;
    food.xp = Math.max(0, Number(String(target.value).replace(',', '.')) || 0);
    rememberResourceXp(food, food.xp);
  } else if (field === 'price') {
    setFoodPrice(sim, id, parseKamas(target.value), 'manual');
    rememberFoodPrice(foodAnkamaId(sim, id), getFoodPrice(sim, id));
  } else if (field === 'owned' || field === 'buy') {
    const raw = String(target.value).replace(/\D/g, '');
    const amounts = { ...(sim.amounts[id] || {}), [field]: field === 'buy' && raw === '' ? null : raw };
    sim.amounts = { ...sim.amounts, [id]: normalizeAmount(amounts) };
    if (field === 'buy' && raw !== '' && sim.mainFood === id) sim.mainFood = AUTO_FOOD;
  }
}

function rememberFoodPrice(ankamaId, price) {
  if (ankamaId == null) return;
  const id = Number(ankamaId);
  rememberPetPrice(id === RATION_ANKAMA_ID ? 'ration' : id === BAG_ANKAMA_ID ? 'bag' : String(id), price);
}

// Preços da comunidade só valem para o servidor em que foram consultados.
function petCommunityFor(sim) {
  const serverId = sim?.serverId || state.account?.user?.serverId || '';
  return String(serverId) === String(state.petCommunity.serverId) ? state.petCommunity.prices : {};
}

let petServerId = state.account?.user?.serverId || '';
function syncPetServer() {
  const serverId = state.account?.user?.serverId || '';
  if (serverId === petServerId) return;
  petServerId = serverId;
  state.petPrices = loadPetPrices(serverId);
  state.petCommunity = emptyPetCommunity(serverId);
}

function petQueryContext() {
  const token = state.account?.sessionToken;
  const serverId = state.simulationEditor?.simulation.serverId || state.account?.user?.serverId;
  return token && serverId && state.account?.user && isAccountApiConfigured() ? { token, serverId: String(serverId) } : null;
}

function usePetCommunity(serverId) {
  if (String(state.petCommunity.serverId) !== serverId) state.petCommunity = emptyPetCommunity(serverId);
  return state.petCommunity;
}

async function queryPetPrices({ token, serverId }, ankamaIds) {
  const data = await accountApi.consultarPrecosEmLote({ sessionToken: token, serverId, priceMode: state.account.user?.priceMode || 'COMUNIDADE', ankamaIds: ankamaIds.map(String) });
  return data.prices || {};
}

async function refreshPetCommunity({ notify = false } = {}) {
  const sim = state.simulationEditor?.simulation;
  const onPage = sim || state.route?.name === 'pet-resources';
  if (onPage && sim && !sim.serverId && state.account?.user?.serverId) {
    sim.serverId = String(state.account.user.serverId);
    sim.serverNameSnapshot = activeServerFor()?.name || '';
  }
  const context = petQueryContext();
  if (!onPage || !context) return false;
  const community = usePetCommunity(context.serverId);
  community.status = 'loading';
  try {
    const prices = await queryPetPrices(context, sim ? simulationAnkamaIds(sim) : [RATION_ANKAMA_ID, BAG_ANKAMA_ID]);
    Object.assign(community.prices, prices);
    community.status = 'ready';
    const current = state.simulationEditor?.simulation;
    if (current) applyPetCommunityPrices(current, petCommunityFor(current));
    emit();
    return true;
  } catch (error) {
    community.status = 'error';
    emit();
    if (notify) showToast(accountErrorMessage(error), 'error');
    return false;
  }
}

// Consulta sob demanda de todos os alimentos. O lote diminui se o serviço recusar o tamanho.
async function scanPetCommunity() {
  const context = petQueryContext();
  if (!context) { navigateTo('login'); return; }
  const community = usePetCommunity(context.serverId);
  if (community.scan === 'loading') return;
  community.scan = 'loading'; community.progress = 0;
  emit();
  let size = 250;
  for (let start = 0; start < ALL_FEED_IDS.length;) {
    try {
      Object.assign(community.prices, await queryPetPrices(context, ALL_FEED_IDS.slice(start, start + size)));
      start += size;
      community.progress = Math.min(100, Math.round(start / ALL_FEED_IDS.length * 100));
      const label = app.querySelector('[data-scan-progress]');
      if (label) label.textContent = `${community.progress}%`;
    } catch (error) {
      if (error?.code === 'NETWORK_ERROR' || size <= 50) {
        community.scan = 'error'; emit(); showToast(accountErrorMessage(error), 'error');
        return;
      }
      size = Math.max(50, Math.floor(size / 2));
    }
  }
  community.scan = 'ready';
  const current = state.simulationEditor?.simulation;
  if (current) applyPetCommunityPrices(current, petCommunityFor(current));
  emit();
}

async function publishPetPrice({ ankamaId, name, price, bag = false, projectId = '' }) {
  const context = petQueryContext();
  if (!context || ankamaId == null || !(price > 0)) return false;
  const community = usePetCommunity(context.serverId);
  if (community.prices[ankamaId]?.isOwn && Number(community.prices[ankamaId].unitPrice) === price && !Number(community.prices[ankamaId].ageDays)) return true;
  community.sync[ankamaId] = 'saving';
  emit();
  const send = origin => accountApi.registrarPrecosEmLote({
    sessionToken: context.token, serverId: context.serverId, siteVersion: APP_VERSION,
    prices: [{ ankamaId, itemNameSnapshot: name, itemCategory: bag ? 'Consumível' : 'Recurso', quantity: 1, totalPrice: price, origin, projectId }]
  });
  try {
    const data = await send('CRAFT');
    const saved = (data.registered || []).find(row => String(row.ankamaId) === String(ankamaId));
    community.prices[ankamaId] = { unitPrice: Number(saved?.unitPrice) || price, registeredAt: saved?.registeredAt || nowIso(), ageDays: 0, freshness: 'FRESH', source: 'COMUNIDADE', isOwn: true };
    community.sync[ankamaId] = 'saved';
    emit();
    return true;
  } catch (error) {
    community.sync[ankamaId] = 'error';
    emit();
    showToast(accountErrorMessage(error), 'error');
    return false;
  }
}

function publishFood(id) {
  const sim = state.simulationEditor?.simulation;
  if (!sim) return;
  const bag = id === BAG;
  const name = id === RATION ? t({ language: 'pt-BR' }, 'simulation.marketFood') : bag ? t({ language: 'pt-BR' }, 'simulation.kolitokenBag') : sim.foods.find(food => food.id === id)?.name || '';
  void publishPetPrice({ ankamaId: foodAnkamaId(sim, id), name, price: getFoodPrice(sim, id), bag, projectId: sim.id });
}

function updateExplorerField(field, value) {
  const numeric = field === 'minXp' || field === 'maxLevel';
  state.petExplorer = { ...state.petExplorer, limit: 40, [field]: numeric ? Math.max(0, Number(String(value).replace(',', '.')) || 0) : value };
}

function exportBackup() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(createBackup(APP_VERSION))], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `dofus4business-${nowIso().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importBackup(file) {
  if (!file) return;
  try {
    const backup = parseBackup(await file.text());
    openModal({ type: 'confirm', title: t(state, 'backup.import'), text: t(state, 'backup.confirm', { date: backup.exportedAt ? new Intl.DateTimeFormat(state.language).format(new Date(backup.exportedAt)) : '—' }), confirmLabel: t(state, 'backup.replace'), confirmAction: 'restore-backup', backup });
  } catch { showToast(t(state, 'backup.invalid'), 'error'); }
}

function updateCraftField(field, rawValue, shouldRender = true) {
  const editor=state.craftEditor;if(!editor)return;const project=editor.project;
  const numeric=new Set(['desiredQuantity','marketUnitPrice','desiredSalePrice','additionalCosts']);
  project[field]=numeric.has(field)?parseKamas(rawValue):rawValue;
  if(field==='desiredQuantity')project.desiredQuantity=Math.max(1,Math.round(Number(rawValue)||1));
  if(!['finalized','cancelled'].includes(project.status))project.status='draft';
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
  list.innerHTML=creatureOptionsMarkup(state,editor);
}

function updatePetResourceListDom() {
  const editor=state.simulationEditor;const list=app.querySelector('#resource-options');if(!editor||!list)return;
  list.innerHTML=resourceOptionsMarkup(state,editor);
}

function craftSearchMarkup() {
  const search=state.craftSearch;
  if(search.status==='loading')return `<div class="combobox-empty">${escapeHtml(t(state,'v3.crafts.filteringCraftable'))}</div>`;
  if(search.error)return `<div class="combobox-empty error-text">${escapeHtml(t(state,'v3.crafts.apiUnavailable'))}</div>`;
  if(!search.results.length)return `<div class="combobox-empty">${escapeHtml(search.query?t(state,'v3.crafts.noCraftableResults'):t(state,'v3.crafts.searchHint'))}</div>`;
  return search.results.map(item=>`<button type="button" class="combobox-option item-option" data-action="select-craft-item" data-id="${item.ankamaId}" data-category="${escapeHtml(item.category)}">${imageTag(item.imageUrl,item.name,'combobox-thumb','/assets/placeholders/item-fallback.svg')}<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(t(state,'simulation.levelShort'))} ${formatNumber(item.level)} · ${formatNumber(item.recipe?.length||0)} ${escapeHtml(t(state,'v3.crafts.ingredients').toLocaleLowerCase())}</small></span></button>`).join('');
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
    try{const results=await searchCraftItems(query,state.language,{limit:30,signal:craftSearchController.signal});state.craftSearch={query,status:'ready',results,error:null};updateCraftSearchListDom();}
    catch(error){if(error?.name==='AbortError')return;state.craftSearch={query,status:'error',results:[],error:String(error?.message||error)};updateCraftSearchListDom();}
  },280);
}

async function selectCraftItem(ankamaId) {
  const editor=state.craftEditor;if(!editor)return;
  const summary=state.craftSearch.results.find(item=>String(item.ankamaId)===String(ankamaId))||{ankamaId};
  editor.itemQuery=summary.name||editor.itemQuery;editor.searchOpen=false;emit();
  try{
    const detail=await fetchCraftItemDetails(summary,state.language);
    if(!detail.recipe?.length){showToast(t(state,'v3.crafts.noRecipe'),'error');return;}
    const quantity=Math.max(1,editor.project.desiredQuantity||1);
    const activeServer=state.account?.selectedServer||activeServerFor();
    editor.project={...editor.project,status:'draft',ankamaId:detail.ankamaId,itemNameSnapshot:detail.name,itemImageSnapshot:detail.imageUrl,itemTypeSnapshot:detail.type,itemLevelSnapshot:detail.level,professionTag:detail.professionTag||'unknown',serverId:editor.project.serverId||activeServer?.id||state.account?.user?.serverId||'',serverNameSnapshot:editor.project.serverNameSnapshot||activeServer?.name||'',ingredients:detail.recipe.map(item=>normalizeIngredient({ankamaId:item.ankamaId,nameSnapshot:item.name,imageSnapshot:item.imageUrl,typeSnapshot:item.type,typeNameIdSnapshot:item.typeNameId,professionTag:item.professionTag||'unknown',isCraftable:item.isCraftable,quantityPerUnit:item.quantity,totalQuantity:item.quantity*quantity,unitMarketPrice:state.craftPrices?.[item.ankamaId]||0,acquisitionMode:'buy'})),updatedAt:nowIso()};
    applyCommunityPrices(editor.project.ingredients,state.communityPrices||{});
    editor.itemQuery=detail.name;emit();
    void refreshCommunityPrices();
  }catch{showToast(t(state,'v3.crafts.apiUnavailable'),'error');}
}

async function loadSubrecipe(ingredientId, { openPlanner=false, pushToStack=false } = {}) {
  const editor=state.craftEditor;const line=findIngredientById(editor?.project.ingredients||[],ingredientId);if(!line?.ankamaId)return false;
  const ancestors=collectAncestorAnkamaIds(editor.project.ingredients,ingredientId)||[];
  if(ancestors.some(id=>String(id)===String(line.ankamaId))){line.subRecipeStatus='error';showToast(t(state,'v3.crafts.recipeCycle'),'error');emit();return false;}
  if(line.subRecipeLoaded&&line.subRecipe?.length){
    if(openPlanner){
      const stack=pushToStack&&state.modal?.type==='craft-recipe-planner'?[...(state.modal.recipeStack||[]),line.id]:[line.id];
      openModal({type:'craft-recipe-planner',ingredientId:stack[0],recipeStack:stack});
    }
    return true;
  }
  line.subRecipeStatus='loading';emit();
  try{
    const detail=await fetchCraftItemDetails({ankamaId:line.ankamaId,type:line.typeSnapshot},state.language);
    line.isCraftable=Boolean(detail.recipe?.length);
    if(!line.isCraftable){line.acquisitionMode='buy';line.subRecipe=[];line.subRecipeLoaded=true;line.subRecipeStatus='idle';line.professionTag='unknown';showToast(t(state,'v3.crafts.notCraftable'),'error');emit();return false;}
    line.professionTag=detail.professionTag||line.professionTag||'unknown';
    line.subRecipe=(detail.recipe||[]).map(item=>normalizeIngredient({ankamaId:item.ankamaId,nameSnapshot:item.name,imageSnapshot:item.imageUrl,typeSnapshot:item.type,typeNameIdSnapshot:item.typeNameId,professionTag:item.isCraftable?(item.professionTag||'unknown'):'unknown',isCraftable:item.isCraftable,quantityPerUnit:item.quantity,totalQuantity:item.quantity,unitMarketPrice:state.craftPrices?.[item.ankamaId]||0,acquisitionMode:'buy'}));
    line.subRecipeLoaded=true;line.subRecipeStatus='ready';
    applyCommunityPrices(line.subRecipe,state.communityPrices||{});
    emit();
    void refreshCommunityPrices();
    if(openPlanner){
      const stack=pushToStack&&state.modal?.type==='craft-recipe-planner'?[...(state.modal.recipeStack||[]),line.id]:[line.id];
      openModal({type:'craft-recipe-planner',ingredientId:stack[0],recipeStack:stack});
    }
    return true;
  } catch { line.subRecipeStatus='error';showToast(t(state,'v3.crafts.apiUnavailable'),'error');emit();return false; }
}

async function saveCraftProject({ stay = false } = {}) {
  const editor=state.craftEditor;if(!editor)return;const project=editor.project;
  if(!project.ankamaId||!project.itemNameSnapshot){showToast(t(state,'v3.crafts.chooseItemFirst'),'error');return;}
  await flushDirtyIngredientPrices();
  const calc=calculateCraftProject(project,state.craftInventory);
  const ready=calc.readiness==='ready';
  const activeServer=state.account?.selectedServer||activeServerFor();
  const saved=normalizeCraftProject({...project,serverId:project.serverId||activeServer?.id||state.account?.user?.serverId||'',serverNameSnapshot:project.serverNameSnapshot||activeServer?.name||'',status:ready?'ready':'draft',totalCost:calc.totalCost,financialCost:calc.totalCost,economicCost:calc.totalCost,accountingCost:calc.totalCost,replacementCost:calc.totalCost,updatedAt:nowIso()});
  const exists=state.craftProjects.some(item=>item.id===saved.id);setCraftProjects(exists?state.craftProjects.map(item=>item.id===saved.id?saved:item):[saved,...state.craftProjects]);addActivity({module:'crafts',action:exists?'craft_project_updated':'craft_project_created',itemName:saved.itemNameSnapshot,itemImage:saved.itemImageSnapshot,entityId:saved.id,route:`/crafts/projetos/${encodeURIComponent(saved.id)}`,value:calc.totalCost});if(stay){editor.project=saved;editor.mode='edit';return saved;}state.craftEditor=null;navigateTo('crafts');showToast(ready?t(state,'v3.crafts.savedAsReady'):t(state,'v3.crafts.savedAsDraft'));
}

function completeCraftProject(projectId, forSale=false) {
  const project=state.craftProjects.find(item=>item.id===projectId);if(!project)return;const calc=calculateCraftProject(project,state.craftInventory);
  if(calc.readiness!=='ready'){showToast(t(state,'v3.crafts.missingPrices',{count:calc.missingPrices.length+calc.missingRecipes.length}),'error');return;}
  const batch=normalizeCraftBatch({projectId:project.id,serverId:project.serverId||'',serverNameSnapshot:project.serverNameSnapshot||'',ankamaId:project.ankamaId,itemNameSnapshot:project.itemNameSnapshot,itemImageSnapshot:project.itemImageSnapshot,itemTypeSnapshot:project.itemTypeSnapshot,professionTag:project.professionTag,producedQuantity:project.desiredQuantity,remainingQuantity:project.desiredQuantity,totalCost:calc.totalCost,financialCost:calc.totalCost,economicCost:calc.totalCost,accountingCost:calc.totalCost,unitCost:Math.round(calc.unitCost),desiredSalePrice:project.desiredSalePrice,status:forSale?'awaiting_sale':'in_stock',createdAt:nowIso()});
  let inventory=[...state.craftInventory];
  const existing=inventory.find(item=>String(item.ankamaId)===String(batch.ankamaId)&&String(item.serverId||'')===String(batch.serverId||''));const merged=normalizeInventoryItem({...mergeInventory(existing,batch),serverId:batch.serverId||'',serverNameSnapshot:batch.serverNameSnapshot||'',id:existing?.id||createId('inventory'),updatedAt:nowIso()});inventory=existing?inventory.map(item=>item.id===existing.id?merged:item):[merged,...inventory];
  const stockUsage=new Map();for(const ingredient of flattenCalculatedIngredients(calc.ingredients)){if(!ingredient.stockUsed||!ingredient.inventoryItemId)continue;const key=String(ingredient.inventoryItemId);stockUsage.set(key,(stockUsage.get(key)||0)+ingredient.stockUsed);}
  inventory=inventory.map(item=>{const used=stockUsage.get(String(item.id))||0;return used?normalizeInventoryItem({...item,quantity:Math.max(0,item.quantity-used),updatedAt:nowIso()}):item;});
  setCraftBatches([batch,...state.craftBatches]);setCraftInventory(inventory);setCraftProjects(state.craftProjects.map(item=>item.id===project.id?normalizeCraftProject({...item,status:'finalized',completedAt:nowIso(),totalCost:calc.totalCost,financialCost:calc.totalCost,economicCost:calc.totalCost,accountingCost:calc.totalCost,updatedAt:nowIso()}):item));addActivity({module:'crafts',action:'craft_completed',itemName:project.itemNameSnapshot,itemImage:project.itemImageSnapshot,entityId:batch.id,route:'/crafts/estoque',value:calc.totalCost});closeModal();navigateTo('crafts');showToast(t(state,'v3.crafts.completeProduction'));
}

function confirmCraftSale() {
  const modal=state.modal;const item=state.craftInventory.find(row=>row.id===modal.inventoryItemId);if(!item)return;const draft=modal.draft;const quantity=Math.max(1,Math.round(Number(draft.quantity)||1));
  if(quantity>item.availableQuantity||Number(draft.unitSalePrice)<=0){showToast(t(state,'toast.invalidStep'),'error');return;}
  const relatedBatches=state.craftBatches.filter(batch=>(item.batchIds||[]).includes(batch.id)&&batch.remainingQuantity>0).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const sourceBatch=relatedBatches[0]||null;
  const calc=calculateCraftSale({...draft,quantity,unitCost:item.weightedUnitCost});
  const sale=normalizeCraftSale({...draft,inventoryItemId:item.id,sourceId:item.id,batchId:sourceBatch?.id||null,projectId:sourceBatch?.projectId||null,ankamaId:item.ankamaId,itemNameSnapshot:item.itemNameSnapshot,itemImageSnapshot:item.itemImageSnapshot,itemTypeSnapshot:item.itemTypeSnapshot,serverId:item.serverId||'',serverNameSnapshot:item.serverNameSnapshot||'',server:draft.server||item.serverNameSnapshot||'',quantity,unitCost:item.weightedUnitCost,...calc,createdAt:nowIso()});
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


function setAccountBusy(busy) {
  state.accountUi.busy = Boolean(busy);
  emit();
}

async function performLogin() {
  const draft=state.accountUi.login||{};
  if (!draft.email || !draft.password) { showToast(t(state,'toast.invalidStep'),'error'); return; }
  setAccountBusy(true);
  try {
    const data=await accountApi.login({
      email:draft.email,
      password:draft.password,
      rememberConnected:Boolean(draft.rememberConnected)
    });
    const session=saveAccountSession(data);
    state.account.sessionToken=session?.sessionToken||data.sessionToken;
    state.account.expiresAt=data.expiresAt||null;
    state.account.rememberConnected=Boolean(data.rememberConnected);
    applyAccountUser(data.user,{sessionToken:state.account.sessionToken,expiresAt:state.account.expiresAt,rememberConnected:state.account.rememberConnected});
    state.accountUi.login={email:'',password:'',rememberConnected:Boolean(data.rememberConnected)};
    state.accountUi.busy=false;
    emit();
    navigateTo('home');
    showToast(data.message||t(state,'v310.account.enter'));
  } catch(error) {
    state.accountUi.busy=false;
    emit();
    showToast(accountErrorMessage(error),'error');
  }
}

async function performRegister() {
  const draft=state.accountUi.register||{};
  if (!draft.displayName || !draft.email || !draft.serverId || !draft.password || draft.password!==draft.confirmPassword) {
    showToast(t(state,'toast.invalidStep'),'error'); return;
  }
  setAccountBusy(true);
  try {
    const data=await accountApi.criarConta({
      displayName:draft.displayName,
      email:draft.email,
      password:draft.password,
      serverId:draft.serverId
    });
    state.accountUi.register={displayName:'',email:'',serverId:'',password:'',confirmPassword:''};
    state.accountUi.busy=false;
    emit();
    navigateTo('login');
    showToast(data.message||t(state,'v310.account.createAccount'));
  } catch(error) {
    state.accountUi.busy=false; emit(); showToast(accountErrorMessage(error),'error');
  }
}

async function performForgotPassword() {
  const email=state.accountUi.forgot?.email||'';
  if (!email) { showToast(t(state,'toast.invalidStep'),'error'); return; }
  setAccountBusy(true);
  try {
    const data=await accountApi.solicitarRecuperacaoSenha(email);
    state.accountUi.busy=false; emit();
    showToast(data.message||t(state,'v310.account.sendRecovery'));
  } catch(error) {
    state.accountUi.busy=false; emit(); showToast(accountErrorMessage(error),'error');
  }
}

async function performResetPassword() {
  const draft=state.accountUi.reset||{};
  const token=new URLSearchParams(globalThis.location?.search||'').get('token')||'';
  if (!token || !draft.password || draft.password!==draft.confirmPassword) { showToast(t(state,'toast.invalidStep'),'error'); return; }
  setAccountBusy(true);
  try {
    const data=await accountApi.redefinirSenha({token,newPassword:draft.password});
    state.accountUi.reset={password:'',confirmPassword:''};
    state.accountUi.busy=false; emit();
    navigateTo('login');
    showToast(data.message||t(state,'v310.account.saveNewPassword'));
  } catch(error) {
    state.accountUi.busy=false; emit(); showToast(accountErrorMessage(error),'error');
  }
}

async function performAccountSettingsSave() {
  const draft=state.accountUi.settings||{};
  if (!state.account?.sessionToken) { navigateTo('login'); return; }
  setAccountBusy(true);
  try {
    const data=await accountApi.atualizarConfiguracoesConta({
      sessionToken:state.account.sessionToken,
      displayName:draft.displayName,
      serverId:draft.serverId,
      priceMode:draft.priceMode
    });
    applyAccountUser(data.user,{});
    updateStoredAccountUser(data.user);
    state.accountUi.busy=false; emit();
    showToast(data.message||t(state,'common.save'));
  } catch(error) {
    state.accountUi.busy=false; emit(); showToast(accountErrorMessage(error),'error');
  }
}

async function performChangePassword() {
  const draft=state.accountUi.changePassword||{};
  if (!draft.currentPassword || !draft.newPassword || draft.newPassword!==draft.confirmPassword) { showToast(t(state,'toast.invalidStep'),'error'); return; }
  setAccountBusy(true);
  try {
    const data=await accountApi.alterarSenha({
      sessionToken:state.account.sessionToken,
      currentPassword:draft.currentPassword,
      newPassword:draft.newPassword
    });
    const session=saveAccountSession({
      sessionToken:data.sessionToken,
      expiresAt:data.expiresAt,
      rememberConnected:data.rememberConnected,
      user:state.account.user
    });
    state.account.sessionToken=session.sessionToken;
    state.account.expiresAt=session.expiresAt;
    state.account.rememberConnected=session.rememberConnected;
    state.accountUi.changePassword={currentPassword:'',newPassword:'',confirmPassword:''};
    state.accountUi.busy=false; emit();
    showToast(data.message||t(state,'v310.account.changePassword'));
  } catch(error) {
    state.accountUi.busy=false; emit(); showToast(accountErrorMessage(error),'error');
  }
}

async function performLogout(all = false) {
  const token=state.account?.sessionToken;
  try {
    if (token && isAccountApiConfigured()) {
      if (all) await accountApi.logoutTodasSessoes(token);
      else await accountApi.logout(token);
    }
  } catch {}
  clearAccountSession();
  applyAccountUser(null,{sessionToken:'',expiresAt:null,rememberConnected:false});
  state.communityPrices={};
  emit();
  navigateTo('home');
}

function handleAction(button) {
  const action=button.dataset.action;if(!action)return;
  if(action.startsWith('builder-')){handleBuilderAction(action,button);return;}
  if(action==='route'){navigateTo(button.dataset.route);return;}
  if(action==='navigate-path'){navigatePath(button.dataset.path);return;}
  if(action==='navigate'){const mapping={dashboard:'pets',simulations:'pet-simulations',sales:'pet-sales'};navigateTo(mapping[button.dataset.view]||'home');return;}
  if(action==='global-module-filter'){setGlobalFilters({module:button.dataset.module});return;}
  if(action==='new-simulation'){openEditor(newSimulation(),'new');return;}
  if(action==='edit-simulation'){closeModal();const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openEditor(sim,'edit');return;}
  if(action==='duplicate-simulation'){closeModal();const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim)openEditor(sim,'duplicate');return;}
  if(action==='exit-editor'){state.simulationEditor=null;navigateTo('pet-simulations');return;}
  if(action==='save-simulation'){const ed=state.simulationEditor,errors=validateSimulation(ed.simulation);if(Object.keys(errors).length){ed.errors=errors;ed.comboOpen=false;showToast(t(state,'toast.invalidStep'),'error');window.setTimeout(()=>app.querySelector('[aria-invalid="true"]')?.scrollIntoView({block:'center'}),80);return;}const calc=calculateSimulation(ed.simulation),creature=getCreatureById(ed.simulation.creatureId);const saved={...ed.simulation,upMethod:methodForPlan(calc.plan),name:generateSimulationName(ed.simulation),creatureType:creature.type,creatureCanonicalName:creature.canonicalName,creatureImageUrl:creature.imageUrl,unassociatedCreature:false,updatedAt:nowIso()};const exists=state.simulations.some(x=>x.id===saved.id);setSimulations(exists?state.simulations.map(x=>x.id===saved.id?saved:x):[saved,...state.simulations]);state.simulationEditor=null;navigateTo('pet-simulations');showToast(exists?t(state,'toast.simulationUpdated'):t(state,'toast.simulationSaved'));return;}  if(action==='select-creature'){const ed=state.simulationEditor,c=getCreatureById(button.dataset.id);if(c){ed.simulation.creatureId=c.id;ed.simulation.creatureType=c.type;ed.simulation.creatureCanonicalName=c.canonicalName;ed.simulation.creatureImageUrl=c.imageUrl;ed.creatureQuery=getCreatureName(c,state.language);ed.comboOpen=false;ed.errors={};emit();}return;}
  if(action==='set-main-food'){state.simulationEditor.simulation.mainFood=button.dataset.id;emit();return;}
  if(action==='set-auto-food'){state.simulationEditor.simulation.mainFood=AUTO_FOOD;emit();return;}
  if(action==='remove-food'){const sim=state.simulationEditor.simulation;sim.foods=sim.foods.filter(x=>x.id!==button.dataset.id);delete sim.amounts[button.dataset.id];delete sim.priceSources[button.dataset.id];if(sim.mainFood===button.dataset.id)sim.mainFood=AUTO_FOOD;emit();return;}
  if(action==='select-resource'){const editor=state.simulationEditor;const item=findResourceCatalogItem(state.resourceCatalog,{resourceId:button.dataset.id});if(item){addFood(item);editor.resourceQuery='';editor.resourceComboOpen=false;emit();}return;}
  if(action==='select-custom-resource'){const editor=state.simulationEditor;const name=String(editor.resourceQuery||'').trim();if(name){addFood({name,xp:getRememberedResourceXp({resourceName:name})||0},{custom:true});editor.resourceQuery='';editor.resourceComboOpen=false;emit();}return;}
  if(action==='simulate-resource'){const item=state.resourceCatalog.find(x=>String(x.ankamaId)===button.dataset.id);if(item){openEditor(newSimulation(),'new',{navigate:false});addFood(item);navigateTo('pet-simulation-new');}return;}
  if(action==='explorer-more'){state.petExplorer.limit+=40;emit();return;}
  if(action==='toggle-pet-sale'){const sim=state.simulations.find(x=>x.id===button.dataset.id);if(sim){const forSale=sim.status!=='awaiting_sale';setSimulations(state.simulations.map(x=>x.id===sim.id?{...x,status:forSale?'awaiting_sale':'ready',updatedAt:nowIso()}:x));showToast(t(state,forSale?'v3.inventory.forSale':'v3.inventory.removeFromSale'));}return;}
  if(action==='backup-export'){exportBackup();return;}
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
  if(action==='duplicate-craft-project'){closeModal();const project=state.craftProjects.find(item=>item.id===button.dataset.id);if(project){openCraftEditor(project,'duplicate');showToast(t(state,'v3.crafts.projectDuplicated'));}return;}
  if(action==='delete-craft-project'){const project=state.craftProjects.find(item=>item.id===button.dataset.id);if(project)openModal({type:'confirm',title:t(state,'v3.crafts.deleteProjectTitle'),text:t(state,'v3.crafts.deleteProjectText'),confirmAction:'delete-craft-project',id:project.id});return;}
  if(action==='select-craft-item'){void selectCraftItem(button.dataset.id);return;}
  if(action==='open-craft-recipe'){void loadSubrecipe(button.dataset.id,{openPlanner:true});return;}
  if(action==='open-craft-recipe-level'){void loadSubrecipe(button.dataset.id,{openPlanner:true,pushToStack:true});return;}
  if(action==='craft-recipe-breadcrumb'&&state.modal?.type==='craft-recipe-planner'){const index=Math.max(0,Number(button.dataset.index)||0);state.modal.recipeStack=(state.modal.recipeStack||[]).slice(0,index+1);emit();return;}
  if(action==='use-max-stock'){const line=findIngredientById(state.craftEditor?.project.ingredients||[],button.dataset.id);if(line){const inventory=state.craftInventory.find(item=>line.ankamaId!=null&&String(item.ankamaId)===String(line.ankamaId)&&String(item.serverId||'')===String(state.craftEditor.project.serverId||''));const required=Math.max(1,(line.quantityPerUnit||1)*(state.craftEditor.project.desiredQuantity||1));line.useStockQuantity=Math.min(required,inventory?.availableQuantity||0);emit();}return;}
  if(action==='save-craft-project'||action==='save-craft-project-draft'||action==='save-craft-project-ready'||action==='save-craft-project-auto'){void saveCraftProject();return;}
  if(action==='exit-craft-editor'){state.craftEditor=null;navigateTo('crafts');return;}
  if(action==='craft-project-details'){openModal({type:'craft-project-details',id:button.dataset.id});return;}
  // No editor, as alterações ainda não salvas precisam entrar na produção.
  if(action==='complete-craft-project'&&state.craftEditor){void saveCraftProject({stay:true}).then(saved=>{if(!saved)return;if(saved.status!=='ready'){showToast(t(state,'v3.crafts.completeBlocked'),'error');return;}openModal({type:'complete-craft-project',id:saved.id,draft:{forSale:false}});});return;}
  if(action==='complete-craft-project'){const project=state.craftProjects.find(item=>item.id===button.dataset.id)||state.craftEditor?.project;if(project){const calc=calculateCraftProject(project,state.craftInventory);if(calc.readiness!=='ready'){showToast(t(state,'v3.crafts.completeBlocked'),'error');return;}openModal({type:'complete-craft-project',id:project.id,draft:{forSale:false}});}return;}
  if(action==='confirm-complete-craft'){completeCraftProject(state.modal.id,Boolean(state.modal.draft?.forSale));return;}
  if(action==='toggle-inventory-sale'){const item=state.craftInventory.find(row=>row.id===button.dataset.id);if(item){const updated=normalizeInventoryItem({...item,forSale:!item.forSale,updatedAt:nowIso()});setCraftInventory(state.craftInventory.map(row=>row.id===item.id?updated:row));addActivity({module:'crafts',action:'craft_for_sale',itemName:item.itemNameSnapshot,itemImage:item.itemImageSnapshot,entityId:item.id,route:'/crafts/estoque',value:updated.desiredSalePrice*updated.availableQuantity});}return;}
  if(action==='register-craft-sale'){const item=state.craftInventory.find(row=>row.id===button.dataset.id);if(item)openModal({type:'register-craft-sale',inventoryItemId:item.id,draft:{quantity:1,unitSalePrice:item.desiredSalePrice||0,channel:'HDV',otherCosts:0,buyer:'',server:item.serverNameSnapshot||'',notes:'',saleDate:toIsoLocalDateTime()}});return;}
  if(action==='confirm-craft-sale'){confirmCraftSale();return;}
  if(action==='inventory-adjust'){const item=state.craftInventory.find(row=>row.id===button.dataset.id);if(item)openModal({type:'inventory-adjust',id:item.id,draft:{quantity:item.quantity,reservedQuantity:item.reservedQuantity,desiredSalePrice:item.desiredSalePrice}});return;}
  if(action==='confirm-inventory-adjust'){confirmInventoryAdjust();return;}
  if(action==='global-sale-details'){openModal({type:button.dataset.module==='pets'?'sale-details':'craft-sale-details',id:button.dataset.id});return;}
  if(action==='use-pet-community'){const sim=state.simulationEditor?.simulation,price=sim&&petCommunityFor(sim)[foodAnkamaId(sim,button.dataset.id)]?.unitPrice;if(price>0){setFoodPrice(sim,button.dataset.id,price,'community');emit();}return;}
  if(action==='scan-pet-prices'){void scanPetCommunity();return;}
  if(action==='refresh-community-prices'&&state.simulationEditor){void refreshPetCommunity({notify:true});return;}
  if(action==='use-community-price'){const line=findIngredientRecursive(state.craftEditor?.project.ingredients||[],button.dataset.id);if(line&&Number(line.communityPriceUnit)>0){line.unitMarketPrice=Number(line.communityPriceUnit);line.priceInputSource='community';line.priceDirty=false;line.priceSyncStatus='idle';emit();}return;}
  if(action==='refresh-community-prices'){void refreshCommunityPrices({overwriteManual:false});return;}
  if(action==='account-logout'){void performLogout(false);return;}
  if(action==='account-logout-all'){void performLogout(true);return;}
  if(action==='open-support'){openModal({type:'support'});return;}
  if(action==='open-information'){openInformation(button.dataset.section||'about');return;}
  if(action==='information-section'){state.modal={...state.modal,section:button.dataset.section};history.replaceState(null,'',`${location.pathname}#${button.dataset.section==='how'?'como-funciona':button.dataset.section}`);emit();return;}
  if(action==='open-consent'){openModal({type:'consent',draft:{...state.consent}});return;}
  if(action==='consent-accept'){saveConsent({preferences:true,analytics:true,advertising:true});return;}
  if(action==='consent-reject'){saveConsent({preferences:false,analytics:false,advertising:false});return;}
  if(action==='consent-save'){saveConsent(state.modal?.draft||state.consent);return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='confirm-modal'){const m=state.modal;if(m.confirmAction==='restore-backup'){try{restoreBackup(m.backup);location.assign('/');}catch{closeModal();showToast(t(state,'backup.invalid'),'error');}return;}if(m.confirmAction==='delete-simulation'){setSimulations(state.simulations.filter(x=>x.id!==m.id));showToast(t(state,'toast.simulationDeleted'));}if(m.confirmAction==='delete-sale'){const removed=state.sales.find(x=>x.id===m.id);cancelSaleSync(m.id);const remaining=state.sales.filter(x=>x.id!==m.id);setSales(remaining);if(removed&&!remaining.some(x=>x.simulationId===removed.simulationId))setSimulations(state.simulations.map(sim=>sim.id===removed.simulationId?{...sim,status:'ready',updatedAt:nowIso()}:sim));showToast(t(state,'toast.saleDeleted'));}if(m.confirmAction==='delete-craft-project'){setCraftProjects(state.craftProjects.filter(project=>project.id!==m.id));showToast(t(state,'v3.crafts.projectDeleted'));}closeModal();return;}
  if(action==='copy-pix'){void copyPix();return;}
  if(action==='copy-name'){void copyText(button.dataset.name||'',t(state,'v303.nameCopied'));return;}
  if(action==='toggle-language'){const menu=app.querySelector('[data-language-menu]');menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));return;}
  if(action==='set-language'){const language=button.dataset.language;if(state.simulationEditor?.simulation?.creatureId){state.simulationEditor.creatureQuery=getCreatureName(getCreatureById(state.simulationEditor.simulation.creatureId),language);}setLanguage(language);void refreshResourceCatalog(language);return;}
  if(action==='toggle-mobile'){const nav=app.querySelector('[data-mobile-nav]');nav.hidden=!nav.hidden;button.setAttribute('aria-expanded',String(!nav.hidden));return;}
}

function confirmPetSale() {
  const modal=state.modal,sim=state.simulations.find(x=>x.id===modal.simulationId);if(!sim)return;const draft=modal.draft;
  if(!draft.soldAt||draft.salePrice<=0||draft.originCost<0||draft.upCost<0||!['Mercado HDV','Outro Jogador'].includes(draft.saleChannel)){showToast(t(state,'toast.invalidStep'),'error');return;}
  const soldDate=new Date(draft.soldAt);if(Number.isNaN(soldDate.getTime())){showToast(t(state,'toast.invalidStep'),'error');return;}
  const calc=calculateSaleProfit(draft);const sale=normalizeSale({id:createId('sale'),simulationId:sim.id,simulationName:sim.name,creatureId:sim.creatureId,creatureCanonicalName:sim.creatureCanonicalName,creatureType:sim.creatureType,creatureImageUrl:sim.creatureImageUrl,originLevel:sim.originLevel,targetLevel:sim.targetLevel,xpBonusPercent:sim.xpBonusPercent||0,upMethod:sim.upMethod,resourceDetails:planResourceLines(calculateSimulation(sim).plan),originCost:draft.originCost,upCost:draft.upCost,salePrice:draft.salePrice,saleChannel:draft.saleChannel,fee:calc.fee,profit:calc.profit,soldAt:soldDate.toISOString(),syncStatus:'pending',apiRegistered:false,apiRow:null,syncStarted:false,createdAt:nowIso()});
  setSales([sale,...state.sales]);setSimulations(state.simulations.map(x=>x.id===sim.id?{...x,status:'sold',lastSaleAt:sale.createdAt,updatedAt:nowIso()}:x));closeModal();showToast(t(state,'sales.registered'));startSync(sale);
}

function startSync(sale) {
  const started={...sale,syncStarted:true};setSales(state.sales.map(item=>item.id===sale.id?started:item));
  syncSale(started,patch=>setSales(state.sales.map(item=>item.id===sale.id?{...item,...patch}:item)),patch=>setSales(state.sales.map(item=>item.id===sale.id?{...item,...patch}:item)));
}

async function copyText(value, successMessage=t(state,'common.copied')) {
  if(!value)return false;
  let copied=false;try{await navigator.clipboard.writeText(value);copied=true;}catch{const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();copied=document.execCommand('copy');input.remove();}if(copied)showToast(successMessage);return copied;
}
async function copyPix() { return copyText(PIX_KEY,t(state,'common.copied')); }


function updateAccountDraft(path, target) {
  const [section, field] = String(path || '').split('.');
  if (!section || !field) return;
  const current = state.accountUi[section] || {};
  let value = target.type === 'checkbox' ? target.checked : target.value;
  state.accountUi[section] = { ...current, [field]: value };
}

app.addEventListener('submit',event=>{
  const form=event.target.closest('[data-form]');
  if(!form)return;
  event.preventDefault();
  const type=form.dataset.form;
  if(type==='builder'){void sendBuilderMessage(state,form.querySelector('[data-builder-input]').value,emitBuilder);return;}
  if(type==='login'){void performLogin();return;}
  if(type==='register'){void performRegister();return;}
  if(type==='forgot-password'){void performForgotPassword();return;}
  if(type==='reset-password'){void performResetPassword();return;}
  if(type==='account-settings'){void performAccountSettingsSave();return;}
  if(type==='change-password'){void performChangePassword();return;}
});

app.addEventListener('focusin',event=>{
  if(event.target.matches('[data-field="creatureQuery"]')&&state.simulationEditor&&!state.simulationEditor.comboOpen){state.simulationEditor.comboOpen=true;state.simulationEditor.creatureQuery='';emit();return;}
  if(event.target.matches('[data-resource-picker-search]')&&state.simulationEditor&&!state.simulationEditor.resourceComboOpen){state.simulationEditor.resourceComboOpen=true;emit();return;}
  if(event.target.matches('[data-craft-item-search]')&&state.craftEditor){state.craftEditor.searchOpen=true;const list=app.querySelector('#craft-item-options');if(list)list.hidden=false;}
});

app.addEventListener('click',event=>{
  if(event.target.classList.contains('modal-backdrop')){closeModal();return;}
  const actionNode=event.target.closest('[data-action]');if(actionNode)handleAction(actionNode);
  const editor=state.simulationEditor;
  if(editor&&(editor.comboOpen||editor.resourceComboOpen)&&!event.target.closest('.creature-combobox,.resource-combobox')){editor.comboOpen=false;editor.resourceComboOpen=false;emit();}
  if(!event.target.closest('.language')){const menu=app.querySelector('[data-language-menu]');if(menu)menu.hidden=true;}
});

// "toggle" não propaga: por isso a captura.
app.addEventListener('toggle',event=>{
  const id=event.target.dataset?.disclosure;
  if(id)state.disclosures[id]=event.target.open;
},true);

app.addEventListener('change',event=>{
  const accountField=event.target.dataset.accountField;if(accountField){updateAccountDraft(accountField,event.target);}
  if(event.target.dataset.builderOption){const field=event.target.dataset.builderOption;if(field==='targetRes')state.builder.targetRes=Math.min(50,Math.max(0,Number(event.target.value)||0));else setBuilderOption(state,field,event.target.value);emit();}
  if(event.target.dataset.builderForge){const raw=event.target.value.trim(),value=Number(raw);setForge(state,Number(event.target.dataset.id),event.target.dataset.builderForge,raw===''||!Number.isFinite(value)?null:value);emit();}
  if(event.target.matches('[data-builder-swap-stat]')){state.builder.swapStat=event.target.value;emit();}
  if(event.target.matches('[data-builder-exo]')&&event.target.value){const key=event.target.value,id=Number(event.target.dataset.id),item=state.builder.gear.item(id);setForge(state,id,key,UNIQUE_EXOS.includes(key)?1:Math.min(10,forgeLimit(item,key)));emit();}
  const field=event.target.dataset.field;if(field&&field!=='creatureQuery')updateEditorField(field,event.target.value,true);
  if(event.target.dataset.foodField){updateFood(event.target);emit();if(event.target.dataset.foodField==='price')publishFood(event.target.dataset.id);}
  if(event.target.dataset.petPrice){const bag=event.target.dataset.petPrice==='bag',price=parseKamas(event.target.value);rememberPetPrice(event.target.dataset.petPrice,price);emit();void publishPetPrice({ankamaId:bag?BAG_ANKAMA_ID:RATION_ANKAMA_ID,name:t({language:'pt-BR'},bag?'simulation.kolitokenBag':'simulation.marketFood'),price,bag});}
  if(event.target.matches('[data-explorer-price]')){const id=event.target.dataset.id,price=parseKamas(event.target.value);rememberPetPrice(id,price);emit();void publishPetPrice({ankamaId:Number(id),name:state.resourceCatalog.find(item=>String(item.ankamaId)===id)?.name||'',price});}
  if(event.target.dataset.explorerField){updateExplorerField(event.target.dataset.explorerField,event.target.value);emit();}
  if(event.target.matches('[data-backup-import]')){void importBackup(event.target.files?.[0]);}
  const saleField=event.target.dataset.saleField;if(saleField&&state.modal?.type==='register-sale'){state.modal.draft[saleField]=['originCost','upCost','salePrice'].includes(saleField)?parseKamas(event.target.value):event.target.value;emit();}
  const craftField=event.target.dataset.craftField;if(craftField)updateCraftField(craftField,event.target.value,true);
  const ingredientField=event.target.dataset.craftIngredientField;if(ingredientField&&state.craftEditor){const line=findIngredientById(state.craftEditor.project.ingredients,event.target.dataset.id);if(line){if(ingredientField==='unitMarketPrice')markIngredientPriceEdited(line,parseKamas(event.target.value));else if(ingredientField==='useStockQuantity')line[ingredientField]=parseKamas(event.target.value);else line[ingredientField]=event.target.value;line.totalQuantity=line.quantityPerUnit*state.craftEditor.project.desiredQuantity;if(!['finalized','cancelled'].includes(state.craftEditor.project.status))state.craftEditor.project.status='draft';if(ingredientField==='acquisitionMode'&&line.acquisitionMode==='craft'){void loadSubrecipe(line.id,{openPlanner:true});return;}if(ingredientField==='acquisitionMode'&&line.acquisitionMode!=='craft'&&state.modal?.type==='craft-recipe-planner'){closeModal();return;}emit();if(ingredientField==='unitMarketPrice')void publishIngredientPrice(line);}}
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
  const accountField=event.target.dataset.accountField;if(accountField){updateAccountDraft(accountField,event.target);return;}
  if(event.target.matches('[data-builder-swap-query]')){state.builder.swapQuery=event.target.value;window.clearTimeout(explorerTimer);explorerTimer=window.setTimeout(emit,260);return;}
  if(event.target.matches('[data-builder-save-name]')){state.builder.saveName=event.target.value;return;}
  if(event.target.matches('[data-builder-input]')){state.builder.input=event.target.value;return;}
  if(event.target.matches('[data-resource-picker-search]')&&state.simulationEditor){const editor=state.simulationEditor;editor.resourceQuery=event.target.value;editor.resourceComboOpen=true;updatePetResourceListDom();return;}
  const field=event.target.dataset.field;if(field==='creatureQuery'&&state.simulationEditor){state.simulationEditor.creatureQuery=event.target.value;state.simulationEditor.comboOpen=true;updatePetCreatureListDom();return;}if(field&&state.simulationEditor){updateEditorField(field,event.target.value,false);return;}
  if(event.target.dataset.foodField){updateFood(event.target);refreshPetSummary();return;}
  if(event.target.dataset.explorerField==='query'){updateExplorerField('query',event.target.value);window.clearTimeout(explorerTimer);explorerTimer=window.setTimeout(emit,220);return;}
  const saleField=event.target.dataset.saleField;if(saleField&&state.modal?.type==='register-sale'){state.modal.draft[saleField]=['originCost','upCost','salePrice'].includes(saleField)?parseKamas(event.target.value):event.target.value;return;}
  if(event.target.matches('[data-craft-item-search]')&&state.craftEditor){state.craftEditor.itemQuery=event.target.value;state.craftEditor.searchOpen=true;scheduleCraftSearch(event.target.value);return;}
  const craftField=event.target.dataset.craftField;if(craftField){updateCraftField(craftField,event.target.value,false);return;}
  const ingredientField=event.target.dataset.craftIngredientField;if(ingredientField&&state.craftEditor){const line=findIngredientById(state.craftEditor.project.ingredients,event.target.dataset.id);if(line){if(ingredientField==='unitMarketPrice')markIngredientPriceEdited(line,parseKamas(event.target.value));else if(ingredientField==='useStockQuantity')line[ingredientField]=parseKamas(event.target.value);else line[ingredientField]=event.target.value;if(!['finalized','cancelled'].includes(state.craftEditor.project.status))state.craftEditor.project.status='draft';}return;}
  const craftSaleField=event.target.dataset.craftSaleField;if(craftSaleField&&state.modal?.type==='register-craft-sale'){state.modal.draft[craftSaleField]=['quantity','unitSalePrice','otherCosts'].includes(craftSaleField)?parseKamas(event.target.value):event.target.value;return;}
  const inventoryAdjustField=event.target.dataset.inventoryAdjustField;if(inventoryAdjustField&&state.modal?.type==='inventory-adjust'){state.modal.draft[inventoryAdjustField]=parseKamas(event.target.value);return;}
  const globalSalesFilter=event.target.dataset.globalSalesFilter;if(globalSalesFilter==='search'){state.globalSalesFilter.search=event.target.value;return;}
  const inventoryFilter=event.target.dataset.inventoryFilter;if(inventoryFilter==='search'){state.inventoryFilter.search=event.target.value;return;}
  const filter=event.target.dataset.salesFilter;if(filter==='search'){state.salesFilter={...(state.salesFilter||{}),search:event.target.value};return;}
});

app.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&state.modal){closeModal();return;}
  if(event.key==='Escape'&&(state.simulationEditor?.comboOpen||state.simulationEditor?.resourceComboOpen)){event.target.blur();state.simulationEditor.comboOpen=false;state.simulationEditor.resourceComboOpen=false;emit();return;}
  if(state.modal&&event.key==='Tab'){const modal=app.querySelector('.modal');const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')];if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
  if(event.target.matches('[data-field="creatureQuery"]')&&event.key==='ArrowDown'){event.preventDefault();app.querySelector('#creature-options .combobox-option')?.focus();return;}
  if(event.target.matches('[data-resource-picker-search]')&&event.key==='ArrowDown'){event.preventDefault();app.querySelector('#resource-options .combobox-option')?.focus();return;}
  if(event.target.matches('[data-craft-item-search]')&&event.key==='ArrowDown'){event.preventDefault();app.querySelector('#craft-item-options .combobox-option')?.focus();return;}
  if(event.target.matches('.combobox-option')){const list=event.target.closest('[role="listbox"]');if(!list)return;const options=[...list.querySelectorAll('.combobox-option')],index=options.indexOf(event.target);if(event.key==='ArrowDown'){event.preventDefault();options[(index+1)%options.length]?.focus();}if(event.key==='ArrowUp'){event.preventDefault();options[(index-1+options.length)%options.length]?.focus();}}
});

const initialHash=location.hash.replace('#','');
if(initialHash==='como-funciona')requestAnimationFrame(()=>openInformation('how'));
