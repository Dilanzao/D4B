import { calculateCraftProject, ingredientCost } from '../utils/craftCalculations.js';
import { professionLabel } from '../utils/craftProfession.js';
import { formatKamas, formatNumber } from '../../../utils/currency.js';
import { copyableImage, escapeHtml, icon, imageTag, t } from '../../../components/common.js';
import { renderBreadcrumbs } from '../../../components/breadcrumbs.js';

function searchResults(state) {
  const search = state.craftSearch || {};
  if (search.status === 'loading') return `<div class="combobox-empty">${escapeHtml(t(state,'v3.crafts.filteringCraftable'))}</div>`;
  if (search.error) return `<div class="combobox-empty error-text">${escapeHtml(t(state,'v3.crafts.apiUnavailable'))}</div>`;
  if (!search.results.length) return `<div class="combobox-empty">${escapeHtml(search.query ? t(state,'v3.crafts.noCraftableResults') : t(state,'v3.crafts.searchHint'))}</div>`;
  return search.results.map(item => `<button type="button" class="combobox-option item-option" data-action="select-craft-item" data-id="${item.ankamaId}" data-category="${escapeHtml(item.category)}">${imageTag(item.imageUrl,item.name,'combobox-thumb','/assets/placeholders/item-fallback.svg')}<span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(t(state,'simulation.levelShort'))} ${formatNumber(item.level)} · ${escapeHtml(professionLabel(item.professionTag,state.language))} · ${formatNumber(item.recipe?.length || 0)} ${escapeHtml(t(state,'v3.crafts.ingredients').toLocaleLowerCase())}</small></span></button>`).join('');
}

function professionBadge(state, tag, canCraft = true) {
  if (!canCraft || !tag || tag === 'unknown') return '';
  return `<span class="profession-badge" data-profession="${escapeHtml(tag)}">${escapeHtml(professionLabel(tag,state.language))}</span>`;
}

function comparisonMarkup(state, line, inventory) {
  if (!line.isCraftable || !line.subRecipe?.length || !line.unitMarketPrice || !line.remaining) return '';
  const buyCost = line.remaining * line.unitMarketPrice;
  const alternateRows = line.subRecipe.map(child => ingredientCost(child,line.remaining,inventory));
  const craftCost = alternateRows.reduce((sum, child) => sum + child.cost, 0);
  const craftWins = craftCost < buyCost;
  const equal = craftCost === buyCost;
  return `<div class="ingredient-comparison ${equal ? 'neutral' : craftWins ? 'positive' : 'warning'}"><span>${escapeHtml(t(state,'v303.marketComparisonHelp'))}</span><strong>${escapeHtml(equal ? t(state,'v303.sameCost') : craftWins ? t(state,'v303.craftCheaper') : t(state,'v303.buyCheaper'))}</strong><small>${escapeHtml(t(state,'v303.buyReady'))}: ${formatKamas(buyCost,state.language)} · ${escapeHtml(t(state,'v3.crafts.manufacture'))}: ${formatKamas(craftCost,state.language)}</small></div>`;
}

