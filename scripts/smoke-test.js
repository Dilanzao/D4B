import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
import { buildSalePayload } from '../src/services/salesService.js';
import { loadDofusDudeResourceCatalog, searchResourceCatalog } from '../src/services/resourceCatalogService.js';
import { getRememberedResourceXp, rememberResourceXp } from '../src/services/resourceXpMemoryService.js';
import { normalizeSimulation } from '../src/services/storageService.js';
import { normalizeCraftProject, normalizeCraftBatch, normalizeInventoryItem, normalizeCraftSale } from '../src/modules/crafts/services/craftStorageService.js';
import { calculateCraftProject, calculateCraftSale, mergeInventory } from '../src/modules/crafts/utils/craftCalculations.js';
import { clearCraftApiCache, fetchCraftItemDetails, searchCraftItems } from '../src/modules/crafts/services/dofusDudeCraftService.js';
import { adaptLegacyPetSale } from '../src/modules/pets/legacyPetSalesAdapter.js';
import { aggregateGlobalMetrics, resolveGlobalPeriod } from '../src/modules/global/globalDashboardAggregator.js';
import { matchRoute, pathFor } from '../src/router/router.js';
import { applyCommunityPrices, collectDirtyIngredientPrices, collectRecipeAnkamaIds, markIngredientPriceEdited } from '../src/services/communityPriceService.js';

assert.equal(APP_VERSION,'3.1.0');
assert.equal(DEFAULT_CONSENT.analytics,false);assert.equal(DEFAULT_CONSENT.advertising,false);

const storage = new Map();
globalThis.localStorage = {
  getItem:key=>storage.has(key)?storage.get(key):null,
  setItem:(key,value)=>storage.set(key,String(value)),
  removeItem:key=>storage.delete(key),
  key:index=>[...storage.keys()][index]??null,
  get length(){return storage.size;}
};

// Regression: legacy pet behavior remains unchanged.
const fullResourceList=Array.from({length:125},(_,index)=>({id:`r-${index}`,name:`Recurso ${index}`,canonicalName:`Recurso ${index}`}));
assert.equal(searchResourceCatalog(fullResourceList,'').length,fullResourceList.length);
assert.equal(rememberResourceXp({ankamaId:99999,name:'Memorizado'},321.5),true);
assert.equal(getRememberedResourceXp({ankamaId:99999,name:'Memorizado'}),321.5);
assert.equal(normalizeSimulation({upMethod:'resources'}).upMethod,'combined');
assert.ok(creatureCatalog.length>=100);
assert.ok(searchCreatures({type:'Mascote',query:'awaw',language:'pt-BR'}).every(item=>item.type==='Mascote'));
assert.ok(searchCreatures({type:'Montascote',query:'kram',language:'pt-BR'}).every(item=>item.type==='Montascote'));
const first=creatureCatalog[0];assert.equal(findCreatureMatch(first.canonicalName,first.type)?.id,first.id);assert.ok(getCreatureName(first,'en-US'));
assert.equal(applyXpBonus(500,50),750);assert.equal(calculateQuantityNeeded(1000,500,50),2);
assert.equal(calculateRationMethod(1001,20000,50).quantity,2);
const petSimulation={originLevel:0,currentXp:0,xpBonusPercent:0,targetLevel:80,marketFoodPrice:32000,bagPrice:300000,resourceLines:[],upMethod:'kolitokenBag',originCost:838000,additionalCosts:0,estimatedSalePrice:1850000,estimatedSaleChannel:'Mercado HDV'};
const petCalc=calculateSimulation(petSimulation);assert.ok(petCalc.xpNeeded>0);assert.ok(petCalc.upCost>=0);
const resourceCalc=calculateResourceMethod([{id:'custom',resourceId:'custom',resourceName:'Teste',custom:true,customXp:100,xpUnit:100,quantity:2,unitPrice:1000}],1000,50);
assert.equal(resourceCalc.lines[0].quantityNeededAlone,7);
const saleCalc=calculateSaleProfit({originCost:838000,upCost:912000,salePrice:1850000,saleChannel:'Mercado HDV'});
assert.deepEqual({fee:saleCalc.fee,profit:saleCalc.profit},{fee:37000,profit:63000});
const payload=buildSalePayload({id:'sale',creatureCanonicalName:'Herbichinho',creatureType:'Mascote',simulationName:'Teste',originCost:838000,upCost:912000,salePrice:1850000,saleChannel:'Mercado HDV'});
assert.equal(payload.precoVenda,1850000);assert.ok(!('profit' in payload));

