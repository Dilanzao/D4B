import { PET_NON_TRADABLE as nonTradable, isUncertainXp } from '../../data/petXp.js';
import { getFeedingXp } from '../../services/resourceCatalogService.js';
import { normalizeResourceText } from '../../data/feedingResources.js';
import { copyableImage, escapeHtml, icon, t } from '../../components/common.js';
import { renderPageHead } from '../../components/pageLayout.js';
import { formatKamas, formatNumber } from '../../utils/currency.js';
import { BAG_ANKAMA_ID, RATION_ANKAMA_ID } from '../../config/app.js';
import { ageText } from '../crafts/components/communityPriceUi.js';
import { scanButton } from '../../components/simulationStepper.js';
import { referenceCostPerXp } from './petPlan.js';

const PAGE_SIZE = 40;

const SORTS = {
  xp: (a, b) => b.xp - a.xp,
  level: (a, b) => a.level - b.level || b.xp - a.xp,
  name: (a, b) => a.name.localeCompare(b.name),
  saving: (a, b) => b.saving - a.saving || b.xp - a.xp
};

const shared = (state, id) => state.account?.user && String(state.petCommunity.serverId) === String(state.account.user.serverId) ? state.petCommunity.prices[id] : null;
const explorerPrice = (state, id, own) => Math.round(Number(shared(state, id)?.unitPrice) || 0) || own || 0;
const explorerReference = state => referenceCostPerXp(explorerPrice(state, RATION_ANKAMA_ID, state.petPrices.ration), explorerPrice(state, BAG_ANKAMA_ID, state.petPrices.bag));

export function listExplorerResources(state) {
  const f = state.petExplorer;
  const reference = explorerReference(state);
  const query = normalizeResourceText(f.query || '');
  return state.resourceCatalog
    .map(item => {
      const xp = getFeedingXp(item.ankamaId) && (item.xp || getFeedingXp(item.ankamaId));
      if (!xp || Number(item.ankamaId) === RATION_ANKAMA_ID || nonTradable.has(Number(item.ankamaId))) return null;
      const entry = shared(state, item.ankamaId);
      const price = explorerPrice(state, item.ankamaId, state.petPrices.resources[item.ankamaId]);
      const maxPrice = Math.floor(xp * reference);
      // Sem preço, o item fica depois dos que têm economia conhecida.
      const saving = price && reference ? 1 - price / (xp * reference) : -Infinity;
      return { ...item, xp, price, maxPrice, saving, entry };
    })
    .filter(Boolean)
    .filter(item => (!query || normalizeResourceText(item.name).includes(query)) && (!f.minXp || item.xp >= f.minXp) && (!f.maxLevel || item.level <= f.maxLevel))
    .sort(SORTS[f.sort] || SORTS.xp);
}

function row(state, item, reference) {
  const verdict = !item.price || !reference ? '' : item.saving > 0
    ? `<span class="badge green">${escapeHtml(t(state, 'pet.worth', { percent: formatNumber(item.saving * 100, state.language, 0) }))}</span>`
    : `<span class="badge red">${escapeHtml(t(state, 'pet.notWorth'))}</span>`;
  return `<tr><td><div class="table-item">${copyableImage(item.imageUrl, item.name, 'resource-line-thumb', '/assets/placeholders/item-fallback.svg', t(state, 'v303.copyItemName', { name: item.name }))}<span><strong>${escapeHtml(item.name)}</strong><small class="muted">${escapeHtml(t(state, 'simulation.levelShort'))} ${formatNumber(item.level, state.language)}</small></span></div></td>
    <td class="num">${formatNumber(item.xp, state.language, 3)}${isUncertainXp(item.ankamaId) && item.xpSource !== 'manual' ? `<small class="xp-uncertain" title="${escapeHtml(t(state, 'pet.uncertainHelp'))}">${escapeHtml(t(state, 'pet.uncertain'))}</small>` : ''}</td>
    <td class="num"><strong>${reference ? (item.maxPrice >= 1 ? formatKamas(item.maxPrice, state.language) : '—') : '—'}</strong></td>
    <td><input class="input price-input" inputmode="numeric" aria-label="${escapeHtml(`${t(state, 'pet.yourPrice')}: ${item.name}`)}" data-explorer-price data-id="${item.ankamaId}" value="${item.price || ''}" placeholder="0">${item.entry?.unitPrice ? `<small class="food-note">${escapeHtml(t(state, item.entry.isOwn ? 'v310.prices.ownSource' : 'v310.prices.communitySource'))} · ${escapeHtml(ageText(state, { communityPriceAgeDays: item.entry.ageDays, communityPriceRegisteredAt: item.entry.registeredAt }))}</small>` : ''}</td>
    <td>${verdict}</td>
    <td><button class="button ghost compact" data-action="simulate-resource" data-id="${item.ankamaId}">${icon('plus', 15)} ${escapeHtml(t(state, 'pet.simulate'))}</button></td></tr>`;
}

