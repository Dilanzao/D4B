import { DOFUSDUDE_API_BASE } from '../../../config/app.js';
import { professionLabel, resolveCraftProfession } from '../utils/craftProfession.js';

const LANGUAGE_MAP = { 'pt-BR': 'pt', 'fr-FR': 'fr', 'en-US': 'en', 'es-ES': 'es' };
const DETAIL_CATEGORIES = ['equipment', 'consumables', 'resources', 'cosmetics', 'quest'];
const CRAFT_SEARCH_INDEXES = ['items-equipment', 'items-consumables', 'items-cosmetics', 'items-quest_items'];
const ITEM_FALLBACK = '/assets/placeholders/item-fallback.svg';
const detailCache = new Map();
const snapshotCache = new Map();
const searchCache = new Map();

const getArray = payload => {
  if (Array.isArray(payload)) return payload;
  for (const key of ['items', 'data', 'results']) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

function normalizeImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `https://api.dofusdu.de${url}`;
  return `${DOFUSDUDE_API_BASE.replace(/\/dofus3\/v1\/?$/, '')}/${url.replace(/^\.\//, '')}`;
}

function flattenedItem(raw = {}) {
  return raw.item || raw.data?.item || raw.data || raw;
}

function imageFrom(raw = {}) {
  const item = flattenedItem(raw);
  const urls = item.image_urls || item.imageUrls || item.images || raw.image_urls || raw.imageUrls || {};
  if (typeof urls === 'string') return normalizeImageUrl(urls) || ITEM_FALLBACK;
  // A documentação garante o ícone; SD é preferido quando já estiver renderizado.
  return normalizeImageUrl(urls.sd || urls.icon || urls.hq || urls.hd || item.image_url || item.imageUrl || raw.image_url || raw.imageUrl) || ITEM_FALLBACK;
}

function nameFrom(raw = {}) {
  const item = flattenedItem(raw);
  return raw.name || item.name || item.names?.pt || item.names?.en || raw.title || `Item ${raw.ankama_id ?? item.ankama_id ?? raw.id ?? item.id ?? ''}`.trim();
}

function typeMetaFrom(raw = {}) {
  const item = flattenedItem(raw);
  const type = item.type || raw.item_type || raw.itemType || raw.type || item.category || raw.category;
  if (typeof type === 'string') return { name: type, nameId: type };
  return { name: type?.name || type?.label || type?.name_id || 'item', nameId: type?.name_id || type?.nameId || type?.id || '' };
}

function typeFrom(raw = {}) { return typeMetaFrom(raw).name; }

function categoryFromSubtype(value = '') {
  const normalized = String(value || '').toLowerCase().replace(/^items[-_]/, '').replace(/[-_ ]items?$/, '');
  if (/resource/.test(normalized)) return 'resources';
  if (/consum/.test(normalized)) return 'consumables';
  if (/quest/.test(normalized)) return 'quest';
  if (/cosmetic/.test(normalized)) return 'cosmetics';
  if (/equipment|weapon/.test(normalized)) return 'equipment';
  return null;
}

function categoryHint(raw = {}) {
  const item = flattenedItem(raw);
  const explicit = categoryFromSubtype(raw.category || item.category || raw.item_category || raw.itemCategory || item.item_subtype || raw.item_subtype || raw.type);
  if (explicit) return explicit;
  const type = typeFrom(raw).toLowerCase();
  return categoryFromSubtype(type) || 'equipment';
}

export function normalizeDofusDudeItem(raw = {}) {
  const item = flattenedItem(raw);
  const ankamaId = Number(raw.ankama_id ?? raw.ankamaId ?? item.ankama_id ?? item.ankamaId ?? raw.id ?? item.id);
  const typeMeta = typeMetaFrom(raw);
  const category = categoryHint(raw);
  const professionTag = resolveCraftProfession(typeMeta.nameId, typeMeta.name, category);
  return {
    ankamaId: Number.isFinite(ankamaId) ? ankamaId : null,
    name: nameFrom(raw),
    imageUrl: imageFrom(raw),
    level: Math.max(0, Number(item.level ?? raw.level) || 0),
    type: typeMeta.name,
    typeNameId: String(typeMeta.nameId || ''),
    category,
    professionTag,
    raw
  };
}

function normalizeRecipe(rawRecipe) {
  const entries = Array.isArray(rawRecipe) ? rawRecipe : Array.isArray(rawRecipe?.ingredients) ? rawRecipe.ingredients : [];
  return entries.map(entry => {
    const item = entry.item || entry.ingredient || entry;
    const ankamaId = Number(item.ankama_id ?? item.ankamaId ?? entry.item_ankama_id ?? entry.item_id ?? entry.ankama_id ?? entry.id);
    const quantity = Math.max(1, Math.round(Number(entry.quantity ?? entry.qty ?? item.quantity ?? 1) || 1));
    const itemSubtype = entry.item_subtype || entry.itemSubtype || item.item_subtype || item.itemSubtype || item.category || null;
    return {
      ankamaId: Number.isFinite(ankamaId) ? ankamaId : null,
      itemSubtype,
      name: item.name && !/^item\s*$/i.test(item.name) ? nameFrom(item) : '',
      imageUrl: imageFrom(item),
      level: Math.max(0, Number(item.level) || 0),
      type: typeFrom(item),
      category: categoryFromSubtype(itemSubtype) || categoryHint(item),
      quantity
    };
  }).filter(item => item.ankamaId !== null);
}