// Resource API fallback/normalization is preserved.
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>({ok:true,json:async()=>[{ankama_id:123,name:'Pó',level:42,image_urls:{sd:'https://example.com/p.png'}}]});
const remoteCatalog=await loadDofusDudeResourceCatalog('pt-BR',{force:true});assert.equal(remoteCatalog.items[0].ankamaId,123);
globalThis.fetch=originalFetch;

// Crafts API: product search excludes resources, keeps only items with a recipe and hydrates ingredient names/images.
clearCraftApiCache();
const craftFetchCalls=[];
globalThis.fetch=async url=>{
  craftFetchCalls.push(String(url));
  if(String(url).includes('/pt/search?')) return {ok:true,json:async()=>[
    {name:'Arco fabricável',ankama_id:500,type:'items-equipment',item:{level:100,image_urls:{icon:'https://example.com/bow.png'},type:{name:'Arco'}}},
    {name:'Recurso indevido',ankama_id:600,type:'items-resources',item:{level:1,image_urls:{icon:'https://example.com/resource.png'}}},
    {name:'Equipamento sem receita',ankama_id:700,type:'items-equipment',item:{level:20,image_urls:{icon:'https://example.com/no-recipe.png'}}}
  ]};
  if(String(url).includes('/items/equipment/500')) return {ok:true,json:async()=>({ankama_id:500,name:'Arco fabricável',level:100,type:{name:'Arco'},image_urls:{icon:'https://example.com/bow.png'},recipe:[{item_ankama_id:601,item_subtype:'resources',quantity:3}]})};
  if(String(url).includes('/items/equipment/700')) return {ok:true,json:async()=>({ankama_id:700,name:'Equipamento sem receita',level:20,type:{name:'Chapéu'},image_urls:{icon:'https://example.com/no-recipe.png'},recipe:[]})};
  if(String(url).includes('/items/resources/601')) return {ok:true,json:async()=>({ankama_id:601,name:'Madeira real',level:45,type:{name:'Madeira'},image_urls:{icon:'https://example.com/wood.png'}})};
  return {ok:false,status:404,json:async()=>({})};
};
const craftSearch=await searchCraftItems('arco','pt-BR',{limit:30});
assert.equal(craftSearch.length,1);assert.equal(craftSearch[0].ankamaId,500);assert.equal(craftSearch[0].recipe.length,1);
assert.equal(craftSearch[0].recipe[0].name,'Madeira real');assert.equal(craftSearch[0].recipe[0].imageUrl,'https://example.com/wood.png');
assert.ok(craftFetchCalls.some(url=>url.includes('filter%5Bsearch_index%5D=items-equipment%2Citems-consumables%2Citems-cosmetics%2Citems-quest_items')));
assert.ok(!craftSearch.some(item=>item.category==='resources'));
const craftDetail=await fetchCraftItemDetails({ankamaId:500,category:'equipment'},'pt-BR');assert.equal(craftDetail.recipe[0].quantity,3);
globalThis.fetch=originalFetch;

// New route layer keeps modules isolated and supports deep links.
assert.equal(matchRoute('/').name,'home');
assert.equal(matchRoute('/pets/simulacoes').name,'pet-simulations');
assert.deepEqual(matchRoute('/pets/simulacoes/abc').params,{id:'abc'});
assert.equal(matchRoute('/crafts/projetos/novo').name,'craft-project-new');
assert.equal(matchRoute('/crafts/projetos/proj-1').name,'craft-project-edit');
assert.equal(pathFor('craft-inventory'),'/crafts/estoque');
assert.equal(matchRoute('/entrar').name,'login');
assert.equal(matchRoute('/criar-conta').name,'register');
assert.equal(matchRoute('/esqueci-senha').name,'forgot-password');
assert.equal(matchRoute('/verificar-email').name,'verify-email');
assert.equal(matchRoute('/redefinir-senha').name,'reset-password');
assert.equal(matchRoute('/conta').name,'account-settings');

