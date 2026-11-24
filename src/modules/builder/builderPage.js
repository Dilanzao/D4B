import { creatureCatalog } from '../../data/creatures.js';
import { escapeHtml, icon, t } from '../../components/common.js';
import { renderDisclosure, renderPageHead } from '../../components/pageLayout.js';
import { formatKamas, formatNumber } from '../../utils/currency.js';
import { buildCost, currentBuild, slotAlternatives } from './builderController.js';
import { normalizeText } from './chatParser.js';
import { LANGUAGES, PET_TYPES, SLOTS, itemImage, itemName } from './gearSchema.js';

const STAT_ROWS = ['strength', 'intelligence', 'chance', 'agility', 'vitality', 'wisdom', 'power', 'damage', 'earthDamage', 'fireDamage', 'waterDamage', 'airDamage', 'critical', 'criticalDamage', 'initiative', 'prospecting', 'lock', 'dodge', 'heals', 'summons', 'apParry', 'mpParry', 'apReduction', 'mpReduction', 'pushDamage', 'neutralRes', 'earthRes', 'fireRes', 'waterRes', 'airRes', 'criticalRes', 'pushRes'];
const PERCENT = new Set(['critical', 'neutralRes', 'earthRes', 'fireRes', 'waterRes', 'airRes']);
// O catálogo de pets usa o número do ícone; alguns ícones se repetem, por isso o nome vem primeiro.
export const petCreature = item => creatureCatalog.find(creature => [0, 1, 2, 3].some(index => normalizeText(creature.names?.[LANGUAGES[index]]) === normalizeText(item.n[index]))) || creatureCatalog.find(creature => creature.id.startsWith(`item-${item.p}-`)) || null;