export function renderResourceExplorer(state) {
  const f = state.petExplorer;
  const prices = state.petPrices;
  const reference = explorerReference(state);
  const items = listExplorerResources(state);
  const visible = items.slice(0, f.limit || PAGE_SIZE);
  const loading = state.resourceCatalogStatus === 'loading' && !items.length;
  const failed = state.resourceCatalogStatus === 'fallback' && !items.length;
  const option = (value, key) => `<option value="${value}" ${f.sort === value ? 'selected' : ''}>${escapeHtml(t(state, key))}</option>`;
  const th = (key, cls = '') => `<th class="${cls}">${escapeHtml(t(state, key))}</th>`;
  return `<section class="stack">${renderPageHead(state, { title: t(state, 'v3.modules.pets.title'), tabs: 'pets', actions: `<button class="button primary" data-action="new-simulation">${icon('plus', 17)} ${escapeHtml(t(state, 'home.newSimulation'))}</button>` })}
    <article class="card section"><h2>${escapeHtml(t(state, 'pet.referenceTitle'))}</h2><p class="muted small">${escapeHtml(t(state, 'pet.referenceHelp'))}</p><div class="filters-row" style="margin-top:12px">
      <label class="field"><span>${escapeHtml(t(state, 'simulation.marketFoodPrice'))}</span><input class="input" inputmode="numeric" data-pet-price="ration" value="${explorerPrice(state, RATION_ANKAMA_ID, prices.ration) || ''}" placeholder="0"></label>
      <label class="field"><span>${escapeHtml(t(state, 'simulation.bagPrice'))}</span><input class="input" inputmode="numeric" data-pet-price="bag" value="${explorerPrice(state, BAG_ANKAMA_ID, prices.bag) || ''}" placeholder="0"></label>
      ${reference ? `<p class="reference-note">${escapeHtml(t(state, 'pet.referenceResult', { value: formatNumber(reference, state.language, 2) }))}</p>` : ''}
    ${state.account?.user ? scanButton(state) : ''}</div></article>
    <div class="filters-row">
      <label class="field"><span>${escapeHtml(t(state, 'common.search'))}</span><input class="input" data-explorer-field="query" value="${escapeHtml(f.query || '')}" placeholder="${escapeHtml(t(state, 'simulation.resource'))}"></label>
      <label class="field"><span>${escapeHtml(t(state, 'pet.minXp'))}</span><input class="input" inputmode="decimal" data-explorer-field="minXp" value="${f.minXp || ''}" placeholder="0"></label>
      <label class="field"><span>${escapeHtml(t(state, 'pet.maxLevel'))}</span><input class="input" inputmode="numeric" data-explorer-field="maxLevel" value="${f.maxLevel || ''}" placeholder="200"></label>
      <label class="field"><span>${escapeHtml(t(state, 'pet.sortBy'))}</span><select class="select" data-explorer-field="sort">${option('xp', 'pet.sortXp')}${option('saving', 'pet.sortSaving')}${option('level', 'pet.sortLevel')}${option('name', 'pet.sortName')}</select></label>
    </div>
    <article class="card table-card"><div class="table-scroll"><table><thead><tr>${th('simulation.resource')}${th('pet.xpUnit', 'num')}${th('pet.maxPrice', 'num')}${th('pet.yourPrice')}<th></th><th></th></tr></thead><tbody>${visible.length ? visible.map(item => row(state, item, reference)).join('') : `<tr><td colspan="6" class="empty-cell">${escapeHtml(t(state, loading ? 'common.loading' : failed ? 'pet.catalogOffline' : 'common.noResults'))}</td></tr>`}</tbody></table></div></article>
    ${items.length > visible.length ? `<button class="button secondary" style="justify-self:center" data-action="explorer-more">${escapeHtml(t(state, 'pet.showMore', { count: formatNumber(items.length - visible.length, state.language) }))}</button>` : ''}
    <p class="muted small">${escapeHtml(t(state, 'pet.batchTip'))}</p>
  </section>`;
}
