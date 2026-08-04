import { safeGet, safeSet } from '../../../services/storageService.js';
import { createId, nowIso } from '../../../utils/identifiers.js';

export const CRAFT_STORAGE_KEYS = Object.freeze({
  projects: 'd4b_craft_projects_v1',
  batches: 'd4b_craft_batches_v1',
  inventory: 'd4b_craft_inventory_v1',
  sales: 'd4b_craft_sales_v1',
  prices: 'd4b_craft_prices_v1',
  activities: 'd4b_global_activities_v1',
  schema: 'd4b_schema_version'
});

const nonNegativeInt = value => Math.max(0, Math.round(Number(value) || 0));
const validStatus = (value, fallback) => typeof value === 'string' && value ? value : fallback;

export function normalizeIngredient(input = {}) {
  return {
    id: input.id || createId('ingredient'),
    ankamaId: input.ankamaId ?? input.ankama_id ?? null,
    nameSnapshot: input.nameSnapshot || input.name || 'Item sem nome',
    imageSnapshot: input.imageSnapshot || input.imageUrl || './assets/placeholders/item-fallback.svg',
    typeSnapshot: input.typeSnapshot || input.type || 'resource',
    quantityPerUnit: Math.max(1, nonNegativeInt(input.quantityPerUnit || input.quantity || 1)),
    totalQuantity: Math.max(1, nonNegativeInt(input.totalQuantity || input.quantity || 1)),
    unitMarketPrice: nonNegativeInt(input.unitMarketPrice || input.unitPrice),
    stockQuantity: nonNegativeInt(input.stockQuantity),
    useStockQuantity: nonNegativeInt(input.useStockQuantity),
    acquisitionMode: ['buy', 'stock', 'craft'].includes(input.acquisitionMode) ? input.acquisitionMode : 'buy',
    subRecipe: Array.isArray(input.subRecipe) ? input.subRecipe.map(normalizeIngredient) : [],
    notes: input.notes || ''
  };
}

export function normalizeCraftProject(input = {}) {
  const createdAt = input.createdAt || nowIso();
  return {
    id: input.id || createId('craft-project'),
    ankamaId: input.ankamaId ?? input.ankama_id ?? null,
    itemNameSnapshot: input.itemNameSnapshot || input.itemName || 'Projeto sem item',
    itemImageSnapshot: input.itemImageSnapshot || input.imageUrl || './assets/placeholders/item-fallback.svg',
    itemTypeSnapshot: input.itemTypeSnapshot || input.itemType || 'item',
    itemLevelSnapshot: nonNegativeInt(input.itemLevelSnapshot || input.level),
    desiredQuantity: Math.max(1, nonNegativeInt(input.desiredQuantity || input.quantity || 1)),
    status: validStatus(input.status, 'draft'),
    ingredients: Array.isArray(input.ingredients) ? input.ingredients.map(normalizeIngredient) : [],
    additionalCosts: nonNegativeInt(input.additionalCosts),
    desiredSalePrice: nonNegativeInt(input.desiredSalePrice),
    marketUnitPrice: nonNegativeInt(input.marketUnitPrice),
    saleChannel: input.saleChannel || 'HDV',
    server: input.server || '',
    costingMethod: input.costingMethod || 'weighted_average',
    financialCost: nonNegativeInt(input.financialCost),
    economicCost: nonNegativeInt(input.economicCost),
    accountingCost: nonNegativeInt(input.accountingCost),
    replacementCost: nonNegativeInt(input.replacementCost),
    notes: input.notes || '',
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    completedAt: input.completedAt || null
  };
}

export function normalizeCraftBatch(input = {}) {
  const createdAt = input.createdAt || nowIso();
  const producedQuantity = Math.max(1, nonNegativeInt(input.producedQuantity || input.quantity || 1));
  const soldQuantity = Math.min(producedQuantity, nonNegativeInt(input.soldQuantity));
  const reservedQuantity = Math.min(producedQuantity - soldQuantity, nonNegativeInt(input.reservedQuantity));
  const remainingQuantity = Math.max(0, nonNegativeInt(input.remainingQuantity ?? producedQuantity - soldQuantity));
  return {
    id: input.id || createId('craft-batch'),
    projectId: input.projectId || null,
    ankamaId: input.ankamaId ?? null,
    itemNameSnapshot: input.itemNameSnapshot || 'Item fabricado',
    itemImageSnapshot: input.itemImageSnapshot || './assets/placeholders/item-fallback.svg',
    itemTypeSnapshot: input.itemTypeSnapshot || 'item',
    producedQuantity,
    remainingQuantity,
    reservedQuantity,
    soldQuantity,
    availableQuantity: Math.max(0, remainingQuantity - reservedQuantity),
    financialCost: nonNegativeInt(input.financialCost),
    economicCost: nonNegativeInt(input.economicCost),
    accountingCost: nonNegativeInt(input.accountingCost),
    unitCost: nonNegativeInt(input.unitCost),
    desiredSalePrice: nonNegativeInt(input.desiredSalePrice),
    marketUnitPrice: nonNegativeInt(input.marketUnitPrice),
    status: validStatus(input.status, 'in_stock'),
    notes: input.notes || '',
    createdAt,
    updatedAt: input.updatedAt || createdAt
  };
}

