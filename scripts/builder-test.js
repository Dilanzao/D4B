import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { alternatives, defaultIntent, describeBuild, isLegal, optimize, pointsToStat } = await import('../src/modules/builder/buildEngine.js');
const { applyParsed, defaultTargets, parseMessage } = await import('../src/modules/builder/chatParser.js');
const { SLOTS, SLOT_OF_TYPE } = await import('../src/modules/builder/gearSchema.js');
const { builderTranslations } = await import('../src/i18n/builderTranslations.js');

const gear = JSON.parse(await readFile(new URL('../public/data/gear.json', import.meta.url), 'utf8'));
const byId = new Map(gear.items.map(item => [item.i, item]));
gear.slotOf = id => SLOT_OF_TYPE[byId.get(id)?.t];
gear.item = id => byId.get(id);
assert.ok(gear.items.length > 3000 && gear.sets.length > 400);
assert.equal(new Set(gear.items.map(item => item.i)).size, gear.items.length);
assert.equal(pointsToStat(995), 398);
assert.equal(pointsToStat(99), 99);

// Bônus de conjunto conferido com a API: Conjunto do Papatudo.
const gobball = gear.sets.find(set => set.i === 1);
assert.deepEqual(gobball.e['2'], [45, 5, 5, 13, 5, 5, 9, 5, 5]);
const naked = describeBuild(gear, SLOTS.map(() => null), { ...defaultIntent(), level: 200 });
assert.equal(naked.stats.ap, 7); assert.equal(naked.stats.mp, 3); assert.equal(naked.hp, 1150);
assert.equal(describeBuild(gear, SLOTS.map(() => null), { ...defaultIntent(), level: 1 }).hp, 55);

const run = async intent => { const result = await optimize(gear, intent, { restarts: 4, iterations: 6000 }); const build = describeBuild(gear, result.ids, intent); return { result, build }; };
for (const intent of [
  { level: 200, elements: ['strength'], targets: { ap: 11, mp: 6 } }, { level: 200, elements: ['strength', 'intelligence', 'chance', 'agility'], targets: { ap: 11, mp: 6 } },
  { level: 100, elements: ['intelligence'], targets: { ap: 9, mp: 4 } }, { level: 20, elements: ['agility'], targets: {} }, { level: 200, elements: ['chance'], targets: { ap: 12, mp: 6, range: 5 } }
]) {
  const { result, build } = await run({ ...defaultIntent(), ...intent });
  assert.ok(isLegal(build.items), 'itens repetidos ou incompatíveis');
  build.items.forEach((item, index) => { if (item) { assert.equal(SLOT_OF_TYPE[item.t], SLOTS[index]); assert.ok(item.l <= intent.level); } });
  assert.deepEqual(build.broken, [], JSON.stringify(intent)); assert.deepEqual(build.missing, [], JSON.stringify(intent));
  assert.equal(result.ids.length, 16);
}
// Pedidos diferentes geram sets diferentes na direção certa.
const damage = (await run({ ...defaultIntent(), level: 200, damage: 1.3, survival: 0.3, targets: { ap: 11, mp: 6 } })).build;
const tank = (await run({ ...defaultIntent(), level: 200, damage: 0.35, survival: 1.5, targets: { ap: 11, mp: 6 } })).build;
assert.ok(tank.ehp > damage.ehp * 1.3 && damage.damage > tank.damage * 1.1);
const drop = (await run({ ...defaultIntent(), level: 200, damage: 0.35, survival: 0.35, extras: { prospecting: 1.6 } })).build;
assert.ok(drop.stats.prospecting > damage.stats.prospecting + 100);

