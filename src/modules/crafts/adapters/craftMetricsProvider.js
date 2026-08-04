import { calculateCraftProject } from '../utils/craftCalculations.js';

export function adaptCraftSale(sale = {}) {
  return {
    id: sale.id,
    module: 'crafts',
    sourceType: sale.sourceType || 'crafted_batch',
    sourceId: sale.sourceId || sale.batchId || sale.inventoryItemId,
    itemReference: sale.ankamaId || sale.itemNameSnapshot,
    itemNameSnapshot: sale.itemNameSnapshot,
    itemImageSnapshot: sale.itemImageSnapshot,
    ankamaId: sale.ankamaId ?? null,
    quantity: sale.quantity || 1,
    unitSalePrice: sale.unitSalePrice || 0,
    grossRevenue: sale.grossRevenue || 0,
    fees: sale.fees || 0,
    netRevenue: sale.netRevenue || 0,
    unitCost: sale.unitCost || 0,
    totalCost: sale.totalCost || 0,
    realizedProfit: sale.realizedProfit || 0,
    realizedMargin: sale.realizedMargin || 0,
    saleDate: sale.saleDate || sale.createdAt,
    server: sale.server || '',
    channel: sale.channel || 'HDV',
    status: sale.status || 'completed',
    legacyReference: null,
    original: sale
  };
}

export function getCraftModuleMetrics(state) {
  const projects = state.craftProjects || [];
  const inventory = state.craftInventory || [];
  const sales = (state.craftSales || []).map(adaptCraftSale);
  const active = projects.filter(item => !['finalized', 'sold', 'cancelled'].includes(item.status));
  const inventoryValue = inventory.reduce((sum, item) => sum + (item.quantity || 0) * (item.weightedUnitCost || 0), 0);
  const awaiting = inventory.filter(item => item.forSale && item.availableQuantity > 0);
  const awaitingSaleValue = awaiting.reduce((sum, item) => sum + item.availableQuantity * (item.desiredSalePrice || 0), 0);
  const awaitingCost = awaiting.reduce((sum, item) => sum + item.availableQuantity * (item.weightedUnitCost || 0), 0);
  const projectCalculations = new Map(projects.map(project => [project.id, calculateCraftProject(project, inventory)]));
  const investedValue = active.reduce((sum, project) => sum + (projectCalculations.get(project.id)?.totalCost || project.totalCost || project.financialCost || 0), 0) + inventoryValue;
  const potentialRevenue = awaitingSaleValue;
  const potentialProfit = awaitingSaleValue - awaitingCost;
  const realizedRevenue = sales.reduce((sum, sale) => sum + sale.netRevenue, 0);
  const realizedProfit = sales.reduce((sum, sale) => sum + sale.realizedProfit, 0);
  const alerts = [
    ...projects.filter(project => projectCalculations.get(project.id)?.readiness !== 'ready').map(project => ({ type: 'missing_price', entityId: project.id, message: project.itemNameSnapshot })),
    ...awaiting.filter(item => !item.desiredSalePrice).map(item => ({ type: 'missing_sale_price', entityId: item.id, message: item.itemNameSnapshot }))
  ];
  const recentActivities = [...(state.activities || [])].filter(item => item.module === 'crafts');
  return {
    moduleId: 'crafts',
    investedValue,
    inventoryValue,
    awaitingSaleValue,
    potentialRevenue,
    potentialProfit,
    realizedRevenue,
    realizedProfit,
    activeProjects: active.length,
    awaitingSaleCount: awaiting.reduce((sum, item) => sum + item.availableQuantity, 0),
    completedSalesCount: sales.length,
    alerts,
    recentActivities,
    sales,
    awaitingSaleItems: awaiting.map(item => ({
      id: item.id,
      module: 'crafts',
      name: item.itemNameSnapshot,
      image: item.itemImageSnapshot,
      quantity: item.availableQuantity,
      unitCost: item.weightedUnitCost,
      desiredSalePrice: item.desiredSalePrice,
      route: '/crafts/estoque'
    }))
  };
}
