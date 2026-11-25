import { POINT_STATS, alternatives, defaultIntent, describeBuild, optimize, scrollOf, spellProfile } from './buildEngine.js';
import { applyParsed, defaultTargets, normalizeText, parseMessage } from './chatParser.js';
import { FORGE_STATS, LANGUAGES, SLOTS, SLOT_OF_TYPE, UNIQUE_EXOS, forgeLimit, isExo, isForgeable, itemName, naturalMax } from './gearSchema.js';
import { t } from '../../components/common.js';
import { formatKamas, formatNumber } from '../../utils/currency.js';

export const BUILDER_KEY = 'd4b_builder_v1';
export const BUILDS_KEY = 'd4b_builds_v1';

const startIntent = () => ({ ...defaultIntent(), targets: defaultTargets(200) });
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* cheio ou bloqueado */ } };
const cleanIds = ids => SLOTS.map((_, index) => Number(ids?.[index]) || null);
const list = value => (Array.isArray(value) ? value.map(Number).filter(Boolean) : []);

function cleanStats(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return Object.fromEntries(['ap', 'mp', 'range', 'hp', 'damage', 'res'].map(key => [key, Math.round(Number(raw[key])) || 0]));
}

function cleanPoints(raw) {
  return Object.fromEntries(POINT_STATS.filter(key => Number.isFinite(raw?.[key])).map(key => [key, Math.min(995, Math.max(0, Math.trunc(raw[key])))]));
}

function cleanForge(raw) {
  const out = {};
  for (const [id, values] of Object.entries(raw && typeof raw === 'object' ? raw : {}).slice(0, 60)) {
    const rows = Object.entries(values && typeof values === 'object' ? values : {}).filter(([key, value]) => FORGE_STATS.includes(key) && Number.isFinite(value)).map(([key, value]) => [key, Math.trunc(value)]);
    if (Number(id) && rows.length) out[Number(id)] = Object.fromEntries(rows);
  }
  return out;
}

function cleanIntent(raw) {
  const base = startIntent();
  if (!raw || typeof raw !== 'object') return base;
  const numbers = value => Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {}).filter(([key, item]) => /^[a-zA-Z]+$/.test(key) && Number.isFinite(item)));
  return { ...base, level: Math.min(200, Math.max(1, Math.trunc(Number(raw.level) || 200))), elements: (Array.isArray(raw.elements) ? raw.elements : base.elements).filter(item => ['strength', 'intelligence', 'chance', 'agility'].includes(item)),
    damage: Number(raw.damage) || base.damage, survival: Number(raw.survival) || base.survival, extras: numbers(raw.extras), targets: numbers(raw.targets), customTargets: Boolean(raw.customTargets), noCrit: Boolean(raw.noCrit), craftable: Boolean(raw.craftable), noDofus: Boolean(raw.noDofus), preferOwned: Boolean(raw.preferOwned),
    roll: raw.roll === 'max' ? 'max' : 'average', distance: ['melee', 'ranged'].includes(raw.distance) ? raw.distance : 'any', breed: Math.trunc(Number(raw.breed)) || 0, scroll: Number.isFinite(raw.scroll) ? Math.min(100, Math.max(0, Math.trunc(raw.scroll))) : null, exo: Object.fromEntries(UNIQUE_EXOS.map(key => [key, Boolean(raw.exo?.[key])])), forge: cleanForge(raw.forge), points: cleanPoints(raw.points), locked: list(raw.locked), banned: list(raw.banned) };
}

