import { aggregateGlobalMetrics } from '../modules/global/globalDashboardAggregator.js';
import { formatCompactKamas, formatKamas, formatNumber } from '../utils/currency.js';
import { escapeHtml, imageTag, t } from './common.js';
import { moreFiltersLabel, renderDisclosure, renderPageHead } from './pageLayout.js';

// Pets gravam "Mercado HDV" e crafts gravam "HDV": para o usuário é o mesmo canal.
const channelGroup = channel => channel === 'Mercado HDV' ? 'HDV' : channel;

const CHANNEL_KEYS = { 'Outro Jogador':'simulation.playerChannel', 'Venda direta':'v3.sales.direct', Troca:'v3.sales.trade', Guilda:'v3.sales.guild', 'Comércio':'v3.sales.commerce', Outro:'v3.sales.other' };

function channelLabel(state, channel) {
  const group = channelGroup(channel);
  return CHANNEL_KEYS[group] ? t(state, CHANNEL_KEYS[group]) : group;
}

function filteredSales(state) {
  const filter = state.globalSalesFilter || {};
  return aggregateGlobalMetrics(state, 'all').sales.filter(sale => {
    if (filter.module && filter.module !== 'all' && sale.module !== filter.module) return false;
    if (filter.search && !String(sale.itemNameSnapshot).toLocaleLowerCase().includes(filter.search.toLocaleLowerCase())) return false;
    if (filter.channel && filter.channel !== 'all' && channelGroup(sale.channel) !== channelGroup(filter.channel)) return false;
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
  const channels = ['HDV', ...Object.keys(CHANNEL_KEYS)];
  const extraCount = [f.channel && f.channel !== 'all', f.from, f.to].filter(Boolean).length;
  const extra = `<div class="filters-grid"><label class="field"><span>${escapeHtml(t(state,'v3.filters.channel'))}</span><select class="select" data-global-sales-filter="channel"><option value="all">${escapeHtml(t(state,'v3.filters.all'))}</option>${channels.map(channel=>`<option value="${escapeHtml(channel)}" ${f.channel===channel?'selected':''}>${escapeHtml(channelLabel(state,channel))}</option>`).join('')}</select></label><label class="field"><span>${escapeHtml(t(state,'dashboard.from'))}</span><input class="input" type="date" data-global-sales-filter="from" value="${escapeHtml(f.from||'')}"></label><label class="field"><span>${escapeHtml(t(state,'dashboard.to'))}</span><input class="input" type="date" data-global-sales-filter="to" value="${escapeHtml(f.to||'')}"></label></div>`;
  const th = (key,cls='') => `<th class="${cls}">${escapeHtml(t(state,key))}</th>`;
  return `<section class="stack">${renderPageHead(state,{title:t(state,'v3.nav.sales'),tabs:'sales'})}
    <div class="global-kpi-grid compact-grid"><article class="card kpi"><span>${escapeHtml(t(state,'v3.sales.count'))}</span><strong>${formatNumber(sales.length,state.language)}</strong></article><article class="card kpi"><span>${escapeHtml(t(state,'v3.metrics.realizedRevenue'))}</span><strong>${formatCompactKamas(revenue,state.language)}</strong></article><article class="card kpi"><span>${escapeHtml(t(state,'v3.metrics.realizedProfit'))}</span><strong class="${profit<0?'negative':'positive'}">${formatCompactKamas(profit,state.language)}</strong></article></div>
    <div><div class="filters-row"><label class="field"><span>${escapeHtml(t(state,'common.search'))}</span><input class="input" data-global-sales-filter="search" value="${escapeHtml(f.search||'')}" placeholder="${escapeHtml(t(state,'v3.sales.searchPlaceholder'))}"></label><label class="field"><span>${escapeHtml(t(state,'ux.area'))}</span><select class="select" data-global-sales-filter="module"><option value="all">${escapeHtml(t(state,'v3.filters.all'))}</option><option value="pets" ${f.module==='pets'?'selected':''}>${escapeHtml(t(state,'v3.modules.pets.title'))}</option><option value="crafts" ${f.module==='crafts'?'selected':''}>${escapeHtml(t(state,'v3.modules.crafts.title'))}</option></select></label></div>${renderDisclosure(state,'global-sales-filters',moreFiltersLabel(state,extraCount),extra)}</div>
    <article class="card table-card"><div class="table-scroll"><table><thead><tr>${th('v3.sales.item')}${th('ux.area')}${th('v3.sales.quantity','num')}${th('v3.sales.cost','num')}${th('v3.sales.value','num')}${th('v3.sales.profit','num')}${th('v3.filters.channel')}${th('common.date')}<th><span class="visually-hidden">${escapeHtml(t(state,'common.actions'))}</span></th></tr></thead><tbody>${sales.length?sales.map(sale=>`<tr><td><div class="table-item">${imageTag(sale.itemImageSnapshot,sale.itemNameSnapshot,'table-thumb')}<strong>${escapeHtml(sale.itemNameSnapshot)}</strong></div></td><td><span class="module-badge ${sale.module}">${escapeHtml(t(state,sale.module==='pets'?'v3.modules.pets.short':'v3.modules.crafts.short'))}</span></td><td class="num">${formatNumber(sale.quantity,state.language)}</td><td class="num">${formatKamas(sale.totalCost,state.language)}</td><td class="num">${formatKamas(sale.grossRevenue,state.language)}</td><td class="num"><strong class="${sale.realizedProfit<0?'negative':'positive'}">${formatKamas(sale.realizedProfit,state.language)}</strong></td><td>${escapeHtml(channelLabel(state,sale.channel))}</td><td>${new Intl.DateTimeFormat(state.language).format(new Date(sale.saleDate))}</td><td><button class="button ghost compact" data-action="global-sale-details" data-module="${sale.module}" data-id="${escapeHtml(sale.id)}">${escapeHtml(t(state,'common.details'))}</button></td></tr>`).join(''):`<tr><td colspan="9" class="empty-cell">${escapeHtml(t(state,'v3.sales.empty'))}</td></tr>`}</tbody></table></div></article>
  </section>`;
}
