import { SET_BONUS_ID, SLOTS, UNIQUE_EXOS, isExo, isForgeable, SLOT_OF_TYPE, STAT, STAT_IDS, STAT_INDEX, TYPE_DOFUS, TYPE_PRYSMARADITE } from './gearSchema.js';

const N = STAT_IDS.length;
const S = Object.fromEntries(Object.entries(STAT).map(([key, id]) => [key, STAT_INDEX[id]]));
export const ELEMENTS = {
  strength: { stat: 'strength', flat: 'earthDamage' }, intelligence: { stat: 'intelligence', flat: 'fireDamage' },
  chance: { stat: 'chance', flat: 'waterDamage' }, agility: { stat: 'agility', flat: 'airDamage' }
};
const RES = ['neutralRes', 'earthRes', 'fireRes', 'waterRes', 'airRes'];
const CAP = { ap: 12, mp: 6, range: 6, res: 50 };
// Total típico no nível 200: põe cada característica na mesma escala.
const TYPICAL = { wisdom: 400, prospecting: 350, initiative: 4000, lock: 110, dodge: 110, heals: 150, critical: 70, apParry: 110, mpParry: 110, apReduction: 110, mpReduction: 110, pushDamage: 250, summons: 5, pods: 1500, range: 5, criticalRes: 100, pushRes: 150, trapDamage: 60, reflect: 100 };

export function defaultIntent() {
  return { level: 200, elements: ['strength'], damage: 1, survival: 0.55, extras: {}, targets: {}, noCrit: false, roll: 'average', distance: 'any', craftable: false, noDofus: false, preferOwned: false, locked: [], banned: [], breed: 0, scroll: null, exo: { ap: false, mp: false, range: false }, forge: {}, profile: null };
}

function vector(effects, roll) {
  const out = new Float64Array(N);
  for (let i = 0; i < effects.length; i += 3) {
    const index = STAT_INDEX[effects[i]];
    if (index === undefined) continue;
    const [a, b] = [effects[i + 1], effects[i + 2]];
    out[index] += roll === 'max' ? Math.max(a, b) : roll === 'min' ? Math.min(a, b) : (a + b) / 2;
  }
  return out;
}

const vectorCache = new WeakMap();
function vectorsFor(gear, roll) {
  let byRoll = vectorCache.get(gear);
  if (!byRoll) vectorCache.set(gear, byRoll = {});
  if (!byRoll[roll]) {
    byRoll[roll] = {
      items: new Map(gear.items.map(item => [item.i, vector(item.e, roll)])),
      sets: new Map(gear.sets.map(set => [set.i, Object.fromEntries(Object.entries(set.e).map(([count, effects]) => [count, vector(effects, roll)]))]))
    };
  }
  return byRoll[roll];
}

// Pontos de característica: 1:1 até 100, 2:1 até 200, 3:1 até 300, depois 4:1.
export function pointsToStat(points) {
  let left = points; let value = 0;
  for (const cost of [1, 2, 3]) { const take = Math.min(100, Math.floor(left / cost)); value += take; left -= take * cost; if (take < 100) return value; }
  return value + Math.floor(left / 4);
}

// Pergaminhos: o que a pessoa disse ou, sem dizer, 100 a partir do nível 100.
export const scrollOf = intent => intent.scroll ?? (intent.level >= 100 ? 100 : 0);

function baseStats(intent) {
  const base = new Float64Array(N);
  base[S.ap] = intent.level >= 100 ? 7 : 6;
  base[S.mp] = 3; base[S.prospecting] = 100;
  const points = (intent.level - 1) * 5;
  for (const key of ['strength', 'intelligence', 'chance', 'agility', 'vitality', 'wisdom']) base[S[key]] += scrollOf(intent);
  if (intent.damage < 0.4 || !intent.elements.length) base[S.vitality] += points;
  else for (const element of intent.elements) base[S[element]] += pointsToStat(Math.floor(points / intent.elements.length));
  return base;
}

export function maxHp(stats, level) { return 50 + level * 5 + stats[S.vitality]; }