export function createBuilderState() {
  const saved = read(BUILDER_KEY, {});
  const builds = read(BUILDS_KEY, []);
  return { status: 'idle', gear: null, breeds: null, selected: null, tab: 'stats', forging: false, showSwaps: false, pickBreed: false, targetRes: 0, dirty: false, saveName: '', savedId: String(saved?.savedId || '').replace(/[^\w-]/g, ''), swapQuery: '', swapStat: '', busy: false, input: '', swapIndex: null, history: [], seed: 7, ids: Array.isArray(saved?.ids) ? cleanIds(saved.ids) : null, intent: cleanIntent(saved?.intent),
    messages: (Array.isArray(saved?.messages) ? saved.messages : []).slice(-30).map(item => ({ role: item?.role === 'user' ? 'user' : 'bot', text: String(item?.text || '').slice(0, 4000), tags: Array.isArray(item?.tags) ? item.tags.slice(0, 20).map(tag => String(tag).slice(0, 120)) : [], stats: cleanStats(item?.stats) })),
    saved: (Array.isArray(builds) ? builds : []).map(item => ({ id: String(item?.id || '').replace(/[^\w-]/g, ''), name: String(item?.name || '').slice(0, 120), ids: cleanIds(item?.ids), intent: cleanIntent(item?.intent) })) };
}

export function persistBuilder(builder) {
  write(BUILDER_KEY, { savedId: builder.savedId, ids: builder.ids, intent: builder.intent, messages: builder.messages.slice(-30) });
  write(BUILDS_KEY, builder.saved);
}

let gearPromise = null;
export function loadGear() {
  gearPromise ??= fetch('/data/gear.json').then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then(gear => {
    const slots = new Map(gear.items.map(item => [item.i, SLOT_OF_TYPE[item.t]]));
    const byId = new Map(gear.items.map(item => [item.i, item]));
    return { ...gear, slotOf: id => slots.get(id), item: id => byId.get(id) };
  }).catch(error => { gearPromise = null; throw error; });
  return gearPromise;
}

let breedsPromise = null;
export function loadBreeds() {
  breedsPromise ??= fetch('/data/breeds.json').then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then(data => data.breeds).catch(error => { breedsPromise = null; throw error; });
  return breedsPromise;
}
export const currentBreed = builder => (builder.breeds || []).find(breed => breed.i === builder.intent.breed) || null;

const langIndex = state => Math.max(0, LANGUAGES.indexOf(state.language));
const signed = (value, suffix = '') => `${value >= 0 ? '+' : '−'}${Math.abs(value)}${suffix}`;
const percent = (state, value) => `${value >= 0 ? '+' : '−'}${formatNumber(Math.abs(value), state.language, 1)}%`;
const ownedIds = state => (state.craftInventory || []).filter(item => item.quantity > 0).map(item => Number(item.ankamaId)).filter(Boolean);
// Pedido completo para o motor: estoque e perfil dos feitiços da raça.
const withOwned = (state, intent) => ({ ...intent, ownedIds: ownedIds(state), profile: spellProfile((state.builder.breeds || []).find(breed => breed.i === intent.breed), intent) });
const describe = (state, ids, intent) => describeBuild(state.builder.gear, ids, withOwned(state, intent));

// Materiais diretos do set, com os preços que a pessoa ou a comunidade já informaram.
export function buildCost(state, ids) {
  const gear = state.builder.gear; const totals = new Map(); let items = 0;
  for (const id of ids || []) {
    const recipe = gear.item(id)?.r; if (!recipe) continue;
    items += 1;
    for (let i = 0; i < recipe.length; i += 2) totals.set(recipe[i], (totals.get(recipe[i]) || 0) + recipe[i + 1]);
  }
  const serverId = String(state.account?.user?.serverId || '');
  const community = { ...(state.communityPrices || {}), ...(state.petCommunity && String(state.petCommunity.serverId) === serverId ? state.petCommunity.prices : {}) };
  const price = id => Math.round(Number(community[id]?.unitPrice) || Number(state.craftPrices?.[id]) || Number(state.petPrices?.resources?.[id]) || 0);
  let cost = 0; let known = 0;
  for (const [id, quantity] of totals) { const unit = price(id); if (unit) { known += 1; cost += unit * quantity; } }
  return { cost, known, total: totals.size, items };
}

