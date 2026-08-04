import { MAX_LEVEL } from '../data/xpTable.js';
import { creatureCatalog, getCreatureById, getCreatureName } from '../data/creatures.js';
import { normalizeResourceText } from '../data/feedingResources.js';
import { calculateSimulation, getLevelXpLimit } from '../utils/calculations.js';
import { formatCompactKamas, formatNumber } from '../utils/currency.js';
import { includesNormalized } from '../utils/textSearch.js';
import { findResourceCatalogItem, searchResourceCatalog } from '../services/resourceCatalogService.js';
import { copyableIcon, copyableImage, escapeHtml, icon, imageTag, t } from './common.js';

export const methodKey = {
  vitaminizedFood: 'marketFood',
  kolitokenBag: 'kolitokenBag',
  combined: 'combined',
  resources: 'combined'
};

function fieldError(editor, key, state) {
  const errorKey = editor.errors?.[key];
  return errorKey ? `<span class="error" id="error-${key}">${escapeHtml(t(state, `simulation.validation.${errorKey}`))}</span>` : '';
}

function renderStepper(state, editor) {
  const labels = ['creature', 'levels', 'method', 'costs', 'review'];
  return `<div class="stepper" aria-label="${escapeHtml(t(state, 'simulation.stepLabel', { current: editor.step, total: 5 }))}">${labels.map((key, index) => {
    const step = index + 1;
    const cls = step === editor.step ? 'active' : step < editor.step ? 'complete' : '';
    return `<button class="step ${cls}" data-action="go-step" data-step="${step}" ${step > editor.maxReached ? 'disabled' : ''} ${step === editor.step ? 'aria-current="step"' : ''}><span>${step < editor.step ? '✓' : step}</span><strong>${escapeHtml(t(state, `simulation.steps.${key}`))}</strong></button>`;
  }).join('')}</div>`;
}

function renderCreatureStep(state, editor) {
  const sim = editor.simulation;
  const selected = getCreatureById(sim.creatureId);
  const query = editor.creatureQuery || '';
  const filtered = creatureCatalog.filter((creature) => creature.type === sim.creatureType
    && [getCreatureName(creature, state.language), creature.canonicalName, ...Object.values(creature.names || {})]
      .some((name) => includesNormalized(name, query)));

  return `<div class="stack"><div class="form-grid">
    <label class="field" for="creature-type"><span>${escapeHtml(t(state, 'simulation.creatureType'))}</span><select class="select" id="creature-type" data-field="creatureType"><option value="Mascote" ${sim.creatureType === 'Mascote' ? 'selected' : ''}>${escapeHtml(t(state, 'simulation.pet'))}</option><option value="Montascote" ${sim.creatureType === 'Montascote' ? 'selected' : ''}>${escapeHtml(t(state, 'simulation.petsmount'))}</option></select></label>
    <div class="field creature-combobox"><label for="creature-search">${escapeHtml(t(state, 'simulation.species'))}</label><div class="input-wrap"><input class="input" id="creature-search" data-field="creatureQuery" role="combobox" aria-expanded="${editor.comboOpen ? 'true' : 'false'}" aria-controls="creature-options" aria-autocomplete="list" autocomplete="off" value="${escapeHtml(editor.comboOpen ? query : (query || getCreatureName(selected, state.language)))}" placeholder="${escapeHtml(t(state, 'simulation.searchCreature'))}" aria-invalid="${Boolean(editor.errors?.creatureId)}"><span class="suffix">${icon('search', 17)}</span></div>
    ${editor.comboOpen ? `<div class="combobox-list" id="creature-options" role="listbox">${filtered.length ? filtered.map((creature, index) => `<button class="combobox-option" type="button" role="option" aria-selected="${creature.id === sim.creatureId}" data-action="select-creature" data-id="${creature.id}" data-index="${index}">${imageTag(creature.imageUrl, getCreatureName(creature, state.language))}<span><strong>${escapeHtml(getCreatureName(creature, state.language))}</strong><small class="muted">${escapeHtml(creature.type === 'Mascote' ? t(state, 'simulation.pet') : t(state, 'simulation.petsmount'))}</small></span></button>`).join('') : `<p class="small muted" style="padding:12px">${escapeHtml(t(state, 'common.noResults'))}</p>`}</div>` : ''}
    ${fieldError(editor, 'creatureId', state)}</div>
    <label class="field" for="simulation-name"><span>${escapeHtml(t(state, 'simulation.simulationName'))}</span><input class="input" id="simulation-name" data-field="name" value="${escapeHtml(sim.name)}"><small>${escapeHtml(t(state, 'simulation.autoNameHint'))}</small></label>
  </div>${selected ? `<div class="selected-creature">${copyableImage(selected.imageUrl, getCreatureName(selected, state.language), 'creature-thumb large', '', t(state,'v303.copyItemName',{name:getCreatureName(selected,state.language)}))}<div><span class="eyebrow">${escapeHtml(t(state, 'simulation.selectedCreature'))}</span><h2>${escapeHtml(getCreatureName(selected, state.language))}</h2><p class="muted">${escapeHtml(selected.canonicalName)} · ${escapeHtml(selected.type === 'Mascote' ? t(state, 'simulation.pet') : t(state, 'simulation.petsmount'))}</p></div></div>` : ''}</div>`;
}