// Dano de um feitiço genérico do nível, na média dos elementos pedidos, com a chance de crítico do equipamento.
export function spellDamage(stats, intent) {
  const elements = intent.elements.length ? intent.elements : ['strength'];
  // Com a raça escolhida, o perfil vem dos feitiços dela.
  const base = intent.profile?.base || 8 + intent.level * 0.16;
  const critBase = intent.profile?.critBase || base * 1.2;
  const chance = intent.noCrit ? 0 : Math.min(100, Math.max(0, (intent.profile?.crit ?? 10) + stats[S.critical])) / 100;
  const distance = intent.distance === 'melee' ? stats[S.meleeDamage] : intent.distance === 'ranged' ? stats[S.rangedDamage] : (stats[S.meleeDamage] + stats[S.rangedDamage]) / 2;
  let total = 0;
  for (const element of elements) {
    const factor = 1 + Math.max(0, stats[S[ELEMENTS[element].stat]] + stats[S.power]) / 100;
    const flat = stats[S.damage] + stats[S[ELEMENTS[element].flat]];
    total += (1 - chance) * (base * factor + flat) + chance * (critBase * factor + flat + stats[S.criticalDamage]);
  }
  return Math.max(1, total / elements.length * (1 + (stats[S.spellDamage] + distance) / 100));
}

export function averageRes(stats) { return RES.reduce((sum, key) => sum + Math.min(CAP.res, stats[S[key]]), 0) / RES.length; }
export const effectiveHp = (stats, level) => maxHp(stats, level) / (1 - Math.min(CAP.res, Math.max(-50, averageRes(stats))) / 100);

function targetValue(stats, key, level) {
  if (key === 'hp') return maxHp(stats, level);
  if (key === 'res') return averageRes(stats);
  return stats[S[key]] ?? 0;
}

// Quanto falta para uma condição de equipamento (0 = cumprida).
function conditionGap(node, stats, setBonuses) {
  if (!node) return 0;
  if (node[0] === 'and') return node.slice(1).reduce((sum, child) => sum + conditionGap(child, stats, setBonuses), 0);
  if (node[0] === 'or') return Math.min(...node.slice(1).map(child => conditionGap(child, stats, setBonuses)));
  const [id, operator, value] = node;
  const current = id === SET_BONUS_ID ? setBonuses : STAT_INDEX[id] === undefined ? null : stats[STAT_INDEX[id]];
  if (current === null) return 0;
  const gap = operator === '>' ? value + 1 - current : operator === '<' ? current - value + 1 : operator === '=' ? Math.abs(current - value) : 0;
  return gap <= 1e-9 ? 0 : 0.5 + Math.min(1.5, gap / Math.max(1, Math.abs(value)));
}

function context(gear, intent) {
  let vectors = vectorsFor(gear, intent.roll);
  // Itens forjados: o valor informado substitui a linha do item.
  const forged = Object.entries(intent.forge || {});
  const exoOwners = { ap: new Set(), mp: new Set(), range: new Set() };
  if (forged.length) {
    const own = new Map(); const byId = new Map(gear.items.map(item => [item.i, item]));
    for (const [id, values] of forged) {
      const item = byId.get(Number(id)); if (!isForgeable(item)) continue;
      const v = Float64Array.from(vectors.items.get(item.i));
      for (const [key, value] of Object.entries(values)) { v[S[key]] = value; if (exoOwners[key] && value > 0 && isExo(item, key)) exoOwners[key].add(item.i); }
      own.set(item.i, v);
    }
    const base = vectors.items;
    vectors = { ...vectors, items: { get: id => own.get(id) || base.get(id) } };
  }
  return { gear, intent, vectors, exoOwners, autoExo: UNIQUE_EXOS.filter(key => intent.exo?.[key]), base: baseStats(intent), stats: new Float64Array(N), counts: new Map(), owned: new Set(intent.ownedIds || []) };
}

function sumStats(ctx, items) {
  const { stats, counts, vectors, base } = ctx;
  stats.set(base); counts.clear();
  for (const item of items) {
    if (!item) continue;
    const v = vectors.items.get(item.i);
    for (let i = 0; i < N; i += 1) stats[i] += v[i];
    if (item.s) counts.set(item.s, (counts.get(item.s) || 0) + 1);
  }
  // Exo liberado: +1, desde que nenhuma peça vestida já tenha esse exo.
  for (const key of ctx.autoExo) if (items.some(isForgeable) && !items.some(item => item && ctx.exoOwners[key].has(item.i))) stats[S[key]] += 1;
  let bonuses = 0;
  for (const [id, count] of counts) {
    if (count < 2) continue;
    bonuses += count - 1;
    const v = vectors.sets.get(id)?.[count];
    if (v) for (let i = 0; i < N; i += 1) stats[i] += v[i];
  }
  return bonuses;
}

