import { normalizeResourceText } from '../data/feedingResources.js';

export const RESOURCE_XP_MEMORY_KEY = 'd4b_resource_xp_memory_v1';

function safeRead() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESOURCE_XP_MEMORY_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function safeWrite(value) {
  try {
    localStorage.setItem(RESOURCE_XP_MEMORY_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getResourceXpMemoryKey(reference = {}) {
  const ankamaId = reference.resourceAnkamaId ?? reference.ankamaId;
  if (ankamaId !== null && ankamaId !== undefined && ankamaId !== '') return `ankama:${String(ankamaId)}`;

  const resourceId = reference.resourceId ?? reference.id;
  if (resourceId && !String(resourceId).startsWith('custom-')) return `id:${String(resourceId)}`;

  const name = reference.resourceName || reference.customName || reference.canonicalName || reference.name;
  const normalizedName = normalizeResourceText(name || '');
  return normalizedName ? `name:${normalizedName}` : '';
}

export function getRememberedResourceXp(reference = {}) {
  const key = getResourceXpMemoryKey(reference);
  if (!key) return null;
  const value = Number(safeRead()[key]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function rememberResourceXp(reference = {}, xp) {
  const key = getResourceXpMemoryKey(reference);
  const numericXp = Number(xp);
  if (!key || !Number.isFinite(numericXp) || numericXp <= 0) return false;
  const memory = safeRead();
  memory[key] = numericXp;
  return safeWrite(memory);
}

export function enrichResourceWithRememberedXp(item = {}) {
  const rememberedXp = getRememberedResourceXp(item);
  if (!rememberedXp) return item;
  return {
    ...item,
    xp: rememberedXp,
    xpSource: 'memory'
  };
}
