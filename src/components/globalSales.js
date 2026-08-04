import { aggregateGlobalMetrics } from '../modules/global/globalDashboardAggregator.js';
import { formatCompactKamas, formatKamas, formatNumber } from '../utils/currency.js';
import { escapeHtml, imageTag, t } from './common.js';
import { renderBreadcrumbs } from './breadcrumbs.js';

function filteredSales(state) {
  const filter = state.globalSalesFilter || {};
  return aggregateGlobalMetrics(state, 'all').sales.filter(sale => {
    if (filter.module && filter.module !== 'all' && sale.module !== filter.module) return false;
    if (filter.search && !String(sale.itemNameSnapshot).toLocaleLowerCase().includes(filter.search.toLocaleLowerCase())) return false;
    if (filter.channel && filter.channel !== 'all' && sale.channel !== filter.channel) return false;
    if (filter.status && filter.status !== 'all' && sale.status !== filter.status) return false;
    const date = String(sale.saleDate || '').slice(0, 10);
    if (filter.from && date < filter.from) return false;
    if (filter.to && date > filter.to) return false;
    return true;
  });
}

export function renderGlobalSales(state) {
  const sales = filteredSales(state);
  const revenue = sales.reduce((sum,row)=>sum+row.grossRevenue,0);
  const profit = sales.reduce((sum,row)=>sum+row.realizedProfit,0);
  const f = state.globalSalesFilter || {};
  return `<section class="stack">${renderBreadcrumbs(state,[{label:t(state,'v3.sales.title')}])}<div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.sales.eyebrow'))}</span><h1>${escapeHtml(t(state,'v3.sales.title'))}</h1><p>${escapeHtml(t(state,'v3.sales.description'))}</p></div></div>
    <div class="global-kpi-grid compact-grid"><article class="card kpi"><span>${escapeHtml(t(state,'v3.sales.count'))}</span><strong>${formatNumber(sales.length)}</strong></article><article class="card kpi"><span>${escapeHtml(t(state,'v3.metrics.realizedRevenue'))}</span><strong>${formatCompactKamas(revenue)}</strong></article><article class="card kpi"><span>${escapeHtml(t(state,'v3.metrics.realizedProfit'))}</span><strong class="${profit<0?'negative':'positive'}">${formatCompactKamas(profit)}</strong></article></div>
    <article class="card section"><div class="global-filter-grid"><label class="field"><span>${escapeHtml(t(state,'v3.filters.module'))}</span><select class="select" data-global-sales-filter="module"><option value="all">${escapeHtml(t(state,'v3.filters.all'))}</option><option value="pets" ${f.module==='pets'?'selected':''}>${escapeHtml(t(state,'v3.modules.pets.title'))}</option><option value="crafts" ${f.module==='crafts'?'selected':''}>${escapeHtml(t(state,'v3.modules.crafts.title'))}</option></select></label><label class="field"><span>${escapeHtml(t(state,'common.search'))}</span><input class="input" data-global-sales-filter="search" value="${escapeHtml(f.search||'')}" placeholder="${escapeHtml(t(state,'v3.sales.searchPlaceholder'))}"></label><label class="field"><span>${escapeHtml(t(state,'v3.filters.channel'))}</span><select class="select" data-global-sales-filter="channel"><option value="all">${escapeHtml(t(state,'v3.filters.all'))}</option><option value="HDV">HDV</option><option value="Mercado HDV">Mercado HDV</option><option value="Outro Jogador">${escapeHtml(t(state,'simulation.playerChannel'))}</option><option value="Venda direta">${escapeHtml(t(state,'v3.sales.direct'))}</option></select></label><label class="field"><span>${escapeHtml(t(state,'dashboard.from'))}</span><input class="input" type="date" data-global-sales-filter="from" value="${escapeHtml(f.from||'')}"></label><label class="field"><span>${escapeHtml(t(state,'dashboard.to'))}</span><input class="input" type="date" data-global-sales-filter="to" value="${escapeHtml(f.to||'')}"></label></div></article>
    <article class="card table-card"><div class="table-scroll"><table><thead><tr><th>${escapeHtml(t(state,'v3.sales.item'))}</th><th>${escapeHtml(t(state,'v3.filters.module'))}</th><th>${escapeHtml(t(state,'v3.sales.quantity'))}</th><th>${escapeHtml(t(state,'v3.sales.cost'))}</th><th>${escapeHtml(t(state,'v3.sales.value'))}</th><th>${escapeHtml(t(state,'v3.sales.profit'))}</th><th>${escapeHtml(t(state,'v3.filters.channel'))}</th><th>${escapeHtml(t(state,'common.date'))}</th><th>${escapeHtml(t(state,'common.actions'))}</th></tr></thead><tbody>${sales.length?sales.map(sale=>`<tr><td><div class="table-item">${imageTag(sale.itemImageSnapshot,sale.itemNameSnapshot,'table-thumb')}<strong>${escapeHtml(sale.itemNameSnapshot)}</strong></div></td><td><span class="module-badge ${sale.module}">${escapeHtml(t(state,sale.module==='pets'?'v3.modules.pets.short':'v3.modules.crafts.short'))}</span></td><td>${formatNumber(sale.quantity)}</td><td>${formatKamas(sale.totalCost)}</td><td>${formatKamas(sale.grossRevenue)}</td><td><strong class="${sale.realizedProfit<0?'negative':'positive'}">${formatKamas(sale.realizedProfit)}</strong></td><td>${escapeHtml(sale.channel)}</td><td>${new Intl.DateTimeFormat(state.language).format(new Date(sale.saleDate))}</td><td><button class="button ghost compact" data-action="global-sale-details" data-module="${sale.module}" data-id="${escapeHtml(sale.id)}">${escapeHtml(t(state,'common.details'))}</button></td></tr>`).join(''):`<tr><td colspan="9" class="empty-cell">${escapeHtml(t(state,'v3.sales.empty'))}</td></tr>`}</tbody></table></div></article>
  </section>`;
}
