import { inventorySnapshotFor } from './craftRecipeTree.js';

const integer = value => Math.max(0, Math.round(Number(value) || 0));

function calculateIngredient(ingredient, multiplier = 1, inventory = [], ancestry = []) {
  const required = Math.max(1, integer(ingredient.quantityPerUnit || ingredient.totalQuantity || 1)) * Math.max(1, integer(multiplier || 1));
  const stock = inventorySnapshotFor(ingredient, inventory);
  const requestedStock = Math.min(required, integer(ingredient.useStockQuantity));
  const stockUsed = Math.min(requestedStock, stock.stockAvailable);
  const remaining = Math.max(0, required - stockUsed);
  const stockCost = stockUsed * stock.stockUnitCost;
  const unitMarketPrice = integer(ingredient.unitMarketPrice);
  const mode = ingredient.acquisitionMode === 'stock' ? 'buy' : ingredient.acquisitionMode || 'buy';
  const cycle = ingredient.ankamaId != null && ancestry.some(id => String(id) === String(ingredient.ankamaId));
  let operationCost = 0;
  let subCosts = [];
  let missing = [];

  if (remaining > 0 && mode === 'craft') {
    if (cycle) {
      missing.push({ id: ingredient.id, name: ingredient.nameSnapshot, reason: 'cycle' });
    } else if (Array.isArray(ingredient.subRecipe) && ingredient.subRecipe.length) {
      const nextAncestry = [...ancestry, ingredient.ankamaId].filter(value => value != null);
      subCosts = ingredient.subRecipe.map(line => calculateIngredient(line, remaining, inventory, nextAncestry));
      operationCost = subCosts.reduce((sum, row) => sum + row.cost, 0);
      missing = subCosts.flatMap(row => row.missing);
    } else {
      missing.push({ id: ingredient.id, name: ingredient.nameSnapshot, reason: 'recipe' });
    }
  } else if (remaining > 0 && mode === 'buy') {
    if (unitMarketPrice <= 0) missing.push({ id: ingredient.id, name: ingredient.nameSnapshot, reason: 'price' });
    operationCost = remaining * unitMarketPrice;
  } else if (remaining > 0 && mode === 'drop') {
    operationCost = 0;
  }

  return {
    ...ingredient,
    acquisitionMode: mode,
    required,
    totalQuantity: required,
    stockAvailable: stock.stockAvailable,
    stockUnitCost: stock.stockUnitCost,
    inventoryItemId: stock.inventoryItemId,
    stockUsed,
    remaining,
    purchased: mode === 'buy' ? remaining : 0,
    dropped: mode === 'drop' ? remaining : 0,
    crafted: mode === 'craft' ? remaining : 0,
    stockCost,
    operationCost,
    cost: stockCost + operationCost,
    totalCost: stockCost + operationCost,
    subCosts,
    missing
  };
}

export function ingredientCost(ingredient, multiplier = 1, inventory = []) {
  return calculateIngredient(ingredient, multiplier, inventory);
}

