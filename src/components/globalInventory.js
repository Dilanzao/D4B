import { aggregateGlobalMetrics } from '../modules/global/globalDashboardAggregator.js';
import { formatKamas, formatNumber } from '../utils/currency.js';
import { escapeHtml, imageTag, t } from './common.js';
import { renderBreadcrumbs } from './breadcrumbs.js';

export function renderGlobalInventory(state) {
  const f=state.inventoryFilter||{};
  const items=aggregateGlobalMetrics(state,'all').awaitingSaleItems.filter(item=>{
    if(f.module&&f.module!=='all'&&item.module!==f.module)return false;
    if(f.search&&!item.name.toLocaleLowerCase().includes(f.search.toLocaleLowerCase()))return false;
    return true;
  });
  return `<section class="stack">${renderBreadcrumbs(state,[{label:t(state,'v3.inventory.title')}])}<div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.inventory.eyebrow'))}</span><h1>${escapeHtml(t(state,'v3.inventory.title'))}</h1><p>${escapeHtml(t(state,'v3.inventory.description'))}</p></div></div><article class="card section"><div class="global-filter-grid"><label class="field"><span>${escapeHtml(t(state,'v3.filters.module'))}</span><select class="select" data-inventory-filter="module"><option value="all">${escapeHtml(t(state,'v3.filters.all'))}</option><option value="pets" ${f.module==='pets'?'selected':''}>${escapeHtml(t(state,'v3.modules.pets.title'))}</option><option value="crafts" ${f.module==='crafts'?'selected':''}>${escapeHtml(t(state,'v3.modules.crafts.title'))}</option></select></label><label class="field"><span>${escapeHtml(t(state,'common.search'))}</span><input class="input" data-inventory-filter="search" value="${escapeHtml(f.search||'')}"></label></div></article><div class="inventory-grid">${items.length?items.map(item=>`<article class="card inventory-card">${imageTag(item.image,item.name,'inventory-image')}<div><span class="module-badge ${item.module}">${escapeHtml(t(state,item.module==='pets'?'v3.modules.pets.short':'v3.modules.crafts.short'))}</span><h2>${escapeHtml(item.name)}</h2><p>${formatNumber(item.quantity)} ${escapeHtml(t(state,'v3.inventory.units'))}</p><dl><div><dt>${escapeHtml(t(state,'v3.sales.cost'))}</dt><dd>${formatKamas(item.unitCost)}</dd></div><div><dt>${escapeHtml(t(state,'v3.inventory.desiredPrice'))}</dt><dd>${formatKamas(item.desiredSalePrice)}</dd></div><div><dt>${escapeHtml(t(state,'v3.metrics.potentialProfit'))}</dt><dd class="${item.desiredSalePrice-item.unitCost<0?'negative':'positive'}">${formatKamas((item.desiredSalePrice-item.unitCost)*item.quantity)}</dd></div></dl><button class="button primary" data-action="navigate-path" data-path="${escapeHtml(item.route)}">${escapeHtml(t(state,'v3.inventory.open'))}</button></div></article>`).join(''):`<div class="card empty module-empty"><h3>${escapeHtml(t(state,'v3.inventory.empty'))}</h3></div>`}</div></section>`;
}