export function normalizeInventoryItem(input = {}) {
  const quantity = nonNegativeInt(input.quantity);
  const reservedQuantity = Math.min(quantity, nonNegativeInt(input.reservedQuantity));
  return {
    id: input.id || createId('inventory'),
    ankamaId: input.ankamaId ?? null,
    itemNameSnapshot: input.itemNameSnapshot || 'Item em estoque',
    itemImageSnapshot: input.itemImageSnapshot || './assets/placeholders/item-fallback.svg',
    itemTypeSnapshot: input.itemTypeSnapshot || 'item',
    module: 'crafts',
    quantity,
    reservedQuantity,
    availableQuantity: Math.max(0, quantity - reservedQuantity),
    soldQuantity: nonNegativeInt(input.soldQuantity),
    weightedUnitCost: nonNegativeInt(input.weightedUnitCost),
    financialUnitCost: nonNegativeInt(input.financialUnitCost),
    economicUnitCost: nonNegativeInt(input.economicUnitCost),
    desiredSalePrice: nonNegativeInt(input.desiredSalePrice),
    marketUnitPrice: nonNegativeInt(input.marketUnitPrice),
    forSale: Boolean(input.forSale),
    batchIds: Array.isArray(input.batchIds) ? [...new Set(input.batchIds.filter(Boolean))] : [],
    updatedAt: input.updatedAt || nowIso()
  };
}

export function normalizeCraftSale(input = {}) {
  const quantity = Math.max(1, nonNegativeInt(input.quantity || 1));
  const unitSalePrice = nonNegativeInt(input.unitSalePrice || input.salePrice);
  const grossRevenue = nonNegativeInt(input.grossRevenue || unitSalePrice * quantity);
  const fees = nonNegativeInt(input.fees);
  const totalCost = nonNegativeInt(input.totalCost || nonNegativeInt(input.unitCost) * quantity);
  const netRevenue = nonNegativeInt(input.netRevenue || grossRevenue - fees - nonNegativeInt(input.otherCosts));
  const realizedProfit = Number.isFinite(Number(input.realizedProfit)) ? Math.round(Number(input.realizedProfit)) : netRevenue - totalCost;
  const createdAt = input.createdAt || nowIso();
  return {
    id: input.id || createId('craft-sale'),
    module: 'crafts',
    sourceType: input.sourceType || 'crafted_batch',
    sourceId: input.sourceId || input.batchId || null,
    projectId: input.projectId || null,
    batchId: input.batchId || null,
    inventoryItemId: input.inventoryItemId || null,
    ankamaId: input.ankamaId ?? null,
    itemNameSnapshot: input.itemNameSnapshot || 'Item vendido',
    itemImageSnapshot: input.itemImageSnapshot || './assets/placeholders/item-fallback.svg',
    itemTypeSnapshot: input.itemTypeSnapshot || 'item',
    quantity,
    unitSalePrice,
    grossRevenue,
    fees,
    otherCosts: nonNegativeInt(input.otherCosts),
    netRevenue,
    unitCost: nonNegativeInt(input.unitCost),
    totalCost,
    realizedProfit,
    realizedMargin: grossRevenue ? realizedProfit / grossRevenue * 100 : 0,
    saleDate: input.saleDate || createdAt,
    server: input.server || '',
    channel: input.channel || 'HDV',
    buyer: input.buyer || '',
    notes: input.notes || '',
    status: input.status || 'completed',
    createdAt
  };
}

export function normalizeActivity(input = {}) {
  return {
    id: input.id || createId('activity'),
    module: input.module || 'crafts',
    action: input.action || 'updated',
    itemName: input.itemName || '',
    itemImage: input.itemImage || '',
    entityId: input.entityId || null,
    route: input.route || '/',
    value: Number.isFinite(Number(input.value)) ? Math.round(Number(input.value)) : null,
    createdAt: input.createdAt || nowIso()
  };
}

export function loadCraftData() {
  const projects = safeGet(CRAFT_STORAGE_KEYS.projects, []);
  const batches = safeGet(CRAFT_STORAGE_KEYS.batches, []);
  const inventory = safeGet(CRAFT_STORAGE_KEYS.inventory, []);
  const sales = safeGet(CRAFT_STORAGE_KEYS.sales, []);
  const prices = safeGet(CRAFT_STORAGE_KEYS.prices, {});
  const activities = safeGet(CRAFT_STORAGE_KEYS.activities, []);
  return {
    projects: Array.isArray(projects) ? projects.map(normalizeCraftProject) : [],
    batches: Array.isArray(batches) ? batches.map(normalizeCraftBatch) : [],
    inventory: Array.isArray(inventory) ? inventory.map(normalizeInventoryItem) : [],
    sales: Array.isArray(sales) ? sales.map(normalizeCraftSale) : [],
    prices: prices && typeof prices === 'object' && !Array.isArray(prices) ? prices : {},
    activities: Array.isArray(activities) ? activities.map(normalizeActivity) : []
  };
}

export const craftStorage = {
  saveProjects: value => safeSet(CRAFT_STORAGE_KEYS.projects, value),
  saveBatches: value => safeSet(CRAFT_STORAGE_KEYS.batches, value),
  saveInventory: value => safeSet(CRAFT_STORAGE_KEYS.inventory, value),
  saveSales: value => safeSet(CRAFT_STORAGE_KEYS.sales, value),
  savePrices: value => safeSet(CRAFT_STORAGE_KEYS.prices, value),
  saveActivities: value => safeSet(CRAFT_STORAGE_KEYS.activities, value),
  saveSchema: value => safeSet(CRAFT_STORAGE_KEYS.schema, value)
};
