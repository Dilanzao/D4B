import { CONSENT_POLICY_VERSION, DEFAULT_CONSENT, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../config/app.js';
import { findCreatureMatch, getCreatureById } from '../data/creatures.js';
import { createId, nowIso } from '../utils/identifiers.js';

export const STORAGE_KEYS = {
  language: 'd4b_language_v2',
  simulations: 'd4b_simulations_v2',
  sales: 'd4b_sales_v2',
  preferences: 'd4b_preferences_v2',
  consent: 'd4b_consent_v2'
};

const OLD_SIMULATION_KEYS = ['d4b-saved-simulations-v2', 'd4b-saved-simulations-v1'];
const OLD_SALES_KEYS = ['d4b-flip-history-v2', 'd4b-flip-history-v1'];

function safeParse(raw, fallback) {
  try { const parsed = JSON.parse(raw); return parsed ?? fallback; } catch { return fallback; }
}

export function safeGet(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : safeParse(raw, fallback); } catch { return fallback; }
}

export function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function safeRemove(key) {
  try { localStorage.removeItem(key); return true; } catch { return false; }
}

function findCreature(nameOrId, type) {
  if (!nameOrId) return null;
  return getCreatureById(nameOrId) || findCreatureMatch(nameOrId, type);
}

export function normalizeSimulation(input = {}) {
  const legacy = input.input || input;
  const creatureType = legacy.creatureType || legacy.petType || 'Mascote';
  const creature = findCreature(legacy.creatureId || legacy.petName || legacy.creatureCanonicalName || legacy.name, creatureType);
  const createdAt = input.createdAt || legacy.createdAt || nowIso();
  const rawTarget = Number(legacy.targetLevel);
  return {
    id: input.id || legacy.id || createId('simulation'),
    name: input.name || legacy.name || legacy.petName || '',
    creatureId: creature?.id || legacy.creatureId || '',
    creatureCanonicalName: creature?.canonicalName || legacy.creatureCanonicalName || legacy.petName || '',
    creatureType: creature?.type || creatureType,
    creatureImageUrl: creature?.imageUrl || legacy.creatureImageUrl || './assets/placeholders/creature-fallback.svg',
    unassociatedCreature: !creature && Boolean(legacy.creatureId || legacy.petName || legacy.creatureCanonicalName),
    originLevel: Number.isFinite(Number(legacy.originLevel)) ? Math.min(99, Math.max(0, Math.trunc(Number(legacy.originLevel)))) : 0,
    currentXp: Number.isFinite(Number(legacy.currentXp ?? legacy.currentXpInLevel)) ? Math.max(0, Math.trunc(Number(legacy.currentXp ?? legacy.currentXpInLevel))) : 0,
    targetLevel: Number.isFinite(rawTarget) ? Math.min(100, Math.max(1, Math.trunc(rawTarget))) : 80,
    upMethod: legacy.upMethod === '' ? '' : (['vitaminizedFood','kolitokenBag','resources','combined'].includes(legacy.upMethod)
      ? legacy.upMethod
      : ((legacy.bagPrice || 0) / 10 < (legacy.marketRationPrice || Infinity) ? 'kolitokenBag' : 'vitaminizedFood')),
    marketFoodPrice: Math.max(0, Math.round(Number(legacy.marketFoodPrice ?? legacy.marketRationPrice ?? 0) || 0)),
    bagPrice: Math.max(0, Math.round(Number(legacy.bagPrice ?? 0) || 0)),
    combinedRationSource: ['vitaminizedFood','kolitokenBag'].includes(legacy.combinedRationSource) ? legacy.combinedRationSource : 'vitaminizedFood',
    resourceLines: Array.isArray(legacy.resourceLines) ? legacy.resourceLines.filter(Boolean) : [],
    originCost: Math.max(0, Math.round(Number(legacy.originCost ?? legacy.purchasePrice ?? 0) || 0)),
    additionalCosts: Math.max(0, Math.round(Number(legacy.additionalCosts ?? 0) || 0)),
    estimatedSalePrice: Math.max(0, Math.round(Number(legacy.estimatedSalePrice ?? legacy.intendedSalePrice ?? 0) || 0)),
    estimatedSaleChannel: ['Mercado HDV','Outro Jogador'].includes(legacy.estimatedSaleChannel)
      ? legacy.estimatedSaleChannel
      : (legacy.sellViaMarket === false ? 'Outro Jogador' : 'Mercado HDV'),
    status: legacy.status || 'ready',
    createdAt,
    updatedAt: input.updatedAt || legacy.updatedAt || createdAt,
    lastSaleAt: legacy.lastSaleAt || null
  };
}

