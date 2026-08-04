import { aggregateGlobalMetrics } from '../modules/global/globalDashboardAggregator.js';
import { formatCompactKamas, formatKamas, formatNumber } from '../utils/currency.js';
import { adSlot, escapeHtml, icon, imageTag, t } from './common.js';

const metricCard = (label, value, note = '') => `<article class="card kpi global-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${note?`<small>${escapeHtml(note)}</small>`:''}</article>`;

function moduleCard(state, id, metrics) {
  const pets = id === 'pets';
  const route = pets ? 'pets' : 'crafts';
  const title = t(state, pets ? 'v3.modules.pets.title' : 'v3.modules.crafts.title');
  const description = t(state, pets ? 'v3.modules.pets.description' : 'v3.modules.crafts.description');
  const iconName = pets ? 'heart' : 'craft';
  return `<article class="card module-card module-${id}">
    <div class="module-card-head"><span class="module-icon">${icon(iconName,25)}</span><span class="status-chip">${escapeHtml(t(state,'v3.modules.active'))}</span></div>
    <h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p>
    <div class="module-quick-metrics">
      <div><span>${escapeHtml(t(state,'v3.metrics.activeProjects'))}</span><strong>${formatNumber(metrics.activeProjects)}</strong></div>
      <div><span>${escapeHtml(t(state,'v3.metrics.realizedProfit'))}</span><strong class="${metrics.realizedProfit<0?'negative':'positive'}">${formatCompactKamas(metrics.realizedProfit)}</strong></div>
      <div><span>${escapeHtml(t(state,'v3.metrics.awaitingSale'))}</span><strong>${formatCompactKamas(metrics.awaitingSaleValue)}</strong></div>
    </div>
    <div class="module-card-actions"><button class="button primary" data-action="route" data-route="${route}">${escapeHtml(t(state,pets?'v3.modules.pets.open':'v3.modules.crafts.open'))}</button>${pets?`<button class="button ghost compact" data-action="new-simulation">${escapeHtml(t(state,'home.newSimulation'))}</button>`:`<button class="button ghost compact" data-action="new-craft-project">${escapeHtml(t(state,'v3.crafts.newProject'))}</button>`}</div>
  </article>`;
}

function recentActivity(state, activity) {
  const moduleLabel = activity.module === 'pets' ? t(state,'v3.modules.pets.title') : t(state,'v3.modules.crafts.title');
  const actionLabel = t(state,`v3.activities.${activity.action}`);
  return `<button class="activity-row" data-action="navigate-path" data-path="${escapeHtml(activity.route || '/')}">${imageTag(activity.itemImage,activity.itemName,'activity-thumb')}<span><strong>${escapeHtml(activity.itemName || actionLabel)}</strong><small>${escapeHtml(moduleLabel)} · ${escapeHtml(actionLabel)}</small></span>${activity.value!==null&&activity.value!==undefined?`<b>${formatCompactKamas(activity.value)}</b>`:''}</button>`;
}

