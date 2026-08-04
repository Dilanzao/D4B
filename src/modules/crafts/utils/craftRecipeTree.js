export function findIngredientById(lines = [], id) {
  for (const line of lines) {
    if (String(line.id) === String(id)) return line;
    const nested = findIngredientById(line.subRecipe || [], id);
    if (nested) return nested;
  }
  return null;
}

export function walkIngredients(lines = [], callback, depth = 0, parent = null) {
  for (const line of lines) {
    callback(line, depth, parent);
    walkIngredients(line.subRecipe || [], callback, depth + 1, line);
  }
}

export function collectAncestorAnkamaIds(lines = [], targetId, ancestors = []) {
  for (const line of lines) {
    if (String(line.id) === String(targetId)) return ancestors;
    const nested = collectAncestorAnkamaIds(line.subRecipe || [], targetId, [...ancestors, line.ankamaId].filter(Boolean));
    if (nested) return nested;
  }
  return null;
}

export function inventorySnapshotFor(ingredient, inventory = []) {
  const item = inventory.find(row => ingredient.ankamaId != null && String(row.ankamaId) === String(ingredient.ankamaId));
  return {
    inventoryItemId: item?.id || null,
    stockAvailable: Math.max(0, Number(item?.availableQuantity ?? item?.quantity ?? 0) || 0),
    stockUnitCost: Math.max(0, Number(item?.weightedUnitCost ?? 0) || 0)
  };
}

export function flattenCalculatedIngredients(lines = []) {
  const result = [];
  const visit = line => {
    result.push(line);
    (line.subCosts || []).forEach(visit);
  };
  lines.forEach(visit);
  return result;
}