function describeIntent(state, intent) {
  const tr = (key, vars) => t(state, `builder.${key}`, vars);
  const parts = [tr('level', { value: intent.level }), intent.elements.length ? intent.elements.map(key => tr(`stat.${key}`)).join(' + ') : tr('noElement')];
  const targets = Object.entries(intent.targets).map(([key, value]) => `${value} ${tr(`stat.${key}`)}`);
  if (targets.length) parts.push(tr('targets', { list: targets.join(', ') }));
  if (intent.survival >= 1.2) parts.push(tr('styleTank')); else if (intent.damage >= 1.25) parts.push(tr('styleDamage'));
  const extras = Object.entries(intent.extras).filter(([, value]) => value > 0.2).map(([key]) => tr(`stat.${key}`));
  if (extras.length) parts.push(tr('extras', { list: extras.join(', ') }));
  for (const key of ['craftable', 'noDofus', 'noCrit']) if (intent[key]) parts.push(tr(key));
  if (intent.roll === 'max') parts.push(tr('maxRoll'));
  if (intent.distance !== 'any') parts.push(tr(intent.distance));
  if (intent.preferOwned) parts.push(tr('owned'));
  if (intent.locked.length) parts.push(tr('locked', { count: intent.locked.length }));
  if (intent.banned.length) parts.push(tr('banned', { count: intent.banned.length }));
  const breed = (state.builder.breeds || []).find(row => row.i === intent.breed);
  if (breed) parts.unshift(itemName(breed, state.language));
  if (intent.scroll !== null) parts.push(scrollOf(intent) ? tr('scrolled', { value: scrollOf(intent) }) : tr('unscrolled'));
  const fixedPoints = Object.entries(intent.points).map(([key, value]) => `${value} ${tr(`stat.${key}`)}`);
  if (fixedPoints.length) parts.push(tr('pointsFixed', { list: fixedPoints.join(', ') }));
  const exos = UNIQUE_EXOS.filter(key => intent.exo[key]);
  if (exos.length) parts.push(tr('exoAllowed', { list: exos.map(key => tr(`stat.${key}`)).join(', ') }));
  return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
}

export function currentBuild(state) {
  const { gear, ids, intent } = state.builder;
  return gear && ids ? describe(state, ids, intent) : null;
}

function buildReply(state, before, build, result, parsed) {
  const { gear, intent } = state.builder;
  const tr = (key, vars) => t(state, `builder.${key}`, vars);
  const name = id => { const item = gear.item(id); return item ? itemName(item, state.language) : String(id); };
  const lines = [];
  if (before) lines.push(before.same ? tr('same') : tr('delta', { damage: signed(Math.round((build.damage / before.damage - 1) * 100), '%'), hp: signed(build.hp - before.hp) }));
  if (build.missing.length) lines.push(tr('missing', { list: build.missing.map(row => `${tr(`stat.${row.key}`)} ${row.got}/${row.want}`).join(', ') }));
  if (build.broken.length) lines.push(tr('broken', { list: build.broken.map(name).join(', ') }));
  if (result.rejected?.length) lines.push(tr('rejected', { list: result.rejected.slice(0, 6).map(name).join(', ') }));
  if (parsed?.notes?.includes('budget')) lines.push(tr('budget'));
  return { text: lines.join('\n'), tags: describeIntent(state, intent), stats: { ...build.capped, hp: build.hp, damage: Math.round(build.damage), res: Math.round(build.res) } };
}

function explain(state, slots) {
  const { gear, ids, intent } = state.builder;
  const now = describe(state, ids, intent);
  const lines = ids.map((id, index) => {
    if (!id || (slots.length && !slots.includes(SLOTS[index]))) return null;
    const without = [...ids]; without[index] = null;
    const other = describe(state, without, intent);
    const extra = ['ap', 'mp', 'range'].map(key => [key, now.stats[key] - other.stats[key]]).filter(([, value]) => value).map(([key, value]) => `${signed(value)} ${t(state, `builder.stat.${key}`)}`);
    const text = [t(state, 'builder.explainPart', { damage: percent(state, (1 - other.damage / now.damage) * 100), hp: signed(now.hp - other.hp) }), ...extra].join(', ');
    return t(state, 'builder.explainLine', { name: itemName(gear.item(id), state.language), text });
  }).filter(Boolean);
  const sets = now.sets.map(row => `${itemName(row.set, state.language)} (${row.count})`);
  return t(state, 'builder.explain', { list: lines.join('\n') }) + (sets.length ? `\n${t(state, 'builder.explainSets', { list: sets.join(', ') })}` : '');
}

