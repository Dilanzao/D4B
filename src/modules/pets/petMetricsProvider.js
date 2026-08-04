import { calculateSimulation } from '../../utils/calculations.js';
import { adaptLegacyPetSales } from './legacyPetSalesAdapter.js';

const safeCalc = simulation => {
  try { return calculateSimulation(simulation); } catch { return null; }
};

export function getPetModuleMetrics(state) {
  const simulations = state.simulations || [];
  const sales = adaptLegacyPetSales(state.sales || []);
  const active = simulations.filter(item => item.status !== 'sold' && item.status !== 'cancelled');
  const calculations = active.map(sim => ({ sim, calc: safeCalc(sim) })).filter(row => row.calc);
  const investedValue = calculations.reduce((sum, row) => sum + (row.calc.originCost || 0) + (row.calc.upCost || 0) + (row.calc.additionalCosts || 0), 0);
  const potentialRevenue = calculations.reduce((sum, row) => sum + (row.calc.salePrice || 0), 0);
  const potentialProfit = calculations.reduce((sum, row) => sum + (row.calc.profit || 0), 0);
  const awaiting = calculations.filter(row => row.sim.status === 'awaiting_sale');
  const awaitingSaleValue = awaiting.reduce((sum, row) => sum + (row.calc.salePrice || 0), 0);
  const realizedRevenue = sales.reduce((sum, sale) => sum + sale.netRevenue, 0);
  const realizedProfit = sales.reduce((sum, sale) => sum + sale.realizedProfit, 0);
  const recentActivities = [
    ...simulations.slice(0, 10).map(sim => ({
      id: `pet-sim-${sim.id}`,
      module: 'pets',
      action: 'simulation_updated',
      itemName: sim.creatureCanonicalName || sim.name,
      itemImage: sim.creatureImageUrl,
      entityId: sim.id,
      route: `/pets/simulacoes/${encodeURIComponent(sim.id)}`,
      value: safeCalc(sim)?.upCost || null,
      createdAt: sim.updatedAt || sim.createdAt
    })),
    ...sales.slice(0, 10).map(sale => ({
      id: `pet-sale-${sale.id}`,
      module: 'pets',
      action: 'sale_registered',
      itemName: sale.itemNameSnapshot,
      itemImage: sale.itemImageSnapshot,
      entityId: sale.id,
      route: '/pets/vendas',
      value: sale.realizedProfit,
      createdAt: sale.saleDate
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    moduleId: 'pets',
    investedValue,
    inventoryValue: 0,
    awaitingSaleValue,
    potentialRevenue,
    potentialProfit,
    realizedRevenue,
    realizedProfit,
    activeProjects: active.length,
    awaitingSaleCount: awaiting.length,
    completedSalesCount: sales.length,
    alerts: [],
    recentActivities,
    sales,
    awaitingSaleItems: awaiting.map(row => ({
      id: row.sim.id,
      module: 'pets',
      name: row.sim.creatureCanonicalName || row.sim.name,
      image: row.sim.creatureImageUrl,
      quantity: 1,
      unitCost: (row.calc.originCost || 0) + (row.calc.upCost || 0),
      desiredSalePrice: row.calc.salePrice || 0,
      route: `/pets/simulacoes/${encodeURIComponent(row.sim.id)}`
    }))
  };
}
