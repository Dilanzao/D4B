import { alternatives, defaultIntent, describeBuild, optimize } from './buildEngine.js';
import { applyParsed, defaultTargets, parseMessage } from './chatParser.js';
import { LANGUAGES, SLOTS, SLOT_OF_TYPE, itemName } from './gearSchema.js';
import { t } from '../../components/common.js';
import { formatKamas, formatNumber } from '../../utils/currency.js';

export const BUILDER_KEY = 'd4b_builder_v1';
export const BUILDS_KEY = 'd4b_builds_v1';

const startIntent = () => ({ ...defaultIntent(), targets: defaultTargets(200) });
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* cheio ou bloqueado */ } };
const cleanIds = ids => SLOTS.map((_, index) => Number(ids?.[index]) || null);
const list = value => (Array.isArray(value) ? value.map(Number).filter(Boolean) : []);

function cleanIntent(raw) {
  const base = startIntent();
  if (!raw || typeof raw !== 'object') return base;
  const numbers = value => Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {}).filter(([key, item]) => /^[a-zA-Z]+$/.test(key) && Number.isFinite(item)));
  return { ...base, level: Math.min(200, Math.max(1, Math.trunc(Number(raw.level) || 200))), elements: (Array.isArray(raw.elements) ? raw.elements : base.elements).filter(item => ['strength', 'intelligence', 'chance', 'agility'].includes(item)),
    damage: Number(raw.damage) || base.damage, survival: Number(raw.survival) || base.survival, extras: numbers(raw.extras), targets: numbers(raw.targets), customTargets: Boolean(raw.customTargets), noCrit: Boolean(raw.noCrit), craftable: Boolean(raw.craftable), noDofus: Boolean(raw.noDofus), preferOwned: Boolean(raw.preferOwned),
    roll: raw.roll === 'max' ? 'max' : 'average', distance: ['melee', 'ranged'].includes(raw.distance) ? raw.distance : 'any', className: String(raw.className || '').slice(0, 30), locked: list(raw.locked), banned: list(raw.banned) };
}

export function createBuilderState() {
  const saved = read(BUILDER_KEY, {});
  const builds = read(BUILDS_KEY, []);
  return { status: 'idle', gear: null, busy: false, input: '', swapIndex: null, history: [], seed: 7, ids: Array.isArray(saved?.ids) ? cleanIds(saved.ids) : null, intent: cleanIntent(saved?.intent),
    messages: (Array.isArray(saved?.messages) ? saved.messages : []).slice(-30).map(item => ({ role: item?.role === 'user' ? 'user' : 'bot', text: String(item?.text || '').slice(0, 4000) })),
    saved: (Array.isArray(builds) ? builds : []).map(item => ({ id: String(item?.id || '').replace(/[^\w-]/g, ''), name: String(item?.name || '').slice(0, 120), ids: cleanIds(item?.ids), intent: cleanIntent(item?.intent) })) };
}

export function persistBuilder(builder) {
  write(BUILDER_KEY, { ids: builder.ids, intent: builder.intent, messages: builder.messages.slice(-30) });
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

const langIndex = state => Math.max(0, LANGUAGES.indexOf(state.language));
const signed = (value, suffix = '') => `${value >= 0 ? '+' : '−'}${Math.abs(value)}${suffix}`;
const percent = (state, value) => `${value >= 0 ? '+' : '−'}${formatNumber(Math.abs(value), state.language, 1)}%`;
const ownedIds = state => (state.craftInventory || []).filter(item => item.quantity > 0).map(item => Number(item.ankamaId)).filter(Boolean);
const withOwned = (state, intent) => ({ ...intent, ownedIds: ownedIds(state) });

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
  if (intent.className) parts.push(tr('className', { value: intent.className }));
  return parts.join(', ');
}

export function currentBuild(state) {
  const { gear, ids, intent } = state.builder;
  return gear && ids ? describeBuild(gear, ids, intent) : null;
}

function buildReply(state, before, build, result, parsed) {
  const { gear, intent } = state.builder;
  const tr = (key, vars) => t(state, `builder.${key}`, vars);
  const number = value => formatNumber(value, state.language);
  const name = id => { const item = gear.item(id); return item ? itemName(item, state.language) : String(id); };
  const lines = [tr('understood', { list: describeIntent(state, intent) }), tr('built', { ap: build.capped.ap, mp: build.capped.mp, range: build.capped.range, hp: number(build.hp), damage: number(Math.round(build.damage)), res: number(Math.round(build.res)) })];
  if (before) lines.push(before.same ? tr('same') : tr('delta', { damage: signed(Math.round((build.damage / before.damage - 1) * 100), '%'), hp: signed(build.hp - before.hp) }));
  if (build.missing.length) lines.push(tr('missing', { list: build.missing.map(row => `${tr(`stat.${row.key}`)} ${row.got}/${row.want}`).join(', ') }));
  if (build.broken.length) lines.push(tr('broken', { list: build.broken.map(name).join(', ') }));
  if (result.rejected?.length) lines.push(tr('rejected', { list: result.rejected.slice(0, 6).map(name).join(', ') }));
  if (parsed?.notes?.includes('budget')) lines.push(tr('budget'));
  return lines.join('\n');
}

