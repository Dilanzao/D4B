import { calculateCraftProject, ingredientCost } from '../utils/craftCalculations.js';
import { findIngredientById } from '../utils/craftRecipeTree.js';
import { professionLabel } from '../utils/craftProfession.js';
import { formatKamas, formatNumber } from '../../../utils/currency.js';
import { copyableImage, escapeHtml, icon, t } from '../../../components/common.js';
import { renderCommunityPriceBox } from './communityPriceUi.js';

function findCalculated(lines = [], id) {
  for (const line of lines) {
    if (String(line.id) === String(id)) return line;
    const child = findCalculated(line.subCosts || [], id);
    if (child) return child;
  }
  return null;
}

function professionBadge(state, line) {
  const canCraft = Boolean(line?.isCraftable || line?.subRecipe?.length);
  if (!canCraft || !line.professionTag || line.professionTag === 'unknown') return '';
  return `<span class="profession-badge">${escapeHtml(professionLabel(line.professionTag,state.language))}</span>`;
}

function comparison(state, line) {
  if (!line.isCraftable || !line.subRecipe?.length || !line.unitMarketPrice || !line.remaining) return '';
  const buyCost = line.remaining * line.unitMarketPrice;
  const craftCost = line.subRecipe.map(child => ingredientCost(child,line.remaining,state.craftInventory,state.craftEditor?.project?.serverId||'')).reduce((sum, child) => sum + child.cost, 0);
  const key = craftCost === buyCost ? 'sameCost' : craftCost < buyCost ? 'craftCheaper' : 'buyCheaper';
  return `<div class="recipe-comparison ${craftCost < buyCost ? 'positive' : craftCost > buyCost ? 'warning' : 'neutral'}"><strong>${escapeHtml(t(state,`v303.${key}`))}</strong><small>${escapeHtml(t(state,'v303.buyReady'))}: ${formatKamas(buyCost,state.language)} · ${escapeHtml(t(state,'v3.crafts.manufacture'))}: ${formatKamas(craftCost,state.language)}</small></div>`;
}

function recipeLine(state, line) {
  const canCraft = Boolean(line.isCraftable || line.subRecipe?.length);
  const stockMax = Math.min(line.required || line.totalQuantity || 0, line.stockAvailable || 0);
  return `<article class="recipe-planner-line" data-ingredient-id="${escapeHtml(line.id)}">
    <div class="recipe-planner-item">${copyableImage(line.imageSnapshot,line.nameSnapshot,'ingredient-thumb','/assets/placeholders/item-fallback.svg',t(state,'v303.copyItemName',{name:line.nameSnapshot}))}<div><strong>${escapeHtml(line.nameSnapshot)}</strong><small>${formatNumber(line.required || line.totalQuantity,state.language)} ${escapeHtml(t(state,'v3.crafts.total'))}</small>${professionBadge(state,line)}</div></div>
    <label class="field compact-field"><span>${escapeHtml(t(state,'v3.crafts.acquisition'))}</span><select class="select" data-craft-ingredient-field="acquisitionMode" data-id="${escapeHtml(line.id)}"><option value="buy" ${line.acquisitionMode==='buy'?'selected':''}>${escapeHtml(t(state,'v3.crafts.buy'))}</option><option value="drop" ${line.acquisitionMode==='drop'?'selected':''}>${escapeHtml(t(state,'v3.crafts.drop'))}</option>${canCraft?`<option value="craft" ${line.acquisitionMode==='craft'?'selected':''}>${escapeHtml(t(state,'v3.crafts.manufacture'))}</option>`:''}</select></label>
    <label class="field compact-field"><span>${escapeHtml(t(state,'v310.prices.observedPrice'))}</span><input class="input" inputmode="numeric" data-craft-ingredient-field="unitMarketPrice" data-id="${escapeHtml(line.id)}" value="${line.unitMarketPrice||''}"></label>
    <label class="field compact-field"><span>${escapeHtml(t(state,'v3.crafts.stockUse'))} <small>${formatNumber(line.stockAvailable||0,state.language)}</small></span><div class="input-with-action"><input class="input" inputmode="numeric" data-craft-ingredient-field="useStockQuantity" data-id="${escapeHtml(line.id)}" value="${line.useStockQuantity||''}" max="${stockMax}"><button type="button" class="mini-action" data-action="use-max-stock" data-id="${escapeHtml(line.id)}" ${stockMax<=0?'disabled':''}>${escapeHtml(t(state,'v3.crafts.maxStock'))}</button></div></label>
    <div class="ingredient-cost"><span>${escapeHtml(t(state,'v3.sales.cost'))}</span><strong>${formatKamas(line.cost||0,state.language)}</strong></div>
    <div class="ingredient-actions">${canCraft?`<button class="button ghost compact" data-action="open-craft-recipe-level" data-id="${escapeHtml(line.id)}" ${line.subRecipeStatus==='loading'?'disabled':''}>${icon('chevron',15)} ${escapeHtml(t(state,'v303.openRecipeLevel'))}</button>`:''}</div>
    ${renderCommunityPriceBox(state,line)}
    ${comparison(state,line)}
    ${line.missing?.length?`<div class="ingredient-warning">${icon('alert',14)} ${escapeHtml(line.missing.some(item=>item.reason==='price')?t(state,'v3.crafts.priceRequired'):t(state,'v3.crafts.recipeRequired'))}</div>`:''}
  </article>`;
}