function renderLevelsStep(state, editor, calc) {
  const sim = editor.simulation;
  const max = getLevelXpLimit(sim.originLevel);
  const bonus = Number(sim.xpBonusPercent || 0);
  return `<div class="stack"><div class="form-grid four">
    <label class="field" for="origin-level"><span>${escapeHtml(t(state, 'simulation.originLevel'))}</span><input class="input" id="origin-level" data-field="originLevel" type="number" min="0" max="99" value="${sim.originLevel}" aria-invalid="${Boolean(editor.errors?.originLevel)}">${fieldError(editor, 'originLevel', state)}</label>
    <label class="field" for="current-xp"><span>${escapeHtml(t(state, 'simulation.currentXp'))} <small>${escapeHtml(t(state, 'common.optional'))}</small></span><input class="input" id="current-xp" data-field="currentXp" type="number" min="0" max="${max}" value="${sim.currentXp || ''}" placeholder="${escapeHtml(t(state, 'simulation.currentXpHint', { max: formatNumber(max, state.language, 2) }))}"></label>
    <label class="field" for="target-level"><span>${escapeHtml(t(state, 'simulation.targetLevel'))}</span><input class="input" id="target-level" data-field="targetLevel" type="number" min="1" max="${MAX_LEVEL}" value="${sim.targetLevel}" aria-invalid="${Boolean(editor.errors?.targetLevel)}">${fieldError(editor, 'targetLevel', state)}</label>
    <label class="field" for="xp-bonus"><span>${escapeHtml(t(state, 'simulation.xpBonus'))}</span><div class="input-wrap"><input class="input" id="xp-bonus" data-field="xpBonusPercent" inputmode="decimal" type="number" min="0" max="1000" step="0.1" value="${bonus || ''}" placeholder="${escapeHtml(t(state, 'simulation.xpBonusExample'))}"><span class="suffix">%</span></div><small>${escapeHtml(t(state, 'simulation.xpBonusHelp'))}</small></label>
  </div><div class="bonus-presets" aria-label="${escapeHtml(t(state, 'simulation.xpBonus'))}">${[0, 50, 100].map((value) => `<button type="button" class="button compact ${bonus === value ? 'gold' : 'secondary'}" data-action="set-xp-bonus" data-value="${value}">${value === 0 ? escapeHtml(t(state, 'simulation.noBonus')) : `+${value}%`}</button>`).join('')}</div>
  <div class="xp-overview-grid"><div class="card section" style="background:var(--surface-blue)"><span class="eyebrow">${escapeHtml(t(state, 'simulation.requiredXp'))}</span><strong>${formatNumber(calc.xpNeeded, state.language, 2)} XP</strong><p class="muted">${escapeHtml(t(state, 'simulation.levelRange', { origin: sim.originLevel, target: sim.targetLevel }))}</p></div><div class="card section bonus-summary"><span class="eyebrow">${escapeHtml(t(state, 'simulation.activeXpBonus'))}</span><strong>${bonus > 0 ? `+${formatNumber(bonus, state.language, 1)}%` : escapeHtml(t(state, 'simulation.noBonus'))}</strong><p class="muted">${escapeHtml(t(state, 'simulation.rationEffectiveXp', { xp: formatNumber(calc.methods.vitaminizedFood.effectiveXpPerUnit, state.language, 2) }))}</p></div></div></div>`;
}