export function costReply(state) {
  const cost = buildCost(state, state.builder.ids);
  return cost.known ? t(state, 'builder.cost', { value: formatKamas(cost.cost, state.language), known: cost.known, total: cost.total, items: cost.items }) : t(state, 'builder.costNone');
}

// Grava por cima do set salvo que está aberto.
export function updateSaved(state) {
  const builder = state.builder; const row = builder.saved.find(item => item.id === builder.savedId);
  if (!row || !builder.ids) return false;
  Object.assign(row, { name: builder.saveName.trim().slice(0, 80) || row.name, ids: [...builder.ids], intent: structuredClone(builder.intent) });
  builder.saveName = row.name;
  persistBuilder(builder);
  return true;
}

function saveBuild(state) {
  const builder = state.builder;
  const intent = builder.intent;
  const breed = currentBreed(builder);
  const auto = `${breed ? `${itemName(breed, state.language)} · ` : ''}${t(state, 'builder.level', { value: intent.level })} · ${intent.elements.map(key => t(state, `builder.stat.${key}`)).join(' + ') || t(state, 'builder.hp')}`;
  const name = builder.saveName.trim().slice(0, 80) || auto.charAt(0).toUpperCase() + auto.slice(1);
  const id = `build-${Date.now().toString(36)}-${builder.saved.length}`;
  builder.savedId = id; builder.saveName = name;
  builder.saved = [{ id, name, ids: [...builder.ids], intent: structuredClone(intent) }, ...builder.saved].slice(0, 40);
}

const remember = builder => { if (builder.ids) builder.history = [...builder.history, { ids: [...builder.ids], intent: structuredClone(builder.intent) }].slice(-20); };
const say = (builder, message) => { builder.messages.push(typeof message === 'string' ? { role: 'bot', text: message } : { role: 'bot', ...message }); };

// Antes do primeiro set, pergunta o que falta em vez de adivinhar. "Tanto faz" aceita o padrão.
function missingInfo(builder, parsed) {
  const known = builder.known ??= { level: false, element: false };
  if (parsed.any) { known[builder.asking || 'element'] = true; if (builder.asking !== 'level') known.element = true; }
  if (parsed.patch.level !== undefined) known.level = true;
  const noElementStyle = (parsed.styles || []).some(name => ['tank', 'drop', 'xp', 'pods'].includes(name));
  if (parsed.patch.elements || noElementStyle) known.element = true;
  return !known.element ? 'element' : !known.level ? 'level' : null;
}

function statReply(state, key) {
  const build = currentBuild(state);
  const value = key === 'hp' ? build.hp : key === 'res' ? `${Math.round(build.res)}%` : key === 'damageAll' ? Math.round(build.damage) : build.capped[key] ?? build.stats[key];
  const label = key === 'hp' ? 'builder.hp' : key === 'res' ? 'builder.res' : key === 'damageAll' ? 'builder.damage' : `builder.stat.${key}`;
  return t(state, 'builder.statAnswer', { name: t(state, label), value: typeof value === 'number' ? formatNumber(value, state.language) : value });
}

