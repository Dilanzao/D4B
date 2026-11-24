import assert from 'node:assert/strict';
import { creatureCatalog } from '../src/data/creatures.js';
import { renderSimulationEditor } from '../src/components/simulationStepper.js';

const catalog = Array.from({ length: 125 }, (_, index) => ({
  id: `dofusdude-${index + 1}`,
  ankamaId: index + 1,
  canonicalName: `Recurso ${index + 1}`,
  name: `Recurso ${index + 1}`,
  imageUrl: index % 2 ? `https://example.invalid/resource-${index + 1}.png` : '',
  level: index + 1,
  xp: index < 5 ? 100 + index : null
}));

const simulation = {
  id: 'simulation-ui-test',
  name: 'Teste de interface',
  creatureType: 'Mascote',
  creatureId: '',
  creatureCanonicalName: '',
  creatureImageUrl: './assets/placeholders/creature-fallback.svg',
  originLevel: 0,
  currentXp: 0,
  xpBonusPercent: 0,
  targetLevel: 100,
  upMethod: 'combined',
  marketFoodPrice: 10000,
  bagPrice: 100000,
  combinedRationSource: 'vitaminizedFood',
  resourceLines: [],
  originCost: 0,
  additionalCosts: 0,
  estimatedSalePrice: 0,
  estimatedSaleChannel: 'Mercado HDV'
};

const baseState = {
  petPrices: { ration: 0, bag: 0, resources: {} },
  petCommunity: { serverId: '', prices: {}, sync: {}, status: 'idle', scan: 'idle', progress: 0 },
  language: 'pt-BR',
  resourceCatalog: catalog,
  resourceCatalogStatus: 'ready',
  resourceCatalogSource: 'dofusdude',
  simulationEditor: {
    mode: 'new', step: 1, maxReached: 5, simulation, errors: {}, resourcesOpen: true,
    creatureQuery: '', comboOpen: true, activeOption: 0,
    resourceQuery: '', resourceComboOpen: true, selectedResourceId: '',
    resourceDraft: { xp: 0, quantity: 1, unitPrice: 0, custom: false }
  }
};

const creatureHtml = renderSimulationEditor(baseState);
const creatureOptions = (creatureHtml.match(/data-action="select-creature"/g) || []).length;
// A busca única reúne mascotes e montascotes.
assert.equal(creatureOptions, creatureCatalog.length);
assert.ok(creatureOptions > 100, `Expected all mascotes, received ${creatureOptions}.`);

const resourceState = structuredClone(baseState);
resourceState.simulationEditor.step = 3;
const resourceHtml = renderSimulationEditor(resourceState);
assert.equal((resourceHtml.match(/data-resource-picker-search/g) || []).length, 1);
assert.equal((resourceHtml.match(/data-action="select-resource"/g) || []).length, catalog.length);
assert.equal((resourceHtml.match(/data-method="resources"/g) || []).length, 0);
// Ração (com suas origens) e recursos ficam na mesma lista, sempre presentes.
assert.equal((resourceHtml.match(/data-price="ration"/g) || []).length, 1);
assert.equal((resourceHtml.match(/data-price="bag"/g) || []).length, 1);
assert.match(resourceHtml, /data-pet-summary/);

resourceState.simulationEditor.resourceQuery = 'Recurso totalmente personalizado';
const customHtml = renderSimulationEditor(resourceState);
assert.equal((customHtml.match(/data-action="select-custom-resource"/g) || []).length, 1);

console.log(`UI smoke tests passed: ${creatureOptions} mascotes and ${catalog.length} resources rendered without truncation.`);
