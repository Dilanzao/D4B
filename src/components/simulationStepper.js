import { MAX_LEVEL } from '../data/xpTable.js';
import { creatureCatalog, getCreatureById, getCreatureName } from '../data/creatures.js';
import { normalizeResourceText } from '../data/feedingResources.js';
import { calculateSimulation, getLevelXpLimit } from '../utils/calculations.js';
import { formatCompactKamas, formatKamas, formatNumber } from '../utils/currency.js';
import { includesNormalized } from '../utils/textSearch.js';
import { searchResourceCatalog } from '../services/resourceCatalogService.js';
import { BAG, KOLITOKENS, RATION, foodAnkamaId } from '../modules/pets/petPlan.js';
import { alternativeXp, isUncertainXp } from '../data/petXp.js';
import { rankKnownFoods } from '../modules/pets/petCommunity.js';
import { ageText, freshnessClass, renderCraftServerContext } from '../modules/crafts/components/communityPriceUi.js';
import { RATION_ANKAMA_ID, RATION_XP } from '../config/app.js';
import { getFeedingXp } from '../services/resourceCatalogService.js';
import { copyableIcon, copyableImage, escapeHtml, icon, imageTag, t } from './common.js';
import { renderDisclosure } from './pageLayout.js';

const RESOURCE_RESULTS = 200;

function fieldError(editor, key, state) {
  const errorKey = editor.errors?.[key];
  return errorKey ? `<span class="error" id="error-${key}">${escapeHtml(t(state, `simulation.validation.${errorKey}`))}</span>` : '';
}

function kamasInput(attributes, value) {
  return `<div class="input-wrap"><input class="input" inputmode="numeric" placeholder="0" ${attributes} value="${value || ''}"><span class="suffix">K</span></div>`;
}

const typeLabel = (state, creature) => t(state, creature.type === 'Mascote' ? 'simulation.pet' : 'simulation.petsmount');

export function creatureOptionsMarkup(state, editor) {
  const filtered = creatureCatalog.filter(creature => [getCreatureName(creature, state.language), creature.canonicalName, ...Object.values(creature.names || {})].some(name => includesNormalized(name, editor.creatureQuery || '')));
  if (!filtered.length) return `<p class="small muted" style="padding:12px">${escapeHtml(t(state, 'common.noResults'))}</p>`;
  return filtered.map((creature, index) => `<button class="combobox-option" type="button" role="option" aria-selected="${creature.id === editor.simulation.creatureId}" data-action="select-creature" data-id="${creature.id}" data-index="${index}">${imageTag(creature.imageUrl, getCreatureName(creature, state.language))}<span><strong>${escapeHtml(getCreatureName(creature, state.language))}</strong><small class="muted">${escapeHtml(typeLabel(state, creature))}</small></span></button>`).join('');
}

