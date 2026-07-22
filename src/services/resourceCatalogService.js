import {
  feedingResources,
  getFeedingResourceName,
  normalizeResourceText
} from '../data/feedingResources.js';
import { enrichResourceWithRememberedXp } from './resourceXpMemoryService.js';

const API_BASE = 'https://api.dofusdu.de/dofus3/v1';
const CACHE_PREFIX = 'd4b_dofusdude_resources_v1';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const LOCALE_TO_API = {
  'pt-BR': 'pt',
  'fr-FR': 'fr',
  'en-US': 'en',
  'es-ES': 'es'
};

const memoryCache = new Map();

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    // Mantém somente o catálogo em português e o idioma atualmente solicitado,
    // evitando que alternâncias de idioma esgotem a cota do localStorage.
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const storedKey = localStorage.key(index);
      if (storedKey?.startsWith(`${CACHE_PREFIX}_`) && storedKey !== `${CACHE_PREFIX}_pt` && storedKey !== key) {
        localStorage.removeItem(storedKey);
      }
    }
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function unwrapItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function extractName(item) {
  if (typeof item?.name === 'string') return item.name.trim();
  if (typeof item?.name?.name === 'string') return item.name.name.trim();
  if (typeof item?.name?.value === 'string') return item.name.value.trim();
  if (typeof item?.name?.text === 'string') return item.name.text.trim();
  if (typeof item?.title === 'string') return item.title.trim();
  return '';
}

