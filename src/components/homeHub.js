import { aggregateGlobalMetrics } from '../modules/global/globalDashboardAggregator.js';
import { formatCompactKamas, formatKamas, formatNumber } from '../utils/currency.js';
import { adSlot, escapeHtml, icon, imageTag, t } from './common.js';
import { renderPageHead } from './pageLayout.js';

const metricCard = (label, value, { note = '', tone = '' } = {}) => `<article class="card kpi global-kpi"><span>${escapeHtml(label)}</span><strong class="${tone}">${escapeHtml(value)}</strong>${note?`<small>${escapeHtml(note)}</small>`:''}</article>`;
const toneOf = value => value < 0 ? 'negative' : value > 0 ? 'positive' : '';

function moduleCard(state, id, metrics, isNew) {
  const pets = id === 'pets';
  const title = t(state, pets ? 'v3.modules.pets.title' : 'v3.modules.crafts.title');
  const newLabel = t(state, pets ? 'home.newSimulation' : 'v3.crafts.newProject');
  const newAction = pets ? 'new-simulation' : 'new-craft-project';
  const open = `<button class="button secondary" data-action="route" data-route="${pets?'pets':'crafts'}">${escapeHtml(t(state,pets?'v3.modules.pets.open':'v3.modules.crafts.open'))}</button>`;
  return `<article class="card home-module module-card-compact module-${id}">
    <div class="home-module-head"><span class="module-icon">${icon(pets?'heart':'craft',22)}</span><h2>${escapeHtml(title)}</h2></div>
    ${isNew?`<p>${escapeHtml(t(state, pets ? 'v3.modules.pets.description' : 'v3.modules.crafts.description'))}</p>`:`<div class="module-quick-metrics">
      <div><span>${escapeHtml(t(state,'v3.metrics.activeProjects'))}</span><strong>${formatNumber(metrics.activeProjects,state.language)}</strong></div>
      <div><span>${escapeHtml(t(state,'v3.metrics.realizedProfit'))}</span><strong class="${toneOf(metrics.realizedProfit)}">${formatCompactKamas(metrics.realizedProfit,state.language)}</strong></div>
      <div><span>${escapeHtml(t(state,'v3.metrics.awaitingSale'))}</span><strong>${formatCompactKamas(metrics.awaitingSaleValue,state.language)}</strong></div>
    </div>`}
    <div class="module-card-actions"><button class="button primary" data-action="${newAction}">${icon('plus',17)} ${escapeHtml(newLabel)}</button>${isNew?'':open}</div>
  </article>`;
}

function recentActivity(state, activity) {
  const moduleLabel = activity.module === 'pets' ? t(state,'v3.modules.pets.short') : t(state,'v3.modules.crafts.short');
  const actionLabel = t(state,`v3.activities.${activity.action}`);
  return `<button class="activity-row" data-action="navigate-path" data-path="${escapeHtml(activity.route || '/')}">${imageTag(activity.itemImage,activity.itemName,'activity-thumb')}<span><strong>${escapeHtml(activity.itemName || actionLabel)}</strong><small>${escapeHtml(moduleLabel)} · ${escapeHtml(actionLabel)}</small></span>${activity.value!==null&&activity.value!==undefined?`<b>${formatCompactKamas(activity.value,state.language)}</b>`:''}</button>`;
}

