import { loadApplicationData, storage } from '../services/storageService.js';
import { applyConsent, preferenceStorageAllowed } from '../services/consentService.js';
import { getEmbeddedResourceCatalog } from '../services/resourceCatalogService.js';
import { craftStorage, loadCraftData } from '../modules/crafts/services/craftStorageService.js';
import { STORAGE_SCHEMA_VERSION } from '../config/app.js';

const initial = loadApplicationData();
const craftInitial = loadCraftData();
craftStorage.saveSchema(STORAGE_SCHEMA_VERSION);
const listeners = new Set();

export const state = {
  language: initial.language,
  simulations: initial.simulations,
  sales: initial.sales,
  preferences: initial.preferences,
  consent: initial.consent,
  route: { name: 'home', path: '/', params: {} },
  view: 'home',
  simulationEditor: null,
  craftEditor: null,
  modal: null,
  toast: null,
  globalFilters: { module: 'all', period: 'all', from: '', to: '' },
  dashboardFilters: {
    period: 'all', from: '', to: '', type: 'all', creature: 'all', channel: 'all', method: 'all', result: 'all', grouping: 'month', petMetric: 'quantity', channelMetric: 'quantity', methodMetric: 'averageCost'
  },
  salesFilter: {},
  globalSalesFilter: { module: 'all', search: '', channel: 'all', status: 'all', from: '', to: '' },
  inventoryFilter: { module: 'all', search: '', forSale: 'all' },
  resourceCatalog: getEmbeddedResourceCatalog(initial.language),
  resourceCatalogStatus: 'idle',
  resourceCatalogSource: 'embedded',
  resourceCatalogLoadedAt: null,
  resourceCatalogError: null,
  craftProjects: craftInitial.projects,
  craftBatches: craftInitial.batches,
  craftInventory: craftInitial.inventory,
  craftSales: craftInitial.sales,
  craftPrices: craftInitial.prices,
  activities: craftInitial.activities,
  craftSearch: { query: '', status: 'idle', results: [], error: null },
  craftProjectFilters: { status: 'all', search: '' }
};

export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function emit() { listeners.forEach(listener => listener(state)); }
export function setLanguage(language) { state.language = language; if (preferenceStorageAllowed(state.consent)) storage.saveLanguage(language); emit(); }
export function setView(view) { state.view = view; state.modal = null; emit(); }
export function setRoute(route) { state.route = route; state.view = route?.name || 'home'; state.modal = null; emit(); }
export function setSimulations(simulations) { state.simulations = simulations; storage.saveSimulations(simulations); emit(); }
export function setSales(sales) { state.sales = sales; storage.saveSales(sales); emit(); }
export function setPreferences(preferences) { state.preferences = { ...state.preferences, ...preferences }; if (preferenceStorageAllowed(state.consent)) storage.savePreferences(state.preferences); emit(); }
export function setConsent(consent) { state.consent = { ...state.consent, ...consent, essential: true }; storage.saveConsent(state.consent); applyConsent(state.consent); emit(); }
export function setDashboardFilters(filters) { state.dashboardFilters = { ...state.dashboardFilters, ...filters }; emit(); }
export function setGlobalFilters(filters) { state.globalFilters = { ...state.globalFilters, ...filters }; emit(); }
export function setGlobalSalesFilter(filters) { state.globalSalesFilter = { ...state.globalSalesFilter, ...filters }; emit(); }
export function setInventoryFilter(filters) { state.inventoryFilter = { ...state.inventoryFilter, ...filters }; emit(); }
export function setResourceCatalog({ items, status = 'ready', source = 'dofusdude', loadedAt = null, error = null }) {
  if (Array.isArray(items) && items.length) state.resourceCatalog = items;
  state.resourceCatalogStatus = status;
  state.resourceCatalogSource = source;
  state.resourceCatalogLoadedAt = loadedAt;
  state.resourceCatalogError = error;
  emit();
}
export function setCraftProjects(value) { state.craftProjects = value; craftStorage.saveProjects(value); emit(); }
export function setCraftBatches(value) { state.craftBatches = value; craftStorage.saveBatches(value); emit(); }
export function setCraftInventory(value) { state.craftInventory = value; craftStorage.saveInventory(value); emit(); }
export function setCraftSales(value) { state.craftSales = value; craftStorage.saveSales(value); emit(); }
export function setCraftPrices(value) { state.craftPrices = value; craftStorage.savePrices(value); emit(); }
export function setActivities(value) { state.activities = value; craftStorage.saveActivities(value); emit(); }
export function setCraftSearch(patch) { state.craftSearch = { ...state.craftSearch, ...patch }; emit(); }
export function openModal(modal) { state.modal = modal; emit(); }
export function closeModal() { state.modal = null; emit(); }
export function showToast(message, tone = 'success') {
  state.toast = { message, tone, id: Date.now() };
  emit();
  window.setTimeout(() => {
    if (state.toast?.message === message) { state.toast = null; emit(); }
  }, 2800);
}