function score(ctx, items) {
  const bonuses = sumStats(ctx, items);
  const { stats, intent } = ctx;
  let gap = 0;
  for (const item of items) if (item?.c) gap += conditionGap(item.c, stats, bonuses);
  const ap = Math.min(CAP.ap, stats[S.ap]); const mp = Math.min(CAP.mp, stats[S.mp]); const range = Math.min(CAP.range, stats[S.range]);
  let value = intent.damage * Math.log(spellDamage(stats, intent) * Math.max(1, ap)) + intent.survival * Math.log(Math.max(1, effectiveHp(stats, intent.level)));
  value += 0.1 * mp + 0.02 * Math.max(0, range);
  for (const key in intent.extras) value += intent.extras[key] * (key === 'range' ? range : stats[S[key]]) / (TYPICAL[key] * Math.max(0.2, intent.level / 200));
  for (const key in intent.targets) {
    const want = intent.targets[key]; const missing = want - targetValue(stats, key, intent.level);
    if (missing > 0) value -= ['ap', 'mp', 'range'].includes(key) ? 1.5 * missing : 0.3 + 4 * missing / Math.max(1, Math.abs(want));
  }
  for (const item of items) if (item && intent.preferOwned && ctx.owned.has(item.i)) value += 0.06;
  return value - gap * 3;
}

// Valor aproximado de uma unidade de cada característica, para escolher candidatos.
function gradient(ctx) {
  const { intent } = ctx; const scale = intent.level / 200;
  const typical = new Float64Array(N); typical.set(ctx.base);
  for (const element of intent.elements) { typical[S[element]] += 450 * scale / Math.sqrt(intent.elements.length); typical[S[ELEMENTS[element].flat]] += 45 * scale; }
  typical[S.power] += 150 * scale; typical[S.damage] += 40 * scale; typical[S.vitality] += 2200 * scale; typical[S.critical] += 40 * scale; typical[S.criticalDamage] += 40 * scale;
  for (const key of RES) typical[S[key]] += 15 * scale;
  const at = stats => {
    let value = intent.damage * Math.log(spellDamage(stats, intent) * stats[S.ap]) + intent.survival * Math.log(effectiveHp(stats, intent.level)) + 0.1 * stats[S.mp] + 0.02 * stats[S.range];
    for (const key in intent.extras) value += intent.extras[key] * stats[S[key]] / (TYPICAL[key] * Math.max(0.2, scale));
    for (const key in intent.targets) if (!['ap', 'mp', 'range'].includes(key)) value += 0.6 * targetValue(stats, key, intent.level) / Math.max(1, Math.abs(intent.targets[key]));
    return value;
  };
  const start = at(typical); const out = new Float64Array(N);
  for (let i = 0; i < N; i += 1) { typical[i] += 1; out[i] = at(typical) - start; typical[i] -= 1; }
  out[S.ap] = Math.max(out[S.ap], 0.12); out[S.mp] = Math.max(out[S.mp], 0.12);
  if (intent.targets.range) out[S.range] = Math.max(out[S.range], 0.1);
  return out;
}
const dot = (a, b) => { let sum = 0; for (let i = 0; i < N; i += 1) sum += a[i] * b[i]; return sum; };

// Onde o site supõe cada exo liberado: uma peça forjável sem essa linha, um exo por peça.
function assignExos(ctx, items) {
  const out = {}; const taken = new Set(Object.keys(ctx.intent.forge || {}).map(Number));
  for (const key of ctx.autoExo) {
    if (items.some(item => item && ctx.exoOwners[key].has(item.i))) continue;
    const item = items.find(row => isForgeable(row) && !taken.has(row.i) && isExo(row, key)) || items.find(row => isForgeable(row) && isExo(row, key));
    if (item) { out[key] = item.i; taken.add(item.i); }
  }
  return out;
}

const twoHandedClash = items => items.some(item => item?.h === 2) && items.some(item => item && SLOT_OF_TYPE[item.t] === 'shield');

export function isLegal(items) {
  const ids = items.filter(Boolean).map(item => item.i);
  return new Set(ids).size === ids.length && items.filter(item => item?.t === TYPE_PRYSMARADITE).length <= 1 && !twoHandedClash(items);
}

function allowed(item, intent) {
  if (item.l > intent.level || intent.banned.includes(item.i)) return false;
  if (intent.locked.includes(item.i)) return true;
  if (intent.noDofus && item.t === TYPE_DOFUS) return false;
  const craftSlot = !['companion', 'trophy'].includes(SLOT_OF_TYPE[item.t]);
  return !(intent.craftable && craftSlot && !item.r);
}

