import { BAG_ANKAMA_ID, RATION_ANKAMA_ID, RATION_XP } from '../../config/app.js';
import { PET_NON_TRADABLE as nonTradable, PET_XP } from '../../data/petXp.js';
import { BAG, RATION, foodAnkamaId } from './petPlan.js';

export const emptyPetCommunity = (serverId = '') => ({ serverId, prices: {}, sync: {}, status: 'idle', scan: 'idle', progress: 0 });

// Tudo que pode alimentar um pet e tem preço de mercado.
export const ALL_FEED_IDS = [BAG_ANKAMA_ID, ...Object.keys(PET_XP).map(Number).filter(id => !nonTradable.has(id))];

const sourceIds = simulation => [RATION, BAG, ...(simulation.foods || []).map(food => food.id)];

export function simulationAnkamaIds(simulation) {
  return [...new Set(sourceIds(simulation).map(id => foodAnkamaId(simulation, id)).filter(id => id != null).map(String))];
}

export function getFoodPrice(simulation, id) {
  if (id === RATION) return simulation.marketFoodPrice || 0;
  if (id === BAG) return simulation.bagPrice || 0;
  return simulation.foods.find(food => food.id === id)?.price || 0;
}

export function setFoodPrice(simulation, id, price, source) {
  const value = Math.max(0, Math.round(Number(price) || 0));
  if (id === RATION) simulation.marketFoodPrice = value;
  else if (id === BAG) simulation.bagPrice = value;
  else { const food = simulation.foods.find(item => item.id === id); if (food) food.price = value; }
  simulation.priceSources = { ...(simulation.priceSources || {}), [id]: source };
}

// Como nas receitas: o preço digitado pela pessoa nunca é substituído sozinho.
export function applyPetCommunityPrices(simulation, prices = {}) {
  for (const id of sourceIds(simulation)) {
    const unitPrice = Math.round(Number(prices[foodAnkamaId(simulation, id)]?.unitPrice) || 0);
    if (unitPrice <= 0) continue;
    const source = simulation.priceSources?.[id];
    if (getFoodPrice(simulation, id) > 0 && source !== 'community' && source !== 'memory') continue;
    setFoodPrice(simulation, id, unitPrice, 'community');
  }
}

// Recursos com preço conhecido (seu ou da comunidade), do menor custo por XP ao maior.
export function rankKnownFoods(catalog, petPrices, community, excluded = new Set()) {
  return catalog.map(item => {
    const id = Number(item.ankamaId);
    const xp = PET_XP[id] && (item.xp || PET_XP[id]);
    if (!xp || nonTradable.has(id) || id === RATION_ANKAMA_ID || excluded.has(String(id))) return null;
    const shared = community.prices[id];
    const price = Math.round(Number(shared?.unitPrice) || 0) || petPrices.resources[id] || 0;
    return price > 0 ? { ...item, xp, price, shared: shared?.unitPrice ? shared : null, per500: price / xp * RATION_XP } : null;
  }).filter(Boolean).sort((a, b) => a.per500 - b.per500);
}