function dashboard(state) {
  const filters = state.globalFilters || {};
  const filter = filters.module || 'all';
  const metrics = aggregateGlobalMetrics(state, filters);
  const filterButton = (id,label) => `<button class="filter-chip ${filter===id?'active':''}" data-action="global-module-filter" data-module="${id}" aria-pressed="${filter===id}">${escapeHtml(label)}</button>`;
  const option = (value,key) => `<option value="${value}" ${filters.period===value?'selected':''}>${escapeHtml(t(state,key))}</option>`;
  const dateField = (name,key) => `<label class="field"><span>${escapeHtml(t(state,key))}</span><input class="input" type="date" data-global-dashboard-filter="${name}" value="${escapeHtml(filters[name]||'')}"></label>`;
  return `<div class="page-head"><h2>${escapeHtml(t(state,'ux.summary'))}</h2><div class="filters-row"><div class="filter-chips">${filterButton('all',t(state,'v3.filters.all'))}${filterButton('pets',t(state,'v3.modules.pets.short'))}${filterButton('crafts',t(state,'v3.modules.crafts.short'))}</div><select class="select" style="width:auto" aria-label="${escapeHtml(t(state,'dashboard.period'))}" data-global-dashboard-filter="period">${option('all','dashboard.allTime')}${option('today','v3.filters.today')}${option('7','dashboard.sevenDays')}${option('30','dashboard.thirtyDays')}${option('month','v3.filters.currentMonth')}${option('custom','dashboard.custom')}</select></div></div>
    ${filters.period==='custom'?`<div class="filters-row">${dateField('from','dashboard.from')}${dateField('to','dashboard.to')}</div>`:''}
    <div class="global-kpi-grid">
      ${metricCard(t(state,'v3.metrics.realizedProfit'),formatCompactKamas(metrics.realizedProfit,state.language),{tone:toneOf(metrics.realizedProfit)})}
      ${metricCard(t(state,'v3.metrics.potentialProfit'),formatCompactKamas(metrics.potentialProfit,state.language),{tone:toneOf(metrics.potentialProfit)})}
      ${metricCard(t(state,'v3.metrics.awaitingSale'),formatCompactKamas(metrics.awaitingSaleValue,state.language))}
      ${metricCard(t(state,'v3.metrics.invested'),formatCompactKamas(metrics.investedValue,state.language))}
      ${metricCard(t(state,'v3.metrics.estimatedAssets'),formatCompactKamas(metrics.estimatedAssets,state.language),{note:t(state,'v3.metrics.estimatedNote')})}
      ${metricCard(t(state,'v3.metrics.activeProjects'),formatNumber(metrics.activeProjects,state.language))}
    </div>
    <div class="dashboard-columns">
      <section class="card section"><div class="section-head"><h2>${escapeHtml(t(state,'v3.inventory.awaitingSale'))}</h2><button class="button ghost compact" data-action="route" data-route="global-inventory">${escapeHtml(t(state,'home.viewAll'))}</button></div><div class="awaiting-list">${metrics.awaitingSaleItems.length?metrics.awaitingSaleItems.slice(0,6).map(item=>`<button class="awaiting-row" data-action="navigate-path" data-path="${escapeHtml(item.route)}">${imageTag(item.image,item.name,'activity-thumb')}<span><strong>${escapeHtml(item.name)}</strong><small>${formatNumber(item.quantity,state.language)} × ${formatKamas(item.desiredSalePrice,state.language)}</small></span><b>${formatCompactKamas(item.quantity*item.desiredSalePrice,state.language)}</b></button>`).join(''):`<p class="empty-inline">${escapeHtml(t(state,'v3.inventory.empty'))}</p>`}</div></section>
      <section class="card section"><div class="section-head"><h2>${escapeHtml(t(state,'v3.activities.recent'))}</h2></div><div class="activity-list">${metrics.recentActivities.length?metrics.recentActivities.slice(0,6).map(item=>recentActivity(state,item)).join(''):`<p class="empty-inline">${escapeHtml(t(state,'v3.activities.empty'))}</p>`}</div></section>
    </div>`;
}

export function renderHomeHub(state) {
  const all = aggregateGlobalMetrics(state, { module:'all', period:'all' });
  const isNew = !state.simulations.length && !state.sales.length && !state.craftProjects.length && !state.craftSales.length && !state.craftInventory.length;
  return `<section class="stack global-home">
    ${renderPageHead(state,{ title:t(state,isNew?'ux.welcomeTitle':'v3.nav.home'), description:isNew?t(state,'v3.home.description'):'' })}
    <div class="home-modules">${moduleCard(state,'pets',all.modules.pets,isNew)}${moduleCard(state,'crafts',all.modules.crafts,isNew)}</div>
    <article class="card home-module builder-promo"><div class="home-module-head"><span class="module-icon">${icon('shield',22)}</span><h2>${escapeHtml(t(state,'builder.title'))}</h2></div><p>${escapeHtml(t(state,'builder.intro'))}</p><div class="module-card-actions"><button class="button primary" data-action="route" data-route="builder">${escapeHtml(t(state,'builder.open'))}</button></div></article>
    ${adSlot('ad-slot-middle','middle-ad',state)}
    ${isNew?'':dashboard(state)}
  </section>`;
}