async function requestJson(url, { signal } = {}) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) throw new Error(`DofusDude HTTP ${response.status}`);
  return response.json();
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length || 1) }, worker));
  return results;
}

async function fetchCategorySnapshot(ankamaId, category, lang, signal) {
  const cacheKey = `${lang}:${category}:${ankamaId}`;
  if (snapshotCache.has(cacheKey)) return snapshotCache.get(cacheKey);
  const raw = await requestJson(`${DOFUSDUDE_API_BASE}/${lang}/items/${category}/${encodeURIComponent(ankamaId)}`, { signal });
  const item = normalizeDofusDudeItem(raw?.item || raw?.data || raw);
  const result = {
    ...item,
    category,
    description: raw?.description || raw?.item?.description || raw?.data?.description || '',
    recipeEntries: normalizeRecipe(raw?.recipe || raw?.item?.recipe || raw?.data?.recipe)
  };
  snapshotCache.set(cacheKey, result);
  return result;
}

async function fetchItemSnapshot(ankamaId, category, lang, signal) {
  const categories = [category, ...DETAIL_CATEGORIES].filter((value, index, array) => value && array.indexOf(value) === index);
  let lastError = null;
  for (const currentCategory of categories) {
    try {
      return await fetchCategorySnapshot(ankamaId, currentCategory, lang, signal);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      lastError = error;
    }
  }
  throw lastError || new Error('Item not found.');
}

async function hydrateRecipeIngredients(entries, lang, signal) {
  return mapWithConcurrency(entries, 6, async entry => {
    try {
      const detail = await fetchItemSnapshot(entry.ankamaId, categoryFromSubtype(entry.itemSubtype) || entry.category, lang, signal);
      return {
        ...entry,
        name: detail.name || entry.name || `Item ${entry.ankamaId}`,
        imageUrl: detail.imageUrl || entry.imageUrl || ITEM_FALLBACK,
        level: detail.level || entry.level || 0,
        type: detail.type || entry.type || 'item',
        typeNameId: detail.typeNameId || '',
        category: detail.category || entry.category || categoryFromSubtype(entry.itemSubtype) || 'resources',
        isCraftable: Boolean(detail.recipeEntries?.length),
        professionTag: detail.professionTag || resolveCraftProfession(detail.typeNameId, detail.type, detail.category)
      };
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      return {
        ...entry,
        name: entry.name || `Item ${entry.ankamaId}`,
        imageUrl: entry.imageUrl || ITEM_FALLBACK,
        type: entry.type || categoryFromSubtype(entry.itemSubtype) || 'item',
        isCraftable: false,
        professionTag: 'unknown'
      };
    }
  });
}

export async function fetchCraftItemDetails(itemOrId, language = 'pt-BR', { signal } = {}) {
  const normalized = typeof itemOrId === 'object' ? normalizeDofusDudeItem(itemOrId) : { ankamaId: Number(itemOrId), category: null };
  if (!Number.isFinite(normalized.ankamaId)) throw new Error('Invalid Ankama item id.');
  const lang = LANGUAGE_MAP[language] || 'pt';
  const cacheKey = `${lang}:${normalized.ankamaId}`;
  if (detailCache.has(cacheKey)) return detailCache.get(cacheKey);
  const detail = await fetchItemSnapshot(normalized.ankamaId, normalized.category, lang, signal);
  const recipe = await hydrateRecipeIngredients(detail.recipeEntries || [], lang, signal);
  const result = { ...detail, professionLabel: professionLabel(detail.professionTag, language), recipe };
  detailCache.set(cacheKey, result);
  return result;
}

export async function searchCraftItems(query, language = 'pt-BR', { limit = 30, signal } = {}) {
  const clean = String(query || '').trim();
  if (clean.length < 2) return [];
  const lang = LANGUAGE_MAP[language] || 'pt';
  const safeLimit = Math.min(60, Math.max(1, limit));
  const cacheKey = `${lang}:${clean.toLocaleLowerCase()}:${safeLimit}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  const params = new URLSearchParams({
    query: clean,
    limit: String(Math.min(100, Math.max(safeLimit * 2, 30))),
    'filter[search_index]': CRAFT_SEARCH_INDEXES.join(','),
    'fields[item]': 'level,image_urls,type'
  });
  const payload = await requestJson(`${DOFUSDUDE_API_BASE}/${lang}/search?${params}`, { signal });
  const summaries = getArray(payload)
    .map(normalizeDofusDudeItem)
    .filter(item => item.ankamaId !== null && item.category !== 'resources');

  const hydrated = await mapWithConcurrency(summaries, 6, async summary => {
    try {
      const detail = await fetchCraftItemDetails(summary, language, { signal });
      return detail.recipe?.length ? { ...summary, ...detail, hasRecipe: true } : null;
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      return null;
    }
  });
  const result = hydrated.filter(Boolean).slice(0, safeLimit);
  searchCache.set(cacheKey, result);
  return result;
}

export function clearCraftApiCache() {
  detailCache.clear();
  snapshotCache.clear();
  searchCache.clear();
}
