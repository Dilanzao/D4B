import {
  KOLIFICHAS_PER_BAG,
  KOLIFICHAS_PER_RATION,
  MARKET_FEE_PERCENT,
  RATION_XP
} from '../config/app.js';
import { MAX_LEVEL, XP_BY_LEVEL } from '../data/xpTable.js';
import { getFeedingResourceById } from '../data/feedingResources.js';

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const integer = (value) => Math.max(0, Math.round(finite(value)));
const positiveDecimal = (value) => Math.max(0, finite(value));

export function getXpBonusPercent(simulation = {}) {
  return clamp(positiveDecimal(simulation.xpBonusPercent), 0, 1000);
}

export function getXpMultiplier(simulation = {}) {
  return 1 + (getXpBonusPercent(simulation) / 100);
}

export function applyXpBonus(baseXp, simulationOrPercent = {}) {
  const percent = typeof simulationOrPercent === 'number'
    ? clamp(positiveDecimal(simulationOrPercent), 0, 1000)
    : getXpBonusPercent(simulationOrPercent);
  return positiveDecimal(baseXp) * (1 + percent / 100);
}

export function calculateQuantityNeeded(xpNeeded, baseXpPerUnit, simulationOrPercent = {}) {
  const effectiveXp = applyXpBonus(baseXpPerUnit, simulationOrPercent);
  if (xpNeeded <= 0) return 0;
  if (effectiveXp <= 0) return 0;
  return Math.ceil(xpNeeded / effectiveXp);
}

export function getLevelXpLimit(level) {
  const safe = clamp(Math.trunc(finite(level)), 0, MAX_LEVEL);
  if (safe >= MAX_LEVEL) return 0;
  return Math.max(0, XP_BY_LEVEL[safe + 1] - XP_BY_LEVEL[safe] - 1);
}

export function calculateXpNeeded(simulation) {
  const origin = clamp(Math.trunc(finite(simulation.originLevel)), 0, MAX_LEVEL);
  const target = clamp(Math.trunc(finite(simulation.targetLevel)), origin, MAX_LEVEL);
  const currentWithin = clamp(integer(simulation.currentXp), 0, getLevelXpLimit(origin));
  return Math.max(0, XP_BY_LEVEL[target] - (XP_BY_LEVEL[origin] + currentWithin));
}

export function calculateRationMethod(xpNeeded, unitPrice, simulationOrPercent = {}) {
  const xpBonusPercent = typeof simulationOrPercent === 'number'
    ? clamp(positiveDecimal(simulationOrPercent), 0, 1000)
    : getXpBonusPercent(simulationOrPercent);
  const effectiveXpPerUnit = applyXpBonus(RATION_XP, xpBonusPercent);
  const quantity = calculateQuantityNeeded(Math.max(0, xpNeeded), RATION_XP, xpBonusPercent);
  const totalCost = quantity * integer(unitPrice);
  return {
    id: 'vitaminizedFood', quantity, rationQuantity: quantity,
    baseXpPerUnit: RATION_XP, effectiveXpPerUnit, xpBonusPercent,
    xpObtained: quantity * effectiveXpPerUnit, totalCost, grossCost: totalCost,
    costPerXp: xpNeeded > 0 ? totalCost / xpNeeded : 0,
    sufficient: xpNeeded === 0 || (quantity * effectiveXpPerUnit >= xpNeeded && integer(unitPrice) > 0),
    leftoverKolifichas: 0, remainingXp: 0
  };
}

export function calculateBagMethod(xpNeeded, bagPrice, simulationOrPercent = {}) {
  const xpBonusPercent = typeof simulationOrPercent === 'number'
    ? clamp(positiveDecimal(simulationOrPercent), 0, 1000)
    : getXpBonusPercent(simulationOrPercent);
  const effectiveXpPerUnit = applyXpBonus(RATION_XP, xpBonusPercent);
  const rationQuantity = calculateQuantityNeeded(Math.max(0, xpNeeded), RATION_XP, xpBonusPercent);
  const kolifichasNeeded = rationQuantity * KOLIFICHAS_PER_RATION;
  const wholeBags = Math.ceil(kolifichasNeeded / KOLIFICHAS_PER_BAG);
  const unitBagPrice = integer(bagPrice);
  const grossCost = wholeBags * unitBagPrice;
  const proportionalCost = KOLIFICHAS_PER_BAG > 0 ? Math.round(kolifichasNeeded * (unitBagPrice / KOLIFICHAS_PER_BAG)) : 0;
  return {
    id: 'kolitokenBag', quantity: wholeBags, rationQuantity, kolifichasNeeded,
    baseXpPerUnit: RATION_XP, effectiveXpPerUnit, xpBonusPercent,
    xpObtained: rationQuantity * effectiveXpPerUnit, totalCost: grossCost, grossCost,
    proportionalCost, costPerXp: xpNeeded > 0 ? grossCost / xpNeeded : 0,
    sufficient: xpNeeded === 0 || (rationQuantity * effectiveXpPerUnit >= xpNeeded && unitBagPrice > 0),
    leftoverKolifichas: wholeBags * KOLIFICHAS_PER_BAG - kolifichasNeeded,
    remainingXp: 0
  };
}

