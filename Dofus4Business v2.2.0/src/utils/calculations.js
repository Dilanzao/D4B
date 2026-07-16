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

export function calculateRationMethod(xpNeeded, unitPrice) {
  const quantity = Math.ceil(Math.max(0, xpNeeded) / RATION_XP);
  const totalCost = quantity * integer(unitPrice);
  return {
    id: 'vitaminizedFood', quantity, rationQuantity: quantity,
    xpObtained: quantity * RATION_XP, totalCost, grossCost: totalCost,
    costPerXp: xpNeeded > 0 ? totalCost / xpNeeded : 0,
    sufficient: xpNeeded === 0 || (quantity * RATION_XP >= xpNeeded && integer(unitPrice) > 0),
    leftoverKolifichas: 0, remainingXp: 0
  };
}

export function calculateBagMethod(xpNeeded, bagPrice) {
  const rationQuantity = Math.ceil(Math.max(0, xpNeeded) / RATION_XP);
  const kolifichasNeeded = rationQuantity * KOLIFICHAS_PER_RATION;
  const wholeBags = Math.ceil(kolifichasNeeded / KOLIFICHAS_PER_BAG);
  const unitBagPrice = integer(bagPrice);
  const grossCost = wholeBags * unitBagPrice;
  const proportionalCost = KOLIFICHAS_PER_BAG > 0 ? Math.round(kolifichasNeeded * (unitBagPrice / KOLIFICHAS_PER_BAG)) : 0;
  return {
    id: 'kolitokenBag', quantity: wholeBags, rationQuantity, kolifichasNeeded,
    xpObtained: rationQuantity * RATION_XP, totalCost: grossCost, grossCost,
    proportionalCost, costPerXp: xpNeeded > 0 ? grossCost / xpNeeded : 0,
    sufficient: xpNeeded === 0 || (rationQuantity * RATION_XP >= xpNeeded && unitBagPrice > 0),
    leftoverKolifichas: wholeBags * KOLIFICHAS_PER_BAG - kolifichasNeeded,
    remainingXp: 0
  };
}

export function calculateResourceMethod(resourceLines = [], xpNeeded = 0) {
  const lines = resourceLines.map((line) => {
    const resource = getFeedingResourceById(line.resourceId);
    const customXp = Math.max(0, finite(line.customXp ?? line.xpUnit));
    const xpUnit = resource?.xp ?? customXp;
    const canonicalName = resource?.canonicalName || String(line.customName || line.resourceName || '').trim();
    if (!canonicalName || xpUnit <= 0) return null;
    const quantity = Math.max(0, Math.trunc(finite(line.quantity)));
    const unitPrice = integer(line.unitPrice);
    return {
      id: line.id,
      resourceId: resource?.id || line.resourceId || `custom-${line.id}`,
      custom: !resource,
      canonicalName,
      xpUnit,
      quantity,
      unitPrice,
      xpTotal: xpUnit * quantity,
      costTotal: unitPrice * quantity
    };
  }).filter((line) => line && line.quantity > 0);
  const xpObtained = lines.reduce((sum, line) => sum + line.xpTotal, 0);
  const totalCost = lines.reduce((sum, line) => sum + line.costTotal, 0);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const remainingXp = Math.max(0, xpNeeded - xpObtained);
  return {
    id: 'resources', lines, quantity, xpObtained, totalCost, grossCost: totalCost,
    costPerXp: xpObtained > 0 ? totalCost / xpObtained : 0,
    sufficient: xpNeeded === 0 || xpObtained >= xpNeeded,
    leftoverKolifichas: 0, remainingXp
  };
}

export function calculateCombinedMethod(resourceLines, xpNeeded, marketFoodPrice, bagPrice, rationSource = 'vitaminizedFood') {
  const resources = calculateResourceMethod(resourceLines, xpNeeded);
  const remainingXp = Math.max(0, xpNeeded - resources.xpObtained);
  const supplement = rationSource === 'kolitokenBag'
    ? calculateBagMethod(remainingXp, bagPrice)
    : calculateRationMethod(remainingXp, marketFoodPrice);
  const xpObtained = resources.xpObtained + supplement.xpObtained;
  const totalCost = resources.totalCost + supplement.totalCost;
  return {
    id: 'combined', quantity: resources.quantity + (supplement.rationQuantity || supplement.quantity || 0),
    resourceQuantity: resources.quantity,
    resourceXp: resources.xpObtained,
    resourceCost: resources.totalCost,
    remainingXp,
    rationSource,
    supplement,
    rationQuantity: supplement.rationQuantity || supplement.quantity || 0,
    xpObtained,
    totalCost,
    grossCost: totalCost,
    costPerXp: xpNeeded > 0 ? totalCost / xpNeeded : 0,
    sufficient: xpNeeded === 0 || (resources.lines.length > 0 && xpObtained >= xpNeeded && (remainingXp === 0 || supplement.sufficient)),
    leftoverKolifichas: supplement.leftoverKolifichas || 0,
    lines: resources.lines
  };
}

export function calculateSimulation(simulation) {
  const xpNeeded = calculateXpNeeded(simulation);
  const resources = calculateResourceMethod(simulation.resourceLines, xpNeeded);
  const methods = {
    vitaminizedFood: calculateRationMethod(xpNeeded, simulation.marketFoodPrice),
    kolitokenBag: calculateBagMethod(xpNeeded, simulation.bagPrice),
    resources,
    combined: calculateCombinedMethod(
      simulation.resourceLines,
      xpNeeded,
      simulation.marketFoodPrice,
      simulation.bagPrice,
      simulation.combinedRationSource || 'vitaminizedFood'
    )
  };
  const viable = Object.values(methods).filter((method) => method.sufficient && (method.totalCost > 0 || xpNeeded === 0));
  const cheapest = [...viable].sort((a, b) => a.totalCost - b.totalCost)[0]?.id ?? null;
  const selected = methods[simulation.upMethod] || null;
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
  return { xpNeeded, methods, cheapest, selected, upCost, originCost, additionalCosts, operationCost, salePrice, feePercent, fee, netRevenue, estimatedProfit, breakEven, resources };
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