function ingredientCard(state, line) {
  const modeLabel = mode => t(state, `v3.crafts.${mode === 'buy' ? 'buy' : mode === 'craft' ? 'manufacture' : 'drop'}`);
  const canCraft = Boolean(line.isCraftable || line.subRecipe?.length);
  const stockMax = Math.min(line.required || line.totalQuantity || 0, line.stockAvailable || 0);
  const loading = line.subRecipeStatus === 'loading';
  const recipeButton = canCraft ? `<button class="button ghost compact" data-action="open-craft-recipe" data-id="${escapeHtml(line.id)}" ${loading ? 'disabled' : ''}>${icon('craft',15)} ${escapeHtml(loading ? t(state,'common.loading') : t(state,'v303.openRecipePlanner'))}</button>` : '';
  return `<article class="ingredient-row ingredient-row-flat" data-ingredient-id="${escapeHtml(line.id)}">
    <div class="ingredient-main">${copyableImage(line.imageSnapshot,line.nameSnapshot,'ingredient-thumb','/assets/placeholders/item-fallback.svg',t(state,'v303.copyItemName',{name:line.nameSnapshot}))}<div><strong>${escapeHtml(line.nameSnapshot)}</strong><small>${formatNumber(line.quantityPerUnit)} × ${escapeHtml(t(state,'v3.crafts.perUnit'))} · ${formatNumber(line.required || line.totalQuantity)} ${escapeHtml(t(state,'v3.crafts.total'))}</small>${professionBadge(state,line.professionTag,canCraft)}</div></div>
    <label class="field compact-field"><span>${escapeHtml(t(state,'v3.crafts.acquisition'))}</span><select class="select" data-craft-ingredient-field="acquisitionMode" data-id="${escapeHtml(line.id)}"><option value="buy" ${line.acquisitionMode==='buy'?'selected':''}>${escapeHtml(modeLabel('buy'))}</option><option value="drop" ${line.acquisitionMode==='drop'?'selected':''}>${escapeHtml(modeLabel('drop'))}</option>${canCraft?`<option value="craft" ${line.acquisitionMode==='craft'?'selected':''}>${escapeHtml(modeLabel('craft'))}</option>`:''}</select></label>
    <label class="field compact-field"><span>${escapeHtml(canCraft ? t(state,'v303.readyMarketPrice') : t(state,'v3.crafts.unitPrice'))}</span><input class="input" inputmode="numeric" data-craft-ingredient-field="unitMarketPrice" data-id="${escapeHtml(line.id)}" value="${line.unitMarketPrice||''}"><small>${canCraft ? escapeHtml(t(state,'v303.readyMarketPriceHelp')) : ''}</small></label>
    <label class="field compact-field stock-field"><span>${escapeHtml(t(state,'v3.crafts.stockUse'))} <small>${formatNumber(line.stockAvailable || 0)} ${escapeHtml(t(state,'v3.inventory.available'))}</small></span><div class="input-with-action"><input class="input" inputmode="numeric" data-craft-ingredient-field="useStockQuantity" data-id="${escapeHtml(line.id)}" value="${line.useStockQuantity||''}" max="${stockMax}"><button type="button" class="mini-action" data-action="use-max-stock" data-id="${escapeHtml(line.id)}" ${stockMax<=0?'disabled':''}>${escapeHtml(t(state,'v3.crafts.maxStock'))}</button></div></label>
    <div class="ingredient-cost"><span>${escapeHtml(t(state,'v3.sales.cost'))}</span><strong>${formatKamas(line.cost || 0,state.language)}</strong><small>${line.stockUsed?`${formatNumber(line.stockUsed)} ${escapeHtml(t(state,'v3.crafts.fromStock'))}`:''}</small></div>
    <div class="ingredient-actions">${recipeButton}</div>
    ${comparisonMarkup(state,line,state.craftInventory)}
    ${line.missing?.length?`<div class="ingredient-warning">${icon('alert',14)} ${escapeHtml(line.missing.some(item=>item.reason==='price')?t(state,'v3.crafts.priceRequired'):t(state,'v3.crafts.recipeRequired'))}</div>`:''}
  </article>`;
}

