import { getCreatureById, getCreatureName } from '../data/creatures.js';
import { calculateSimulation } from '../utils/calculations.js';
import { methodForPlan } from '../modules/pets/petPlan.js';
import { formatCompactKamas } from '../utils/currency.js';
import { escapeHtml, icon, imageTag, t } from './common.js';

export const methodKey={vitaminizedFood:'marketFood',kolitokenBag:'kolitokenBag',resources:'combined',combined:'combined',resource:'singleResource'};

export function methodLabel(state, simulation, calc=calculateSimulation(simulation)) {
  const main=calc.plan.main;
  if(calc.plan.parts.length===1&&main.food)return main.name;
  const key=calc.plan.parts.length?methodForPlan(calc.plan):simulation.upMethod;
  return t(state,`simulation.${methodKey[key]||'marketFood'}`);
}

function cardActions(state, simulation) {
  const iconAction=(action,iconName,key,cls='')=>`<button class="icon-button ${cls}" data-action="${action}" data-id="${simulation.id}" aria-label="${escapeHtml(t(state,key))}" title="${escapeHtml(t(state,key))}">${icon(iconName,16)}</button>`;
  return `<div class="row-actions">
    <button class="button compact gold" data-action="register-sale" data-id="${simulation.id}">${icon('sale',15)} ${escapeHtml(t(state,'simulations.registerSale'))}</button>
    <span class="icon-actions">${iconAction('toggle-pet-sale','box',simulation.status==='awaiting_sale'?'v3.inventory.removeFromSale':'v3.inventory.putForSale',simulation.status==='awaiting_sale'?'gold':'')}${iconAction('edit-simulation','edit','common.edit')}${iconAction('duplicate-simulation','copy','common.duplicate')}${iconAction('simulation-details','details','simulations.viewDetails')}${iconAction('delete-simulation','trash','common.delete','danger')}</span>
  </div>`;
}

export function simulationCard(state, simulation, compact=false) {
  const creature=getCreatureById(simulation.creatureId);
  const officialName=getCreatureName(creature,state.language)||simulation.creatureCanonicalName||t(state,'simulation.species');
  const simulationTitle=simulation.name||`${officialName} — ${simulation.originLevel} → ${simulation.targetLevel}`;
  const calc=calculateSimulation(simulation);
  const sold=state.sales.some(s=>s.simulationId===simulation.id);
  const extraName=simulationTitle.includes(officialName)?'':`<p class="official-creature-name">${escapeHtml(officialName)}</p>`;
  const titleButton=`<button class="card-title-button" data-action="edit-simulation" data-id="${simulation.id}">${escapeHtml(simulationTitle)}</button>`;
  const method=methodLabel(state,simulation,calc);
  const hasResult=calc.salePrice>0&&calc.plan.complete;
  const profitText=hasResult?formatCompactKamas(calc.estimatedProfit,state.language):'—';
  const profitTone=!hasResult?'':calc.estimatedProfit>=0?'positive':'negative';
  const forSale=simulation.status==='awaiting_sale';
  if(compact) return `<article class="card simulation-mini">
    ${imageTag(simulation.creatureImageUrl||creature?.imageUrl,officialName,'creature-thumb compact-thumb')}
    <div class="simulation-mini-copy"><h3>${titleButton}</h3><p>${simulation.originLevel} → ${simulation.targetLevel} · ${escapeHtml(method)}</p>${extraName}${calc.xpBonusPercent>0?`<div class="simulation-bonus"><span class="badge green">+${calc.xpBonusPercent}% XP</span></div>`:''}<strong class="${profitTone}">${profitText}</strong></div>
    ${cardActions(state,simulation)}
  </article>`;
  return `<article class="card simulation-card"><div class="simulation-card-head">
    ${imageTag(simulation.creatureImageUrl||creature?.imageUrl,officialName,'creature-thumb')}
    <div class="simulation-title-block"><span class="badge blue">${escapeHtml(simulation.creatureType==='Mascote'?t(state,'simulation.pet'):t(state,'simulation.petsmount'))}</span><h3>${titleButton}</h3><p class="small muted">${simulation.originLevel} → ${simulation.targetLevel} · ${escapeHtml(method)}</p>${extraName}${calc.xpBonusPercent>0?`<div class="simulation-bonus"><span class="badge green">+${calc.xpBonusPercent}% XP</span></div>`:''}</div>
    <span class="badge ${forSale||sold?'green':'blue'}">${escapeHtml(forSale?t(state,'ux.tabs.forSale'):sold?t(state,'simulations.statusSold'):t(state,'simulations.statusReady'))}</span>
  </div><div class="metrics-list simulation-core-metrics">
    <div class="metric"><span>${escapeHtml(t(state,'simulations.operationCost'))}</span><strong>${formatCompactKamas(calc.operationCost,state.language)}</strong></div>
    <div class="metric"><span>${escapeHtml(t(state,'simulations.salePrice'))}</span><strong>${formatCompactKamas(calc.salePrice,state.language)}</strong></div>
    <div class="metric"><span>${escapeHtml(t(state,'simulations.profit'))}</span><strong class="${profitTone}">${profitText}</strong></div>
  </div>${cardActions(state,simulation)}</article>`;
}

export function renderSimulationGallery(state, {limit=null}={}) {
  const sorted=[...state.simulations].sort((a,b)=>new Date(b.lastSaleAt||b.updatedAt)-new Date(a.lastSaleAt||a.updatedAt));
  const visible=limit?sorted.slice(0,limit):sorted;
  return visible.length?`<div class="${limit?'simulation-strip':'grid-3'}">${visible.map(s=>simulationCard(state,s,Boolean(limit))).join('')}</div>`:`<div class="empty"><h2>${escapeHtml(t(state,'simulations.empty'))}</h2><p class="muted">${escapeHtml(t(state,'home.firstText'))}</p><button class="button primary" style="margin-top:14px" data-action="new-simulation">${icon('plus',17)} ${escapeHtml(t(state,'home.newSimulation'))}</button></div>`;
}
