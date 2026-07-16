import { ADS_ENABLED } from '../config/app.js';
import { STORAGE_KEYS, safeRemove } from './storageService.js';

let analyticsBootstrapped = false;
let advertisingBootstrapped = false;

function setConsentAttributes(consent) {
  const root = document.documentElement;
  root.dataset.consentPreferences = String(Boolean(consent?.preferences));
  root.dataset.consentAnalytics = String(Boolean(consent?.analytics));
  root.dataset.consentAdvertising = String(Boolean(consent?.advertising));
}

function clearDisabledPreferenceStorage(consent) {
  if (consent?.preferences) return;
  safeRemove(STORAGE_KEYS.language);
  safeRemove(STORAGE_KEYS.preferences);
}

function bootstrapAnalytics(consent) {
  if (!consent?.analytics || analyticsBootstrapped) return;
  // Infraestrutura pronta. Nenhum provedor de análise está configurado nesta versão.
  analyticsBootstrapped = true;
  window.dispatchEvent(new CustomEvent('d4b:analytics-consent', { detail: { enabled: true } }));
}

function bootstrapAdvertising(consent) {
  if (!ADS_ENABLED || !consent?.advertising || advertisingBootstrapped) return;
  // O script real do AdSense deverá ser conectado aqui quando o site for aprovado.
  // Este ponto nunca é executado sem autorização de publicidade.
  advertisingBootstrapped = true;
  window.dispatchEvent(new CustomEvent('d4b:advertising-consent', { detail: { enabled: true } }));
}

export function applyConsent(consent) {
  setConsentAttributes(consent);
  clearDisabledPreferenceStorage(consent);
  bootstrapAnalytics(consent);
  bootstrapAdvertising(consent);
  window.dispatchEvent(new CustomEvent('d4b:consent-changed', { detail: { ...consent } }));
}

export const preferenceStorageAllowed = (consent) => Boolean(consent?.preferences);
export const advertisingAllowed = (consent) => Boolean(ADS_ENABLED && consent?.advertising);
