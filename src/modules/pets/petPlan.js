import { BAG_ANKAMA_ID, KOLIFICHAS_PER_BAG, KOLIFICHAS_PER_RATION, RATION_ANKAMA_ID, RATION_XP, RATIONS_PER_BAG } from '../../config/app.js';
import { getFeedingResourceById } from '../../data/feedingResources.js';

export const AUTO_FOOD = 'auto';
export const RATION = 'vitaminizedFood';
export const BAG = 'kolitokenBag';
export const KOLITOKENS = 'kolitokens';

// Até três alimentos por combinação, escolhidos entre os mais baratos por XP.
const MIX_DEPTH = 3;
const MIX_CANDIDATES = 12;
// Só vale complicar a lista de compras se a combinação economizar ao menos 1%.
const MIX_MIN_SAVING = 0.01;

const amount = value => Math.max(0, Number(value) || 0);
const whole = value => Math.round(amount(value));
const units = value => Math.trunc(amount(value));
const ceilUnits = value => Math.max(0, Math.ceil(value - 1e-9));

export function foodId(reference = {}) {
  const ankamaId = reference.ankamaId ?? reference.resourceAnkamaId;
  if (Number(ankamaId) === RATION_ANKAMA_ID) return RATION;
  if (ankamaId !== null && ankamaId !== undefined && ankamaId !== '') return `r${ankamaId}`;
  const raw = reference.id || reference.resourceId || reference.name || reference.resourceName || '';
  return `c${String(raw).normalize('NFD').replace(/[^\w-]/g, '').toLowerCase()}`;
}

export function foodAnkamaId(simulation, id) {
  if (id === RATION) return RATION_ANKAMA_ID;
  if (id === BAG) return BAG_ANKAMA_ID;
  return (simulation.foods || []).find(food => food.id === id)?.ankamaId ?? null;
}

export function normalizeFood(input = {}) {
  return {
    id: input.id || foodId(input),
    ankamaId: input.ankamaId ?? null,
    name: String(input.name || ''),
    imageUrl: input.imageUrl || '',
    xp: amount(input.xp),
    price: whole(input.price),
    custom: Boolean(input.custom)
  };
}

// owned: já tenho, sem custo. buy: null deixa o site decidir; um número (inclusive 0) é respeitado.
export function normalizeAmount(input = {}) {
  const auto = input?.buy === null || input?.buy === undefined || input?.buy === '';
  return { owned: units(input?.owned), buy: auto ? null : units(input.buy) };
}

function normalizeAmounts(input) {
  return Object.fromEntries(Object.entries(input && typeof input === 'object' ? input : {})
    .map(([id, value]) => [id, normalizeAmount(value)])
    .filter(([, value]) => value.owned > 0 || value.buy !== null));
}

const foodFromLine = line => normalizeFood({
  id: foodId({ ankamaId: line.resourceAnkamaId, resourceId: line.resourceId, name: line.resourceName }),
  ankamaId: line.resourceAnkamaId ?? null,
  name: line.resourceDisplayName || line.resourceName || line.customName,
  imageUrl: line.resourceImageUrl,
  xp: getFeedingResourceById(line.resourceId)?.xp || line.xpUnit || line.customXp,
  price: line.unitPrice,
  custom: line.custom
});

// Quantidades fixas antigas viram alimentos comuns: preço zero = "já tenho", com preço = "comprar N".
function addFixedLines(lines, foods, amounts) {
  for (const line of lines) {
    const food = foodFromLine(line);
    const quantity = units(line.quantity);
    if (!food.name) continue;
    const baseId = food.id === RATION ? 'cration' : food.id;
    let id = baseId;
    let row = foods.find(item => item.id === id);
    for (let index = 2; row && food.price > 0 && row.price > 0 && row.price !== food.price; index += 1) {
      id = `${baseId}-${index}`;
      row = foods.find(item => item.id === id);
    }
    if (!row) { row = { ...food, id }; foods.push(row); }
    else if (!row.price) row.price = food.price;
    const current = amounts[id] || { owned: 0, buy: null };
    amounts[id] = food.price > 0 ? { ...current, buy: (current.buy || 0) + quantity } : { ...current, owned: current.owned + quantity, buy: current.buy ?? (row.price ? null : 0) };
  }
}