const say = (text, intent = { ...defaultIntent(), targets: defaultTargets(200) }, ids = null) => { const parsed = parseMessage(text, gear, 0, ids); return { parsed, intent: applyParsed(intent, parsed, { gear, ids, defaults: { ...defaultIntent(), targets: defaultTargets(200) } }) }; };
let r = say('Quero um set de iop terra nível 200, 11/6 com bastante vida');
assert.deepEqual(r.intent.elements, ['strength']); assert.equal(r.intent.level, 200); assert.equal(r.intent.targets.ap, 11); assert.equal(r.intent.targets.mp, 6); assert.equal(r.intent.breed, 8);
r = say('cra agilidade 150 12/5/4'); assert.deepEqual(r.intent.targets, { ap: 12, mp: 5, range: 4 }); assert.equal(r.intent.level, 150); assert.deepEqual(r.intent.elements, ['agility']);
r = say('fogo e água nível 180'); assert.deepEqual(r.intent.elements, ['intelligence', 'chance']);
r = say('set barato de força nível 60 até 5mk'); assert.equal(r.intent.level, 60); assert.ok(r.intent.craftable && r.intent.noDofus); assert.ok(r.parsed.notes.includes('budget'));
r = say('tank nível 200 com 10 PA'); assert.equal(r.intent.targets.ap, 10); assert.ok(r.intent.survival > 1);
r = say('60 de crítico e 30 de resistência'); assert.equal(r.intent.targets.critical, 60); assert.equal(r.intent.targets.res, 30);
r = say('sem Dofus Vulbis, usar Dofus Ocre'); assert.deepEqual(r.intent.locked, [7754]); assert.equal(r.intent.banned.length, 1); assert.match(gear.item(r.intent.banned[0]).n[0], /Vulbis/);
r = say('mais vida'); assert.ok(r.intent.survival > 0.55); assert.ok(!r.intent.extras.hp);
assert.ok(say('nível 200 com bastante vida').intent.survival > 0.55);
r = say('mais pm', { ...defaultIntent(), targets: { ap: 11, mp: 5 } }); assert.equal(r.intent.targets.mp, 6);
r = say('resistência a fogo'); assert.equal(r.parsed.patch.elements, undefined);
r = say('agilidade nível 60', { ...defaultIntent(), targets: { ap: 12, mp: 6 }, customTargets: true }); assert.deepEqual(r.intent.targets, defaultTargets(60));
assert.equal(say('azul banana').parsed.cues, 0);
assert.equal(say('bom dia').parsed.action, 'greet'); assert.equal(say('valeu!').parsed.action, 'thanks');
// Frases do dia a dia e erros de digitação.
r = say('tô sem grana e meu pandawa de água morre demais, 120'); assert.equal(r.intent.level, 120); assert.deepEqual(r.intent.elements, ['chance']); assert.ok(r.intent.craftable && r.intent.survival > 0.55 && r.intent.damage === 1); assert.equal(r.intent.breed, 12);
r = say('tomo muito dano'); assert.ok(r.intent.survival > 0.55 && r.intent.damage === 1);
r = say('bato pouco'); assert.ok(r.intent.damage > 1);
r = say('agilidde nivle 80 braato'); assert.deepEqual(r.intent.elements, ['agility']); assert.equal(r.intent.level, 80); assert.ok(r.intent.craftable);
r = say('quero jogar primeiro e ficar longe'); assert.ok(r.intent.extras.initiative > 0 && r.intent.targets.range >= 1);
assert.equal(say('quanto de vida tem?').parsed.stat, 'hp'); assert.equal(say('qual o alcance?').parsed.stat, 'range'); assert.equal(say('quantos pa?').parsed.stat, 'ap'); assert.equal(say('quanto custa?').parsed.action, 'cost');
// Pergunta o que falta antes do primeiro set.
globalThis.document = { querySelector: () => null };
const { createBuilderState, sendBuilderMessage } = await import('../src/modules/builder/builderController.js');
const chat = async (...lines) => { const state = { language: 'pt-BR', builder: { ...createBuilderState(), gear }, account: {}, craftInventory: [] }; for (const line of lines) await sendBuilderMessage(state, line, () => {}); return state.builder; };
let talk = await chat('quero um set barato'); assert.equal(talk.ids, null); assert.equal(talk.asking, 'element');
talk = await chat('quero um set barato', 'fogo'); assert.equal(talk.asking, 'level');
talk = await chat('quero um set barato', 'fogo', '90'); assert.ok(talk.ids); assert.equal(talk.intent.level, 90); assert.deepEqual(talk.intent.elements, ['intelligence']); assert.ok(talk.intent.craftable);
talk = await chat('quero um set', 'tanto faz', '200', 'quanto de vida?'); assert.ok(talk.ids); assert.match(talk.messages.at(-1).text, /^Vida: /);
talk = await chat('tank nível 200 com 10 PA'); assert.ok(talk.ids);
assert.equal(say('strength level 120 9/5').intent.level, 120);
const ids = damage.items.map(item => item?.i ?? null);
r = say('troca o anel', { ...defaultIntent(), targets: { ap: 11, mp: 6 } }, ids); assert.equal(r.parsed.action, 'swap-slot'); assert.equal(r.intent.banned.length, 2); assert.equal(r.intent.locked.length, ids.filter(Boolean).length - 2);
const swapped = await optimize(gear, r.intent, { restarts: 2, iterations: 2000 });
swapped.ids.forEach((id, index) => assert.equal(id === ids[index], SLOTS[index] !== 'ring'));
const options = alternatives(gear, ids, defaultIntent(), 0); assert.equal(options.length, 4); assert.ok(options.every(row => SLOT_OF_TYPE[row.item.t] === 'hat' && row.item.i !== ids[0]));
// Partir do set atual nunca piora o mesmo pedido.
const warmIntent = { ...defaultIntent(), targets: { ap: 11, mp: 6 } };
const cold = await optimize(gear, warmIntent, { restarts: 3, iterations: 4000 });
assert.ok((await optimize(gear, warmIntent, { restarts: 1, iterations: 300, seed: 99, start: cold.ids })).score >= cold.score - 1e-9);
// O mesmo pedido sempre gera o mesmo set.
assert.deepEqual((await optimize(gear, { ...defaultIntent(), level: 80 }, { restarts: 1, iterations: 1500 })).ids, (await optimize(gear, { ...defaultIntent(), level: 80 }, { restarts: 1, iterations: 1500 })).ids);
// Traduções com as mesmas chaves; atalhos da conversa são entendidos em todos os idiomas.
const keys = value => Object.entries(value).flatMap(([key, item]) => typeof item === 'object' ? keys(item).map(sub => key + '.' + sub) : [key]).sort();
const languages = ['pt-BR', 'fr-FR', 'en-US', 'es-ES'];
for (const [index, language] of languages.entries()) {
  const texts = builderTranslations[language].builder;
  assert.deepEqual(keys(texts), keys(builderTranslations['pt-BR'].builder), language);
  for (const key of ['ex1', 'ex2', 'ex3', 'ex4', 'more1', 'more2', 'more3', 'more4', 'more5', 'more6']) assert.ok(parseMessage(texts[key], gear, index, ids).cues > 0, language + ': ' + texts[key]);
}
const { petCreature } = await import('../src/modules/builder/builderPage.js');
const pets = gear.items.filter(item => item.t === 1 || item.t === 180);
console.log(`Pets ligados: ${pets.filter(petCreature).length}/${pets.length}`);
assert.ok(pets.filter(petCreature).length > 110);
// Raças e feitiços: Iop, Pressão no nível 200 (26 a 30 de terra, 3 PA).
const { bestTurn, gradeFor, spellProfile, testSpell } = await import('../src/modules/builder/buildEngine.js');
const { forgeLimit, isForgeable } = await import('../src/modules/builder/gearSchema.js');
const { setForge, startOver, setBuilderOption, loadGear: _ } = await import('../src/modules/builder/builderController.js');
const { breeds } = JSON.parse(await readFile(new URL('../public/data/breeds.json', import.meta.url), 'utf8'));
assert.equal(breeds.length, 19);
const iop = breeds.find(breed => breed.i === 8); const pressure = iop.s.find(spell => spell.n[0] === 'Pressão');
assert.deepEqual(gradeFor(pressure, 200).d, [['strength', 26, 30, 0, 0]]);
const zero = describeBuild(gear, SLOTS.map(() => null), { ...defaultIntent(), level: 200, scroll: 0 });
assert.equal(zero.stats.strength, 398); assert.equal(zero.stats.wisdom, 0); assert.equal(naked.stats.strength, 498);
let hit = testSpell(zero.raw, gradeFor(pressure, 200), defaultIntent());
assert.equal(hit.normal[0].min, Math.floor(26 * 4.98)); assert.equal(hit.normal[0].max, Math.floor(30 * 4.98)); assert.ok(Math.abs(hit.chance - 0.1) < 1e-9);
assert.equal(testSpell(zero.raw, gradeFor(pressure, 200), defaultIntent(), 50).normal[0].min, Math.floor(129 * 0.5));
const turn = bestTurn(zero.raw, iop, defaultIntent(), 12);
assert.ok(turn.value > 0); const spent = turn.casts.reduce((sum, cast) => sum + cast.count * gradeFor(cast.spell, 200).a, 0); assert.ok(spent <= 12);
assert.equal(new Set(turn.casts.map(cast => cast.spell.v)).size, turn.casts.length);
for (const cast of turn.casts) { const grade = gradeFor(cast.spell, 200); assert.ok(cast.count <= Math.min(grade.g || 99, grade.t || 99)); }
for (const breed of breeds) for (const spell of breed.s) for (const grade of spell.g) for (const line of [...grade.d, ...grade.k]) assert.ok(line[1] > 0 && line[2] >= line[1], breed.n[0] + ' ' + spell.n[0]);
assert.ok(spellProfile(iop, { level: 200, elements: ['strength'] }).base > 15);
// Passivas
assert.match(gear.items.find(item => item.i === 7754).x[0], /ganha 1 PA/);
assert.ok(gear.items.every(item => !item.x || item.x.length === 4));
// Exo e over
const st = { language: 'pt-BR', builder: { ...createBuilderState(), gear, breeds, ids }, account: {}, craftInventory: [] };
st.builder.intent.targets = { ap: 11, mp: 6 };
const hat = gear.item(ids[0]); const amulet = gear.item(ids[2]);
assert.ok(isForgeable(hat)); assert.equal(isForgeable(gear.item(7754)), false);
assert.equal(setForge(st, hat.i, 'strength', 9999), forgeLimit(hat, 'strength'));
assert.equal(setForge(st, 7754, 'ap', 1), null);
const noExo = gear.items.filter(item => isForgeable(item) && item.s && !item.e.some((v, i) => i % 3 === 0 && v === 12)).slice(0, 2);
setForge(st, noExo[0].i, 'ap', 5); assert.equal(st.builder.intent.forge[noExo[0].i].ap, 1);
setForge(st, noExo[1].i, 'ap', 1); assert.equal(st.builder.intent.forge[noExo[0].i], undefined); assert.equal(st.builder.intent.forge[noExo[1].i].ap, 1);
const base = describeBuild(gear, ids, { ...defaultIntent() });
const allowedExo = describeBuild(gear, ids, { ...defaultIntent(), exo: { ap: true, mp: true, range: true } });
assert.equal(allowedExo.stats.ap, base.stats.ap + 1); assert.equal(new Set(Object.values(allowedExo.exos)).size, 3);
const target = ids.map(id => gear.item(id)).find(item => isForgeable(item) && !item.e.some((v, i) => i % 3 === 0 && v === 12));
assert.equal(describeBuild(gear, ids, { ...defaultIntent(), exo: { ap: true }, forge: { [target.i]: { ap: 1 } } }).stats.ap, base.stats.ap + 1, 'exo não soma duas vezes');
assert.ok(describeBuild(gear, ids, { ...defaultIntent(), forge: { [hat.i]: { vitality: 505 } } }).hp > base.hp);
// Conversa: raça, pergaminho, exo, forja e recomeço
assert.equal(say('sou cra').intent.breed, 9); assert.equal(say('não tô scrollado').intent.scroll, 0); assert.equal(say('sem pergaminho').intent.scroll, 0); assert.equal(say('tô scrollado').intent.scroll, 100); assert.equal(say('scroll 50').intent.scroll, 50);
assert.deepEqual(say('pode usar exo').intent.exo, { ap: true, mp: true, range: true });
assert.deepEqual(say('pode considerar exo pa e pm').intent.exo, { ap: true, mp: true, range: false });
assert.deepEqual(say('sem exo', { ...defaultIntent(), exo: { ap: true, mp: true, range: true } }).intent.exo, { ap: false, mp: false, range: false });
r = say('iop terra nivel 200 11/6 com exo pa e sem scroll'); assert.equal(r.intent.exo.ap, true); assert.equal(r.intent.scroll, 0); assert.equal(r.intent.targets.ap, 11); assert.equal(r.intent.level, 200); assert.deepEqual(r.intent.elements, ['strength']);
let fg = say('exo pa no amuleto', defaultIntent(), ids).parsed; assert.equal(fg.action, 'forge'); assert.equal(fg.forge.slot, 'amulet'); assert.deepEqual(fg.forge.rows, [{ key: 'ap', value: null }]);
fg = say('over de 20 de força no chapéu', defaultIntent(), ids).parsed; assert.deepEqual([fg.forge.kind, fg.forge.slot, fg.forge.rows[0]], ['over', 'hat', { key: 'strength', value: 20 }]);
fg = say('exo 5 res fogo na capa', defaultIntent(), ids).parsed; assert.deepEqual(fg.forge.rows, [{ key: 'fireRes', value: 5 }]);
assert.equal(say('tira o exo do cinto', defaultIntent(), ids).parsed.forge.clear, true);
assert.equal(say('novo set').parsed.pureReset, true); assert.equal(say('limpar conversa').parsed.pureReset, true); assert.equal(Boolean(say('novo set de fogo nível 100').parsed.pureReset), false);
st.builder.intent.forge = {}; const apBefore = describeBuild(gear, ids, st.builder.intent).stats;
await sendBuilderMessage(st, 'over de 30 de força no chapéu', () => {}); assert.ok(st.builder.intent.forge[hat.i].strength > 0); assert.match(st.builder.messages.at(-1).text, /Força/);
await sendBuilderMessage(st, 'desfazer', () => {}); assert.deepEqual(st.builder.intent.forge, {});
setBuilderOption(st, 'scroll', '0'); assert.equal(st.builder.intent.scroll, 0); assert.equal(st.builder.dirty, true); setBuilderOption(st, 'exo-ap'); assert.equal(st.builder.intent.exo.ap, true);
startOver(st); assert.equal(st.builder.ids, null); assert.equal(st.builder.messages.length, 0);
await sendBuilderMessage(st, 'desfazer', () => {}); assert.ok(st.builder.ids);
// Tela inteira sem quebrar, em todos os idiomas e com qualquer espaço aberto.
const { renderBuilderPage } = await import('../src/modules/builder/builderPage.js');
globalThis.window ??= globalThis;
for (const language of languages) for (const selected of [null, 0, 7, 9, 10]) { const html = renderBuilderPage({ ...st, language, disclosures: {}, builder: { ...st.builder, selected, showSwaps: selected === 0, pickBreed: true, intent: { ...st.builder.intent, breed: 8 } } }); assert.doesNotMatch(html, /undefined|NaN|\bbuilder\.[a-z]/i, language); assert.equal((html.match(/class="doll-slot/g) || []).length, 16); }
const { STAT_ICON_KEYS } = await import('../src/modules/builder/statIcons.js'); const { STAT } = await import('../src/modules/builder/gearSchema.js');
for (const key of Object.keys(STAT)) assert.ok(STAT_ICON_KEYS.includes(key), 'sem ícone: ' + key);
for (const language of languages) for (const key of Object.keys(STAT)) assert.ok(builderTranslations[language].builder.stat[key], language + ' ' + key);
for (const tab of ['stats', 'sets', 'passives', 'spells']) for (const language of languages) { const html = renderBuilderPage({ ...st, language, disclosures: {}, builder: { ...st.builder, selected: null, tab, intent: { ...st.builder.intent, breed: 8 } } }); assert.doesNotMatch(html, /undefined|NaN|\bbuilder\.[a-z]/i, tab); }
assert.match(renderBuilderPage({ ...st, disclosures: {}, builder: { ...st.builder, selected: 0, forging: true } }), /data-builder-forge/);
console.log('Builder tests passed.');
