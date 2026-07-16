import assert from 'node:assert/strict';
import { APP_VERSION, DEFAULT_CONSENT } from '../src/config/app.js';
import { creatureCatalog, findCreatureMatch, getCreatureName, searchCreatures } from '../src/data/creatures.js';
import { calculateSaleProfit, calculateSimulation } from '../src/utils/calculations.js';
import { getFilteredDashboardSales } from '../src/components/dashboard.js';
import { buildSalePayload } from '../src/services/salesService.js';

assert.equal(APP_VERSION,'2.2.0');
assert.equal(DEFAULT_CONSENT.analytics,false);assert.equal(DEFAULT_CONSENT.advertising,false);
assert.ok(creatureCatalog.length>=100);
assert.ok(searchCreatures({type:'Mascote',query:'awaw',language:'pt-BR'}).every(x=>x.type==='Mascote'));
assert.ok(searchCreatures({type:'Montascote',query:'kram',language:'pt-BR'}).every(x=>x.type==='Montascote'));
const first=creatureCatalog[0];assert.equal(findCreatureMatch(first.canonicalName,first.type)?.id,first.id);assert.ok(getCreatureName(first,'en-US'));
const simulation={originLevel:0,currentXp:0,targetLevel:80,marketFoodPrice:32000,bagPrice:300000,resourceLines:[],upMethod:'kolitokenBag',originCost:838000,additionalCosts:0,estimatedSalePrice:1850000,estimatedSaleChannel:'Mercado HDV'};
const calc=calculateSimulation(simulation);assert.ok(calc.xpNeeded>0);assert.ok(calc.upCost>=0);

const translated = creatureCatalog.find(item => item.canonicalName === 'Piuta Azul');
assert.ok(translated);assert.equal(getCreatureName(translated,'fr-FR'),'Pioute bleu');assert.equal(getCreatureName(translated,'en-US'),'Blue Piwin');
const mixedSimulation={...simulation,targetLevel:80,marketFoodPrice:20000,bagPrice:180000,upMethod:'combined',combinedRationSource:'vitaminizedFood',resourceLines:[{id:'r1',resourceId:'runa-ga-pa',quantity:2,unitPrice:10000},{id:'r2',resourceId:'custom-r2',customName:'Recurso de teste',customXp:250,quantity:3,unitPrice:2000}]};
const mixed=calculateSimulation(mixedSimulation);assert.ok(mixed.methods.combined.resourceXp>=1750);assert.ok(mixed.methods.combined.rationQuantity>=0);assert.equal(mixed.selected.id,'combined');assert.equal(mixed.resources.lines.find(line=>line.id==='r2')?.canonicalName,'Recurso de teste');

const saleCalc=calculateSaleProfit({originCost:838000,upCost:912000,salePrice:1850000,saleChannel:'Mercado HDV'});assert.deepEqual({fee:saleCalc.fee,profit:saleCalc.profit},{fee:37000,profit:63000});
const sale={id:'sale-1',creatureId:first.id,creatureCanonicalName:first.canonicalName,creatureType:first.type,simulationName:'Teste',originCost:838000,upCost:912000,salePrice:1850000,saleChannel:'Mercado HDV',profit:63000,soldAt:new Date().toISOString(),upMethod:'vitaminizedFood'};
assert.equal(getFilteredDashboardSales({sales:[sale],dashboardFilters:{period:'all',type:'all',creature:'all',channel:'all',method:'all',result:'all'}}).length,1);
const payload=buildSalePayload(sale);assert.equal(payload.action,'criarVenda');assert.equal(payload.precoVenda,1850000);assert.equal(payload.canalVenda,'Mercado HDV');assert.ok(!('profit' in payload));
console.log('Smoke tests passed.');