// Traduz simulações antigas para o modelo atual. Nada é descartado.
export function migrateFeeding(simulation = {}) {
  const lines = Array.isArray(simulation.resourceLines) ? simulation.resourceLines.filter(Boolean) : [];
  const current = typeof simulation.mainFood === 'string' && Boolean(simulation.mainFood);
  const combined = ['combined', 'resources'].includes(simulation.upMethod);
  const amounts = normalizeAmounts(simulation.amounts);
  const foods = current ? (simulation.foods || []).filter(Boolean).map(normalizeFood) : [];
  let mainFood = current ? simulation.mainFood : AUTO_FOOD;
  if (current || combined) {
    addFixedLines(lines, foods, amounts);
    if (!current) mainFood = simulation.combinedRationSource === BAG ? BAG : RATION;
  } else {
    foods.push(...new Map(lines.map(foodFromLine).filter(food => food.name && food.id !== RATION).map(food => [food.id, food])).values());
    if ([RATION, BAG].includes(simulation.upMethod)) mainFood = simulation.upMethod;
  }
  const sources = simulation.priceSources && typeof simulation.priceSources === 'object' ? { ...simulation.priceSources } : {};
  return { mainFood, foods, amounts, priceSources: sources, resourceLines: [] };
}

function single(option, remaining, multiplier) {
  if (option.id === BAG) {
    // Bolsas são compradas inteiras, mas cada ração é usada separadamente.
    const rations = ceilUnits(remaining / (RATION_XP * multiplier));
    const quantity = Math.ceil(rations / RATIONS_PER_BAG);
    return { quantity, leftover: quantity * KOLIFICHAS_PER_BAG - rations * KOLIFICHAS_PER_RATION };
  }
  return { quantity: option.effectiveXp > 0 ? ceilUnits(remaining / option.effectiveXp) : 0, leftover: 0 };
}

const perXp = option => option.price / option.effectiveXp;

// Menor custo para cobrir a XP: um alimento sozinho ou o máximo inteiro de um + o resto com outros.
function bestMix(remaining, options, multiplier, depth = MIX_DEPTH) {
  let best = null;
  for (const option of options) {
    const alone = single(option, remaining, multiplier);
    const cost = alone.quantity * option.price;
    if (!best || cost < best.cost) best = { cost, parts: [{ id: option.id, ...alone }] };
  }
  if (depth <= 1 || options.length < 2) return best;
  for (const option of options) {
    const quantity = Math.floor(remaining / option.effectiveXp + 1e-9);
    const left = remaining - quantity * option.effectiveXp;
    if (!quantity || left <= 1e-6 || (best && quantity * option.price >= best.cost)) continue;
    const rest = bestMix(left, options.filter(other => other !== option), multiplier, depth - 1);
    const cost = quantity * option.price + (rest?.cost ?? Infinity);
    if (cost < best.cost) best = { cost, parts: [{ id: option.id, quantity, leftover: 0 }, ...rest.parts] };
  }
  return best;
}

function solve(remaining, options, multiplier) {
  const usable = options.filter(option => option.usable).sort((a, b) => perXp(a) - perXp(b)).slice(0, MIX_CANDIDATES);
  if (!usable.length) return null;
  const alone = bestMix(remaining, options.filter(option => option.usable), multiplier, 1);
  const mix = bestMix(remaining, usable, multiplier);
  return mix.cost < alone.cost * (1 - MIX_MIN_SAVING) ? mix : alone;
}