export function calculateResourceMethod(resourceLines = [], xpNeeded = 0, simulationOrPercent = {}) {
  const xpBonusPercent = typeof simulationOrPercent === 'number'
    ? clamp(positiveDecimal(simulationOrPercent), 0, 1000)
    : getXpBonusPercent(simulationOrPercent);
  const lines = resourceLines.map((line) => {
    const resource = getFeedingResourceById(line.resourceId);
    const storedXp = positiveDecimal(line.xpUnit) || positiveDecimal(line.customXp);
    const baseXpUnit = resource?.xp ?? storedXp;
    const canonicalName = resource?.canonicalName || String(line.resourceName || line.customName || '').trim();
    if (!canonicalName) return null;
    const quantity = Math.max(0, Math.trunc(finite(line.quantity)));
    const unitPrice = integer(line.unitPrice);
    const effectiveXpUnit = baseXpUnit > 0 ? applyXpBonus(baseXpUnit, xpBonusPercent) : 0;
    const baseXpTotal = baseXpUnit * quantity;
    const xpTotal = effectiveXpUnit * quantity;
    const quantityNeededAlone = baseXpUnit > 0 ? calculateQuantityNeeded(xpNeeded, baseXpUnit, xpBonusPercent) : 0;
    return {
      id: line.id,
      resourceId: resource?.id || line.resourceId || `custom-${line.id}`,
      resourceAnkamaId: line.resourceAnkamaId ?? null,
      resourceImageUrl: line.resourceImageUrl || '',
      resourceLevel: Number.isFinite(Number(line.resourceLevel)) ? Number(line.resourceLevel) : null,
      resourceName: canonicalName,
      custom: Boolean(line.custom || (!resource && !line.resourceAnkamaId)),
      xpSource: resource ? 'embedded' : (line.xpSource || 'manual'),
      canonicalName,
      baseXpUnit,
      xpUnit: baseXpUnit,
      effectiveXpUnit,
      xpBonusPercent,
      quantity,
      quantityNeededAlone,
      baseXpTotal,
      bonusXpTotal: Math.max(0, xpTotal - baseXpTotal),
      unitPrice,
      xpTotal,
      costTotal: baseXpUnit > 0 ? unitPrice * quantity : 0,
      costNeededAlone: baseXpUnit > 0 ? unitPrice * quantityNeededAlone : 0,
      validXp: baseXpUnit > 0
    };
  }).filter(Boolean);
  const activeLines = lines.filter((line) => line.validXp && line.quantity > 0);
  const xpObtained = activeLines.reduce((sum, line) => sum + line.xpTotal, 0);
  const baseXpObtained = activeLines.reduce((sum, line) => sum + line.baseXpTotal, 0);
  const totalCost = activeLines.reduce((sum, line) => sum + line.costTotal, 0);
  const quantity = activeLines.reduce((sum, line) => sum + line.quantity, 0);
  const remainingXp = Math.max(0, xpNeeded - xpObtained);
  return {
    id: 'resources', lines, activeLines, quantity, xpObtained, baseXpObtained,
    bonusXpObtained: Math.max(0, xpObtained - baseXpObtained),
    xpBonusPercent, totalCost, grossCost: totalCost,
    costPerXp: xpObtained > 0 ? totalCost / xpObtained : 0,
    sufficient: xpNeeded === 0 || xpObtained >= xpNeeded,
    invalidXpCount: lines.filter((line) => !line.validXp).length,
    leftoverKolifichas: 0, remainingXp
  };
}