function methodQuantity(state, method, id) {
  if (id === 'combined') return t(state, 'simulation.combinedQuantity', { resources: method.resourceQuantity, rations: method.rationQuantity });
  return String(method.quantity);
}

function methodCard(state, sim, calc, id) {
  const method = calc.methods[id];
  const selected = (sim.upMethod === 'resources' ? 'combined' : sim.upMethod) === id;
  const cheapest = calc.cheapest === id;
  const name = t(state, `simulation.${methodKey[id]}`);
  const copyIconName = id === 'vitaminizedFood' ? 'box' : id === 'kolitokenBag' ? 'coin' : 'list';
  const effectiveUnit = method.effectiveXpPerUnit ? `<small class="muted">${escapeHtml(t(state, 'simulation.effectiveXpPerUnit', { xp: formatNumber(method.effectiveXpPerUnit, state.language, 2) }))}</small>` : '';
  return `<div class="method-card-shell">${copyableIcon(name,copyIconName,t(state,'v303.copyItemName',{name}))}<button type="button" class="method-card ${selected ? 'selected' : ''} ${cheapest ? 'cheapest' : ''}" ${cheapest ? `data-cheapest="${escapeHtml(t(state, 'simulation.cheapest'))}"` : ''} data-action="select-method" data-method="${id}" aria-pressed="${selected}"><h3>${escapeHtml(name)}</h3>${effectiveUnit}<div class="method-stats"><div><span>${escapeHtml(t(state, 'simulation.quantityNeeded'))}</span><strong>${escapeHtml(methodQuantity(state, method, id))}</strong></div><div><span>${escapeHtml(t(state, 'simulation.xpObtained'))}</span><strong>${formatNumber(method.xpObtained, state.language, 2)} XP</strong></div><div><span>${escapeHtml(t(state, 'simulation.totalCost'))}</span><strong>${formatCompactKamas(method.totalCost, state.language)}</strong></div><div><span>${escapeHtml(t(state, 'simulation.costPerXp'))}</span><strong>${formatNumber(method.costPerXp, state.language, 2)} K</strong></div></div>${id === 'combined' ? `<small class="muted">${escapeHtml(t(state, 'simulation.combinedSummary', { resourceXp: formatNumber(method.resourceXp, state.language, 2), remainingXp: formatNumber(method.remainingXp, state.language, 2) }))}</small>` : ''}${!method.sufficient ? `<span class="badge red">${escapeHtml(t(state, 'simulation.insufficientXp'))}</span>` : ''}</button></div>`;
}

function catalogStatus(state) {
  if (state.resourceCatalogStatus === 'loading') return `<span class="badge blue">${escapeHtml(t(state, 'simulation.resourceCatalogLoading'))}</span>`;
  if (state.resourceCatalogStatus === 'ready') return `<span class="badge green">${escapeHtml(t(state, 'simulation.resourceCatalogReady', { count: state.resourceCatalog.length }))}</span>`;
  return `<span class="badge red">${escapeHtml(t(state, 'simulation.resourceCatalogFallback'))}</span><button type="button" class="button compact secondary" data-action="refresh-resource-catalog">${escapeHtml(t(state, 'common.retry'))}</button>`;
}