export function calculatePlan(simulation, xpNeeded, bonusPercent) {
  const multiplier = 1 + amount(bonusPercent) / 100;
  const feeding = migrateFeeding(simulation);
  const make = ({ id, name = '', xp, price, food = null }) => {
    const { owned, buy } = feeding.amounts[id] || { owned: 0, buy: null };
    const effectiveXp = xp * multiplier;
    return { id, name, food, xp, effectiveXp, price, owned, buy, ownedUsed: 0, buyQuantity: buy || 0, cost: 0, leftover: 0, maxPrice: 0, usable: effectiveXp > 0 && price > 0 && buy === null };
  };
  const options = [
    make({ id: RATION, xp: RATION_XP, price: whole(simulation.marketFoodPrice) }),
    make({ id: BAG, xp: RATION_XP * RATIONS_PER_BAG, price: whole(simulation.bagPrice) }),
    // Uma unidade desta linha é 1 kolificha; só trocas completas viram ração.
    { ...make({ id: KOLITOKENS, xp: RATION_XP / KOLIFICHAS_PER_RATION, price: 0 }), buy: 0, buyQuantity: 0, usable: false },
    ...feeding.foods.map(food => make({ id: food.id, name: food.name, xp: food.xp, price: food.price, food }))
  ];

  // 1. Compras que a pessoa fixou. 2. O que ela já tem. 3. O resto, pelo menor custo.
  let remaining = Math.max(0, xpNeeded - options.reduce((sum, option) => sum + option.buyQuantity * option.effectiveXp, 0));
  for (const option of options) {
    const step = option.id === KOLITOKENS ? KOLIFICHAS_PER_RATION : 1;
    if (!option.owned || !option.effectiveXp) continue;
    option.ownedUsed = Math.min(Math.floor(option.owned / step), ceilUnits(remaining / (option.effectiveXp * step))) * step;
    remaining = Math.max(0, remaining - option.ownedUsed * option.effectiveXp);
  }
  if (remaining < 1e-6) remaining = 0;

  const best = remaining ? solve(remaining, options, multiplier) : null;
  const pinned = feeding.mainFood === AUTO_FOOD ? null : options.find(option => option.id === feeding.mainFood && option.buy === null);
  const pinnedPart = pinned && remaining ? { cost: single(pinned, remaining, multiplier).quantity * pinned.price, parts: [{ id: pinned.id, ...single(pinned, remaining, multiplier) }] } : null;
  const filling = remaining ? (pinned ? pinnedPart : best) : null;
  for (const part of filling?.parts || []) {
    const option = options.find(item => item.id === part.id);
    option.buyQuantity += part.quantity;
    option.leftover = part.leftover;
  }
  for (const option of options) {
    option.cost = option.buyQuantity * option.price;
    const quantity = remaining && option.effectiveXp > 0 ? single(option, remaining, multiplier).quantity : 0;
    const rival = quantity && option.buy === null && option.id !== KOLITOKENS ? solve(remaining, options.filter(other => other !== option), multiplier) : null;
    // Preço-teto: até quanto vale pagar para empatar com a melhor alternativa sem este alimento.
    option.maxPrice = rival ? Math.floor(rival.cost / quantity) : 0;
    option.aloneQuantity = quantity;
  }
  const parts = options.filter(option => option.ownedUsed > 0 || option.buyQuantity > 0);
  const main = [...parts].sort((a, b) => (b.buyQuantity + b.ownedUsed) * b.effectiveXp - (a.buyQuantity + a.ownedUsed) * a.effectiveXp)[0] || null;
  const complete = !remaining || Boolean(pinned ? pinned.usable : best);
  return {
    isAuto: !pinned, pinnedId: pinned?.id || null, options, parts, main, remaining, complete,
    missingPrice: options.filter(option => option.buy > 0 && !option.price).map(option => option.id),
    cost: options.reduce((sum, option) => sum + option.cost, 0),
    bestIds: best?.parts.map(part => part.id) || [],
    extraCost: pinned?.usable && best ? Math.max(0, pinnedPart.cost - best.cost) : 0
  };
}

export function methodForPlan(plan) {
  if (plan.parts.length > 1) return 'combined';
  if (!plan.main) return RATION;
  if (plan.main.id === KOLITOKENS) return BAG;
  return [RATION, BAG].includes(plan.main.id) ? plan.main.id : 'resource';
}

// Registro do que foi usado, guardado junto da venda.
export function planResourceLines(plan) {
  return plan.parts.filter(option => option.food).map(option => ({
    id: option.id, resourceId: option.food.ankamaId != null ? `dofusdude-${option.food.ankamaId}` : option.id,
    resourceAnkamaId: option.food.ankamaId, resourceName: option.food.name, resourceDisplayName: option.food.name,
    resourceImageUrl: option.food.imageUrl, xpUnit: option.xp, customXp: option.xp, custom: option.food.custom,
    quantity: option.buyQuantity + option.ownedUsed, unitPrice: option.buyQuantity ? option.price : 0
  }));
}

// Custo de referência por 1 XP, usado para dizer até que preço um recurso compensa.
export function referenceCostPerXp(rationPrice, bagPrice) {
  const costs = [amount(rationPrice) / RATION_XP, amount(bagPrice) / (RATION_XP * RATIONS_PER_BAG)].filter(value => value > 0);
  return costs.length ? Math.min(...costs) : 0;
}
