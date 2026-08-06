function walk(lines, callback) {
  for (const line of Array.isArray(lines) ? lines : []) {
    callback(line);
    if (Array.isArray(line.subRecipe) && line.subRecipe.length) walk(line.subRecipe, callback);
  }
}

export function collectRecipeAnkamaIds(ingredients) {
  const ids = new Set();
  walk(ingredients, line => {
    if (line?.ankamaId != null && String(line.ankamaId).trim()) ids.add(String(line.ankamaId));
  });
  return [...ids];
}

export function applyCommunityPrices(ingredients, prices = {}, { overwriteManual = false } = {}) {
  let changed = 0;
  walk(ingredients, line => {
    const price = prices?.[String(line.ankamaId)];
    if (!price) return;
    line.communityPriceUnit = Math.max(0, Math.round(Number(price.unitPrice) || 0));
    line.communityPriceRegisteredAt = price.registeredAt || null;
    line.communityPriceAgeDays = Math.max(0, Number(price.ageDays) || 0);
    line.communityPriceFreshness = price.freshness || 'FRESH';
    line.communityPriceSource = price.source || 'COMUNIDADE';
    line.communityPriceIsOwn = Boolean(price.isOwn);
    const hasManualValue = line.priceInputSource === 'manual' && Number(line.unitMarketPrice) > 0;
    if (overwriteManual || !hasManualValue) {
      line.unitMarketPrice = line.communityPriceUnit;
      line.priceInputSource = 'community';
      line.priceDirty = false;
      line.priceSyncStatus = 'idle';
    }
    changed += 1;
  });
  return changed;
}

export function markIngredientPriceEdited(line, value) {
  if (!line) return;
  line.unitMarketPrice = Math.max(0, Math.round(Number(value) || 0));
  line.priceInputSource = 'manual';
  line.priceDirty = line.unitMarketPrice > 0 && line.unitMarketPrice !== Number(line.priceLastSubmittedUnit || 0);
  line.priceSyncStatus = line.priceDirty ? 'dirty' : 'idle';
}

export function collectDirtyIngredientPrices(ingredients) {
  const rows = [];
  walk(ingredients, line => {
    if (!line?.priceDirty || line.priceSyncStatus === 'saving' || Number(line.unitMarketPrice) <= 0 || line.ankamaId == null) return;
    rows.push(line);
  });
  return rows;
}

export function setPriceSyncStatus(lines, status, registered = []) {
  const byId = new Map((registered || []).map(row => [String(row.ankamaId), row]));
  for (const line of lines || []) {
    line.priceSyncStatus = status;
    if (status === 'saved') {
      line.priceDirty = false;
      line.priceLastSubmittedUnit = Number(line.unitMarketPrice) || 0;
      const saved = byId.get(String(line.ankamaId));
      if (saved) {
        line.communityPriceUnit = Number(saved.unitPrice) || line.unitMarketPrice;
        line.communityPriceRegisteredAt = saved.registeredAt || new Date().toISOString();
        line.communityPriceAgeDays = 0;
        line.communityPriceFreshness = 'FRESH';
        line.communityPriceIsOwn = true;
      }
    }
  }
}

export function findIngredientRecursive(ingredients, id) {
  let found = null;
  walk(ingredients, line => { if (!found && String(line.id) === String(id)) found = line; });
  return found;
}