export function normalizeSale(input = {}) {
  const createdAt = input.createdAt || nowIso();
  const saleChannel = ['Mercado HDV','Outro Jogador'].includes(input.saleChannel)
    ? input.saleChannel
    : (input.channel || (input.soldThroughMarket === false ? 'Outro Jogador' : 'Mercado HDV'));
  const creatureType = input.creatureType || input.petType || 'Mascote';
  const creature = findCreature(input.creatureId || input.creatureCanonicalName || input.petName, creatureType);
  const originCost = Math.max(0, Math.round(Number(input.originCost ?? input.purchaseCost ?? 0) || 0));
  const upCost = Math.max(0, Math.round(Number(input.upCost ?? input.upgradeCost ?? 0) || 0));
  const additionalCosts = Math.max(0, Math.round(Number(input.additionalCosts ?? 0) || 0));
  const salePrice = Math.max(0, Math.round(Number(input.salePrice ?? input.soldPrice ?? 0) || 0));
  const fee = saleChannel === 'Mercado HDV' ? Math.round(salePrice * 0.02) : 0;
  const profit = Number.isFinite(Number(input.profit ?? input.netProfit))
    ? Math.round(Number(input.profit ?? input.netProfit))
    : salePrice - fee - originCost - upCost - additionalCosts;
  return {
    id: input.id || createId('sale'),
    simulationId: input.simulationId || null,
    simulationName: input.simulationName || input.name || input.petName || '',
    creatureId: creature?.id || input.creatureId || '',
    creatureCanonicalName: creature?.canonicalName || input.creatureCanonicalName || input.petName || '',
    creatureType: creature?.type || creatureType,
    creatureImageUrl: creature?.imageUrl || input.creatureImageUrl || './assets/placeholders/creature-fallback.svg',
    unassociatedCreature: !creature && Boolean(input.creatureId || input.creatureCanonicalName || input.petName),
    originLevel: Number(input.originLevel || 0),
    targetLevel: Number(input.targetLevel || 0),
    upMethod: input.upMethod || 'vitaminizedFood',
    resourceDetails: Array.isArray(input.resourceDetails) ? input.resourceDetails : [],
    originCost,
    upCost,
    additionalCosts,
    salePrice,
    saleChannel,
    fee,
    profit,
    soldAt: input.soldAt || input.date || createdAt,
    apiRow: input.apiRow ?? null,
    apiRegistered: Boolean(input.apiRegistered),
    syncStatus: input.syncStatus || (input.apiRegistered ? 'synced' : 'pending'),
    syncStarted: Boolean(input.syncStarted),
    createdAt
  };
}

function migrateCollection(newKey, oldKeys, normalizer) {
  const existing = safeGet(newKey, null);
  if (Array.isArray(existing)) return existing.map(normalizer);
  for (const key of oldKeys) {
    const old = safeGet(key, null);
    if (Array.isArray(old) && old.length) {
      const migrated = old.map(normalizer);
      safeSet(newKey, migrated);
      return migrated;
    }
  }
  return [];
}

function normalizeConsent(raw, legacyPreferences = {}) {
  if (raw?.version === CONSENT_POLICY_VERSION && raw.essential === true) return {
    ...DEFAULT_CONSENT,
    ...raw,
    essential: true,
    version: CONSENT_POLICY_VERSION
  };
  if (legacyPreferences?.bannerDismissed) return {
    ...DEFAULT_CONSENT,
    preferences: true,
    advertising: Boolean(legacyPreferences.allowAds),
    analytics: false,
    decidedAt: legacyPreferences.decidedAt || nowIso()
  };
  return { ...DEFAULT_CONSENT };
}

export function loadApplicationData() {
  const languageRaw = (() => { try { return localStorage.getItem(STORAGE_KEYS.language); } catch { return null; } })();
  const language = SUPPORTED_LANGUAGES.includes(languageRaw) ? languageRaw : DEFAULT_LANGUAGE;
  const simulations = migrateCollection(STORAGE_KEYS.simulations, OLD_SIMULATION_KEYS, normalizeSimulation);
  const sales = migrateCollection(STORAGE_KEYS.sales, OLD_SALES_KEYS, normalizeSale);
  const preferences = safeGet(STORAGE_KEYS.preferences, {});
  const consent = normalizeConsent(safeGet(STORAGE_KEYS.consent, null), preferences);
  return { language, simulations, sales, preferences, consent };
}

export const storage = {
  saveLanguage(language) { try { localStorage.setItem(STORAGE_KEYS.language, language); return true; } catch { return false; } },
  saveSimulations(simulations) { return safeSet(STORAGE_KEYS.simulations, simulations); },
  saveSales(sales) { return safeSet(STORAGE_KEYS.sales, sales); },
  savePreferences(preferences) { return safeSet(STORAGE_KEYS.preferences, preferences); },
  saveConsent(consent) { return safeSet(STORAGE_KEYS.consent, consent); }
};