// Crafts: unified cost, recursive recipes, inventory recovery, batches and partial sales.
const sourceInventory=[normalizeInventoryItem({id:'stock-metal',ankamaId:2,itemNameSnapshot:'Metal',quantity:4,availableQuantity:4,weightedUnitCost:2000})];
const project=normalizeCraftProject({id:'p1',ankamaId:100,itemNameSnapshot:'Item final',desiredQuantity:10,marketUnitPrice:5000,desiredSalePrice:7000,saleChannel:'HDV',additionalCosts:1000,ingredients:[{ankamaId:1,nameSnapshot:'Madeira',quantityPerUnit:2,unitMarketPrice:1000,acquisitionMode:'buy'},{ankamaId:2,nameSnapshot:'Metal',quantityPerUnit:1,unitMarketPrice:2000,acquisitionMode:'buy',useStockQuantity:4}]});
const projectCalc=calculateCraftProject(project,sourceInventory);
assert.equal(projectCalc.totalCost,41000); // 20k madeira + 8k de estoque + 12k comprados + 1k adicional.
assert.equal(projectCalc.unitCost,4100);
assert.equal(projectCalc.marketBuyCost,50000);
assert.equal(projectCalc.quantity,10);
assert.equal(projectCalc.ingredients[1].stockUsed,4);
const recursiveProject=normalizeCraftProject({desiredQuantity:2,ingredients:[{ankamaId:10,nameSnapshot:'Componente',quantityPerUnit:1,acquisitionMode:'craft',isCraftable:true,subRecipe:[{ankamaId:11,nameSnapshot:'Base',quantityPerUnit:3,unitMarketPrice:100,acquisitionMode:'buy'}]}]});
const recursiveCalc=calculateCraftProject(recursiveProject,[]);assert.equal(recursiveCalc.totalCost,600);assert.equal(recursiveCalc.readiness,'ready');assert.equal(recursiveCalc.ingredients[0].subCosts[0].required,6);
const incompleteTree=normalizeCraftProject({desiredQuantity:1,ingredients:[{ankamaId:20,nameSnapshot:'Componente sem árvore',quantityPerUnit:1,acquisitionMode:'craft',isCraftable:true,subRecipe:[]}]});
assert.equal(calculateCraftProject(incompleteTree).readiness,'missing_prices');
const dropProject=normalizeCraftProject({desiredQuantity:2,ingredients:[{ankamaId:3,nameSnapshot:'Drop',quantityPerUnit:4,unitMarketPrice:500,acquisitionMode:'drop'}]});
const dropCalc=calculateCraftProject(dropProject);assert.equal(dropCalc.totalCost,0);assert.equal(dropCalc.readiness,'ready');
const batch=normalizeCraftBatch({id:'b1',projectId:'p1',ankamaId:100,itemNameSnapshot:'Item final',producedQuantity:10,remainingQuantity:10,totalCost:projectCalc.totalCost,unitCost:Math.round(projectCalc.unitCost),status:'awaiting_sale'});
const inventory=normalizeInventoryItem({...mergeInventory(null,batch),id:'i1'});assert.equal(inventory.quantity,10);assert.equal(inventory.forSale,true);
const partial=calculateCraftSale({quantity:3,unitSalePrice:7000,unitCost:inventory.weightedUnitCost,channel:'HDV'});assert.equal(partial.quantity,3);assert.equal(partial.fees,420);assert.equal(partial.totalCost,inventory.weightedUnitCost*3);
const craftSale=normalizeCraftSale({...partial,id:'cs1',ankamaId:100,itemNameSnapshot:'Item final',saleDate:'2026-08-03T12:00:00.000Z'});assert.equal(craftSale.module,'crafts');assert.equal(craftSale.realizedProfit,partial.realizedProfit);

// Legacy sales are adapted in memory, never rewritten.
const legacy={id:'legacy-1',simulationId:'sim-1',creatureCanonicalName:'Herbichinho',originCost:838000,upCost:912000,salePrice:1850000,fee:37000,profit:63000,soldAt:'2026-08-03T10:00:00.000Z'};
const adapted=adaptLegacyPetSale(legacy);assert.equal(adapted.module,'pets');assert.equal(adapted.legacyReference,'legacy-1');assert.equal(legacy.module,undefined);