function explain(state, slots) {
  const { gear, ids, intent } = state.builder;
  const now = describeBuild(gear, ids, intent);
  const lines = ids.map((id, index) => {
    if (!id || (slots.length && !slots.includes(SLOTS[index]))) return null;
    const without = [...ids]; without[index] = null;
    const other = describeBuild(gear, without, intent);
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

function saveBuild(state) {
  const builder = state.builder;
  const intent = builder.intent;
  const name = `${t(state, 'builder.level', { value: intent.level })} · ${intent.elements.map(key => t(state, `builder.stat.${key}`)).join(' + ') || t(state, 'builder.hp')}`;
  builder.saved = [{ id: `build-${Date.now().toString(36)}`, name: name.charAt(0).toUpperCase() + name.slice(1), ids: [...builder.ids], intent: structuredClone(intent) }, ...builder.saved].slice(0, 40);
}

const remember = builder => { if (builder.ids) builder.history = [...builder.history, { ids: [...builder.ids], intent: structuredClone(builder.intent) }].slice(-20); };
const say = (builder, text) => { builder.messages.push({ role: 'bot', text }); };

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
  const previous = builder.ids && parsed.action !== 'reset' && intent.level === builder.intent.level ? describeBuild(gear, builder.ids, intent) : null;
  const oldIds = builder.ids;
  remember(builder);
  // As travas de "troca o anel" valem só para esta montagem.
  const temporary = intent.temporaryLocks; delete intent.temporaryLocks;
  const permanent = temporary ? builder.intent.locked.filter(id => !intent.banned.includes(id)) : intent.locked;
  const result = await optimize(gear, withOwned(state, intent), { seed: builder.seed, start: parsed.action === 'reset' ? null : builder.ids, onProgress: value => { builder.progress = Math.round(value * 100); const node = document.querySelector('[data-builder-progress]'); if (node) node.textContent = `${builder.progress}%`; } });
  builder.ids = result.ids; builder.asking = null; builder.known = null;
  builder.intent = { ...intent, locked: permanent.filter(id => !result.rejected.includes(id)) };
  const build = describeBuild(gear, builder.ids, builder.intent);
  say(builder, buildReply(state, previous ? { damage: previous.damage, hp: previous.hp, same: oldIds.join() === result.ids.join() } : null, build, result, parsed));
  emit();
}

export async function sendBuilderMessage(state, message, emit) {
  const builder = state.builder; const text = String(message || '').trim().slice(0, 500);
  if (!text || builder.busy || !builder.gear) return;
  builder.input = ''; builder.swapIndex = null;
  builder.messages.push({ role: 'user', text });
  const needs = ['stat', 'undo', 'explain', 'cost', 'save', 'reroll', 'keep-slot', 'swap-slot'];
  builder.busy = true; builder.progress = 0;
  emit();
  try {
    const parsed = parseMessage(text, builder.gear, langIndex(state), builder.ids);
    const missing = builder.ids || parsed.action ? null : missingInfo(builder, parsed);
    if (['help', 'greet', 'thanks'].includes(parsed.action)) say(builder, t(state, `builder.${parsed.action}`));
    else if (parsed.action === 'stat' && builder.ids) say(builder, statReply(state, parsed.stat));
    else if (parsed.cues && missing) {
      builder.intent = applyParsed(builder.intent, parsed, { gear: builder.gear, defaults: startIntent() });
      builder.asking = missing;
      say(builder, t(state, missing === 'level' ? 'builder.askLevel' : 'builder.askElement'));
    }
    else if (!parsed.cues) say(builder, t(state, 'builder.unknown'));
    else if (needs.includes(parsed.action) && !builder.ids && Object.keys(parsed.patch).length === 0) say(builder, t(state, 'builder.needBuild'));
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
      if (builder.ids) parsed.currentStats = describeBuild(builder.gear, builder.ids, builder.intent).stats;
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
  builder.swapIndex = null;
  persistBuilder(builder);
}

export const slotAlternatives = (state, index) => alternatives(state.builder.gear, state.builder.ids, withOwned(state, state.builder.intent), index);
export function openSaved(state, id) { const builder = state.builder; const row = builder.saved.find(item => item.id === id); if (!row) return; remember(builder); builder.ids = [...row.ids]; builder.intent = structuredClone(row.intent); builder.swapIndex = null; persistBuilder(builder); }
export function deleteSaved(state, id) { state.builder.saved = state.builder.saved.filter(item => item.id !== id); persistBuilder(state.builder); }
export function saveCurrent(state) { saveBuild(state); persistBuilder(state.builder); }