export function resourceOptionsMarkup(state, editor) {
  const query = editor.resourceQuery || '';
  const used = new Set([String(RATION_ANKAMA_ID), ...(editor.simulation.foods || []).map(food => String(food.ankamaId))]);
  const filtered = searchResourceCatalog(state.resourceCatalog, query);
  const normalizedQuery = normalizeResourceText(query);
  const exact = filtered.some(item => [item.name, item.canonicalName].some(name => normalizeResourceText(name) === normalizedQuery));
  const shown = filtered.slice(0, RESOURCE_RESULTS);
  const custom = normalizedQuery && !exact ? `<button class="combobox-option custom-option" type="button" role="option" aria-selected="false" data-action="select-custom-resource"><span class="resource-option-placeholder">${icon('plus', 20)}</span><span><strong>${escapeHtml(t(state, 'simulation.addCustomResourceOption'))}</strong><small class="muted">${escapeHtml(query.trim())}</small></span></button>` : '';
  const more = filtered.length > shown.length ? `<p class="small muted" style="padding:10px">${escapeHtml(t(state, 'pet.refineSearch', { count: formatNumber(filtered.length - shown.length, state.language) }))}</p>` : '';
  const empty = !shown.length && !custom ? `<p class="small muted" style="padding:12px">${escapeHtml(t(state, 'common.noResults'))}</p>` : '';
  return shown.map((item, index) => `<button class="combobox-option" type="button" role="option" aria-selected="false" data-action="select-resource" data-id="${escapeHtml(item.id)}" data-index="${index}">${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" width="42" height="42" onerror="this.hidden=true">` : `<span class="resource-option-placeholder">${icon('box', 20)}</span>`}<span><strong>${escapeHtml(item.name)}</strong><small class="muted">${item.level ? `${escapeHtml(t(state, 'simulation.resourceLevel'))} ${item.level} · ` : ''}${used.has(String(item.ankamaId ?? '-')) ? escapeHtml(t(state, 'pet.alreadyListed')) : item.xp || getFeedingXp(item.ankamaId) ? `${formatNumber(item.xp || getFeedingXp(item.ankamaId), state.language, 3)} XP` : escapeHtml(t(state, 'simulation.xpNeedsInput'))}</small></span></button>`).join('') + custom + more + empty;
}

function petCard(state, editor, calc) {
  const sim = editor.simulation;
  const selected = getCreatureById(sim.creatureId);
  const name = selected ? getCreatureName(selected, state.language) : '';
  const bonus = Number(sim.xpBonusPercent || 0);
  const combobox = `<div class="field creature-combobox"><label for="creature-search">${escapeHtml(t(state, 'pet.which'))}</label><div class="input-wrap"><input class="input" id="creature-search" data-field="creatureQuery" role="combobox" aria-expanded="${Boolean(editor.comboOpen)}" aria-controls="creature-options" aria-autocomplete="list" autocomplete="off" value="${escapeHtml(editor.comboOpen ? (editor.creatureQuery || '') : name)}" placeholder="${escapeHtml(t(state, 'simulation.searchCreature'))}" aria-invalid="${Boolean(editor.errors?.creatureId)}"><span class="suffix">${icon('search', 17)}</span></div>${editor.comboOpen ? `<div class="combobox-list" id="creature-options" role="listbox">${creatureOptionsMarkup(state, editor)}</div>` : ''}${fieldError(editor, 'creatureId', state)}</div>`;
  const extra = `<div class="form-grid"><label class="field" for="current-xp"><span>${escapeHtml(t(state, 'simulation.currentXp'))}</span><input class="input" id="current-xp" data-field="currentXp" type="number" min="0" max="${getLevelXpLimit(sim.originLevel)}" value="${sim.currentXp || ''}" placeholder="${escapeHtml(t(state, 'simulation.currentXpHint', { max: formatNumber(getLevelXpLimit(sim.originLevel), state.language) }))}"></label><label class="field" for="simulation-name"><span>${escapeHtml(t(state, 'simulation.simulationName'))}</span><input class="input" id="simulation-name" data-field="name" value="${escapeHtml(sim.name)}"><small>${escapeHtml(t(state, 'simulation.autoNameHint'))}</small></label></div>`;
  return `<article class="card section stack-tight"><h2><span class="step-number">1</span>${escapeHtml(t(state, 'pet.sectionPet'))}</h2>
    <div class="pet-picker">${selected ? copyableImage(selected.imageUrl, name, 'creature-thumb', '', t(state, 'v303.copyItemName', { name })) : `<span class="creature-thumb placeholder">${icon('heart', 26)}</span>`}${combobox}</div>
    <div class="form-grid three">
      <label class="field" for="origin-level"><span>${escapeHtml(t(state, 'pet.from'))}</span><input class="input" id="origin-level" data-field="originLevel" type="number" min="0" max="99" value="${sim.originLevel}" aria-invalid="${Boolean(editor.errors?.originLevel)}">${fieldError(editor, 'originLevel', state)}</label>
      <label class="field" for="target-level"><span>${escapeHtml(t(state, 'pet.to'))}</span><input class="input" id="target-level" data-field="targetLevel" type="number" min="1" max="${MAX_LEVEL}" value="${sim.targetLevel}" aria-invalid="${Boolean(editor.errors?.targetLevel)}">${fieldError(editor, 'targetLevel', state)}</label>
      <label class="field" for="xp-bonus"><span>${escapeHtml(t(state, 'simulation.xpBonus'))}</span><div class="input-wrap"><input class="input" id="xp-bonus" data-field="xpBonusPercent" inputmode="decimal" type="number" min="0" max="1000" step="0.1" value="${bonus || ''}" placeholder="0"><span class="suffix">%</span></div></label>
    </div>
    <p class="xp-needed">${escapeHtml(t(state, 'simulation.requiredXp'))}: <strong>${formatNumber(calc.xpNeeded, state.language)} XP</strong></p>
    ${renderDisclosure(state, 'pet-more', t(state, 'ux.moreOptions'), extra, { open: Boolean(sim.currentXp) })}</article>`;
}

export function foodName(state, option) {
  if (option.id === RATION) return t(state, 'simulation.marketFood');
  if (option.id === BAG) return t(state, 'simulation.kolitokenBag');
  if (option.id === KOLITOKENS) return t(state, 'pet.kolitokens');
  return option.name;
}

function communityNote(state, sim, option) {
  const community = state.petCommunity;
  const ankamaId = foodAnkamaId(sim, option.id);
  if (!state.account?.user || ankamaId == null || String(community.serverId) !== String(sim.serverId || state.account.user.serverId)) return '';
  const entry = community.prices[ankamaId];
  const status = community.sync[ankamaId];
  const value = Math.round(Number(entry?.unitPrice) || 0);
  const sync = status && status !== 'idle' ? `<span class="price-sync ${status}">${escapeHtml(t(state, `v310.prices.${{ saving: 'saving', saved: 'saved', error: 'saveError' }[status]}`))}</span>` : '';
  if (!value) return `<span class="food-note">${escapeHtml(t(state, community.status === 'loading' ? 'common.loading' : 'pet.noCommunityPrice'))} ${sync}</span>`;
  const line = { communityPriceFreshness: entry.freshness, communityPriceAgeDays: entry.ageDays, communityPriceRegisteredAt: entry.registeredAt };
  const diff = option.price ? (option.price / value - 1) * 100 : 0;
  const diffText = Math.abs(diff) >= 1 ? ` (${diff > 0 ? '+' : '−'}${formatNumber(Math.abs(diff), state.language, 0)}%)` : '';
  const source = entry.isOwn || entry.source === 'PROPRIOS' ? 'v310.prices.ownSource' : 'v310.prices.communitySource';
  return `<span class="food-note ${freshnessClass(line)}">${escapeHtml(t(state, source))}: <strong>${formatKamas(value, state.language)}</strong>${diffText} · ${escapeHtml(ageText(state, line))}${option.price !== value ? ` <button type="button" class="link-button" data-action="use-pet-community" data-id="${escapeHtml(option.id)}">${escapeHtml(t(state, 'pet.use'))}</button>` : ''} ${sync}</span>`;
}

const per500 = (state, option) => formatKamas(Math.ceil(option.price / option.xp * RATION_XP), state.language);

function foodRow(state, sim, plan, option) {
  const name = foodName(state, option);
  const id = escapeHtml(option.id);
  const isRation = [RATION, BAG, KOLITOKENS].includes(option.id);
  const used = plan.parts.includes(option);
  const copyLabel = t(state, 'v303.copyItemName', { name });
  const ration = isRation ? state.resourceCatalog.find(item => Number(item.ankamaId) === RATION_ANKAMA_ID) : null;
  const image = option.food?.imageUrl || (option.id === RATION ? ration?.imageUrl : '');
  const thumb = image ? copyableImage(image, name, 'resource-line-thumb', '/assets/placeholders/item-fallback.svg', copyLabel) : copyableIcon(name, isRation && option.id !== RATION ? 'coin' : 'box', copyLabel);
  const title = option.id === RATION ? t(state, 'pet.originMarket') : option.id === BAG ? t(state, 'pet.originBag') : option.id === KOLITOKENS ? t(state, 'pet.originKolitokens') : name;
  const detail = option.id === BAG ? t(state, 'pet.bagDetail') : option.id === KOLITOKENS ? t(state, 'pet.kolitokensDetail') : `${formatNumber(option.xp, state.language, 3)} XP`;
  const uncertain = Boolean(option.food) && isUncertainXp(option.food.ankamaId);
  const editableXp = option.food && (option.food.custom || !option.food.xp || uncertain);
  const other = uncertain ? alternativeXp(option.food.ankamaId) : 0;
  // Numa combinação, quem só completa a sobra pode passar do teto e ainda compensar: ali o aviso confundiria.
  const max = option.maxPrice >= 1 && !(used && option.price > option.maxPrice) ? `<span class="food-max ${option.price && option.price <= option.maxPrice ? 'positive' : option.price ? 'negative' : ''}">${escapeHtml(t(state, 'pet.worthUpTo', { value: formatKamas(option.maxPrice, state.language) }))}</span>` : '';
  const number = (field, value, placeholder, label) => `<label class="field"><span>${escapeHtml(label)}</span><input class="input" type="number" min="0" step="1" inputmode="numeric" data-food-field="${field}" data-id="${id}" value="${value}" placeholder="${placeholder}"></label>`;
  const owned = number('owned', option.owned || '', '0', t(state, 'pet.owned'));
  const priceCell = option.id === KOLITOKENS ? '<span class="food-blank"></span>' : `<label class="field"><span>${escapeHtml(t(state, 'pet.unitPrice'))}</span>${kamasInput(`data-food-field="price" data-id="${id}" ${option.id === RATION ? 'data-price="ration"' : option.id === BAG ? 'data-price="bag"' : ''}`, option.price)}</label>`;
  const buyCell = option.id === KOLITOKENS ? '<span class="food-blank"></span>' : number('buy', option.buy ?? '', option.buy === null ? formatNumber(option.buyQuantity, state.language) : '', t(state, 'pet.buy'));
  const pin = option.id === KOLITOKENS || plan.pinnedId === option.id || option.buy !== null || !plan.remaining || (plan.parts.length === 1 && used) ? '' : `<button type="button" class="link-button" data-action="set-main-food" data-id="${id}">${escapeHtml(t(state, 'pet.completeWith'))}</button>`;
  const remove = option.food ? `<button type="button" class="icon-button danger" data-action="remove-food" data-id="${id}" title="${escapeHtml(t(state, 'common.delete'))}" aria-label="${escapeHtml(`${t(state, 'common.delete')}: ${name}`)}">${icon('trash', 16)}</button>` : '';
  const xpNote = uncertain ? `<span class="food-note warning">${escapeHtml(other && other !== option.xp ? t(state, 'pet.uncertainOther', { value: formatNumber(other, state.language, 3) }) : t(state, 'pet.uncertainHelp'))}</span>` : '';
  const notes = [xpNote, option.id === KOLITOKENS ? '' : communityNote(state, sim, option), option.price && option.xp && option.id !== RATION ? `<span class="food-note">${escapeHtml(t(state, 'pet.per500', { value: per500(state, option) }))}</span>` : '', max, pin].filter(Boolean).join('');
  return `<div class="food-row ${used ? 'selected' : ''}">
    <div class="food-name">${thumb}<div><strong>${escapeHtml(title)}</strong>${editableXp ? `<label class="food-xp"><span>XP</span><input class="input" type="number" min="0" step="0.001" data-food-field="xp" data-id="${id}" value="${option.food.xp || ''}" placeholder="0"></label>` : `<small class="muted">${escapeHtml(detail)}</small>`}${used ? `<span class="badge green">${icon('check', 12)} ${escapeHtml(t(state, 'pet.inPlan'))}</span>` : ''}</div></div>
    ${priceCell}${owned}${buyCell}
    <div class="food-figure"><span>${escapeHtml(t(state, 'simulation.totalCost'))}</span><strong>${option.buyQuantity && option.price ? formatCompactKamas(option.cost, state.language) : '—'}</strong></div>
    <div class="food-remove">${remove}</div>
    ${notes ? `<div class="food-notes">${notes}</div>` : ''}
  </div>`;
}

function suggestions(state, sim, plan) {
  const community = state.petCommunity;
  const logged = Boolean(state.account?.user);
  const sameServer = !logged || String(community.serverId) === String(sim.serverId || state.account.user.serverId);
  const excluded = new Set((sim.foods || []).map(food => String(food.ankamaId)));
  const rows = rankKnownFoods(state.resourceCatalog, state.petPrices, sameServer ? community : { prices: {} }, excluded).slice(0, 5);
  const scan = !logged ? `<p class="muted small">${escapeHtml(t(state, 'pet.scanLogin'))} <button type="button" class="link-button" data-action="route" data-route="login">${escapeHtml(t(state, 'v310.account.enter'))}</button></p>` : scanButton(state);
  const list = rows.map(item => `<li><img src="${escapeHtml(item.imageUrl)}" alt="" width="34" height="34" loading="lazy" onerror="this.hidden=true"><span><strong>${escapeHtml(item.name)}</strong><small class="muted">${formatKamas(item.price, state.language)} · ${formatNumber(item.xp, state.language, 3)} XP · ${escapeHtml(t(state, 'pet.per500', { value: formatKamas(Math.ceil(item.per500), state.language) }))}${item.shared ? ` · ${escapeHtml(ageText(state, { communityPriceAgeDays: item.shared.ageDays, communityPriceRegisteredAt: item.shared.registeredAt }))}` : ''}</small></span><button type="button" class="button ghost compact" data-action="select-resource" data-id="${escapeHtml(item.id)}">${icon('plus', 14)} ${escapeHtml(t(state, 'pet.add'))}</button></li>`).join('');
  return `<div class="food-suggestions"><h3>${escapeHtml(t(state, 'pet.cheapestKnown'))}</h3>${list ? `<ul>${list}</ul>` : `<p class="muted small">${escapeHtml(t(state, 'pet.cheapestEmpty'))}</p>`}${scan}</div>`;
}

export function scanButton(state) {
  const { scan, progress } = state.petCommunity;
  return `<button type="button" class="button secondary compact" data-action="scan-pet-prices" ${scan === 'loading' ? 'disabled' : ''}>${icon('refresh', 15)} ${escapeHtml(t(state, scan === 'loading' ? 'pet.scanning' : 'pet.scan'))} ${scan === 'loading' ? `<span data-scan-progress>${progress}%</span>` : ''}</button>`;
}

function foodCard(state, editor, calc) {
  const { plan } = calc;
  const sim = editor.simulation;
  const picker = `<div class="field resource-combobox"><label for="resource-search">${escapeHtml(t(state, 'pet.addResource'))}</label><div class="input-wrap"><input class="input" id="resource-search" data-resource-picker-search role="combobox" aria-expanded="${Boolean(editor.resourceComboOpen)}" aria-controls="resource-options" aria-autocomplete="list" autocomplete="off" value="${escapeHtml(editor.resourceQuery || '')}" placeholder="${escapeHtml(t(state, 'pet.addResourceHint'))}"><span class="suffix">${icon('search', 17)}</span></div>${editor.resourceComboOpen ? `<div class="combobox-list resource-combobox-list" id="resource-options" role="listbox">${resourceOptionsMarkup(state, editor)}</div>` : ''}</div>`;
  const offline = state.resourceCatalogStatus === 'fallback' ? `<div class="resource-catalog-status"><span class="badge red">${escapeHtml(t(state, 'simulation.resourceCatalogFallback'))}</span><button type="button" class="button compact secondary" data-action="refresh-resource-catalog">${escapeHtml(t(state, 'common.retry'))}</button></div>` : '';
  const rows = options => options.map(option => foodRow(state, sim, plan, option)).join('');
  const rations = plan.options.filter(option => [RATION, BAG, KOLITOKENS].includes(option.id));
  const resources = plan.options.filter(option => option.food);
  return `<article class="card section stack-tight"><div class="section-head"><h2><span class="step-number">2</span>${escapeHtml(t(state, 'pet.sectionFood'))}</h2>${plan.isAuto ? '' : `<button type="button" class="button ghost compact" data-action="set-auto-food">${escapeHtml(t(state, 'pet.backToAuto'))}</button>`}</div>
    <p class="muted small">${escapeHtml(t(state, 'pet.foodHelp'))}</p>
    ${state.account?.user ? renderCraftServerContext(state, sim) : ''}
    <div class="food-group"><h3>${escapeHtml(t(state, 'simulation.marketFood'))} <small class="muted">${escapeHtml(t(state, 'pet.rationGroup'))}</small></h3><div class="food-list">${rows(rations)}</div></div>
    <div class="food-group"><h3>${escapeHtml(t(state, 'pet.resourceGroup'))}</h3>${resources.length ? `<div class="food-list">${rows(resources)}</div>` : ''}${offline}${picker}</div>
    ${suggestions(state, sim, plan)}</article>`;
}

function tradeCard(state, editor) {
  const sim = editor.simulation;
  const channel = (value, key) => `<option value="${value}" ${sim.estimatedSaleChannel === value ? 'selected' : ''}>${escapeHtml(t(state, key))}</option>`;
  return `<article class="card section stack-tight"><h2><span class="step-number">3</span>${escapeHtml(t(state, 'pet.sectionTrade'))}</h2><div class="form-grid">
    <label class="field"><span>${escapeHtml(t(state, 'simulation.originCost'))}</span>${kamasInput('data-field="originCost"', sim.originCost)}</label>
    <label class="field"><span>${escapeHtml(t(state, 'simulation.salePrice'))}</span>${kamasInput('data-field="estimatedSalePrice"', sim.estimatedSalePrice)}</label>
    <label class="field"><span>${escapeHtml(t(state, 'simulation.saleChannel'))}</span><select class="select" data-field="estimatedSaleChannel">${channel('Mercado HDV', 'pet.hdvFee')}${channel('Outro Jogador', 'pet.playerNoFee')}</select></label>
    <label class="field"><span>${escapeHtml(t(state, 'simulation.additionalCosts'))} <small>${escapeHtml(t(state, 'common.optional'))}</small></span>${kamasInput('data-field="additionalCosts"', sim.additionalCosts)}</label>
  </div></article>`;
}

// Também usado sozinho durante a digitação, sem recriar o campo ativo.
export function petSummaryMarkup(state, editor = state.simulationEditor) {
  const sim = editor.simulation;
  const calc = calculateSimulation(sim);
  const { plan } = calc;
  const line = (label, value, cls = '') => `<div><dt>${escapeHtml(label)}</dt><dd class="${cls}">${value}</dd></div>`;
  const kamas = value => formatKamas(value, state.language);
  const shopping = plan.parts.flatMap(option => {
    const name = foodName(state, option);
    const item = (quantity, label, cost) => `<li><span>${escapeHtml(label)}</span><strong>${formatNumber(quantity, state.language)} × ${escapeHtml(name)}</strong>${cost ? `<small>${cost}</small>` : ''}</li>`;
    return [option.ownedUsed ? item(option.ownedUsed, t(state, 'pet.useOwned')) : '', option.buyQuantity ? item(option.buyQuantity, t(state, 'pet.buy'), option.price ? kamas(option.cost) : '') : ''].filter(Boolean);
  });
  const hasSale = calc.salePrice > 0;
  const spare = plan.parts.find(option => option.leftover > 0)?.leftover;
  const leftover = spare ? `<small class="muted">${escapeHtml(t(state, 'pet.leftover', { count: formatNumber(spare, state.language) }))}</small>` : '';
  const buy = plan.complete && shopping.length
    ? `<ul class="shopping-list">${shopping.join('')}</ul>${leftover}`
    : plan.complete ? '' : `<div class="notice warning">${escapeHtml(t(state, 'pet.missingFoodPrice'))}</div>`;
  return `<span class="eyebrow">${escapeHtml(t(state, 'pet.result'))}</span>
    <div class="result-hero"><span>${escapeHtml(t(state, 'simulation.estimatedProfit'))}</span><strong class="${!hasSale || !plan.complete ? '' : calc.estimatedProfit >= 0 ? 'positive' : 'negative'}">${hasSale && plan.complete ? kamas(calc.estimatedProfit) : '—'}</strong></div>
    ${buy}
    ${plan.extraCost > 0 ? `<div class="notice warning">${escapeHtml(t(state, 'pet.extraCost', { value: kamas(plan.extraCost), name: plan.bestIds.map(id => foodName(state, plan.options.find(option => option.id === id))).join(' + ') }))}</div>` : ''}
    ${plan.missingPrice.length ? `<div class="notice warning">${escapeHtml(t(state, 'pet.missingBuyPrice', { name: plan.missingPrice.map(id => foodName(state, plan.options.find(option => option.id === id))).join(', ') }))}</div>` : ''}
    <dl class="summary-list">${line(t(state, 'simulation.upCost'), plan.complete ? kamas(calc.upCost) : '—')}${line(t(state, 'simulation.originCost'), kamas(calc.originCost))}${calc.additionalCosts ? line(t(state, 'simulation.additionalCosts'), kamas(calc.additionalCosts)) : ''}${line(t(state, 'simulation.operationCost'), plan.complete ? kamas(calc.operationCost) : '—')}${calc.fee ? line(t(state, 'simulation.marketFee'), kamas(calc.fee)) : ''}${line(t(state, 'pet.breakEven'), plan.complete ? kamas(calc.breakEven) : '—')}</dl>`;
}

export function renderSimulationEditor(state) {
  const editor = state.simulationEditor;
  const calc = calculateSimulation(editor.simulation);
  const title = editor.mode === 'edit' ? 'editTitle' : editor.mode === 'duplicate' ? 'duplicateTitle' : 'newTitle';
  return `<section class="stack"><div class="section-head"><h1>${escapeHtml(t(state, `simulation.${title}`))}</h1><button class="button ghost" data-action="exit-editor">${icon('back', 17)} ${escapeHtml(t(state, 'common.back'))}</button></div>
    <div class="craft-editor-layout"><div class="stack">${petCard(state, editor, calc)}${foodCard(state, editor, calc)}${tradeCard(state, editor)}</div>
    <aside class="sticky craft-summary"><article class="card section"><div data-pet-summary>${petSummaryMarkup(state, editor)}</div><div class="stack-actions"><button class="button primary" data-action="save-simulation">${icon('check', 17)} ${escapeHtml(t(state, editor.mode === 'edit' ? 'simulation.updateSimulation' : 'simulation.saveSimulation'))}</button></div></article></aside></div></section>`;
}