export function calculateCombinedMethod(resourceLines, xpNeeded, marketFoodPrice, bagPrice, rationSource = 'vitaminizedFood', simulationOrPercent = {}) {
  const resources = calculateResourceMethod(resourceLines, xpNeeded, simulationOrPercent);
  const remainingXp = Math.max(0, xpNeeded - resources.xpObtained);
  const supplement = rationSource === 'kolitokenBag'
    ? calculateBagMethod(remainingXp, bagPrice, simulationOrPercent)
    : calculateRationMethod(remainingXp, marketFoodPrice, simulationOrPercent);
  const xpObtained = resources.xpObtained + supplement.xpObtained;
  const totalCost = resources.totalCost + supplement.totalCost;
  return {
    id: 'combined', quantity: resources.quantity + (supplement.rationQuantity || supplement.quantity || 0),
    resourceQuantity: resources.quantity,
    resourceXp: resources.xpObtained,
    resourceBaseXp: resources.baseXpObtained,
    resourceCost: resources.totalCost,
    remainingXp,
    rationSource,
    supplement,
    rationQuantity: supplement.rationQuantity || supplement.quantity || 0,
    xpObtained,
    totalCost,
    grossCost: totalCost,
    costPerXp: xpNeeded > 0 ? totalCost / xpNeeded : 0,
    sufficient: xpNeeded === 0 || (resources.activeLines.length > 0 && xpObtained >= xpNeeded && (remainingXp === 0 || supplement.sufficient)),
    leftoverKolifichas: supplement.leftoverKolifichas || 0,
    lines: resources.lines,
    xpBonusPercent: resources.xpBonusPercent
  };
}

export function calculateSimulation(simulation) {
  const xpNeeded = calculateXpNeeded(simulation);
  const xpBonusPercent = getXpBonusPercent(simulation);
  const xpMultiplier = getXpMultiplier(simulation);
  const resources = calculateResourceMethod(simulation.resourceLines, xpNeeded, xpBonusPercent);
  const methods = {
    vitaminizedFood: calculateRationMethod(xpNeeded, simulation.marketFoodPrice, xpBonusPercent),
    kolitokenBag: calculateBagMethod(xpNeeded, simulation.bagPrice, xpBonusPercent),
    resources,
    combined: calculateCombinedMethod(
      simulation.resourceLines,
      xpNeeded,
      simulation.marketFoodPrice,
      simulation.bagPrice,
      simulation.combinedRationSource || 'vitaminizedFood',
      xpBonusPercent
    )
  };
  const viable = ['vitaminizedFood','kolitokenBag','combined'].map((id) => methods[id]).filter((method) => method.sufficient && (method.totalCost > 0 || xpNeeded === 0));
  const cheapest = [...viable].sort((a, b) => a.totalCost - b.totalCost)[0]?.id ?? null;
  const selectedMethod = simulation.upMethod === 'resources' ? 'combined' : simulation.upMethod;
  const selected = methods[selectedMethod] || null;
  const upCost = selected?.sufficient ? integer(selected.totalCost) : 0;
  const originCost = integer(simulation.originCost);
  const additionalCosts = integer(simulation.additionalCosts);
  const operationCost = originCost + upCost + additionalCosts;
  const salePrice = integer(simulation.estimatedSalePrice);
  const feePercent = simulation.estimatedSaleChannel === 'Mercado HDV' ? MARKET_FEE_PERCENT : 0;
  const fee = Math.round(salePrice * feePercent / 100);
  const netRevenue = salePrice - fee;
  const estimatedProfit = netRevenue - operationCost;
  const breakEven = feePercent > 0 ? Math.ceil(operationCost / (1 - feePercent / 100)) : operationCost;
  return { xpNeeded, xpBonusPercent, xpMultiplier, methods, cheapest, selected, upCost, originCost, additionalCosts, operationCost, salePrice, feePercent, fee, netRevenue, estimatedProfit, breakEven, resources };
}

export function generateLevelRows(simulation, calculation = calculateSimulation(simulation)) {
  const origin = clamp(Math.trunc(finite(simulation.originLevel)), 0, MAX_LEVEL);
  const target = clamp(Math.trunc(finite(simulation.targetLevel)), origin, MAX_LEVEL);
  const rows = [];
  let cumulativeXp = 0;
  for (let level = origin + 1; level <= target; level += 1) {
    const stepXp = Math.max(0, XP_BY_LEVEL[level] - XP_BY_LEVEL[level - 1] - (level === origin + 1 ? integer(simulation.currentXp) : 0));
    cumulativeXp += stepXp;
    const ratio = calculation.xpNeeded > 0 ? cumulativeXp / calculation.xpNeeded : 0;
    rows.push({ level, stepXp, cumulativeXp, cumulativeUpCost: Math.round(calculation.upCost * ratio), cumulativeOperationCost: calculation.originCost + calculation.additionalCosts + Math.round(calculation.upCost * ratio) });
  }
  return rows;
}

export function calculateSaleProfit({ originCost, upCost, salePrice, saleChannel }) {
  const costOrigin = integer(originCost);
  const costUp = integer(upCost);
  const price = integer(salePrice);
  const feePercent = saleChannel === 'Mercado HDV' ? MARKET_FEE_PERCENT : 0;
  const fee = Math.round(price * feePercent / 100);
  return { feePercent, fee, netRevenue: price - fee, profit: price - fee - costOrigin - costUp };
}
