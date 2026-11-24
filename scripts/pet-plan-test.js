import assert from 'node:assert/strict';
import { FEEDING_XP } from '../src/data/feedingXp.js';
import { calculateSimulation } from '../src/utils/calculations.js';
import { formatCompactKamas, parseKamas } from '../src/utils/currency.js';
import { normalizeSimulation } from '../src/services/storageService.js';
import { PET_XP, alternativeXp, isUncertainXp } from '../src/data/petXp.js';
import { migrateFeeding, planResourceLines } from '../src/modules/pets/petPlan.js';
import { applyPetCommunityPrices, rankKnownFoods, setFoodPrice, simulationAnkamaIds } from '../src/modules/pets/petCommunity.js';
import { loadPetPrices, savePetPrices } from '../src/modules/pets/petPriceMemory.js';
import { createBackup, parseBackup, restoreBackup } from '../src/services/backupService.js';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };

// Escolhe o mais barato e calcula o preço-teto.
const base = { originLevel: 0, currentXp: 0, xpBonusPercent: 0, targetLevel: 100, originCost: 0, additionalCosts: 0, estimatedSalePrice: 0, estimatedSaleChannel: 'Mercado HDV', resourceLines: [] };
const auto = calculateSimulation({ ...base, mainFood: 'auto', foods: [{ id: 'r1557', ankamaId: 1557, name: 'Runa', xp: 500, price: 8000 }], marketFoodPrice: 9000, bagPrice: 100000 });
const option = id => auto.plan.options.find(item => item.id === id);
assert.equal(auto.xpNeeded, 179592);
assert.equal(auto.plan.main.id, 'r1557');
assert.equal(auto.plan.main.buyQuantity, 360);
assert.equal(auto.upCost, 2880000);
assert.equal(option('vitaminizedFood').aloneQuantity, 360);
assert.equal(option('kolitokenBag').aloneQuantity, 36);
assert.equal(option('r1557').maxPrice, 9000);
assert.equal(option('kolitokenBag').maxPrice, 80000);

const forced = calculateSimulation({ ...base, mainFood: 'kolitokenBag', foods: [], marketFoodPrice: 9000, bagPrice: 100000 });
assert.equal(forced.upCost, 3600000);
assert.equal(forced.plan.extraCost, 360000);
assert.equal(calculateSimulation({ ...base, mainFood: 'auto', foods: [] }).plan.complete, false);
assert.equal(calculateSimulation({ ...base, xpBonusPercent: 50, mainFood: 'auto', foods: [], marketFoodPrice: 9000 }).plan.main.buyQuantity, 240);

// Quantidade fixa entra antes e o restante é completado.
const line = { id: 'f', resourceName: 'Meu', xpUnit: 500, quantity: 60, unitPrice: 10 };
const mixed = calculateSimulation({ ...base, mainFood: 'vitaminizedFood', foods: [], marketFoodPrice: 9000, resourceLines: [{ ...line, unitPrice: 0 }] });
assert.equal(mixed.plan.remaining, 149592);
assert.equal(mixed.upCost, 300 * 9000);

// Combinação: exemplo do Cristal Inibidor (20.000 XP). 8 cristais + rações saem mais barato que 9.
const crystal = { id: 'r9', ankamaId: 9, name: 'Cristal', xp: 20000, price: 100000 };
const mix = calculateSimulation({ ...base, mainFood: 'auto', foods: [crystal], marketFoodPrice: 3000, amounts: { kolitokens: { owned: 2400 } } }).plan;
assert.deepEqual(mix.parts.map(part => [part.id, part.buyQuantity]), [['vitaminizedFood', 16], ['kolitokens', 0], ['r9', 8]]);
assert.equal(mix.cost, 848000);
// Já tenho: sem custo. Comprar fixo: respeitado. Comprar 0: não usa.
const owned = calculateSimulation({ ...base, mainFood: 'auto', foods: [crystal], marketFoodPrice: 9000, amounts: { r9: { owned: 5, buy: 0 }, kolitokens: { owned: 1050 } } }).plan;
assert.equal(owned.remaining, 179592 - 100000 - 5000);
assert.equal(owned.options.find(row => row.id === 'kolitokens').ownedUsed, 1000);
assert.equal(owned.cost, Math.ceil(74592 / 500) * 9000);
const bought = calculateSimulation({ ...base, mainFood: 'auto', foods: [{ ...crystal, price: 900000 }], marketFoodPrice: 9000, amounts: { r9: { buy: 2 } } }).plan;
assert.equal(bought.cost, 1800000 + Math.ceil(139592 / 500) * 9000);
// Duas origens de ração ao mesmo tempo: bolsas inteiras + o resto do mercado.
const origins = calculateSimulation({ ...base, targetLevel: 100, mainFood: 'auto', foods: [], marketFoodPrice: 9000, bagPrice: 80000, amounts: { kolitokenBag: { buy: 10 } } }).plan;
assert.equal(origins.cost, 800000 + Math.ceil(129592 / 500) * 9000);
// Nunca sobra XP por cobrir, com qualquer bônus; e nunca custa mais que o melhor alimento sozinho.
for (const bonus of [0, 7.5, 50, 100]) for (let seed = 1; seed < 40; seed += 1) {
  const foods = [1, 2, 3, 4].map(n => ({ id: 'r' + n, ankamaId: n, name: 'F' + n, xp: (seed * n * 37) % 900 + 0.25, price: (seed * n * 53) % 700 + 1 }));
  const calc = calculateSimulation({ ...base, xpBonusPercent: bonus, originLevel: seed, mainFood: 'auto', foods, marketFoodPrice: 400 + seed, bagPrice: 3000 });
  const got = calc.plan.parts.reduce((sum, part) => sum + part.buyQuantity * part.effectiveXp, 0);
  assert.ok(got + 1e-5 >= calc.xpNeeded);
  assert.ok(calc.upCost <= Math.min(...calc.plan.options.filter(row => row.usable).map(row => row.aloneQuantity * row.price)));
}
// A própria ração nunca vira um segundo alimento.
assert.equal(migrateFeeding({ mainFood: 'auto', foods: [], amounts: { x: { owned: 0 } } }).amounts.x, undefined);
assert.equal(planResourceLines(mix)[0].quantity, 8);