async function rebuild(state, intent, parsed, emit) {
  const builder = state.builder;
  const { gear } = builder;
  const previous = builder.ids && parsed.action !== 'reset' && intent.level === builder.intent.level && intent.breed === builder.intent.breed && intent.elements.join() === builder.intent.elements.join() ? describe(state, builder.ids, intent) : null;
  const oldIds = builder.ids;
  remember(builder);
  // As travas de "troca o anel" valem só para esta montagem.
  const temporary = intent.temporaryLocks; delete intent.temporaryLocks;
  const permanent = temporary ? builder.intent.locked.filter(id => !intent.banned.includes(id)) : intent.locked;
  const result = await optimize(gear, withOwned(state, intent), { seed: builder.seed, start: parsed.action === 'reset' ? null : builder.ids, onProgress: value => { builder.progress = Math.round(value * 100); const node = document.querySelector('[data-builder-progress]'); if (node) node.textContent = `${builder.progress}%`; } });
  builder.ids = result.ids; builder.dirty = false; builder.selected = null; builder.forging = false; builder.showSwaps = false; builder.asking = null; builder.known = null;
  builder.intent = { ...intent, locked: permanent.filter(id => !result.rejected.includes(id)) };
  const build = describe(state, builder.ids, builder.intent);
  say(builder, buildReply(state, previous ? { damage: previous.damage, hp: previous.hp, same: oldIds.join() === result.ids.join() } : null, build, result, parsed));
  emit();
}

export async function sendBuilderMessage(state, message, emit) {
  const builder = state.builder; const text = String(message || '').trim().slice(0, 500);
  if (!text || builder.busy || !builder.gear) return;
  builder.input = '';
  builder.messages.push({ role: 'user', text });
  const needs = ['stat', 'forge', 'undo', 'explain', 'cost', 'save', 'reroll', 'keep-slot', 'swap-slot'];
  builder.busy = true; builder.progress = 0;
  emit();
  try {
    const parsed = parseMessage(text, builder.gear, langIndex(state), builder.ids);
    if (parsed.action === 'reset' && parsed.pureReset) { startOver(state); return; }
    const missing = builder.ids || parsed.action ? null : missingInfo(builder, parsed);
    if (['help', 'greet', 'thanks'].includes(parsed.action)) say(builder, t(state, `builder.${parsed.action}`));
    else if (parsed.action === 'stat' && builder.ids) say(builder, statReply(state, parsed.stat));
    else if (parsed.action === 'forgeHelp') say(builder, t(state, 'builder.forgeHelp'));
    else if (parsed.action === 'forge' && builder.ids) say(builder, forgeFromChat(state, parsed.forge));
    else if (parsed.cues && missing) {
      builder.intent = applyParsed(builder.intent, parsed, { gear: builder.gear, defaults: startIntent() });
      builder.asking = missing;
      say(builder, t(state, missing === 'level' ? 'builder.askLevel' : 'builder.askElement'));
    }
    else if (!parsed.cues) say(builder, t(state, 'builder.unknown'));
    else if (needs.includes(parsed.action) && !builder.ids && !(parsed.action === 'undo' && builder.history.length) && Object.keys(parsed.patch).length === 0) say(builder, t(state, 'builder.needBuild'));
    else if (parsed.action === 'undo') {
      const last = builder.history.pop();
      if (last) { builder.ids = last.ids; builder.intent = last.intent; }
      say(builder, t(state, last ? 'builder.undone' : 'builder.noUndo'));
    } else if (parsed.action === 'explain') say(builder, explain(state, parsed.slots));
    else if (parsed.action === 'cost' && !Object.keys(parsed.patch).length) say(builder, costReply(state));
    else if (parsed.action === 'save') { saveBuild(state); say(builder, t(state, 'builder.saved')); }
    else {
      if (parsed.action === 'reroll' && builder.ids) {
        // Outra opção de verdade: evita parte das peças principais do set atual.
        const heavy = builder.ids.filter((id, index) => id && ['hat', 'cloak', 'amulet', 'belt', 'boots'].includes(SLOTS[index]) && !builder.intent.locked.includes(id));
        parsed.banNames.push(...heavy.slice(0, 3)); builder.seed += 1;
      }
      if (builder.ids) parsed.currentStats = describe(state, builder.ids, builder.intent).stats;
      const intent = applyParsed(builder.intent, parsed, { gear: builder.gear, ids: builder.ids, defaults: startIntent() });
      await rebuild(state, intent, parsed, emit);
    }
  } finally {
    builder.busy = false;
    persistBuilder(builder);
    emit();
  }
}