function renderResourceLine(state, line) {
  const catalogItem = findResourceCatalogItem(state.resourceCatalog, line);
  const displayName = catalogItem?.name || line.resourceDisplayName || line.resourceName || line.canonicalName;
  const imageUrl = catalogItem?.imageUrl || line.resourceImageUrl || '';
  const xpCell = `<div class="resource-xp-input"><input class="input" type="number" min="0.0001" step="0.001" value="${line.baseXpUnit || ''}" data-resource-field="customXp" data-id="${line.id}" aria-label="${escapeHtml(t(state, 'simulation.unitXp'))}" placeholder="0"></div>`;
  return `<tr><td><div class="resource-identity">${imageUrl ? copyableImage(imageUrl,displayName,'resource-line-thumb','/assets/placeholders/item-fallback.svg',t(state,'v303.copyItemName',{name:displayName})) : copyableIcon(displayName,'box',t(state,'v303.copyItemName',{name:displayName}))}<div><strong>${escapeHtml(displayName)}</strong><small>${catalogItem?.level ? `${escapeHtml(t(state, 'simulation.resourceLevel'))} ${catalogItem.level}` : escapeHtml(line.custom ? t(state, 'simulation.customResource') : t(state, 'simulation.dofusDudeResource'))}</small></div></div></td><td>${xpCell}</td><td><strong>${formatNumber(line.effectiveXpUnit, state.language, 3)}</strong><small class="muted resource-cell-note">${line.xpBonusPercent > 0 ? `+${formatNumber(line.xpBonusPercent, state.language, 1)}%` : escapeHtml(t(state, 'simulation.noBonus'))}</small></td><td><input class="input" style="min-width:90px" type="number" min="1" value="${line.quantity}" data-resource-field="quantity" data-id="${line.id}"></td><td><div class="needed-resource"><strong>${formatNumber(line.quantityNeededAlone, state.language)}</strong><button type="button" class="button compact secondary" data-action="fill-resource-required" data-id="${line.id}">${escapeHtml(t(state, 'simulation.useRequiredQuantity'))}</button></div></td><td>${formatNumber(line.xpTotal, state.language, 3)}</td><td><input class="input" style="min-width:120px" inputmode="numeric" value="${line.unitPrice}" data-resource-field="unitPrice" data-id="${line.id}"></td><td>${formatCompactKamas(line.costTotal, state.language)}</td><td><button class="icon-button" type="button" data-action="delete-resource" data-id="${line.id}" aria-label="${escapeHtml(t(state, 'common.delete'))}">${icon('trash', 17)}</button></td></tr>`;
}

