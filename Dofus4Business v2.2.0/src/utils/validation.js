import { MAX_LEVEL } from '../data/xpTable.js';
import { getCreatureById } from '../data/creatures.js';

export function validateStep(simulation, step, calculation) {
  const errors = {};
  if (step === 1) {
    const creature = getCreatureById(simulation.creatureId);
    if (!creature || creature.type !== simulation.creatureType) errors.creatureId = 'creature';
  }
  if (step === 2) {
    if (!Number.isInteger(simulation.originLevel) || simulation.originLevel < 0 || simulation.originLevel >= MAX_LEVEL) errors.originLevel = 'levels';
    if (!Number.isInteger(simulation.targetLevel) || simulation.targetLevel <= simulation.originLevel || simulation.targetLevel > MAX_LEVEL) errors.targetLevel = 'levels';
  }
  if (step === 3) {
    if (!['vitaminizedFood', 'kolitokenBag', 'resources', 'combined'].includes(simulation.upMethod)) errors.upMethod = 'method';
    if (simulation.upMethod === 'vitaminizedFood' && simulation.marketFoodPrice <= 0) errors.marketFoodPrice = 'method';
    if (simulation.upMethod === 'kolitokenBag' && simulation.bagPrice <= 0) errors.bagPrice = 'method';
    if (simulation.upMethod === 'resources' && (!calculation.resources.sufficient || calculation.resources.lines.length === 0)) errors.resources = 'resources';
    if (simulation.upMethod === 'combined') {
      if (calculation.resources.lines.length === 0) errors.resources = 'combinedResources';
      if (!calculation.methods.combined.sufficient) errors.resources = 'combinedIncomplete';
      if (calculation.methods.combined.remainingXp > 0 && simulation.combinedRationSource === 'vitaminizedFood' && simulation.marketFoodPrice <= 0) errors.marketFoodPrice = 'method';
      if (calculation.methods.combined.remainingXp > 0 && simulation.combinedRationSource === 'kolitokenBag' && simulation.bagPrice <= 0) errors.bagPrice = 'method';
    }
  }
  if (step === 4) {
    if (!Number.isSafeInteger(simulation.originCost) || simulation.originCost < 0) errors.originCost = 'originCost';
    if (!Number.isSafeInteger(simulation.estimatedSalePrice) || simulation.estimatedSalePrice <= 0) errors.estimatedSalePrice = 'sale';
    if (!['Mercado HDV', 'Outro Jogador'].includes(simulation.estimatedSaleChannel)) errors.estimatedSaleChannel = 'sale';
  }
  return errors;
}

export function isStepValid(simulation, step, calculation) {
  return Object.keys(validateStep(simulation, step, calculation)).length === 0;
}