function candidates(ctx) {
  const { gear, intent, vectors } = ctx;
  const g = gradient(ctx);
  const rank = new Map(); const pool = {};
  for (const item of gear.items) {
    if (!allowed(item, intent)) continue;
    rank.set(item.i, dot(vectors.items.get(item.i), g) + (intent.preferOwned && ctx.owned.has(item.i) ? 0.06 : 0));
    (pool[SLOT_OF_TYPE[item.t]] ??= []).push(item);
  }
  const byId = new Map(gear.items.map(item => [item.i, item]));
  // Conjuntos promissores: valor por peça, contando o melhor bônus.
  const sets = gear.sets.map(set => {
    const members = set.m.map(id => byId.get(id)).filter(item => item && rank.has(item.i));
    let best = -Infinity;
    for (const count in set.e) if (members.length >= +count) best = Math.max(best, (dot(vectors.sets.get(set.i)[count], g) + members.map(item => rank.get(item.i)).sort((a, b) => b - a).slice(0, +count).reduce((a, b) => a + b, 0)) / +count);
    return { members, best };
  }).filter(set => set.members.length > 1 && Number.isFinite(set.best)).sort((a, b) => b.best - a.best).slice(0, 40);
  const lists = {};
  for (const slot of new Set(SLOTS)) {
    const list = (pool[slot] || []).sort((a, b) => rank.get(b.i) - rank.get(a.i));
    const chosen = new Set(list.slice(0, 34));
    for (const key of ['ap', 'mp', 'range']) list.filter(item => vectors.items.get(item.i)[S[key]] > 0).slice(0, 10).forEach(item => chosen.add(item));
    for (const set of sets) set.members.filter(item => SLOT_OF_TYPE[item.t] === slot).forEach(item => chosen.add(item));
    lists[slot] = [...chosen];
  }
  return { lists, sets, rank };
}