export function toggleLock(state, id) {
  const intent = state.builder.intent;
  intent.locked = intent.locked.includes(id) ? intent.locked.filter(other => other !== id) : [...intent.locked, id];
  persistBuilder(state.builder);
}

export async function banItem(state, id, emit) {
  const builder = state.builder; if (builder.busy) return;
  builder.busy = true; builder.progress = 0; emit();
  try {
    const intent = structuredClone(builder.intent);
    intent.banned = [...new Set([...intent.banned, id])]; intent.locked = builder.ids.filter(other => other && other !== id); intent.temporaryLocks = true;
    await rebuild(state, intent, { action: null }, emit);
  } finally { builder.busy = false; persistBuilder(builder); emit(); }
}

export function swapItem(state, index, id) {
  const builder = state.builder;
  remember(builder);
  const old = builder.ids[index];
  builder.ids = builder.ids.map((value, slot) => (slot === index ? id : value));
  builder.intent.locked = [...new Set([...builder.intent.locked.filter(other => other !== old), id])];
  builder.showSwaps = false;
  persistBuilder(builder);
}

export function slotAlternatives(state, index) {
  const { gear, ids, intent, swapQuery, swapStat } = state.builder;
  const query = normalizeText(swapQuery);
  const match = query ? item => item.n.some(name => normalizeText(name).includes(query)) : null;
  return alternatives(gear, ids, withOwned(state, intent), index, query || swapStat ? 20 : 8, { match, stat: swapStat });
}
export function openSaved(state, id) { const builder = state.builder; const row = builder.saved.find(item => item.id === id); if (!row) return; remember(builder); builder.ids = [...row.ids]; builder.intent = structuredClone(row.intent); builder.selected = null; builder.dirty = false; builder.savedId = row.id; builder.saveName = row.name; persistBuilder(builder); }
export function deleteSaved(state, id) { if (state.builder.savedId === id) state.builder.savedId = ''; state.builder.saved = state.builder.saved.filter(item => item.id !== id); persistBuilder(state.builder); }
// Limpa conversa e set, mantendo os salvos. "Desfazer" ainda traz o set de volta.
export function startOver(state) {
  const builder = state.builder;
  remember(builder);
  Object.assign(builder, { ids: null, intent: startIntent(), messages: [], asking: null, known: null, selected: null, showSwaps: false, dirty: false, input: '', saveName: '', savedId: '', swapQuery: '', swapStat: '', seed: 7 });
  persistBuilder(builder);
}

// Muda uma linha de um item. Valor vazio volta ao natural. Só um exo de PA, PM e alcance por personagem.
export function setForge(state, id, key, value) {
  const builder = state.builder; const item = builder.gear.item(id);
  if (!isForgeable(item) || !FORGE_STATS.includes(key)) return null;
  const forge = structuredClone(builder.intent.forge);
  const row = { ...(forge[id] || {}) };
  if (value === null) delete row[key];
  else {
    row[key] = Math.max(Math.min(0, value), Math.min(forgeLimit(item, key), Math.trunc(value)));
    if (UNIQUE_EXOS.includes(key) && row[key] > 0 && isExo(item, key)) {
      row[key] = 1;
      for (const other of Object.keys(forge)) if (Number(other) !== id && builder.gear.item(Number(other)) && isExo(builder.gear.item(Number(other)), key)) { delete forge[other][key]; if (!Object.keys(forge[other]).length) delete forge[other]; }
    }
    if (row[key] === 0 && isExo(item, key)) delete row[key];
  }
  if (Object.keys(row).length) forge[id] = row; else delete forge[id];
  builder.intent.forge = forge;
  persistBuilder(builder);
  return row[key] ?? null;
}
export function clearForge(state, id) { delete state.builder.intent.forge[id]; persistBuilder(state.builder); }