export function renderCraftRecipePlanner(state, modal) {
  const editor = state.craftEditor;
  if (!editor) return null;
  const stack = Array.isArray(modal.recipeStack) && modal.recipeStack.length ? modal.recipeStack : [modal.ingredientId];
  const currentId = stack[stack.length - 1];
  const current = findIngredientById(editor.project.ingredients,currentId);
  if (!current) return null;
  const calc = calculateCraftProject(editor.project,state.craftInventory);
  const calculated = findCalculated(calc.ingredients,currentId) || current;
  const crumbs = stack.map((id,index) => {
    const line = findIngredientById(editor.project.ingredients,id);
    return `<button type="button" class="recipe-breadcrumb ${index===stack.length-1?'active':''}" data-action="craft-recipe-breadcrumb" data-index="${index}">${escapeHtml(line?.nameSnapshot || '')}</button>`;
  }).join('<span>›</span>');
  const loading = current.subRecipeStatus === 'loading';
  const multiplier = Math.max(1,calculated.remaining || calculated.required || 1);
  const rows = (current.subRecipe || []).map(child => ingredientCost(child,multiplier,state.craftInventory,editor.project.serverId||''));
  const body = `<div class="recipe-planner" data-scroll-key="recipe-planner-content">
    <nav class="recipe-breadcrumbs" aria-label="${escapeHtml(t(state,'v303.recipePath'))}">${crumbs}</nav>
    <div class="recipe-planner-hero">${copyableImage(current.imageSnapshot,current.nameSnapshot,'selected-item-image','/assets/placeholders/item-fallback.svg',t(state,'v303.copyItemName',{name:current.nameSnapshot}))}<div><span class="eyebrow">${escapeHtml(t(state,'v303.recipe'))}</span><h3>${escapeHtml(current.nameSnapshot)}</h3>${professionBadge(state,current)}<p class="muted small">${escapeHtml(t(state,'v303.recipeModalHelp'))}</p></div><div class="recipe-total"><span>${escapeHtml(t(state,'v303.recipeCost'))}</span><strong>${formatKamas(rows.reduce((sum,row)=>sum+row.cost,0),state.language)}</strong></div></div>
    ${loading?`<div class="empty-inline">${escapeHtml(t(state,'common.loading'))}</div>`:rows.length?`<div class="recipe-planner-list">${rows.map(line=>recipeLine(state,line)).join('')}</div>`:`<div class="notice warning">${escapeHtml(t(state,'v3.crafts.recipeRequired'))}</div>`}
  </div>`;
  return {
    title: t(state,'v303.recipePlanner'),
    body,
    actions: `<button class="button secondary" data-action="close-modal">${escapeHtml(t(state,'common.close'))}</button>`,
    wide: true,
    extraClass: 'recipe-planner-modal'
  };
}