const globalState={simulations:[],sales:[legacy],craftProjects:[project],craftInventory:[inventory],craftSales:[craftSale],activities:[]};
const allMetrics=aggregateGlobalMetrics(globalState,{module:'all',period:'all'});assert.equal(allMetrics.sales.length,2);assert.equal(allMetrics.realizedProfit,63000+craftSale.realizedProfit);
const petsOnly=aggregateGlobalMetrics(globalState,{module:'pets',period:'all'});assert.equal(petsOnly.sales.length,1);assert.equal(petsOnly.sales[0].module,'pets');
const futureRange=resolveGlobalPeriod({period:'custom',from:'2030-01-01',to:'2030-01-31'});assert.ok(futureRange.from instanceof Date);assert.equal(aggregateGlobalMetrics(globalState,{module:'all',period:'custom',from:'2030-01-01',to:'2030-01-31'}).sales.length,0);

// Community prices are recursive, server-aware and do not overwrite a manual value by default.
const communityTree=[{id:'root-line',ankamaId:501,nameSnapshot:'A',unitMarketPrice:0,subRecipe:[{id:'child-line',ankamaId:502,nameSnapshot:'B',unitMarketPrice:900,priceInputSource:'manual'}]}];
assert.deepEqual(collectRecipeAnkamaIds(communityTree),['501','502']);
applyCommunityPrices(communityTree,{'501':{unitPrice:1200,registeredAt:'2026-08-05T00:00:00Z',ageDays:0,freshness:'FRESH',source:'COMUNIDADE'},'502':{unitPrice:800,registeredAt:'2026-07-25T00:00:00Z',ageDays:11,freshness:'STALE',source:'COMUNIDADE'}});
assert.equal(communityTree[0].unitMarketPrice,1200);
assert.equal(communityTree[0].subRecipe[0].unitMarketPrice,900);
assert.equal(communityTree[0].subRecipe[0].communityPriceFreshness,'STALE');
markIngredientPriceEdited(communityTree[0],1300);
assert.equal(collectDirtyIngredientPrices(communityTree).length,1);

// Numeric input regression: input handlers mutate state without a full render; full renders preserve selection.
const mainSource=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const focusSource=await readFile(new URL('../src/utils/focusPreservation.js',import.meta.url),'utf8');
  const scrollSource=await readFile(new URL('../src/utils/scrollPreservation.js',import.meta.url),'utf8');
  const accountApiSource=await readFile(new URL('../src/services/accountApiService.js',import.meta.url),'utf8');
assert.match(mainSource,/captureFocusSnapshot\(app\)/);assert.match(mainSource,/restoreFocusSnapshot\(app, focusSnapshot\)/);
assert.match(focusSource,/selectionStart/);assert.match(focusSource,/selectionEnd/);assert.match(focusSource,/setSelectionRange/);
assert.match(scrollSource,/scrollTop/);assert.match(scrollSource,/data-scroll-key/);
assert.match(accountApiSource,/consultarPrecosEmLote/);assert.match(accountApiSource,/registrarPrecosEmLote/);assert.doesNotMatch(accountApiSource,/Authorization/);
assert.match(mainSource,/if\(field&&state\.simulationEditor\)\{updateEditorField\(field,event\.target\.value,false\);return;\}/);
assert.match(mainSource,/if\(craftField\)\{updateCraftField\(craftField,event\.target\.value,false\);return;\}/);
assert.doesNotMatch(mainSource,/if\(field&&state\.simulationEditor\)\{updateEditorField\(field,event\.target\.value,true\)/);
assert.doesNotMatch(mainSource,/remove-craft-ingredient/);

const plannerSource=await readFile(new URL('../src/modules/crafts/components/craftRecipePlanner.js',import.meta.url),'utf8');
assert.match(plannerSource,/recipeStack/);assert.match(plannerSource,/craft-recipe-breadcrumb/);assert.match(plannerSource,/renderCommunityPriceBox/);assert.match(plannerSource,/observedPrice/);
assert.match(mainSource,/action==='copy-name'/);assert.match(mainSource,/copyText\(button\.dataset\.name/);


console.log('Smoke tests passed.');
