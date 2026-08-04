const integer = value => Math.max(0, Math.round(Number(value) || 0));

export function ingredientCost(ingredient, multiplier = 1) {
  const required = Math.max(1, integer(ingredient.totalQuantity || ingredient.quantityPerUnit || 1)) * Math.max(1, integer(multiplier || 1));
  const stockUsed = Math.min(required, integer(ingredient.useStockQuantity));
  const purchased = Math.max(0, required - stockUsed);
  const marketUnitPrice = integer(ingredient.unitMarketPrice);
  const economicCost = required * marketUnitPrice;

  if (ingredient.acquisitionMode === 'craft' && Array.isArray(ingredient.subRecipe) && ingredient.subRecipe.length) {
    const sub = ingredient.subRecipe.map(line => ingredientCost({ ...line, totalQuantity: (line.quantityPerUnit || line.totalQuantity || 1) * required }, 1));
    const financialCost = sub.reduce((sum, row) => sum + row.financialCost, 0);
    const subEconomic = sub.reduce((sum, row) => sum + row.economicCost, 0);
    return { required, stockUsed, purchased: 0, financialCost, economicCost: subEconomic || economicCost, subCosts: sub };
  }

  if (ingredient.acquisitionMode === 'stock') {
    return { required, stockUsed, purchased, financialCost: purchased * marketUnitPrice, economicCost, subCosts: [] };
  }

  return { required, stockUsed: 0, purchased: required, financialCost: required * marketUnitPrice, economicCost, subCosts: [] };
}

export function calculateCraftProject(project) {
  const quantity = Math.max(1, integer(project.desiredQuantity || 1));
  const ingredients = (project.ingredients || []).map(line => {
    const totalQuantity = Math.max(1, integer(line.quantityPerUnit || 1)) * quantity;
    const normalized = { ...line, totalQuantity };
    return { ...normalized, ...ingredientCost(normalized, 1), totalCost: totalQuantity * integer(line.unitMarketPrice) };
  });
  const ingredientFinancialCost = ingredients.reduce((sum, line) => sum + line.financialCost, 0);
  const ingredientEconomicCost = ingredients.reduce((sum, line) => sum + line.economicCost, 0);
  const additionalCosts = integer(project.additionalCosts);
  const financialCost = ingredientFinancialCost + additionalCosts;
  const economicCost = ingredientEconomicCost + additionalCosts;
  const accountingCost = project.costingMethod === 'financial' ? financialCost : economicCost;
  const unitFinancialCost = quantity ? financialCost / quantity : 0;
  const unitEconomicCost = quantity ? economicCost / quantity : 0;
  const unitAccountingCost = quantity ? accountingCost / quantity : 0;
  const salePriceUnit = integer(project.desiredSalePrice);
  const grossRevenue = salePriceUnit * quantity;
  const feeRate = project.saleChannel === 'HDV' ? 0.02 : 0;
  const fees = Math.round(grossRevenue * feeRate);
  const netRevenue = grossRevenue - fees;
  const potentialProfitFinancial = netRevenue - financialCost;
  const potentialProfitEconomic = netRevenue - economicCost;
  const potentialMargin = grossRevenue ? potentialProfitEconomic / grossRevenue * 100 : 0;
  const roi = economicCost ? potentialProfitEconomic / economicCost * 100 : 0;
  const marketBuyCost = integer(project.marketUnitPrice) * quantity;
  const manufactureSaving = marketBuyCost ? marketBuyCost - economicCost : null;
  const missingPrices = ingredients.filter(line => line.unitMarketPrice <= 0 && line.acquisitionMode !== 'craft');
  const readiness = !ingredients.length ? 'no_recipe' : missingPrices.length ? 'missing_prices' : 'ready';

  return {
    quantity,
    ingredients,
    ingredientFinancialCost,
    ingredientEconomicCost,
    additionalCosts,
    financialCost,
    economicCost,
    accountingCost,
    unitFinancialCost,
    unitEconomicCost,
    unitAccountingCost,
    salePriceUnit,
    grossRevenue,
    fees,
    netRevenue,
    potentialProfitFinancial,
    potentialProfitEconomic,
    potentialMargin,
    roi,
    marketBuyCost,
    manufactureSaving,
    missingPrices,
    readiness
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
      quantity,
      reservedQuantity: integer(batch.reservedQuantity),
      soldQuantity: integer(batch.soldQuantity),
      weightedUnitCost: integer(batch.unitCost),
      financialUnitCost: batch.producedQuantity ? integer(batch.financialCost / batch.producedQuantity) : integer(batch.unitCost),
      economicUnitCost: batch.producedQuantity ? integer(batch.economicCost / batch.producedQuantity) : integer(batch.unitCost),
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
    batchIds: [...new Set([...(existing.batchIds || []), batch.id])]
  };
}