export function renderCraftProjectEditor(state) {
  const editor = state.craftEditor;
  if (!editor) return '';
  const project = editor.project;
  const calc = calculateCraftProject(project, state.craftInventory);
  const isReady = calc.readiness === 'ready';
  const canComplete = editor.mode !== 'new' && isReady && ['ready','planned','awaiting_resources','draft'].includes(project.status);
  project.totalCost = Math.round(calc.totalCost);
  project.financialCost = project.economicCost = project.accountingCost = project.replacementCost = project.totalCost;

  const readinessNotice = !project.ankamaId
    ? `<div class="notice warning">${escapeHtml(t(state,'v3.crafts.chooseItemFirst'))}</div>`
    : !project.ingredients.length
      ? `<div class="notice warning">${escapeHtml(t(state,'v3.crafts.noRecipe'))}</div>`
      : !isReady
        ? `<div class="notice warning"><strong>${escapeHtml(t(state,'v3.crafts.notReadyTitle'))}</strong><span>${escapeHtml(t(state,'v3.crafts.missingPrices',{count:calc.missingPrices.length + calc.missingRecipes.length}))} ${escapeHtml(t(state,'v3.crafts.readyBlockHelp'))}</span></div>`
        : `<div class="notice success"><strong>${escapeHtml(t(state,'v3.crafts.readyTitle'))}</strong><span>${escapeHtml(t(state,'v3.crafts.readyHelp'))}</span></div>`;

  return `<section class="stack">${renderBreadcrumbs(state,[{label:t(state,'v3.modules.crafts.title'),route:'crafts'},{label:t(state,'v3.crafts.projects'),route:'craft-projects'},{label:project.itemNameSnapshot||t(state,'v3.crafts.newProject')}])}<div class="section-head"><div><span class="eyebrow">${escapeHtml(t(state,'v3.crafts.projectEditor'))}</span><h1>${escapeHtml(editor.mode==='new'?t(state,'v3.crafts.newProject'):project.itemNameSnapshot)}</h1><p>${escapeHtml(t(state,'v3.crafts.editorDescription'))}</p></div><button class="button ghost" data-action="exit-craft-editor">${icon('back',17)} ${escapeHtml(t(state,'common.back'))}</button></div>
    <div class="craft-editor-layout"><div class="stack">
      <article class="card section"><h2>${escapeHtml(t(state,'v3.crafts.chooseItem'))}</h2><div class="craft-item-selector"><label class="field"><span>${escapeHtml(t(state,'v3.crafts.searchItem'))}</span><div class="combobox"><input class="input" autocomplete="off" data-craft-item-search value="${escapeHtml(editor.itemQuery||'')}" placeholder="${escapeHtml(t(state,'v3.crafts.searchPlaceholder'))}" aria-controls="craft-item-options" aria-expanded="${Boolean(editor.searchOpen)}"><div id="craft-item-options" class="combobox-options" role="listbox" ${editor.searchOpen?'':'hidden'}>${searchResults(state)}</div></div></label>${project.ankamaId?`<div class="selected-craft-item">${copyableImage(project.itemImageSnapshot,project.itemNameSnapshot,'selected-item-image','/assets/placeholders/item-fallback.svg',t(state,'v303.copyItemName',{name:project.itemNameSnapshot}))}<div><strong>${escapeHtml(project.itemNameSnapshot)}</strong><small>${escapeHtml(project.itemTypeSnapshot)} · ${escapeHtml(t(state,'simulation.levelShort'))} ${formatNumber(project.itemLevelSnapshot)} · ${formatNumber(project.ingredients.length)} ${escapeHtml(t(state,'v3.crafts.ingredients').toLocaleLowerCase())}</small>${professionBadge(state,project.professionTag,true)}</div></div>`:''}</div></article>
      <article class="card section"><h2>${escapeHtml(t(state,'v3.crafts.plan'))}</h2><div class="form-grid four"><label class="field"><span>${escapeHtml(t(state,'v3.crafts.quantity'))}</span><input class="input" inputmode="numeric" data-craft-field="desiredQuantity" value="${project.desiredQuantity||''}"></label><label class="field"><span>${escapeHtml(t(state,'v3.crafts.finishedMarketPrice'))}</span><input class="input" inputmode="numeric" data-craft-field="marketUnitPrice" value="${project.marketUnitPrice||''}"></label><label class="field"><span>${escapeHtml(t(state,'v3.crafts.desiredSalePrice'))}</span><input class="input" inputmode="numeric" data-craft-field="desiredSalePrice" value="${project.desiredSalePrice||''}"></label><label class="field"><span>${escapeHtml(t(state,'v3.crafts.additionalCosts'))}</span><input class="input" inputmode="numeric" data-craft-field="additionalCosts" value="${project.additionalCosts||''}"></label><label class="field"><span>${escapeHtml(t(state,'v3.crafts.saleChannel'))}</span><select class="select" data-craft-field="saleChannel"><option value="HDV" ${project.saleChannel==='HDV'?'selected':''}>HDV</option><option value="Venda direta" ${project.saleChannel==='Venda direta'?'selected':''}>${escapeHtml(t(state,'v3.sales.direct'))}</option></select></label><label class="field span-2"><span>${escapeHtml(t(state,'v3.crafts.notes'))}</span><input class="input" data-craft-field="notes" value="${escapeHtml(project.notes||'')}"></label></div></article>
      <article class="card section"><div class="section-head compact-head"><div><h2>${escapeHtml(t(state,'v3.crafts.ingredients'))}</h2><p>${escapeHtml(t(state,'v303.ingredientsModalHelp'))}</p></div></div>${project.ingredients.length?`<div class="ingredient-list ingredient-list-flat">${calc.ingredients.map(line=>ingredientCard(state,line)).join('')}</div>`:`<div class="empty-inline">${escapeHtml(project.ankamaId?t(state,'v3.crafts.noRecipe'):t(state,'v3.crafts.chooseItemFirst'))}</div>`}</article>
    </div><aside class="stack sticky craft-summary"><article class="card section"><span class="eyebrow">${escapeHtml(t(state,'v3.crafts.summary'))}</span><dl class="summary-list"><div><dt>${escapeHtml(t(state,'v3.crafts.totalCost'))}</dt><dd>${formatKamas(calc.totalCost)}</dd></div><div><dt>${escapeHtml(t(state,'v3.crafts.unitCost'))}</dt><dd>${formatKamas(calc.unitCost)}</dd></div><div><dt>${escapeHtml(t(state,'v3.crafts.marketBuyCost'))}</dt><dd>${project.marketUnitPrice?formatKamas(calc.marketBuyCost):'—'}</dd></div><div><dt>${escapeHtml(t(state,'v3.metrics.potentialProfit'))}</dt><dd class="${calc.potentialProfit<0?'negative':'positive'}">${formatKamas(calc.potentialProfit)}</dd></div><div><dt>${escapeHtml(t(state,'v3.crafts.margin'))}</dt><dd>${formatNumber(calc.potentialMargin,1)}%</dd></div><div><dt>ROI</dt><dd>${formatNumber(calc.roi,1)}%</dd></div></dl>${readinessNotice}<div class="stack-actions"><button class="button primary" data-action="save-craft-project-auto">${icon('check',17)} ${escapeHtml(isReady?t(state,'v3.crafts.saveProject'):t(state,'v3.crafts.saveDraft'))}</button>${editor.mode!=='new'?`<button class="button secondary" data-action="complete-craft-project" data-id="${escapeHtml(project.id)}" ${canComplete?'':'disabled'}>${escapeHtml(t(state,'v3.crafts.completeProduction'))}</button>`:''}</div></article></aside></div>
  </section>`;
}