function forgeFromChat(state, { slot, nth, clear, kind, rows }) {
  const builder = state.builder; const tr = (key, vars) => t(state, `builder.${key}`, vars);
  const ids = builder.ids.filter((id, index) => id && SLOTS[index] === slot);
  const id = ids[Math.min(nth, ids.length - 1)]; const item = id ? builder.gear.item(id) : null;
  if (!isForgeable(item)) return tr('forgeNo', { name: item ? itemName(item, state.language) : tr(`slot.${slot}`) });
  const before = describe(state, builder.ids, builder.intent);
  remember(builder);
  const done = [];
  if (clear && !rows.length) { clearForge(state, id); done.push(tr('forgeCleared')); }
  for (const { key, value } of rows) {
    if (clear) { setForge(state, id, key, null); done.push(`${tr(`stat.${key}`)}: ${tr('natural')}`); continue; }
    const max = naturalMax(item, key);
    // "over de 20" soma ao máximo; "exo 20" é o valor da linha nova.
    const wanted = kind === 'over' ? max + (value || (max ? Math.max(1, Math.round(max * 0.1)) : 1)) : value || (UNIQUE_EXOS.includes(key) ? max + 1 : forgeLimit(item, key) > 20 ? 10 : 1);
    const set = setForge(state, id, key, wanted);
    done.push(`${set ?? 0} ${tr(`stat.${key}`)}${set !== null && set < wanted ? ` (${tr('forgeMax')})` : ''}`);
  }
  const after = describe(state, builder.ids, builder.intent);
  return `${tr('forgeDone', { name: itemName(item, state.language), list: done.join(', ') })}\n${tr('delta', { damage: signed(Math.round((after.damage / before.damage - 1) * 100), '%'), hp: signed(after.hp - before.hp) })} ${tr('nowHas', { ap: after.capped.ap, mp: after.capped.mp, range: after.capped.range })}`;
}

// Opções visuais. O set atual é recalculado na hora; remontar fica a critério da pessoa.
export function setBuilderOption(state, field, value) {
  const builder = state.builder; const intent = builder.intent;
  if (field === 'breed') intent.breed = Number(value) || 0;
  else if (field === 'level') { const level = Math.min(200, Math.max(1, Math.trunc(Number(value)) || 1)); if (level !== intent.level) { intent.level = level; if (!intent.customTargets) intent.targets = defaultTargets(level); } }
  else if (field.startsWith('points-')) { const key = field.slice(7); if (!POINT_STATS.includes(key)) return; const points = { ...intent.points }; if (String(value).trim() === '') delete points[key]; else points[key] = Math.max(0, Math.min((intent.level - 1) * 5, Math.trunc(Number(value)) || 0)); intent.points = points; }
  else if (field === 'scroll') intent.scroll = String(value).trim() === '' ? null : Math.min(100, Math.max(0, Math.trunc(Number(value)) || 0));
  else if (field.startsWith('exo-')) { const key = field.slice(4); if (UNIQUE_EXOS.includes(key)) intent.exo = { ...intent.exo, [key]: !intent.exo[key] }; }
  else if (field === 'element') { const has = intent.elements.includes(value); intent.elements = has ? intent.elements.filter(item => item !== value) : [...intent.elements, value]; if (!intent.elements.length) intent.elements = [value]; }
  else if (field === 'roll') intent.roll = intent.roll === 'max' ? 'average' : 'max';
  else if (['noCrit', 'noDofus', 'craftable'].includes(field)) intent[field] = !intent[field];
  else if (['ap', 'mp', 'range'].includes(field)) { const cap = field === 'ap' ? 12 : 6; const number = Math.min(cap, Math.max(0, Math.trunc(Number(value)) || 0)); intent.targets = { ...intent.targets, [field]: number }; if (!number) delete intent.targets[field]; intent.customTargets = true; }
  else return;
  builder.dirty = Boolean(builder.ids);
  persistBuilder(builder);
}

export async function rebuildWithOptions(state, emit) {
  const builder = state.builder; if (builder.busy || !builder.gear) return;
  builder.busy = true; builder.progress = 0; emit();
  try { await rebuild(state, structuredClone(builder.intent), { action: null }, emit); } finally { builder.busy = false; persistBuilder(builder); emit(); }
}

export function saveCurrent(state) { saveBuild(state); persistBuilder(state.builder); }