// Preços da comunidade: completam, não apagam o digitado.
const shared = { ...base, marketFoodPrice: 50, bagPrice: 0, foods: [{ ...crystal, price: 0 }], priceSources: {} };
assert.deepEqual(simulationAnkamaIds(shared), ['20125', '684', '9']);
applyPetCommunityPrices(shared, { 20125: { unitPrice: 36 }, 684: { unitPrice: 300 }, 9: { unitPrice: 144 } });
assert.equal(shared.marketFoodPrice, 50); assert.equal(shared.bagPrice, 300); assert.equal(shared.foods[0].price, 144);
applyPetCommunityPrices(shared, { 684: { unitPrice: 310 } }); assert.equal(shared.bagPrice, 310);
setFoodPrice(shared, 'kolitokenBag', 280, 'manual'); applyPetCommunityPrices(shared, { 684: { unitPrice: 999 } }); assert.equal(shared.bagPrice, 280);
const ranked = rankKnownFoods([{ ankamaId: 1557, name: 'A' }, { ankamaId: 1558, name: 'B' }, { ankamaId: 303, name: 'C' }], { resources: { 1558: 100 } }, { prices: { 1557: { unitPrice: 500 } } });
assert.deepEqual(ranked.map(row => row.name), ['B', 'A']);
// Lembrança de preços separada por servidor.
savePetPrices({ ration: 10, bag: 0, resources: {} });
assert.equal(loadPetPrices('s1').ration, 10);
savePetPrices({ ration: 20, bag: 0, resources: {} }, 's1');
assert.equal(loadPetPrices('s1').ration, 20); assert.equal(loadPetPrices('s2').ration, 0); assert.equal(loadPetPrices().ration, 10);

// Simulações antigas mantêm o custo e nenhum recurso se perde.
const combined = normalizeSimulation({ ...base, upMethod: 'combined', combinedRationSource: 'kolitokenBag', bagPrice: 100000, resourceLines: [line] });
assert.equal(combined.mainFood, 'kolitokenBag');
assert.equal(calculateSimulation(combined).upCost, 30 * 100000 + 600);
const single = normalizeSimulation({ ...base, upMethod: 'vitaminizedFood', marketFoodPrice: 9000, resourceLines: [line] });
assert.equal(calculateSimulation(single).upCost, 3240000);
assert.equal(single.foods.length, 1);
assert.deepEqual(normalizeSimulation(single).foods, single.foods);

assert.ok(Object.keys(FEEDING_XP).length > 2000);
assert.equal(FEEDING_XP[303], 0.03);
assert.equal(FEEDING_XP[1557], 500);
// Planilha comunitária: completa os dados e, quando diverge, vale o menor.
assert.ok(Object.keys(PET_XP).length > 2600);
assert.equal(PET_XP[20125], 500); assert.equal(PET_XP[16440], 0.45); assert.equal(PET_XP[13157], 9.6765); assert.equal(PET_XP[8732], 0.2358);
assert.ok(isUncertainXp(13157) && isUncertainXp(16440) && !isUncertainXp(1557) && !isUncertainXp(20125));
assert.equal(alternativeXp(13157), 48.3823);

// Kamas: K = 1; KK = mil; MK = milhão.
for (const [text, value] of [['900', 900], ['900k', 900], ['1kk', 1000], ['1,5kk', 1500], ['500kk', 500000], ['2mk', 2000000], ['1,5mk', 1500000], ['1.234.567', 1234567]]) assert.equal(parseKamas(text), value, text);
assert.equal(formatCompactKamas(1970000), '1,97 MK');
assert.equal(formatCompactKamas(45000), '45 KK');

// Backup: ida e volta, sem sessão, e recusa de conteúdo inválido.
localStorage.setItem('d4b_simulations_v2', '[{"id":"s1","name":"A <b>"}]');
localStorage.setItem('d4b_account_session_v1', 'segredo');
const text = JSON.stringify(createBackup('x'));
assert.ok(!text.includes('segredo'));
localStorage.setItem('d4b_simulations_v2', '[]');
restoreBackup(parseBackup(text));
assert.equal(localStorage.getItem('d4b_simulations_v2'), '[{"id":"s1","name":"A <b>"}]');
assert.equal(localStorage.getItem('d4b_account_session_v1'), 'segredo');
assert.throws(() => parseBackup('{}'));
assert.throws(() => parseBackup(JSON.stringify({ app: 'dofus4business', format: 1, data: { d4b_sales_v2: JSON.stringify([{ id: 'x" onload=1' }]) } })));

console.log('Pet plan tests passed.');
