// Gera public/data/gear.json com equipamentos e conjuntos (DofusDude; armas de duas mãos via DofusDB).
// Uso: npm run generate:gear
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SLOT_OF_TYPE, STAT_IDS } from '../src/modules/builder/gearSchema.js';

const API = 'https://api.dofusdu.de/dofus3/v1';
const LANGS = ['pt', 'fr', 'en', 'es'];
const json = async url => { const response = await fetch(url); if (!response.ok) throw new Error(`${response.status} ${url}`); return response.json(); };
const stats = new Set(STAT_IDS);

function packEffects(effects = []) {
  return (effects || []).filter(effect => !effect.type.is_active && stats.has(effect.type.id))
    .flatMap(effect => [effect.type.id, effect.int_minimum, effect.ignore_int_max || !effect.int_maximum ? effect.int_minimum : effect.int_maximum]);
}

function packCondition(node) {
  if (!node) return null;
  if (node.is_operand) return [node.condition.element.id, node.condition.operator, node.condition.int_value];
  return [node.relation, ...(node.children || []).map(packCondition)];
}

const equipment = {}; const sets = {};
for (const lang of LANGS) {
  equipment[lang] = new Map((await json(`${API}/${lang}/items/equipment/all`)).items.map(item => [item.ankama_id, item]));
  sets[lang] = new Map((await json(`${API}/${lang}/sets/all`)).sets.map(set => [set.ankama_id, set]));
}
const version = (await json(`${API}/meta/version`)).version;

// Itens internos do jogo, acessórios que exigem condição de conta e o Amuleto de Jiva (nível 1, inacessível).
const blocked = item => item.ankama_id === 2155 || /\bGMs?\b|Hide Effect Test/i.test(equipment.en.get(item.ankama_id)?.name || '') || JSON.stringify(item.conditions || '').includes('"id":252');
const usable = [...equipment.pt.values()].filter(item => SLOT_OF_TYPE[item.type.id] && !blocked(item) && packEffects(item.effects).length);

const weapons = usable.filter(item => item.is_weapon).map(item => item.ankama_id);
const twoHanded = new Set();
for (let i = 0; i < weapons.length; i += 50) {
  const query = new URLSearchParams({ $limit: '50' });
  weapons.slice(i, i + 50).forEach(id => query.append('id[$in][]', id));
  ['id', 'twoHanded'].forEach(field => query.append('$select[]', field));
  for (const row of (await json(`https://api.dofusdb.fr/items?${query}`)).data) if (row.twoHanded) twoHanded.add(row.id);
}

const names = (source, id) => LANGS.map(lang => source[lang].get(id)?.name || source.pt.get(id).name);
const ids = new Set(usable.map(item => item.ankama_id));
const items = usable.map(item => {
  const row = { i: item.ankama_id, t: item.type.id, l: item.level, p: Number(item.image_urls.icon.match(/item\/(\d+)-/)?.[1]) || 0, n: names(equipment, item.ankama_id), e: packEffects(item.effects) };
  if (item.parent_set && sets.pt.has(item.parent_set.id)) row.s = item.parent_set.id;
  if (item.recipe?.length) row.r = item.recipe.flatMap(line => [line.item_ankama_id, line.quantity]);
  if (item.conditions) row.c = packCondition(item.conditions);
  if (twoHanded.has(item.ankama_id)) row.h = 2;
  // Efeito passivo em texto: não entra no cálculo, mas a tela avisa.
  if ((item.effects || []).some(effect => effect.type.id === 163)) row.x = 1;
  return row;
});
const setRows = [...sets.pt.values()].filter(set => !set.contains_cosmetics_only && set.equipment_ids.some(id => ids.has(id))).map(set => ({
  i: set.ankama_id, n: names(sets, set.ankama_id), m: set.equipment_ids.filter(id => ids.has(id)),
  e: Object.fromEntries(Object.entries(set.effects || {}).map(([count, effects]) => [count, packEffects(effects)]).filter(([, effects]) => effects.length))
}));
if (items.length < 2500 || setRows.length < 300) throw new Error(`Dados incompletos: ${items.length} itens, ${setRows.length} conjuntos.`);
const target = resolve(import.meta.dirname, '../public/data');
await mkdir(target, { recursive: true });
await writeFile(resolve(target, 'gear.json'), JSON.stringify({ version, items, sets: setRows }));
console.log(`${items.length} itens, ${setRows.length} conjuntos, ${twoHanded.size} armas de duas mãos (${version}).`);