function renderResourcePicker(state, editor) {
  const query = editor.resourceQuery || '';
  const selected = editor.selectedResourceId && editor.selectedResourceId !== '__custom__'
    ? findResourceCatalogItem(state.resourceCatalog, { resourceId: editor.selectedResourceId })
    : null;
  const filtered = searchResourceCatalog(state.resourceCatalog, query);
  const normalizedQuery = normalizeResourceText(query);
  const hasExactMatch = filtered.some((item) => [item.name, item.canonicalName].some((name) => normalizeResourceText(name) === normalizedQuery));
  const canAddCustom = Boolean(normalizedQuery) && !hasExactMatch;
  const draft = editor.resourceDraft || { xp: 0, quantity: 1, unitPrice: 0, custom: false };
  const displayValue = editor.resourceComboOpen ? query : (query || selected?.name || '');

  return `<div class="resource-add unified-resource-add">
    <div class="field resource-combobox"><label for="resource-search">${escapeHtml(t(state, 'simulation.resource'))}</label><div class="input-wrap"><input class="input" id="resource-search" data-resource-picker-search role="combobox" aria-expanded="${editor.resourceComboOpen ? 'true' : 'false'}" aria-controls="resource-options" aria-autocomplete="list" autocomplete="off" value="${escapeHtml(displayValue)}" placeholder="${escapeHtml(t(state, 'simulation.searchResourceHint'))}"><span class="suffix">${icon('search', 17)}</span></div>
      ${editor.resourceComboOpen ? `<div class="combobox-list resource-combobox-list" id="resource-options" role="listbox">${filtered.map((item, index) => `<button class="combobox-option" type="button" role="option" aria-selected="${item.id === editor.selectedResourceId}" data-action="select-resource" data-id="${escapeHtml(item.id)}" data-index="${index}">${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" width="42" height="42" onerror="this.hidden=true">` : `<span class="resource-option-placeholder">${icon('box', 20)}</span>`}<span><strong>${escapeHtml(item.name)}</strong><small class="muted">${item.level ? `${escapeHtml(t(state, 'simulation.resourceLevel'))} ${item.level} · ` : ''}${item.xp ? `${formatNumber(item.xp, state.language, 3)} XP` : escapeHtml(t(state, 'simulation.xpNeedsInput'))}</small></span></button>`).join('')}${canAddCustom ? `<button class="combobox-option custom-option" type="button" role="option" aria-selected="${editor.selectedResourceId === '__custom__'}" data-action="select-custom-resource"><span class="resource-option-placeholder">${icon('plus', 20)}</span><span><strong>${escapeHtml(t(state, 'simulation.addCustomResourceOption'))}</strong><small class="muted">${escapeHtml(query.trim())}</small></span></button>` : ''}${!filtered.length && !canAddCustom ? `<p class="small muted" style="padding:12px">${escapeHtml(t(state, 'common.noResults'))}</p>` : ''}</div>` : ''}
    </div>
    <label class="field"><span>${escapeHtml(t(state, 'simulation.unitXp'))}</span><input class="input" data-resource-draft="xp" type="number" min="0.0001" step="0.001" value="${draft.xp || ''}" placeholder="0"></label>
    <label class="field"><span>${escapeHtml(t(state, 'simulation.quantity'))}</span><input class="input" data-resource-draft="quantity" type="number" min="1" value="${draft.quantity || 1}"></label>
    <label class="field"><span>${escapeHtml(t(state, 'simulation.unitPrice'))}</span><input class="input" data-resource-draft="unitPrice" inputmode="numeric" value="${draft.unitPrice || ''}" placeholder="0"></label>
    <button class="button secondary" type="button" data-action="add-selected-resource">${icon('plus', 17)} ${escapeHtml(t(state, 'simulation.addResource'))}</button>
  </div>`;
}

function renderResourceEditor(state, editor, calc) {
  const resources = calc.resources;
  const coverage = calc.xpNeeded > 0 ? Math.min(100, resources.xpObtained / calc.xpNeeded * 100) : 100;
  return `<div class="collapsible"><button type="button" class="collapsible-trigger" data-action="toggle-resources" aria-expanded="${editor.resourcesOpen}"><span><strong>${escapeHtml(t(state, 'simulation.resourcePanel'))}</strong><small class="muted" style="display:block">${escapeHtml(t(state, 'simulation.resourcesCount', { count: resources.lines.length }))} · ${escapeHtml(t(state, 'simulation.resourcesXp', { xp: formatNumber(resources.xpObtained, state.language, 2) }))} · ${formatCompactKamas(resources.totalCost, state.language)}</small></span>${icon(editor.resourcesOpen ? 'down' : 'chevron')}</button>${editor.resourcesOpen ? `<div class="collapsible-content stack">
    <div class="resource-catalog-status">${catalogStatus(state)}</div>
    <div class="resource-coverage"><div><span>${escapeHtml(t(state, 'simulation.resourceCoverage'))}</span><strong>${formatNumber(coverage, state.language, 1)}%</strong></div><div class="coverage-track"><span style="width:${coverage}%"></span></div><small>${escapeHtml(t(state, 'simulation.remainingXp'))}: ${formatNumber(resources.remainingXp, state.language, 2)} XP${resources.bonusXpObtained > 0 ? ` · ${escapeHtml(t(state, 'simulation.bonusXpGenerated', { xp: formatNumber(resources.bonusXpObtained, state.language, 2) }))}` : ''}</small></div>
    ${renderResourcePicker(state, editor)}
    <div data-resource-error class="error"></div><div class="table-wrap"><table class="resource-table expanded-resource-table"><thead><tr><th>${escapeHtml(t(state, 'simulation.resource'))}</th><th>${escapeHtml(t(state, 'simulation.unitXp'))}</th><th>${escapeHtml(t(state, 'simulation.effectiveXp'))}</th><th>${escapeHtml(t(state, 'simulation.quantity'))}</th><th>${escapeHtml(t(state, 'simulation.quantityToTarget'))}</th><th>${escapeHtml(t(state, 'simulation.totalXp'))}</th><th>${escapeHtml(t(state, 'simulation.unitPrice'))}</th><th>${escapeHtml(t(state, 'simulation.lineCost'))}</th><th>${escapeHtml(t(state, 'common.actions'))}</th></tr></thead><tbody>${resources.lines.length ? resources.lines.map((line) => renderResourceLine(state, line)).join('') : `<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">${escapeHtml(t(state, 'common.noResults'))}</td></tr>`}</tbody></table></div><div class="resource-summary"><span>${escapeHtml(t(state, 'simulation.quantity'))}: <strong>${resources.quantity}</strong></span><span>${escapeHtml(t(state, 'simulation.totalXp'))}: <strong>${formatNumber(resources.xpObtained, state.language, 2)}</strong></span><span>${escapeHtml(t(state, 'simulation.totalCost'))}: <strong>${formatCompactKamas(resources.totalCost, state.language)}</strong></span><span>${escapeHtml(t(state, 'simulation.averageCostXp'))}: <strong>${formatNumber(resources.costPerXp, state.language, 2)} K</strong></span></div></div>` : ''}</div>`;
}

function renderCombinedConfigurator(state, sim, calc) {
  if ((sim.upMethod === 'resources' ? 'combined' : sim.upMethod) !== 'combined') return '';
  const method = calc.methods.combined;
  return `<section class="combined-config card section"><div><span class="eyebrow">${escapeHtml(t(state, 'simulation.combined'))}</span><h3>${escapeHtml(t(state, 'simulation.combinedHelpTitle'))}</h3><p class="muted small">${escapeHtml(t(state, 'simulation.combinedHelp'))}</p></div><div class="combined-flow"><div><span>${escapeHtml(t(state, 'simulation.resources'))}</span><strong>${formatNumber(method.resourceXp, state.language, 2)} XP</strong><small>${formatNumber(method.resourceQuantity, state.language)} ${escapeHtml(t(state, 'simulation.resourceUnits'))}</small></div><span class="flow-arrow">+</span><div><span>${escapeHtml(t(state, 'simulation.rationComplement'))}</span><strong>${formatNumber(method.rationQuantity, state.language)} ${escapeHtml(t(state, 'simulation.rationUnits'))}</strong><small>${formatNumber(method.remainingXp, state.language, 2)} XP</small></div><span class="flow-arrow">=</span><div><span>${escapeHtml(t(state, 'simulation.xpObtained'))}</span><strong>${formatNumber(method.xpObtained, state.language, 2)} XP</strong><small>${formatCompactKamas(method.totalCost, state.language)}</small></div></div><fieldset class="field"><legend>${escapeHtml(t(state, 'simulation.complementSource'))}</legend><div class="grid-2"><label class="compact-choice ${sim.combinedRationSource === 'vitaminizedFood' ? 'selected' : ''}"><input type="radio" name="combined-source" data-field="combinedRationSource" value="vitaminizedFood" ${sim.combinedRationSource === 'vitaminizedFood' ? 'checked' : ''}><strong>${escapeHtml(t(state, 'simulation.marketFood'))}</strong></label><label class="compact-choice ${sim.combinedRationSource === 'kolitokenBag' ? 'selected' : ''}"><input type="radio" name="combined-source" data-field="combinedRationSource" value="kolitokenBag" ${sim.combinedRationSource === 'kolitokenBag' ? 'checked' : ''}><strong>${escapeHtml(t(state, 'simulation.kolitokenBag'))}</strong></label></div></fieldset></section>`;
}

function renderMethodStep(state, editor, calc) {
  const sim = editor.simulation;
  const selectedMethod = sim.upMethod === 'resources' ? 'combined' : sim.upMethod;
  return `<div class="stack"><div class="bonus-inline"><span class="badge ${calc.xpBonusPercent > 0 ? 'green' : 'blue'}">${escapeHtml(t(state, 'simulation.activeBonusBadge', { bonus: formatNumber(calc.xpBonusPercent, state.language, 1) }))}</span><p class="muted small">${escapeHtml(t(state, 'simulation.bonusAppliesAll'))}</p></div><p class="muted">${escapeHtml(t(state, 'simulation.chooseMethod'))}</p><div class="form-grid"><label class="field"><span>${escapeHtml(t(state, 'simulation.marketFoodPrice'))}</span><div class="input-wrap"><input class="input" data-field="marketFoodPrice" inputmode="numeric" value="${sim.marketFoodPrice || ''}" placeholder="0"><span class="suffix">K</span></div></label><label class="field"><span>${escapeHtml(t(state, 'simulation.bagPrice'))}</span><div class="input-wrap"><input class="input" data-field="bagPrice" inputmode="numeric" value="${sim.bagPrice || ''}" placeholder="0"><span class="suffix">K</span></div></label></div><div class="method-grid">${['vitaminizedFood', 'kolitokenBag', 'combined'].map((id) => methodCard(state, { ...sim, upMethod: selectedMethod }, calc, id)).join('')}</div>${fieldError(editor, 'upMethod', state)}${fieldError(editor, 'marketFoodPrice', state)}${fieldError(editor, 'bagPrice', state)}${fieldError(editor, 'resources', state)}${renderCombinedConfigurator(state, sim, calc)}${selectedMethod === 'combined' ? renderResourceEditor(state, editor, calc) : ''}</div>`;
}

function renderCostsStep(state, editor, calc) {
  const sim = editor.simulation;
  return `<div class="stack"><div class="form-grid three"><label class="field"><span>${escapeHtml(t(state, 'simulation.originCost'))}</span><div class="input-wrap"><input class="input" data-field="originCost" inputmode="numeric" value="${sim.originCost || ''}" aria-invalid="${Boolean(editor.errors?.originCost)}"><span class="suffix">K</span></div>${fieldError(editor, 'originCost', state)}</label><label class="field"><span>${escapeHtml(t(state, 'simulation.additionalCosts'))} <small>${escapeHtml(t(state, 'common.optional'))}</small></span><div class="input-wrap"><input class="input" data-field="additionalCosts" inputmode="numeric" value="${sim.additionalCosts || ''}"><span class="suffix">K</span></div></label><label class="field"><span>${escapeHtml(t(state, 'simulation.salePrice'))}</span><div class="input-wrap"><input class="input" data-field="estimatedSalePrice" inputmode="numeric" value="${sim.estimatedSalePrice || ''}" aria-invalid="${Boolean(editor.errors?.estimatedSalePrice)}"><span class="suffix">K</span></div>${fieldError(editor, 'estimatedSalePrice', state)}</label></div><fieldset class="field"><legend>${escapeHtml(t(state, 'simulation.saleChannel'))}</legend><div class="grid-2"><label class="method-card ${sim.estimatedSaleChannel === 'Mercado HDV' ? 'selected' : ''}"><input type="radio" name="sale-channel" data-field="estimatedSaleChannel" value="Mercado HDV" ${sim.estimatedSaleChannel === 'Mercado HDV' ? 'checked' : ''}><strong>${escapeHtml(t(state, 'simulation.marketChannel'))}</strong><span class="muted small">2%</span></label><label class="method-card ${sim.estimatedSaleChannel === 'Outro Jogador' ? 'selected' : ''}"><input type="radio" name="sale-channel" data-field="estimatedSaleChannel" value="Outro Jogador" ${sim.estimatedSaleChannel === 'Outro Jogador' ? 'checked' : ''}><strong>${escapeHtml(t(state, 'simulation.playerChannel'))}</strong><span class="muted small">${escapeHtml(t(state, 'simulation.noFee'))}</span></label></div></fieldset><div class="kpis"><article class="card kpi"><span>${escapeHtml(t(state, 'simulation.upCost'))}</span><strong>${formatCompactKamas(calc.upCost, state.language)}</strong></article><article class="card kpi"><span>${escapeHtml(t(state, 'simulation.operationCost'))}</span><strong>${formatCompactKamas(calc.operationCost, state.language)}</strong></article>${calc.fee ? `<article class="card kpi"><span>${escapeHtml(t(state, 'simulation.marketFee'))}</span><strong>${formatCompactKamas(calc.fee, state.language)}</strong></article>` : ''}<article class="card kpi"><span>${escapeHtml(t(state, 'simulation.estimatedProfit'))}</span><strong class="${calc.estimatedProfit > 0 ? 'positive' : calc.estimatedProfit < 0 ? 'negative' : 'zero'}">${formatCompactKamas(calc.estimatedProfit, state.language)}</strong></article></div></div>`;
}

function selectedQuantityText(state, calc, method) {
  if (method === 'vitaminizedFood') return t(state, 'simulation.rationsRequired', { count: calc.methods.vitaminizedFood.quantity });
  if (method === 'kolitokenBag') return t(state, 'simulation.bagsAndRationsRequired', { bags: calc.methods.kolitokenBag.quantity, rations: calc.methods.kolitokenBag.rationQuantity });
  if (method === 'resources' || method === 'combined') return t(state, 'simulation.combinedQuantity', { resources: calc.methods.combined.resourceQuantity, rations: calc.methods.combined.rationQuantity });
  return '—';
}

function renderReviewStep(state, editor, calc) {
  const sim = editor.simulation;
  const creature = getCreatureById(sim.creatureId);
  const method = sim.upMethod === 'resources' ? 'combined' : sim.upMethod;
  return `<div class="review-grid">${copyableImage(creature?.imageUrl, creature ? getCreatureName(creature, state.language) : sim.creatureCanonicalName, 'creature-thumb large', '', t(state,'v303.copyItemName',{name:creature ? getCreatureName(creature,state.language) : sim.creatureCanonicalName}))}<div><span class="eyebrow">${escapeHtml(t(state, 'simulation.steps.review'))}</span><h2>${escapeHtml(sim.name || `${creature?.canonicalName || ''} — ${t(state, 'simulation.levelRange', { origin: sim.originLevel, target: sim.targetLevel })}`)}</h2><p class="muted">${escapeHtml(t(state, `simulation.${methodKey[method]}`))}</p><div class="review-values" style="margin-top:16px"><div class="metric"><span>${escapeHtml(t(state, 'simulation.requiredXp'))}</span><strong>${formatNumber(calc.xpNeeded, state.language, 2)} XP</strong></div><div class="metric"><span>${escapeHtml(t(state, 'simulation.xpBonus'))}</span><strong>${calc.xpBonusPercent > 0 ? `+${formatNumber(calc.xpBonusPercent, state.language, 1)}%` : escapeHtml(t(state, 'simulation.noBonus'))}</strong></div><div class="metric"><span>${escapeHtml(t(state, 'simulation.quantityNeeded'))}</span><strong>${escapeHtml(selectedQuantityText(state, calc, method))}</strong></div><div class="metric"><span>${escapeHtml(t(state, 'simulation.upCost'))}</span><strong>${formatCompactKamas(calc.upCost, state.language)}</strong></div><div class="metric"><span>${escapeHtml(t(state, 'simulation.operationCost'))}</span><strong>${formatCompactKamas(calc.operationCost, state.language)}</strong></div><div class="metric"><span>${escapeHtml(t(state, 'simulation.salePrice'))}</span><strong>${formatCompactKamas(calc.salePrice, state.language)}</strong></div>${calc.fee ? `<div class="metric"><span>${escapeHtml(t(state, 'simulation.marketFee'))}</span><strong>${formatCompactKamas(calc.fee, state.language)}</strong></div>` : ''}<div class="metric"><span>${escapeHtml(t(state, 'simulation.estimatedProfit'))}</span><strong class="${calc.estimatedProfit >= 0 ? 'positive' : 'negative'}">${formatCompactKamas(calc.estimatedProfit, state.language)}</strong></div></div></div></div>`;
}

export function renderSimulationEditor(state) {
  const editor = state.simulationEditor;
  const calc = calculateSimulation(editor.simulation);
  const title = editor.mode === 'edit' ? 'editTitle' : editor.mode === 'duplicate' ? 'duplicateTitle' : 'newTitle';
  const bodies = [renderCreatureStep, renderLevelsStep, renderMethodStep, renderCostsStep, renderReviewStep];
  return `<section class="editor-shell"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state, 'simulation.stepLabel', { current: editor.step, total: 5 }))}</span><h1>${escapeHtml(t(state, `simulation.${title}`))}</h1></div><button class="button secondary" data-action="exit-editor">${icon('close', 17)} ${escapeHtml(t(state, 'common.cancel'))}</button></div>${renderStepper(state, editor)}<div class="card editor-panel">${bodies[editor.step - 1](state, editor, calc)}<div class="editor-nav"><button class="button secondary" data-action="prev-step" ${editor.step === 1 ? 'disabled' : ''}>${icon('back', 17)} ${escapeHtml(t(state, 'common.back'))}</button>${editor.step < 5 ? `<button class="button primary" data-action="next-step">${escapeHtml(editor.step === 4 ? t(state, 'simulation.reviewSimulation') : t(state, 'common.continue'))} ${icon('chevron', 17)}</button>` : `<button class="button primary" data-action="save-simulation">${icon('check', 17)} ${escapeHtml(editor.mode === 'edit' ? t(state, 'simulation.updateSimulation') : t(state, 'simulation.saveSimulation'))}</button>`}</div></div></section>`;
}