function extractImage(item) {
  const images = item?.image_urls || item?.imageUrls || item?.images || item?.image || {};
  if (typeof images === 'string') return images;
  const candidates = [
    images.hd, images.high, images.large, images.icon, images.sd, images.medium, images.small,
    item?.image_url, item?.imageUrl, item?.icon
  ];
  return candidates.find((value) => typeof value === 'string' && /^https?:\/\//i.test(value)) || '';
}

function extractId(item) {
  const value = item?.ankama_id ?? item?.ankamaId ?? item?.id ?? item?.item_id ?? item?.itemId;
  const number = Number(value);
  return Number.isFinite(number) ? number : String(value || '').trim();
}

function extractLevel(item) {
  const value = Number(item?.level ?? item?.item_level ?? item?.itemLevel ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function normalizeApiItem(item) {
  const ankamaId = extractId(item);
  const name = extractName(item);
  if (!ankamaId || !name) return null;
  return {
    ankamaId,
    name,
    level: extractLevel(item),
    imageUrl: extractImage(item)
  };
}

async function fetchLanguage(apiLanguage, { force = false } = {}) {
  const key = `${CACHE_PREFIX}_${apiLanguage}`;
  const cachedMemory = memoryCache.get(apiLanguage);
  if (!force && cachedMemory) return cachedMemory;

  const cached = safeRead(key);
  if (!force && cached?.items?.length && Date.now() - Number(cached.cachedAt || 0) < CACHE_MAX_AGE) {
    memoryCache.set(apiLanguage, cached.items);
    return cached.items;
  }

  try {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 25000);
    let response;
    try {
      response = await fetch(`${API_BASE}/${apiLanguage}/items/resources/all`, {
        headers: { Accept: 'application/json' },
        cache: force ? 'reload' : 'default',
        signal: controller.signal
      });
    } finally {
      globalThis.clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const items = unwrapItems(payload).map(normalizeApiItem).filter(Boolean);
    if (!items.length) throw new Error('Empty resource catalog.');
    memoryCache.set(apiLanguage, items);
    safeWrite(key, { cachedAt: Date.now(), items });
    return items;
  } catch (error) {
    if (cached?.items?.length) {
      memoryCache.set(apiLanguage, cached.items);
      return cached.items;
    }
    throw error;
  }
}

function knownXpByPortugueseName() {
  const map = new Map();
  for (const resource of feedingResources) {
    const names = [resource.canonicalName, resource.names?.['pt-BR']].filter(Boolean);
    for (const name of names) map.set(normalizeResourceText(name), Number(resource.xp));
  }
  return map;
}

function embeddedCatalog(language = 'pt-BR') {
  return feedingResources.map((resource) => enrichResourceWithRememberedXp({
    id: resource.id,
    ankamaId: null,
    canonicalName: resource.canonicalName,
    name: getFeedingResourceName(resource, language),
    names: resource.names,
    level: null,
    imageUrl: '',
    xp: Number(resource.xp),
    xpSource: 'embedded',
    source: 'local'
  })).sort((a, b) => a.name.localeCompare(b.name, language));
}

export function getEmbeddedResourceCatalog(language = 'pt-BR') {
  return embeddedCatalog(language);
}

export async function loadDofusDudeResourceCatalog(language = 'pt-BR', options = {}) {
  const apiLanguage = LOCALE_TO_API[language] || 'pt';
  const ptItems = await fetchLanguage('pt', options);
  const localizedItems = apiLanguage === 'pt' ? ptItems : await fetchLanguage(apiLanguage, options);

  const ptById = new Map(ptItems.map((item) => [String(item.ankamaId), item]));
  const xpByName = knownXpByPortugueseName();
  const knownEmbeddedByName = new Map(
    feedingResources.flatMap((item) => [item.canonicalName, item.names?.['pt-BR']]
      .filter(Boolean)
      .map((name) => [normalizeResourceText(name), item]))
  );

  const catalog = localizedItems.map((localized) => {
    const portuguese = ptById.get(String(localized.ankamaId)) || localized;
    const normalizedPtName = normalizeResourceText(portuguese.name);
    const known = knownEmbeddedByName.get(normalizedPtName);
    const xp = xpByName.get(normalizedPtName);
    return enrichResourceWithRememberedXp({
      id: `dofusdude-${localized.ankamaId}`,
      ankamaId: localized.ankamaId,
      canonicalName: portuguese.name,
      name: localized.name,
      level: localized.level || portuguese.level || 0,
      imageUrl: localized.imageUrl || portuguese.imageUrl || '',
      xp: Number.isFinite(xp) && xp > 0 ? xp : null,
      xpSource: known ? 'embedded' : null,
      source: 'dofusdude'
    });
  }).filter((item) => item.name && item.id);

  const deduplicated = [...new Map(catalog.map((item) => [item.id, item])).values()]
    .sort((a, b) => a.name.localeCompare(b.name, language));

  return {
    items: deduplicated,
    source: 'dofusdude',
    language,
    loadedAt: new Date().toISOString()
  };
}

export function searchResourceCatalog(items = [], query = '', limit = Infinity) {
  const wanted = normalizeResourceText(query);
  const ranked = items.filter((item) => {
    if (!wanted) return true;
    return [item.name, item.canonicalName, String(item.ankamaId || '')]
      .some((value) => normalizeResourceText(value).includes(wanted));
  }).sort((a, b) => {
    if (wanted) {
      const aStarts = normalizeResourceText(a.name).startsWith(wanted) ? 0 : 1;
      const bStarts = normalizeResourceText(b.name).startsWith(wanted) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
    }
    if (Boolean(a.xp) !== Boolean(b.xp)) return a.xp ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return Number.isFinite(limit) ? ranked.slice(0, limit) : ranked;
}

export function findResourceCatalogItem(items = [], reference = {}) {
  const ankamaId = reference.resourceAnkamaId ?? reference.ankamaId;
  if (ankamaId !== null && ankamaId !== undefined && ankamaId !== '') {
    const byAnkama = items.find((item) => String(item.ankamaId) === String(ankamaId));
    if (byAnkama) return byAnkama;
  }
  const id = reference.resourceId ?? reference.id;
  if (id) {
    const byId = items.find((item) => item.id === id);
    if (byId) return byId;
  }
  const name = reference.resourceName || reference.customName || reference.canonicalName;
  if (name) {
    const normalized = normalizeResourceText(name);
    return items.find((item) => [item.name, item.canonicalName].some((value) => normalizeResourceText(value) === normalized)) || null;
  }
  return null;
}
