import { getPetModuleMetrics } from '../pets/petMetricsProvider.js';
import { getCraftModuleMetrics } from '../crafts/adapters/craftMetricsProvider.js';

const METRIC_FIELDS = ['investedValue', 'inventoryValue', 'awaitingSaleValue', 'potentialRevenue', 'potentialProfit', 'activeProjects', 'awaitingSaleCount'];

export function getModuleMetrics(state) {
  return { pets: getPetModuleMetrics(state), crafts: getCraftModuleMetrics(state) };
}

function startOfDay(date) { const value = new Date(date); value.setHours(0,0,0,0); return value; }
function endOfDay(date) { const value = new Date(date); value.setHours(23,59,59,999); return value; }

export function resolveGlobalPeriod(filters = {}, now = new Date()) {
  const period = filters.period || 'all';
  if (period === 'custom') {
    return {
      from: filters.from ? startOfDay(`${filters.from}T00:00:00`) : null,
      to: filters.to ? endOfDay(`${filters.to}T00:00:00`) : null
    };
  }
  if (period === 'today') return { from: startOfDay(now), to: endOfDay(now) };
  if (period === '7') { const from = startOfDay(now); from.setDate(from.getDate()-6); return { from, to:endOfDay(now) }; }
  if (period === '30') { const from = startOfDay(now); from.setDate(from.getDate()-29); return { from, to:endOfDay(now) }; }
  if (period === 'month') return { from:new Date(now.getFullYear(),now.getMonth(),1), to:endOfDay(now) };
  return { from:null, to:null };
}

function inPeriod(value, range) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return false;
  return (!range.from || date >= range.from) && (!range.to || date <= range.to);
}

function filteredModuleMetrics(metrics, range) {
  const sales = (metrics.sales || []).filter(sale => inPeriod(sale.saleDate, range));
  const recentActivities = (metrics.recentActivities || []).filter(activity => inPeriod(activity.createdAt, range));
  return {
    ...metrics,
    sales,
    recentActivities,
    realizedRevenue: sales.reduce((sum,sale)=>sum+(Number(sale.netRevenue)||0),0),
    realizedProfit: sales.reduce((sum,sale)=>sum+(Number(sale.realizedProfit)||0),0),
    completedSalesCount: sales.length
  };
}

export function aggregateGlobalMetrics(state, filterInput = state.globalFilters || {}) {
  const filters = typeof filterInput === 'string' ? { module:filterInput, period:'all' } : { module:'all', period:'all', ...filterInput };
  const range = resolveGlobalPeriod(filters);
  const rawModules = getModuleMetrics(state);
  const modules = Object.fromEntries(Object.entries(rawModules).map(([id,metrics])=>[id,filteredModuleMetrics(metrics,range)]));
  const selected = filters.module === 'all' ? Object.values(modules) : [modules[filters.module]].filter(Boolean);
  const totals = Object.fromEntries(METRIC_FIELDS.map(field => [field, selected.reduce((sum, metrics) => sum + (Number(metrics[field]) || 0), 0)]));
  totals.realizedRevenue = selected.reduce((sum,metrics)=>sum+(Number(metrics.realizedRevenue)||0),0);
  totals.realizedProfit = selected.reduce((sum,metrics)=>sum+(Number(metrics.realizedProfit)||0),0);
  totals.completedSalesCount = selected.reduce((sum,metrics)=>sum+(Number(metrics.completedSalesCount)||0),0);
  const recentActivities = selected.flatMap(metrics => metrics.recentActivities || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const awaitingSaleItems = selected.flatMap(metrics => metrics.awaitingSaleItems || []);
  const sales = selected.flatMap(metrics => metrics.sales || []).sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
  const alerts = selected.flatMap(metrics => (metrics.alerts || []).map(alert => ({ ...alert, module: metrics.moduleId })));
  return { ...totals, estimatedAssets: totals.inventoryValue, modules, recentActivities, awaitingSaleItems, sales, alerts, range, filters };
}
