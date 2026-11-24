// Atualiza src/data/feedingXp.js com a XP de alimentação dos recursos (recyclingNuggets × fator, via DofusDB).
// Uso: node scripts/fetch-feeding-xp.js [arquivo-bruto.json já baixado]
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FEEDING_XP_FACTOR } from '../src/config/app.js';

const local = process.argv[2];
const target = resolve(import.meta.dirname, '../src/data/feedingXp.js');

async function download() {
  const PAGE = 50;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const fields = ['id', 'typeId', 'level', 'iconId', 'recyclingNuggets', 'name', 'isSaleable', 'exchangeable', 'hasRecipe', 'type'];
  const rows = [];
  const RESOURCE_SUPER_TYPE = '9';
  const types = [];
  for (let skip = 0; ; skip += PAGE) {
    const page = await (await fetch(`https://api.dofusdb.fr/item-types?superTypeId=${RESOURCE_SUPER_TYPE}&$limit=${PAGE}&$skip=${skip}`)).json();
    types.push(...page.data.map(type => type.id));
    if (types.length >= page.total || !page.data.length) break;
  }
  let total = Infinity;
  for (let skip = 0; skip < total; skip += PAGE) {
    const query = new URLSearchParams({ $limit: String(PAGE), $skip: String(skip), '$sort[id]': '1' });
    types.forEach(id => query.append('typeId[$in][]', id));
    fields.forEach(field => query.append('$select[]', field));
    let payload;
    for (let attempt = 1; ; attempt += 1) {
      const response = await fetch(`https://api.dofusdb.fr/items?${query}`);
      if (response.ok) { payload = await response.json(); break; }
      if (attempt >= 4) throw new Error(`HTTP ${response.status} em skip=${skip}`);
      await sleep(2000 * attempt);
    }
    total = payload.total;
    if (!payload.data.length) break;
    rows.push(...payload.data);
    await sleep(150);
  }
  return rows;
}

const rows = local ? JSON.parse(await readFile(local, 'utf8')) : await download();
const fed = rows.filter(row => Number(row.recyclingNuggets) > 0).sort((a, b) => a.id - b.id);
if (fed.length < 1500) throw new Error(`Poucos recursos recebidos (${fed.length}); arquivo não alterado.`);
const xp = fed.map(row => `${row.id}:${Number((row.recyclingNuggets * FEEDING_XP_FACTOR).toFixed(4))}`).join(',');
const blocked = fed.filter(row => !(row.exchangeable && row.isSaleable)).map(row => row.id);
await writeFile(target, `// Gerado por scripts/fetch-feeding-xp.js — não editar manualmente.
export const FEEDING_XP = {${xp}};
export const NON_TRADABLE_IDS = [${blocked.join(',')}];
`);
console.log(`${fed.length} recursos com XP gravados.`);
