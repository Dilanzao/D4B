import assert from 'node:assert/strict';
import { APP_VERSION, DEFAULT_CONSENT } from '../src/config/app.js';
import { creatureCatalog, findCreatureMatch, getCreatureName, searchCreatures } from '../src/data/creatures.js';
import {
  applyXpBonus,
  calculateQuantityNeeded,
  calculateResourceMethod,
  calculateRationMethod,
  calculateSaleProfit,
  calculateSimulation
} from '../src/utils/calculations.js';
import { getFilteredDashboardSales } from '../src/components/dashboard.js';
import { buildSalePayload } from '../src/services/salesService.js';
import { loadDofusDudeResourceCatalog, searchResourceCatalog } from '../src/services/resourceCatalogService.js';
import { getRememberedResourceXp, rememberResourceXp } from '../src/services/resourceXpMemoryService.js';
import { normalizeSimulation } from '../src/services/storageService.js';

assert.equal(APP_VERSION,'2.3.1');
assert.equal(DEFAULT_CONSENT.analytics,false);assert.equal(DEFAULT_CONSENT.advertising,false);
// A listbox sem pesquisa deve disponibilizar o catálogo inteiro, sem truncar os primeiros itens.
const fullResourceList = Array.from({ length: 125 }, (_, index) => ({ id: `r-${index}`, name: `Recurso ${index}`, canonicalName: `Recurso ${index}` }));
assert.equal(searchResourceCatalog(fullResourceList, '').length, fullResourceList.length);
assert.equal(searchResourceCatalog(fullResourceList, 'Recurso 12').length > 0, true);

// A XP confirmada deve ser reutilizada nas próximas inclusões do mesmo recurso.
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  key: index => [...storage.keys()][index] ?? null,
  get length() { return storage.size; }
};
const rememberedReference = { ankamaId: 99999, name: 'Recurso memorizado' };
assert.equal(rememberResourceXp(rememberedReference, 321.5), true);
assert.equal(getRememberedResourceXp(rememberedReference), 321.5);

// Simulações antigas do método puro por recursos são migradas para o método unificado.
assert.equal(normalizeSimulation({ upMethod: 'resources' }).upMethod, 'combined');

assert.ok(creatureCatalog.length>=100);
assert.ok(searchCreatures({type:'Mascote',query:'awaw',language:'pt-BR'}).every(x=>x.type==='Mascote'));
assert.ok(searchCreatures({type:'Montascote',query:'kram',language:'pt-BR'}).every(x=>x.type==='Montascote'));
const first=creatureCatalog[0];assert.equal(findCreatureMatch(first.canonicalName,first.type)?.id,first.id);assert.ok(getCreatureName(first,'en-US'));

// Bônus de XP: 500 XP passam a 750 XP com +50% e a quantidade é sempre arredondada para cima.
assert.equal(applyXpBonus(500,50),750);
assert.equal(calculateQuantityNeeded(1000,500,50),2);
const bonusRation=calculateRationMethod(1001,20000,50);
assert.equal(bonusRation.effectiveXpPerUnit,750);
assert.equal(bonusRation.quantity,2);

const simulation={originLevel:0,currentXp:0,xpBonusPercent:0,targetLevel:80,marketFoodPrice:32000,bagPrice:300000,resourceLines:[],upMethod:'kolitokenBag',originCost:838000,additionalCosts:0,estimatedSalePrice:1850000,estimatedSaleChannel:'Mercado HDV'};
const calc=calculateSimulation(simulation);assert.ok(calc.xpNeeded>0);assert.ok(calc.upCost>=0);
const calcBonus=calculateSimulation({...simulation,xpBonusPercent:50});
assert.ok(calcBonus.methods.vitaminizedFood.quantity < calc.methods.vitaminizedFood.quantity);
assert.equal(calcBonus.methods.vitaminizedFood.effectiveXpPerUnit,750);

