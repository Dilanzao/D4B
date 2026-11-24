import { MAX_LEVEL } from '../data/xpTable.js';
import { getCreatureById } from '../data/creatures.js';

export function validateSimulation(simulation) {
  const errors = {};
  if (!getCreatureById(simulation.creatureId)) errors.creatureId = 'creature';
  if (!Number.isInteger(simulation.originLevel) || simulation.originLevel < 0 || simulation.originLevel >= MAX_LEVEL) errors.originLevel = 'levels';
  if (!Number.isInteger(simulation.targetLevel) || simulation.targetLevel <= simulation.originLevel || simulation.targetLevel > MAX_LEVEL) errors.targetLevel = 'levels';
  return errors;
}