export function calculateCraftProject(project, inventory = []) {
  const quantity = Math.max(1, integer(project.desiredQuantity || 1));
  const ingredients = (project.ingredients || []).map(line => calculateIngredient(line, quantity, inventory, []));
  const ingredientCostTotal = ingredients.reduce((sum, line) => sum + line.cost, 0);
  const additionalCosts = integer(project.additionalCosts);
  const totalCost = ingredientCostTotal + additionalCosts;
  const unitCost = quantity ? totalCost / quantity : 0;
  const salePriceUnit = integer(project.desiredSalePrice);
  const grossRevenue = salePriceUnit * quantity;
  const feeRate = project.saleChannel === 'HDV' ? 0.02 : 0;
  const fees = Math.round(grossRevenue * feeRate);
  const netRevenue = grossRevenue - fees;
  const potentialProfit = netRevenue - totalCost;
  const potentialMargin = grossRevenue ? potentialProfit / grossRevenue * 100 : 0;
  const roi = totalCost ? potentialProfit / totalCost * 100 : 0;
  const marketBuyCost = integer(project.marketUnitPrice) * quantity;
  const manufactureSaving = marketBuyCost ? marketBuyCost - totalCost : null;
  const missingPrices = ingredients.flatMap(line => line.missing).filter(item => item.reason === 'price');
  const missingRecipes = ingredients.flatMap(line => line.missing).filter(item => item.reason !== 'price');
  const readiness = !ingredients.length ? 'no_recipe' : (missingPrices.length || missingRecipes.length) ? 'missing_prices' : 'ready';

  return {
    quantity,
    ingredients,
    ingredientCost: ingredientCostTotal,
    additionalCosts,
    totalCost,
    unitCost,
    salePriceUnit,
    grossRevenue,
    fees,
    netRevenue,
    potentialProfit,
    potentialMargin,
    roi,
    marketBuyCost,
    manufactureSaving,
    missingPrices,
    missingRecipes,
    readiness,
    // Aliases legados preservados para adapters e dados anteriores.
    ingredientFinancialCost: ingredientCostTotal,
    ingredientEconomicCost: ingredientCostTotal,
    financialCost: totalCost,
    economicCost: totalCost,
    accountingCost: totalCost,
    unitFinancialCost: unitCost,
    unitEconomicCost: unitCost,
    unitAccountingCost: unitCost,
    potentialProfitFinancial: potentialProfit,
    potentialProfitEconomic: potentialProfit
  };
}

export function calculateCraftSale(input) {
  const quantity = Math.max(1, integer(input.quantity || 1));
  const unitSalePrice = integer(input.unitSalePrice || input.salePrice);
  const grossRevenue = quantity * unitSalePrice;
  const feeRate = input.channel === 'HDV' ? 0.02 : 0;
  const fees = Math.round(grossRevenue * feeRate);
  const otherCosts = integer(input.otherCosts);
  const netRevenue = grossRevenue - fees - otherCosts;
  const unitCost = integer(input.unitCost);
  const totalCost = unitCost * quantity;
  const realizedProfit = netRevenue - totalCost;
  const realizedMargin = grossRevenue ? realizedProfit / grossRevenue * 100 : 0;
  const roi = totalCost ? realizedProfit / totalCost * 100 : 0;
  return { quantity, unitSalePrice, grossRevenue, fees, otherCosts, netRevenue, unitCost, totalCost, realizedProfit, realizedMargin, roi };
}

export function mergeInventory(existing, batch) {
  const quantity = integer(batch.remainingQuantity);
  if (!existing) {
    return {
      ankamaId: batch.ankamaId,
      itemNameSnapshot: batch.itemNameSnapshot,
      itemImageSnapshot: batch.itemImageSnapshot,
      itemTypeSnapshot: batch.itemTypeSnapshot,
      professionTag: batch.professionTag || 'unknown',
      quantity,
      reservedQuantity: integer(batch.reservedQuantity),
      soldQuantity: integer(batch.soldQuantity),
      weightedUnitCost: integer(batch.unitCost),
      financialUnitCost: integer(batch.unitCost),
      economicUnitCost: integer(batch.unitCost),
      desiredSalePrice: integer(batch.desiredSalePrice),
      forSale: batch.status === 'awaiting_sale',
      batchIds: [batch.id]
    };
  }
  const oldValue = integer(existing.quantity) * integer(existing.weightedUnitCost);
  const newValue = quantity * integer(batch.unitCost);
  const totalQuantity = integer(existing.quantity) + quantity;
  return {
    ...existing,
    quantity: totalQuantity,
    availableQuantity: Math.max(0, totalQuantity - integer(existing.reservedQuantity)),
    weightedUnitCost: totalQuantity ? Math.round((oldValue + newValue) / totalQuantity) : 0,
    desiredSalePrice: integer(batch.desiredSalePrice) || existing.desiredSalePrice,
    forSale: existing.forSale || batch.status === 'awaiting_sale',
    professionTag: existing.professionTag || batch.professionTag || 'unknown',
    batchIds: [...new Set([...(existing.batchIds || []), batch.id])]
  };
}
