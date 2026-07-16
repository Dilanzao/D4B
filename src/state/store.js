import { loadApplicationData, storage } from '../services/storageService.js';
import { applyConsent, preferenceStorageAllowed } from '../services/consentService.js';

const initial = loadApplicationData();
const listeners = new Set();

export const state = {
  language: initial.language,
  simulations: initial.simulations,
  sales: initial.sales,
  preferences: initial.preferences,
  consent: initial.consent,
  view: 'dashboard',
  simulationEditor: null,
  modal: null,
  toast: null,
  dashboardFilters: {
    period: 'all', from: '', to: '', type: 'all', creature: 'all', channel: 'all', method: 'all', result: 'all', grouping: 'month', petMetric: 'quantity', channelMetric: 'quantity', methodMetric: 'averageCost'
  },
  salesFilter: {}
};

export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function emit() { listeners.forEach(listener => listener(state)); }
export function setLanguage(language) { state.language = language; if (preferenceStorageAllowed(state.consent)) storage.saveLanguage(language); emit(); }
export function setView(view) { state.view = view; state.modal = null; emit(); }
export function setSimulations(simulations) { state.simulations = simulations; storage.saveSimulations(simulations); emit(); }
export function setSales(sales) { state.sales = sales; storage.saveSales(sales); emit(); }
export function setPreferences(preferences) { state.preferences = { ...state.preferences, ...preferences }; if (preferenceStorageAllowed(state.consent)) storage.savePreferences(state.preferences); emit(); }
export function setConsent(consent) { state.consent = { ...state.consent, ...consent, essential: true }; storage.saveConsent(state.consent); applyConsent(state.consent); emit(); }
export function setDashboardFilters(filters) { state.dashboardFilters = { ...state.dashboardFilters, ...filters }; emit(); }
export function openModal(modal) { state.modal = modal; emit(); }
export function closeModal() { state.modal = null; emit(); }
export function showToast(message, tone = 'success') {
  state.toast = { message, tone, id: Date.now() };
  emit();
  window.setTimeout(() => {
    if (state.toast?.message === message) { state.toast = null; emit(); }
  }, 2800);
}