const translated = creatureCatalog.find(item => item.canonicalName === 'Piuta Azul');
assert.ok(translated);assert.equal(getCreatureName(translated,'fr-FR'),'Pioute bleu');assert.equal(getCreatureName(translated,'en-US'),'Blue Piwin');

// Quantidade necessária por recurso personalizado, inclusive com bônus.
const resourceCalc=calculateResourceMethod([{id:'custom-1',resourceId:'custom-1',resourceName:'Recurso teste',custom:true,customXp:100,xpUnit:100,quantity:2,unitPrice:1000}],1000,50);
assert.equal(resourceCalc.lines[0].effectiveXpUnit,150);
assert.equal(resourceCalc.lines[0].quantityNeededAlone,7);
assert.equal(resourceCalc.lines[0].xpTotal,300);
assert.equal(resourceCalc.remainingXp,700);
const unknownResource=calculateResourceMethod([{id:'api-unknown',resourceId:'dofusdude-123',resourceName:'Recurso sem XP',quantity:1,unitPrice:100}],1000,0);
assert.equal(unknownResource.lines.length,1);
assert.equal(unknownResource.lines[0].validXp,false);
assert.equal(unknownResource.invalidXpCount,1);

const mixedSimulation={...simulation,targetLevel:80,marketFoodPrice:20000,bagPrice:180000,upMethod:'combined',combinedRationSource:'vitaminizedFood',xpBonusPercent:50,resourceLines:[{id:'r1',resourceId:'runa-ga-pa',quantity:2,unitPrice:10000},{id:'r2',resourceId:'custom-r2',resourceName:'Recurso de teste',customName:'Recurso de teste',customXp:250,xpUnit:250,quantity:3,unitPrice:2000}]};
const mixed=calculateSimulation(mixedSimulation);assert.ok(mixed.methods.combined.resourceXp>=2625);assert.ok(mixed.methods.combined.rationQuantity>=0);assert.equal(mixed.selected.id,'combined');assert.equal(mixed.resources.lines.find(line=>line.id==='r2')?.canonicalName,'Recurso de teste');

// A integração do catálogo usa a rota pública e mantém ID estável do DofusDude.
const originalFetch=globalThis.fetch;
const fakeItems=[{ankama_id:123,name:'Pó de teste',level:42,image_urls:{sd:'https://example.com/test.png'}},{ankama_id:124,name:'Madeira de teste',level:5,image_urls:{icon:'https://example.com/wood.png'}}];
globalThis.fetch=async()=>({ok:true,json:async()=>fakeItems});
const remoteCatalog=await loadDofusDudeResourceCatalog('pt-BR',{force:true});
assert.equal(remoteCatalog.source,'dofusdude');
assert.equal(remoteCatalog.items.length,2);
assert.equal(remoteCatalog.items[0].id.startsWith('dofusdude-'),true);
assert.equal(searchResourceCatalog(remoteCatalog.items,'madeira',10).length,1);
globalThis.fetch=originalFetch;

const saleCalc=calculateSaleProfit({originCost:838000,upCost:912000,salePrice:1850000,saleChannel:'Mercado HDV'});assert.deepEqual({fee:saleCalc.fee,profit:saleCalc.profit},{fee:37000,profit:63000});
const sale={id:'sale-1',creatureId:first.id,creatureCanonicalName:first.canonicalName,creatureType:first.type,simulationName:'Teste',originCost:838000,upCost:912000,salePrice:1850000,saleChannel:'Mercado HDV',profit:63000,soldAt:new Date().toISOString(),upMethod:'vitaminizedFood',xpBonusPercent:50};
assert.equal(getFilteredDashboardSales({sales:[sale],dashboardFilters:{period:'all',type:'all',creature:'all',channel:'all',method:'all',result:'all'}}).length,1);
const payload=buildSalePayload(sale);assert.equal(payload.action,'criarVenda');assert.equal(payload.precoVenda,1850000);assert.equal(payload.canalVenda,'Mercado HDV');assert.ok(!('profit' in payload));
console.log('Smoke tests passed.');