export function renderHomeHub(state) {
  const filter = state.globalFilters?.module || 'all';
  const metrics = aggregateGlobalMetrics(state, state.globalFilters || { module:filter });
  const allMetrics = aggregateGlobalMetrics(state, { module:'all', period:'all' });
  const noData = !state.simulations.length && !state.sales.length && !state.craftProjects.length && !state.craftSales.length;
  const filterButton = (id,label) => `<button class="filter-chip ${filter===id?'active':''}" data-action="global-module-filter" data-module="${id}" aria-pressed="${filter===id}">${escapeHtml(label)}</button>`;
  return `<section class="stack global-home">
    <section class="card platform-hero"><div><span class="eyebrow">${escapeHtml(t(state,'v3.home.eyebrow'))}</span><h1>${escapeHtml(t(state,'v3.home.title'))}</h1><p>${escapeHtml(t(state,'v3.home.description'))}</p><div class="hero-actions"><button class="button primary" data-action="new-simulation">${icon('plus',17)} ${escapeHtml(t(state,'home.newSimulation'))}</button><button class="button secondary" data-action="new-craft-project">${icon('craft',17)} ${escapeHtml(t(state,'v3.crafts.newProject'))}</button></div></div><img src="./assets/brand/logo-header.webp" alt="Dofus4Business"></section>
    <div class="module-grid">${moduleCard(state,'pets',allMetrics.modules.pets)}${moduleCard(state,'crafts',allMetrics.modules.crafts)}</div>
    ${adSlot('ad-slot-middle','middle-ad',state)}
    <section class="stack"><div class="section-head compact-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.dashboard.eyebrow'))}</span><h2>${escapeHtml(t(state,'v3.dashboard.title'))}</h2><p>${escapeHtml(t(state,'v3.dashboard.description'))}</p></div><div class="filter-chips">${filterButton('all',t(state,'v3.filters.all'))}${filterButton('pets',t(state,'v3.modules.pets.short'))}${filterButton('crafts',t(state,'v3.modules.crafts.short'))}</div></div>
    <article class="card section global-period-filter"><div class="global-filter-grid"><label class="field"><span>${escapeHtml(t(state,'dashboard.period'))}</span><select class="select" data-global-dashboard-filter="period"><option value="all" ${state.globalFilters.period==='all'?'selected':''}>${escapeHtml(t(state,'dashboard.allTime'))}</option><option value="today" ${state.globalFilters.period==='today'?'selected':''}>${escapeHtml(t(state,'v3.filters.today'))}</option><option value="7" ${state.globalFilters.period==='7'?'selected':''}>${escapeHtml(t(state,'dashboard.sevenDays'))}</option><option value="30" ${state.globalFilters.period==='30'?'selected':''}>${escapeHtml(t(state,'dashboard.thirtyDays'))}</option><option value="month" ${state.globalFilters.period==='month'?'selected':''}>${escapeHtml(t(state,'v3.filters.currentMonth'))}</option><option value="custom" ${state.globalFilters.period==='custom'?'selected':''}>${escapeHtml(t(state,'dashboard.custom'))}</option></select></label>${state.globalFilters.period==='custom'?`<label class="field"><span>${escapeHtml(t(state,'dashboard.from'))}</span><input class="input" type="date" data-global-dashboard-filter="from" value="${escapeHtml(state.globalFilters.from||'')}"></label><label class="field"><span>${escapeHtml(t(state,'dashboard.to'))}</span><input class="input" type="date" data-global-dashboard-filter="to" value="${escapeHtml(state.globalFilters.to||'')}"></label>`:''}</div></article>
    ${noData?`<div class="card empty module-empty"><h3>${escapeHtml(t(state,'v3.home.emptyTitle'))}</h3><p>${escapeHtml(t(state,'v3.home.emptyText'))}</p></div>`:`<div class="global-kpi-grid">
      ${metricCard(t(state,'v3.metrics.estimatedAssets'),formatCompactKamas(metrics.estimatedAssets),t(state,'v3.metrics.estimatedNote'))}
      ${metricCard(t(state,'v3.metrics.invested'),formatCompactKamas(metrics.investedValue))}
      ${metricCard(t(state,'v3.metrics.awaitingSale'),formatCompactKamas(metrics.awaitingSaleValue))}
      ${metricCard(t(state,'v3.metrics.potentialProfit'),formatCompactKamas(metrics.potentialProfit))}
      ${metricCard(t(state,'v3.metrics.realizedProfit'),formatCompactKamas(metrics.realizedProfit))}
      ${metricCard(t(state,'v3.metrics.activeProjects'),formatNumber(metrics.activeProjects))}
    </div>`}</section>
    <div class="dashboard-columns">
      <section class="card section"><div class="section-head compact-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.activities.title'))}</span><h2>${escapeHtml(t(state,'v3.activities.recent'))}</h2></div></div><div class="activity-list">${metrics.recentActivities.length?metrics.recentActivities.slice(0,8).map(item=>recentActivity(state,item)).join(''):`<p class="empty-inline">${escapeHtml(t(state,'v3.activities.empty'))}</p>`}</div></section>
      <section class="card section"><div class="section-head compact-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.inventory.awaitingSale'))}</span><h2>${escapeHtml(t(state,'v3.inventory.availableItems'))}</h2></div><button class="button ghost compact" data-action="route" data-route="global-inventory">${escapeHtml(t(state,'home.viewAll'))}</button></div><div class="awaiting-list">${metrics.awaitingSaleItems.length?metrics.awaitingSaleItems.slice(0,6).map(item=>`<button class="awaiting-row" data-action="navigate-path" data-path="${escapeHtml(item.route)}">${imageTag(item.image,item.name,'activity-thumb')}<span><strong>${escapeHtml(item.name)}</strong><small>${formatNumber(item.quantity)} × ${formatKamas(item.desiredSalePrice)}</small></span><b>${formatCompactKamas(item.quantity*item.desiredSalePrice)}</b></button>`).join(''):`<p class="empty-inline">${escapeHtml(t(state,'v3.inventory.empty'))}</p>`}</div></section>
    </div>
  </section>`;
}