const tone = value => (value > 0 ? 'positive' : value < 0 ? 'negative' : 'muted');
const signed = (value, suffix = '') => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}${suffix}`;

function chat(state, tr) {
  const { messages, busy, ids, gear, status } = state.builder;
  const asking = !ids && state.builder.asking;
  const chips = asking === 'element' ? ['stat.strength', 'stat.intelligence', 'stat.chance', 'stat.agility', 'multi', 'any'].map(key => tr(key)) : asking === 'level' ? ['60', '100', '150', '200'] : (ids ? ['more1', 'more2', 'more3', 'more4', 'more5', 'more6'] : ['ex1', 'ex2', 'ex3', 'ex4']).map(key => tr(key));
  const rows = [{ role: 'bot', text: tr('hello') }, ...messages].map(item => `<div class="chat-bubble ${item.role}">${escapeHtml(item.text)}</div>`).join('');
  const waiting = busy ? `<div class="chat-bubble bot">${escapeHtml(tr('thinking'))} <span data-builder-progress>${state.builder.progress ? `${state.builder.progress}%` : ''}</span></div>` : '';
  const notice = status === 'error' ? `<div class="notice warning">${escapeHtml(tr('loadError'))} <button type="button" class="link-button" data-action="builder-reload">${escapeHtml(t(state, 'common.retry'))}</button></div>` : !gear ? `<p class="muted small">${escapeHtml(tr('loading'))}…</p>` : '';
  return `<article class="card builder-chat" aria-label="${escapeHtml(tr('chat'))}"><div class="chat-log" data-scroll-key="builder-chat" data-builder-log role="log" aria-live="polite" tabindex="0">${rows}${waiting}</div>${notice}
    <div class="chat-chips">${chips.map(text => `<button type="button" class="filter-chip" data-action="builder-send" data-text="${escapeHtml(text)}" ${busy || !gear ? 'disabled' : ''}>${escapeHtml(text)}</button>`).join('')}</div>
    <form class="chat-form" data-form="builder"><label class="visually-hidden" for="builder-input">${escapeHtml(tr('placeholder'))}</label><input class="input" id="builder-input" data-builder-input maxlength="500" autocomplete="off" placeholder="${escapeHtml(tr('placeholder'))}" value="${escapeHtml(state.builder.input)}"><button class="button primary" type="submit" ${busy || !gear ? 'disabled' : ''}>${escapeHtml(tr('send'))}</button></form></article>`;
}

function swaps(state, tr, index) {
  const rows = slotAlternatives(state, index).map(row => `<li><img src="${itemImage(row.item)}" alt="" width="40" height="40" loading="lazy" onerror="this.style.visibility='hidden'"><span><strong>${escapeHtml(itemName(row.item, state.language))}</strong><small><span class="${tone(row.damage)}">${escapeHtml(tr('damage'))} ${`${row.damage > 0 ? '+' : row.damage < 0 ? '−' : ''}${formatNumber(Math.abs(row.damage), state.language, 1)}%`}</span> · <span class="${tone(row.hp)}">${escapeHtml(tr('hp'))} ${signed(row.hp)}</span>${row.ap ? ` · <span class="${tone(row.ap)}">${signed(row.ap)} ${escapeHtml(tr('stat.ap'))}</span>` : ''}${row.mp ? ` · <span class="${tone(row.mp)}">${signed(row.mp)} ${escapeHtml(tr('stat.mp'))}</span>` : ''}${row.broken ? ` · <span class="negative">${escapeHtml(tr('conditionBroken'))}</span>` : ''}</small></span><button type="button" class="button secondary compact" data-action="builder-use" data-index="${index}" data-id="${row.item.i}">${escapeHtml(tr('use'))}</button></li>`).join('');
  return `<div class="builder-swaps"><div class="section-head"><h3>${escapeHtml(tr('alternatives', { name: tr(`slot.${SLOTS[index]}`) }))}</h3><button type="button" class="icon-button" data-action="builder-swap" data-index="${index}" aria-label="${escapeHtml(tr('close'))}">${icon('close', 16)}</button></div>${rows ? `<ul>${rows}</ul>` : `<p class="muted small">${escapeHtml(t(state, 'common.noResults'))}</p>`}</div>`;
}

function slotCard(state, tr, build, index) {
  const slot = SLOTS[index]; const item = build.items[index];
  const selected = state.builder.swapIndex === index;
  const disabled = state.builder.busy ? 'disabled' : '';
  const action = (name, iconName, label, cls = '') => `<button type="button" class="icon-button ${cls}" data-action="${name}" data-index="${index}" ${item ? `data-id="${item.i}"` : ''} title="${escapeHtml(label)}" aria-label="${escapeHtml(item ? `${label}: ${itemName(item, state.language)}` : label)}" ${disabled}>${icon(iconName, 15)}</button>`;
  if (!item) return `<div class="gear-slot empty ${selected ? 'selected' : ''}"><div><small>${escapeHtml(tr(`slot.${slot}`))}</small><strong>${escapeHtml(tr('empty'))}</strong></div><span class="gear-actions">${action('builder-swap', 'sync', tr('swap'))}</span></div>`;
  const locked = state.builder.intent.locked.includes(item.i);
  const name = itemName(item, state.language);
  const owned = (state.craftInventory || []).some(row => row.quantity > 0 && Number(row.ankamaId) === item.i);
  const set = build.sets.find(row => row.set.i === item.s);
  const badges = [owned ? `<span class="badge green">${escapeHtml(tr('inStock'))}</span>` : '', set ? `<span class="badge blue">${escapeHtml(itemName(set.set, state.language))}</span>` : '', build.broken.includes(item.i) ? `<span class="badge red">${escapeHtml(tr('conditionBroken'))}</span>` : ''].join('');
  const link = PET_TYPES.has(item.t) && petCreature(item) ? action('builder-pet', 'heart', tr('pet')) : item.r ? action('builder-craft', 'craft', tr('craft')) : '';
  return `<div class="gear-slot ${selected ? 'selected' : ''} ${locked ? 'locked' : ''}"><img src="${itemImage(item)}" alt="" width="52" height="52" loading="lazy" onerror="this.onerror=null;this.src='/assets/placeholders/item-fallback.svg'"><div><small>${escapeHtml(tr(`slot.${slot}`))} · ${escapeHtml(t(state, 'simulation.levelShort'))} ${item.l}</small><strong>${escapeHtml(name)}${item.x ? ` <span title="${escapeHtml(tr('passive'))}" aria-label="${escapeHtml(tr('passive'))}">✦</span>` : ''}</strong>${badges}</div>
    <span class="gear-actions">${action('builder-lock', 'lock', tr(locked ? 'unlock' : 'lock'), locked ? 'gold' : '')}${action('builder-swap', 'sync', tr('swap'))}${action('builder-ban', 'close', tr('ban'))}${link}</span></div>`;
}

function result(state, tr) {
  const build = currentBuild(state);
  if (!build) return '';
  const { ids, swapIndex, gear } = state.builder;
  const number = value => formatNumber(value, state.language);
  const cost = buildCost(state, ids);
  const main = [[tr('stat.ap'), build.capped.ap], [tr('stat.mp'), build.capped.mp], [tr('stat.range'), build.capped.range], [tr('hp'), number(build.hp)], [tr('damage'), number(Math.round(build.damage))], [tr('res'), `${number(Math.round(build.res))}%`]];
  const stats = STAT_ROWS.filter(key => build.stats[key]).map(key => `<div><dt>${escapeHtml(tr(`stat.${key}`))}</dt><dd>${number(build.stats[key])}${PERCENT.has(key) ? '%' : ''}</dd></div>`).join('');
  const sets = build.sets.map(row => `<span class="badge blue">${escapeHtml(itemName(row.set, state.language))} · ${row.count}/${row.set.m.length}</span>`).join(' ');
  return `<article class="card section stack-tight"><div class="builder-main">${main.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>
    ${sets ? `<div class="builder-sets"><span class="muted small">${escapeHtml(tr('sets'))}</span> ${sets}</div>` : ''}
    <div class="section-head"><h2>${escapeHtml(tr('items'))}</h2><button type="button" class="button secondary compact" data-action="builder-save">${icon('check', 15)} ${escapeHtml(tr('save'))}</button></div>
    <div class="gear-grid">${SLOTS.map((_, index) => slotCard(state, tr, build, index) + (swapIndex === index ? swaps(state, tr, index) : '')).join('')}</div>
    ${cost.total ? `<p class="builder-cost"><span>${escapeHtml(tr('materials'))}: <strong>${cost.known ? formatKamas(cost.cost, state.language) : '—'}</strong></span> <small class="muted">${escapeHtml(tr('known', { known: cost.known, total: cost.total }))}</small></p>` : ''}
    ${renderDisclosure(state, 'builder-stats', tr('stats'), `<dl class="builder-stats">${stats}</dl>`, { open: true })}
    <p class="muted small">${escapeHtml(tr('assumptions'))} ${escapeHtml(tr('badge', { version: gear.version }))}.</p></article>`;
}

export function renderBuilderPage(state) {
  const tr = (key, vars) => t(state, `builder.${key}`, vars);
  const { saved, ids } = state.builder;
  const mine = saved.length ? renderDisclosure(state, 'builder-saved', `${tr('mySets')} (${saved.length})`, `<ul class="builder-saved">${saved.map(row => `<li><strong>${escapeHtml(row.name)}</strong><span class="icon-actions"><button type="button" class="button ghost compact" data-action="builder-open" data-id="${escapeHtml(row.id)}">${escapeHtml(tr('open'))}</button><button type="button" class="icon-button danger" data-action="builder-delete" data-id="${escapeHtml(row.id)}" aria-label="${escapeHtml(`${t(state, 'common.delete')}: ${row.name}`)}">${icon('trash', 15)}</button></span></li>`).join('')}</ul>`) : '';
  return `<section class="stack">${renderPageHead(state, { title: tr('title'), description: tr('intro') })}<div class="builder-layout ${ids ? '' : 'solo'}"><div class="stack builder-side">${chat(state, tr)}${mine}</div>${result(state, tr)}</div></section>`;
}
