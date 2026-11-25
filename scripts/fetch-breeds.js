// Gera public/data/breeds.json com raças e feitiços de dano (DofusDB).
// Uso: npm run generate:breeds
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const API = 'https://api.dofusdb.fr';
const LANGS = ['pt', 'fr', 'en', 'es'];
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function json(url) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return response.json();
    if (attempt >= 4) throw new Error(`${response.status} ${url}`);
    await sleep(1500 * attempt);
  }
}
const names = node => LANGS.map(lang => node?.[lang] || node?.pt || node?.en || '');

// Efeitos de dano e roubo de vida; o elemento vem do número do efeito.
const DAMAGE = { 96: 'chance', 97: 'strength', 98: 'agility', 99: 'intelligence', 100: 'neutral' };
const STEAL = { 91: 'chance', 92: 'strength', 93: 'agility', 94: 'intelligence', 95: 'neutral' };
const BEST = new Set([2822, 2828, 2830, 2832]);

// Uma linha: [elemento, mínimo, máximo, roubo, condicional]. Condicional = depende de estado, sorteio ou gatilho.
function lines(effects = []) {
  const rows = effects.map(effect => {
    const element = DAMAGE[effect.effectId] || STEAL[effect.effectId] || (BEST.has(effect.effectId) ? 'best' : null);
    if (!element || !effect.visibleInTooltip) return null;
    const mask = String(effect.targetMask || '');
    // Alvo aliado ou só o próprio conjurador não é dano no inimigo.
    if (mask && !/(^|,)\*?A/.test(mask) && !/(^|,)\*?[aAgG]?$/.test(mask) && !/(^|,)(A|I|J|L|M|S|H|D)/.test(mask)) return null;
    const min = effect.diceNum; const max = Math.max(effect.diceNum, effect.diceSide || 0);
    if (!min) return null;
    const conditional = effect.triggers !== 'I' || effect.random > 0 || effect.delay > 0 || /[eEPpfFKkTWUVvBbRrZzQqXxoO]\d/.test(mask);
    return [element, min, max, STEAL[effect.effectId] ? 1 : 0, conditional ? 1 : 0];
  }).filter(Boolean);
  // Linhas repetidas do mesmo elemento costumam valer só em outro tipo de alvo: conta a primeira.
  const seen = new Set();
  for (const row of rows) { if (row[4]) continue; if (seen.has(row[0])) row[4] = 1; else seen.add(row[0]); }
  return rows;
}

const version = await json(`${API}/version`);
const breeds = (await json(`${API}/breeds?$limit=50&$sort[sortIndex]=1`)).data;
const out = [];
for (const breed of breeds) {
  const variants = (await json(`${API}/spell-variants?breedId=${breed.id}&$limit=50`)).data;
  const spells = variants.flatMap((variant, index) => variant.spells.map(spell => ({ spell, variant: index })));
  const ids = spells.map(row => row.spell.id);
  const levels = [];
  for (let i = 0; i < ids.length; i += 10) {
    const query = new URLSearchParams({ $limit: '50' });
    ids.slice(i, i + 10).forEach(id => query.append('spellId[$in][]', id));
    levels.push(...(await json(`${API}/spell-levels?${query}`)).data);
    await sleep(120);
  }
  const rows = spells.map(({ spell, variant }) => {
    const grades = levels.filter(level => level.spellId === spell.id).sort((a, b) => a.grade - b.grade).map(level => ({
      l: level.minPlayerLevel, a: level.apCost, r: [level.minRange, level.range], c: level.criticalHitProbability, t: level.maxCastPerTurn, g: level.maxCastPerTarget, w: level.minCastInterval,
      d: lines(level.effects), k: lines(level.criticalEffect)
    }));
    return { i: spell.id, v: variant, p: spell.iconId, n: names(spell.name), s: names(spell.description), g: grades };
  }).filter(row => row.g.length);
  out.push({ i: breed.id, n: names(breed.shortName), col: breed.maleColors.slice(0, 5).map(value => `#${value.toString(16).padStart(6, '0')}`), s: rows });
  console.log(`${breed.shortName.pt}: ${rows.length} feitiços, ${rows.filter(row => row.g.at(-1).d.length).length} com dano`);
}
if (out.length < 18 || out.some(breed => breed.s.length < 20)) throw new Error('Dados de raças incompletos; arquivo não alterado.');
const target = resolve(import.meta.dirname, '../public/data');
await mkdir(target, { recursive: true });
await writeFile(resolve(target, 'breeds.json'), JSON.stringify({ version, breeds: out }));
