import { getCreatureById, getCreatureName } from '../data/creatures.js';
import { calculateSimulation } from '../utils/calculations.js';
import { formatCompactKamas } from '../utils/currency.js';
import { escapeHtml, icon, imageTag, t } from './common.js';

export const methodKey={vitaminizedFood:'marketFood',kolitokenBag:'kolitokenBag',resources:'combined',combined:'combined'};

function cardActions(state, simulation, compact=false) {
  const cls=compact?'icon-button':'button compact secondary';
  const label=(key)=>compact?'':` ${escapeHtml(t(state,key))}`;
  return `<div class="card-actions simulation-actions ${compact?'compact-actions':''}">
    <button class="${cls}" data-action="edit-simulation" data-id="${simulation.id}" aria-label="${escapeHtml(t(state,'common.edit'))}" title="${escapeHtml(t(state,'common.edit'))}">${icon('edit',15)}${label('common.edit')}</button>
    <button class="${cls}" data-action="duplicate-simulation" data-id="${simulation.id}" aria-label="${escapeHtml(t(state,'common.duplicate'))}" title="${escapeHtml(t(state,'common.duplicate'))}">${icon('copy',15)}${label('common.duplicate')}</button>
    <button class="${compact?'icon-button gold':'button compact gold'}" data-action="register-sale" data-id="${simulation.id}" aria-label="${escapeHtml(t(state,'simulations.registerSale'))}" title="${escapeHtml(t(state,'simulations.registerSale'))}">${icon('sale',15)}${label('simulations.registerSale')}</button>
    <button class="${cls}" data-action="simulation-details" data-id="${simulation.id}" aria-label="${escapeHtml(t(state,'simulations.viewDetails'))}" title="${escapeHtml(t(state,'simulations.viewDetails'))}">${icon('details',15)}${label('simulations.viewDetails')}</button>
    <button class="${compact?'icon-button danger':'button compact danger'}" data-action="delete-simulation" data-id="${simulation.id}" aria-label="${escapeHtml(t(state,'common.delete'))}" title="${escapeHtml(t(state,'common.delete'))}">${icon('trash',15)}${label('common.delete')}</button>
  </div>`;
}

export function simulationCard(state, simulation, compact=false) {
  const creature=getCreatureById(simulation.creatureId);
  const officialName=getCreatureName(creature,state.language)||simulation.creatureCanonicalName||t(state,'simulation.species');
  const simulationTitle=simulation.name||`${officialName} — ${simulation.originLevel} → ${simulation.targetLevel}`;
  const calc=calculateSimulation(simulation);
  const sold=state.sales.some(s=>s.simulationId===simulation.id);
  const method=t(state,`simulation.${methodKey[simulation.upMethod]||'marketFood'}`);
  if(compact) return `<article class="card simulation-mini">
    ${imageTag(simulation.creatureImageUrl||creature?.imageUrl,officialName,'creature-thumb compact-thumb')}
    <div class="simulation-mini-copy"><h3>${escapeHtml(simulationTitle)}</h3><p>${simulation.originLevel} → ${simulation.targetLevel} · ${escapeHtml(method)}</p><small class="muted official-creature-name">${escapeHtml(officialName)}</small>${calc.xpBonusPercent>0?`<div class="simulation-bonus"><span class="badge green">+${calc.xpBonusPercent}% XP</span></div>`:''}<strong class="${calc.estimatedProfit>=0?'positive':'negative'}">${formatCompactKamas(calc.estimatedProfit,state.language)}</strong></div>
    ${cardActions(state,simulation,true)}
  </article>`;
  return `<article class="card simulation-card"><div class="simulation-card-head">
    ${imageTag(simulation.creatureImageUrl||creature?.imageUrl,officialName,'creature-thumb')}
    <div class="simulation-title-block"><span class="badge blue">${escapeHtml(simulation.creatureType==='Mascote'?t(state,'simulation.pet'):t(state,'simulation.petsmount'))}</span><h3>${escapeHtml(simulationTitle)}</h3><p class="tiny muted">${simulation.originLevel} → ${simulation.targetLevel} · ${escapeHtml(method)}</p><p class="official-creature-name">${escapeHtml(officialName)}</p>${calc.xpBonusPercent>0?`<div class="simulation-bonus"><span class="badge green">+${calc.xpBonusPercent}% XP</span></div>`:''}</div>
    <span class="badge ${sold?'green':'blue'}">${escapeHtml(sold?t(state,'simulations.statusSold'):t(state,'simulations.statusReady'))}</span>
  </div><div class="metrics-list simulation-core-metrics">
    <div class="metric"><span>${escapeHtml(t(state,'simulations.operationCost'))}</span><strong>${formatCompactKamas(calc.operationCost,state.language)}</strong></div>
    <div class="metric"><span>${escapeHtml(t(state,'simulations.salePrice'))}</span><strong>${formatCompactKamas(calc.salePrice,state.language)}</strong></div>
    <div class="metric"><span>${escapeHtml(t(state,'simulations.profit'))}</span><strong class="${calc.estimatedProfit>=0?'positive':'negative'}">${formatCompactKamas(calc.estimatedProfit,state.language)}</strong></div>
  </div>${cardActions(state,simulation,false)}</article>`;
}

export function renderSimulationGallery(state, {limit=null}={}) {
  const sorted=[...state.simulations].sort((a,b)=>new Date(b.lastSaleAt||b.updatedAt)-new Date(a.lastSaleAt||a.updatedAt));
  const visible=limit?sorted.slice(0,limit):sorted;
  return visible.length?`<div class="${limit?'simulation-strip':'grid-3'}">${visible.map(s=>simulationCard(state,s,Boolean(limit))).join('')}</div>`:`<div class="empty"><h2>${escapeHtml(t(state,'simulations.empty'))}</h2><p class="muted">${escapeHtml(t(state,'home.firstText'))}</p><button class="button primary" style="margin-top:14px" data-action="new-simulation">${icon('plus',17)} ${escapeHtml(t(state,'home.newSimulation'))}</button></div>`;
}
