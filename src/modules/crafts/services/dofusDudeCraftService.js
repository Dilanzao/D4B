import { DOFUSDUDE_API_BASE } from '../../../config/app.js';

const LANGUAGE_MAP = { 'pt-BR': 'pt', 'fr-FR': 'fr', 'en-US': 'en', 'es-ES': 'es' };
const ITEM_CATEGORIES = ['equipment', 'consumables', 'resources', 'cosmetics', 'quest'];
const detailCache = new Map();
const searchCache = new Map();

const getArray = payload => {
  if (Array.isArray(payload)) return payload;
  for (const key of ['items', 'data', 'results']) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

function imageFrom(raw = {}) {
  const urls = raw.image_urls || raw.imageUrls || raw.images || {};
  if (typeof urls === 'string') return urls;
  return urls.hd || urls.sd || urls.icon || urls.png || raw.image_url || raw.imageUrl || './assets/placeholders/item-fallback.svg';
}

function nameFrom(raw = {}) {
  return raw.name || raw.names?.pt || raw.names?.en || raw.title || `Item ${raw.ankama_id ?? raw.id ?? ''}`.trim();
}

function typeFrom(raw = {}) {
  const type = raw.type || raw.item_type || raw.itemType || raw.category;
  if (typeof type === 'string') return type;
  return type?.name || type?.label || 'item';
}

function categoryHint(raw = {}) {
  const hint = String(raw.category || raw.item_category || raw.itemCategory || raw.type?.category || '').toLowerCase();
  if (ITEM_CATEGORIES.includes(hint)) return hint;
  const type = typeFrom(raw).toLowerCase();
  if (/recurso|resource/.test(type)) return 'resources';
  if (/consum|poção|potion|food/.test(type)) return 'consumables';
  if (/quest|missão/.test(type)) return 'quest';
  if (/cosmetic|aparência|skin/.test(type)) return 'cosmetics';
  return 'equipment';
}

export function normalizeDofusDudeItem(raw = {}) {
  const ankamaId = Number(raw.ankama_id ?? raw.ankamaId ?? raw.id);
  return {
    ankamaId: Number.isFinite(ankamaId) ? ankamaId : null,
    name: nameFrom(raw),
    imageUrl: imageFrom(raw),
    level: Math.max(0, Number(raw.level) || 0),
    type: typeFrom(raw),
    category: categoryHint(raw),
    raw
  };
}

function normalizeRecipe(rawRecipe) {
  const entries = Array.isArray(rawRecipe) ? rawRecipe : Array.isArray(rawRecipe?.ingredients) ? rawRecipe.ingredients : [];
  return entries.map(entry => {
    const item = entry.item || entry.ingredient || entry;
    const ankamaId = Number(item.ankama_id ?? item.ankamaId ?? entry.item_id ?? entry.ankama_id ?? entry.id);
    const quantity = Math.max(1, Math.round(Number(entry.quantity ?? entry.qty ?? item.quantity ?? 1) || 1));
    return {
      ankamaId: Number.isFinite(ankamaId) ? ankamaId : null,
      name: nameFrom(item),
      imageUrl: imageFrom(item),
      level: Math.max(0, Number(item.level) || 0),
      type: typeFrom(item),
      category: categoryHint(item),
      quantity
    };
  }).filter(item => item.ankamaId !== null || item.name);
}

async function requestJson(url, { signal } = {}) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) throw new Error(`DofusDude HTTP ${response.status}`);
  return response.json();
}

export async function searchCraftItems(query, language = 'pt-BR', { limit = 40, signal } = {}) {
  const clean = String(query || '').trim();
  if (clean.length < 2) return [];
  const lang = LANGUAGE_MAP[language] || 'pt';
  const cacheKey = `${lang}:${clean.toLocaleLowerCase()}:${limit}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);
  const params = new URLSearchParams({ query: clean, limit: String(Math.min(100, Math.max(1, limit))) });
  const payload = await requestJson(`${DOFUSDUDE_API_BASE}/${lang}/items/search?${params}`, { signal });
  const result = getArray(payload).map(normalizeDofusDudeItem).filter(item => item.ankamaId !== null);
  searchCache.set(cacheKey, result);
  return result;
}

async function fetchCategoryItem(ankamaId, category, lang, signal) {
  const url = `${DOFUSDUDE_API_BASE}/${lang}/items/${category}/${encodeURIComponent(ankamaId)}?fields[item]=recipe,description,pods`;
  const raw = await requestJson(url, { signal });
  const item = normalizeDofusDudeItem(raw?.item || raw?.data || raw);
  return { ...item, category, description: raw?.description || raw?.item?.description || '', recipe: normalizeRecipe(raw?.recipe || raw?.item?.recipe || raw?.data?.recipe) };
}

export async function fetchCraftItemDetails(itemOrId, language = 'pt-BR', { signal } = {}) {
  const normalized = typeof itemOrId === 'object' ? normalizeDofusDudeItem(itemOrId) : { ankamaId: Number(itemOrId), category: null };
  if (!Number.isFinite(normalized.ankamaId)) throw new Error('Invalid Ankama item id.');
  const lang = LANGUAGE_MAP[language] || 'pt';
  const cacheKey = `${lang}:${normalized.ankamaId}`;
  if (detailCache.has(cacheKey)) return detailCache.get(cacheKey);
  const categories = [normalized.category, ...ITEM_CATEGORIES].filter((value, index, array) => value && array.indexOf(value) === index);
  let lastError = null;
  for (const category of categories) {
    try {
      const detail = await fetchCategoryItem(normalized.ankamaId, category, lang, signal);
      detailCache.set(cacheKey, detail);
      return detail;
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      lastError = error;
    }
  }
  throw lastError || new Error('Item not found.');
}

export function clearCraftApiCache() {
  detailCache.clear();
  searchCache.clear();
}
