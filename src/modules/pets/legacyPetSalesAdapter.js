export function adaptLegacyPetSale(sale = {}) {
  const quantity = 1;
  const grossRevenue = Number(sale.salePrice) || 0;
  const totalCost = (Number(sale.originCost) || 0) + (Number(sale.upCost) || 0) + (Number(sale.additionalCosts) || 0);
  const fees = Number(sale.fee) || 0;
  const netRevenue = grossRevenue - fees;
  const realizedProfit = Number.isFinite(Number(sale.profit)) ? Number(sale.profit) : netRevenue - totalCost;
  return {
    id: sale.id,
    module: 'pets',
    sourceType: 'pet_simulation',
    sourceId: sale.simulationId || null,
    itemReference: sale.creatureId || sale.creatureCanonicalName || sale.id,
    itemNameSnapshot: sale.creatureCanonicalName || sale.simulationName || 'Pet',
    itemImageSnapshot: sale.creatureImageUrl || './assets/placeholders/creature-fallback.svg',
    ankamaId: sale.creatureAnkamaId ?? null,
    quantity,
    unitSalePrice: grossRevenue,
    grossRevenue,
    fees,
    netRevenue,
    unitCost: totalCost,
    totalCost,
    realizedProfit,
    realizedMargin: grossRevenue ? realizedProfit / grossRevenue * 100 : 0,
    saleDate: sale.soldAt || sale.createdAt,
    server: sale.server || '',
    channel: sale.saleChannel || 'Mercado HDV',
    status: 'completed',
    legacyReference: sale.id,
    original: sale
  };
}

export const adaptLegacyPetSales = sales => (sales || []).map(adaptLegacyPetSale);