// Gerador determinístico: o mesmo pedido sempre dá o mesmo set.
function random(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

function lockedLayout(gear, intent) {
  const items = SLOTS.map(() => null); const fixed = SLOTS.map(() => false); const rejected = [];
  for (const id of intent.locked) {
    const item = gear.items.find(row => row.i === id);
    const slot = item ? SLOTS.findIndex((name, index) => name === SLOT_OF_TYPE[item.t] && !fixed[index]) : -1;
    if (slot < 0 || item.l > intent.level) { rejected.push(id); continue; }
    items[slot] = item; fixed[slot] = true;
    if (!isLegal(items)) { items[slot] = null; fixed[slot] = false; rejected.push(id); }
  }
  return { items, fixed, rejected };
}

const pause = () => new Promise(resolve => setTimeout(resolve, 0));

export async function optimize(gear, rawIntent, { restarts = 6, iterations = 9000, seed = 7, start = null, onProgress = null } = {}) {
  const intent = { ...defaultIntent(), ...rawIntent };
  const ctx = context(gear, intent);
  const { lists, sets, rank } = candidates(ctx);
  const layout = lockedLayout(gear, intent);
  let best = null; let bestScore = -Infinity;
  const free = SLOTS.map((_, index) => index).filter(index => !layout.fixed[index]);
  // O set atual entra como ponto de partida: um ajuste nunca devolve algo pior para o mesmo pedido.
  if (start) {
    const byId = new Map(gear.items.map(item => [item.i, item]));
    const items = SLOTS.map((_, index) => { const item = byId.get(start[index]); return layout.fixed[index] ? layout.items[index] : item && allowed(item, intent) ? item : null; });
    if (isLegal(items)) { best = items; bestScore = score(ctx, items); }
  }
  for (let round = 0; round < restarts; round += 1) {
    const next = random(seed * 7919 + round * 104729);
    let current = [...layout.items];
    for (const index of free) {
      const list = lists[SLOTS[index]];
      for (const item of list.slice(round ? Math.floor(next() * 6) : 0)) { const trial = [...current]; trial[index] = item; if (isLegal(trial)) { current = trial; break; } }
    }
    let currentScore = score(ctx, current);
    if (currentScore > bestScore) { best = current; bestScore = currentScore; }
    for (let step = 0; step < iterations && free.length; step += 1) {
      const heat = 0.22 * (1 - step / iterations) ** 2 + 1e-4;
      const trial = [...current];
      if (next() < 0.12 && sets.length) {
        // Troca em bloco: veste de 2 a 5 peças de um conjunto.
        const { members } = sets[Math.floor(next() ** 1.6 * sets.length)];
        const wanted = 2 + Math.floor(next() * 4);
        members.slice().sort(() => next() - 0.5).slice(0, wanted).forEach(item => {
          const index = free.find(slot => SLOTS[slot] === SLOT_OF_TYPE[item.t] && trial[slot]?.s !== item.s);
          if (index !== undefined && !trial.includes(item)) trial[index] = item;
        });
        if (trial.some(item => item?.h === 2)) free.filter(slot => SLOTS[slot] === 'shield').forEach(slot => { trial[slot] = null; });
      } else {
        const index = free[Math.floor(next() * free.length)];
        const list = lists[SLOTS[index]];
        if (!list.length) continue;
        trial[index] = next() < 0.02 ? null : list[Math.floor(next() ** 1.5 * list.length)];
        if (next() < 0.1) { const other = free[Math.floor(next() * free.length)]; const pool = lists[SLOTS[other]]; if (pool.length) trial[other] = pool[Math.floor(next() ** 1.5 * pool.length)]; }
        if (trial[index]?.h === 2) free.filter(slot => SLOTS[slot] === 'shield').forEach(slot => { trial[slot] = null; });
      }
      if (!isLegal(trial)) continue;
      const value = score(ctx, trial);
      if (value > currentScore || next() < Math.exp((value - currentScore) / heat)) { current = trial; currentScore = value; if (value > bestScore) { best = trial; bestScore = value; } }
      if (step % 3000 === 2999) await pause();
    }
    onProgress?.((round + 1) / restarts);
    await pause();
  }
  // Acabamento: troca uma peça por vez enquanto melhorar.
  for (let improved = true, guard = 0; improved && guard < 8; guard += 1) {
    improved = false;
    for (const index of free) for (const item of [null, ...lists[SLOTS[index]]]) {
      const trial = [...best]; trial[index] = item;
      if (!isLegal(trial)) continue;
      const value = score(ctx, trial);
      if (value > bestScore + 1e-9) { best = trial; bestScore = value; improved = true; }
    }
    await pause();
  }
  return { ids: best.map(item => item?.i ?? null), score: bestScore, rejected: layout.rejected, candidates: rank.size };
}

export function describeBuild(gear, ids, rawIntent) {
  const intent = { ...defaultIntent(), ...rawIntent };
  const ctx = context(gear, intent);
  const byId = new Map(gear.items.map(item => [item.i, item]));
  const items = ids.map(id => byId.get(id) || null);
  const bonuses = sumStats(ctx, items);
  const stats = Object.fromEntries(Object.keys(S).map(key => [key, Math.floor(ctx.stats[S[key]] + 1e-9)]));
  const raw = Float64Array.from(ctx.stats);
  const sets = gear.sets.filter(set => (ctx.counts.get(set.i) || 0) > 1).map(set => ({ set, count: ctx.counts.get(set.i) }));
  const broken = items.filter(item => item?.c && conditionGap(item.c, raw, bonuses) > 0).map(item => item.i);
  const missing = Object.entries(intent.targets).map(([key, want]) => ({ key, want, got: Math.floor(targetValue(raw, key, intent.level)) })).filter(row => row.got < row.want);
  return { items, stats, raw, sets, exos: assignExos(ctx, items), broken, missing, hp: Math.floor(maxHp(raw, intent.level)), ehp: Math.round(effectiveHp(raw, intent.level)), damage: spellDamage(raw, intent), res: averageRes(raw), capped: { ap: Math.min(CAP.ap, stats.ap), mp: Math.min(CAP.mp, stats.mp), range: Math.min(CAP.range, stats.range) } };
}

// Melhores trocas para um espaço, com o efeito no set inteiro.
export function alternatives(gear, ids, rawIntent, slotIndex, limit = 4) {
  const intent = { ...defaultIntent(), ...rawIntent };
  const ctx = context(gear, intent);
  const byId = new Map(gear.items.map(item => [item.i, item]));
  const items = ids.map(id => byId.get(id) || null);
  const now = describeBuild(gear, ids, intent);
  return gear.items.filter(item => SLOT_OF_TYPE[item.t] === SLOTS[slotIndex] && allowed(item, intent) && item.i !== ids[slotIndex]).map(item => {
    const trial = [...items]; trial[slotIndex] = item;
    return isLegal(trial) ? { item, value: score(ctx, trial) } : null;
  }).filter(Boolean).sort((a, b) => b.value - a.value).slice(0, limit).map(({ item }) => {
    const next = [...ids]; next[slotIndex] = item.i;
    const after = describeBuild(gear, next, intent);
    return { item, damage: (after.damage / now.damage - 1) * 100, hp: after.hp - now.hp, ap: after.capped.ap - now.capped.ap, mp: after.capped.mp - now.capped.mp, broken: after.broken.length };
  });
}

const SPELL_STAT = { ...ELEMENTS, neutral: { stat: 'strength', flat: 'neutralDamage' } };
const RES_OF = { strength: 'earthRes', intelligence: 'fireRes', chance: 'waterRes', agility: 'airRes', neutral: 'neutralRes' };
export const gradeFor = (spell, level) => [...spell.g].reverse().find(grade => grade.l <= level) || null;

// Dano de um feitiço com o set: cada linha do jogo, normal e crítico, contra a resistência do alvo.
export function testSpell(raw, grade, intent, targetRes = 0) {
  const chance = intent.noCrit || !grade.c ? 0 : Math.min(100, Math.max(0, grade.c + raw[S.critical])) / 100;
  const ranged = grade.r[1] > 1;
  const final = (1 + (raw[S.spellDamage] + (ranged ? raw[S.rangedDamage] : raw[S.meleeDamage])) / 100) * (1 - Math.min(CAP.res, targetRes) / 100);
  const value = (base, element, critical) => {
    const pick = element === 'best' ? Object.keys(ELEMENTS).reduce((a, b) => (raw[S[ELEMENTS[b].stat]] > raw[S[ELEMENTS[a].stat]] ? b : a)) : element;
    const { stat, flat } = SPELL_STAT[pick];
    return Math.max(0, Math.floor((Math.floor(base * (1 + Math.max(0, raw[S[stat]] + raw[S.power]) / 100)) + raw[S.damage] + raw[S[flat]] + (critical ? raw[S.criticalDamage] : 0)) * final));
  };
  const lines = (rows, critical) => rows.map(([element, min, max, steal, conditional]) => ({ element, steal: Boolean(steal), conditional: Boolean(conditional), min: value(min, element, critical), max: value(max, element, critical) }));
  const normal = lines(grade.d, false);
  const critical = lines(grade.k.length ? grade.k : grade.d, true);
  const average = rows => rows.filter(row => !row.conditional).reduce((sum, row) => sum + (row.min + row.max) / 2, 0);
  return { normal, critical, chance, expected: average(normal) * (1 - chance) + average(critical) * chance };
}

// Melhor sequência de um turno no mesmo alvo: respeita PA, lançamentos por alvo e variantes exclusivas.
export function bestTurn(raw, breed, intent, ap, targetRes = 0) {
  const groups = new Map();
  for (const spell of breed.s) {
    const grade = gradeFor(spell, intent.level);
    if (!grade || !grade.a || !grade.d.some(line => !line[4])) continue;
    const limit = grade.w > 0 ? 1 : Math.min(grade.g || 99, grade.t || 99);
    groups.set(spell.v, [...(groups.get(spell.v) || []), { spell, ap: grade.a, limit, value: testSpell(raw, grade, intent, targetRes).expected }]);
  }
  let best = Array.from({ length: ap + 1 }, () => ({ value: 0, casts: [] }));
  for (const options of groups.values()) {
    const next = best.map(row => row);
    for (const option of options) for (let count = 1; count <= option.limit && count * option.ap <= ap; count += 1) for (let spent = count * option.ap; spent <= ap; spent += 1) {
      const from = best[spent - count * option.ap]; const value = from.value + count * option.value;
      if (value > next[spent].value) next[spent] = { value, casts: [...from.casts, { spell: option.spell, count }] };
    }
    best = next;
  }
  return best[ap];
}

// Resume os feitiços da raça nos elementos do set, para o montador otimizar com eles.
export function spellProfile(breed, intent) {
  const rows = [];
  for (const spell of breed?.s || []) {
    const grade = gradeFor(spell, intent.level); if (!grade) continue;
    grade.d.forEach((line, index) => { if (!line[4] && (line[0] === 'best' || intent.elements.includes(line[0]))) { const crit = grade.k[index] || line; rows.push([(line[1] + line[2]) / 2, (crit[1] + crit[2]) / 2, grade.c]); } });
  }
  if (rows.length < 2) return null;
  const mean = index => rows.reduce((sum, row) => sum + row[index], 0) / rows.length;
  return { base: mean(0), critBase: mean(1), crit: mean(2) };
}
