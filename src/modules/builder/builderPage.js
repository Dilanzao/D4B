import { creatureCatalog } from '../../data/creatures.js';
import { escapeHtml, icon, t } from '../../components/common.js';
import { renderDisclosure, renderPageHead } from '../../components/pageLayout.js';
import { formatKamas, formatNumber } from '../../utils/currency.js';
import { bestTurn, gradeFor, scrollOf, testSpell } from './buildEngine.js';
import { buildCost, currentBreed, currentBuild, slotAlternatives } from './builderController.js';
import { normalizeText } from './chatParser.js';
import { FORGE_STATS, LANGUAGES, PET_TYPES, SET_BONUS_ID, SLOTS, STAT, UNIQUE_EXOS, breedImage, forgeLimit, isExo, isForgeable, itemImage, itemLines, itemName, spellImage } from './gearSchema.js';
import { statIcon } from './statIcons.js';

const GROUPS = [
  ['groupMain', ['vitality', 'wisdom', 'strength', 'intelligence', 'chance', 'agility', 'power']],
  ['groupDamage', ['damage', 'neutralDamage', 'earthDamage', 'fireDamage', 'waterDamage', 'airDamage', 'critical', 'criticalDamage', 'spellDamage', 'meleeDamage', 'rangedDamage', 'weaponDamage', 'pushDamage', 'trapDamage', 'trapPower']],
  ['groupRes', ['neutralRes', 'earthRes', 'fireRes', 'waterRes', 'airRes', 'neutralFlat', 'earthFlat', 'fireFlat', 'waterFlat', 'airFlat', 'meleeRes', 'rangedRes', 'criticalRes', 'pushRes']],
  ['groupUtility', ['initiative', 'prospecting', 'lock', 'dodge', 'heals', 'summons', 'apParry', 'mpParry', 'apReduction', 'mpReduction', 'reflect', 'pods']]
];
const PERCENT = new Set(['critical', 'neutralRes', 'earthRes', 'fireRes', 'waterRes', 'airRes', 'spellDamage', 'meleeDamage', 'rangedDamage', 'weaponDamage', 'meleeRes', 'rangedRes']);
const ELEMENT_KEYS = ['strength', 'intelligence', 'chance', 'agility'];
const KEY_OF_ID = Object.fromEntries(Object.entries(STAT).map(([key, id]) => [id, key]));
// Posição de cada espaço em volta do emblema, de cima para baixo.
const LEFT = [0, 2, 7, 3, 5]; const RIGHT = [1, 8, 4, 6, 9]; const BOTTOM = [10, 11, 12, 13, 14, 15];
const TABS = ['stats', 'sets', 'passives', 'spells'];
// O catálogo de pets usa o número do ícone; alguns ícones se repetem, por isso o nome vem primeiro.
export const petCreature = item => creatureCatalog.find(creature => [0, 1, 2, 3].some(index => normalizeText(creature.names?.[LANGUAGES[index]]) === normalizeText(item.n[index]))) || creatureCatalog.find(creature => creature.id.startsWith(`item-${item.p}-`)) || null;

const tone = value => (value > 0 ? 'positive' : value < 0 ? 'negative' : 'muted');
const lang = state => Math.max(0, LANGUAGES.indexOf(state.language));
const signed = (state, value, suffix = '', digits = 0) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), state.language, digits)}${suffix}`;
const statName = (tr, key) => tr(`stat.${key}`).replace(/^%\s*/, '').replace(/^./, first => first.toUpperCase());
const brokenImage = "this.onerror=null;this.src='/assets/placeholders/item-fallback.svg'";
const picture = (src, size, cls = '') => `<img class="${cls}" src="${src}" alt="" width="${size}" height="${size}" loading="lazy" onerror="${brokenImage}">`;

// Uma característica por linha: ícone, nome e valor.
function statRow(state, tr, key, value, extra = '', cls = '') {
  const text = typeof value === 'number' ? `${value < 0 ? '−' : ''}${formatNumber(Math.abs(value), state.language)}${PERCENT.has(key) ? '%' : ''}` : value;
  return `<li class="stat-row ${typeof value === 'number' && value < 0 ? 'negative' : ''} ${cls}">${statIcon(key)}<span>${escapeHtml(statName(tr, key))}${extra}</span><b>${text}</b></li>`;
}
function effectRows(state, tr, effects) {
  const rows = [];
  for (let i = 0; i < effects.length; i += 3) rows.push(statRow(state, tr, KEY_OF_ID[effects[i]], effects[i + 1]));
  return `<ul class="stat-list">${rows.join('')}</ul>`;
}
// Cada efeito passivo em seu parágrafo.
function passiveLines(text) {
  return `<ul class="passive-lines">${String(text).split('\n').map(line => line.trim()).filter(Boolean).map(line => `<li class="${line.startsWith('•') ? 'point' : 'title'}">${escapeHtml(line.replace(/^•\s*/, ''))}</li>`).join('')}</ul>`;
}

function bubble(state, tr, item) {
  if (item.role === 'user') return `<div class="chat-bubble user">${escapeHtml(item.text)}</div>`;
  const tags = item.tags?.length ? `<ul class="chat-tags">${item.tags.map(tag => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>` : '';
  const figures = item.stats ? `<ul class="chat-stats">${[['ap', item.stats.ap], ['mp', item.stats.mp], ['range', item.stats.range], ['hp', formatNumber(item.stats.hp, state.language)], ['damageAll', formatNumber(item.stats.damage, state.language)], ['res', `${item.stats.res}%`]].map(([key, value]) => `<li title="${escapeHtml(tr(key === 'damageAll' ? 'damage' : key === 'hp' || key === 'res' ? key : `stat.${key}`))}">${statIcon(key, 18)}<b>${value}</b></li>`).join('')}</ul>` : '';
  const body = item.text ? item.text.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('') : '';
  return `<div class="chat-bubble bot">${tags}${figures}${body}</div>`;
}

function chat(state, tr) {
  const { messages, busy, ids, gear, status } = state.builder;
  const asking = !ids && state.builder.asking;
  const chips = asking === 'element' ? ['stat.strength', 'stat.intelligence', 'stat.chance', 'stat.agility', 'multi', 'any'].map(key => tr(key)) : asking === 'level' ? ['60', '100', '150', '200'] : (ids ? ['more1', 'more2', 'more3', 'more4', 'more5', 'more6'] : ['ex1', 'ex2', 'ex3', 'ex4']).map(key => tr(key));
  const rows = [{ role: 'bot', text: tr('hello') }, ...messages].map(item => bubble(state, tr, item)).join('');
  const waiting = busy ? `<div class="chat-bubble bot"><p>${escapeHtml(tr('thinking'))} <span data-builder-progress>${state.builder.progress ? `${state.builder.progress}%` : ''}</span></p></div>` : '';
  const notice = status === 'error' ? `<div class="notice warning">${escapeHtml(tr('loadError'))} <button type="button" class="link-button" data-action="builder-reload">${escapeHtml(t(state, 'common.retry'))}</button></div>` : !gear ? `<p class="muted small">${escapeHtml(tr('loading'))}…</p>` : '';
  return `<article class="card builder-chat" aria-label="${escapeHtml(tr('chat'))}"><header><h2>${escapeHtml(tr('chat'))}</h2>${ids || messages.length ? `<button type="button" class="button ghost compact" data-action="builder-new" ${busy ? 'disabled' : ''}>${icon('refresh', 15)} ${escapeHtml(tr('newChat'))}</button>` : ''}</header>
    <div class="chat-log" data-scroll-key="builder-chat" data-builder-log role="log" aria-live="polite" tabindex="0">${rows}${waiting}</div>${notice}
    <div class="chat-chips" tabindex="-1">${chips.map(text => `<button type="button" class="chip" data-action="builder-send" data-text="${escapeHtml(text)}" ${busy || !gear ? 'disabled' : ''}>${escapeHtml(text)}</button>`).join('')}</div>
    <form class="chat-form" data-form="builder"><label class="visually-hidden" for="builder-input">${escapeHtml(tr('placeholder'))}</label><input class="input" id="builder-input" data-builder-input maxlength="500" autocomplete="off" placeholder="${escapeHtml(tr('placeholder'))}" value="${escapeHtml(state.builder.input)}"><button class="button primary" type="submit" ${busy || !gear ? 'disabled' : ''}>${escapeHtml(tr('send'))}</button></form></article>`;
}

// Opções do personagem: tudo que o chat entende também pode ser visto e mudado aqui.
function options(state, tr) {
  const { intent, breeds, pickBreed, ids, busy, gear, dirty } = state.builder;
  const breed = currentBreed(state.builder);
  const off = busy ? 'disabled' : '';
  const toggle = (field, label, on, value = '', iconKey = '') => `<button type="button" class="toggle ${on ? 'on' : ''}" aria-pressed="${on}" data-action="builder-option" data-field="${field}" data-value="${value}" ${off}>${iconKey ? statIcon(iconKey, 18) : ''}<span>${escapeHtml(label)}</span></button>`;
  const number = (field, label, value, max, iconHtml, placeholder = '') => `<label class="option-line">${iconHtml}<span>${escapeHtml(label)}</span><input class="input" type="number" min="0" max="${max}" inputmode="numeric" data-builder-option="${field}" data-id="${field}" value="${value}" placeholder="${placeholder}" ${off}></label>`;
  const group = (label, body) => `<fieldset class="option-group"><legend>${escapeHtml(label)}</legend>${body}</fieldset>`;
  const grid = pickBreed ? `<div class="breed-grid">${(breeds || []).map(row => `<button type="button" class="${row.i === intent.breed ? 'active' : ''}" aria-pressed="${row.i === intent.breed}" data-action="builder-option" data-field="breed" data-value="${row.i}">${picture(breedImage(row.i), 44)}<span>${escapeHtml(itemName(row, state.language))}</span></button>`).join('')}</div>` : '';
  const body = `<button type="button" class="breed-button" data-action="builder-pick-breed" aria-expanded="${pickBreed}">${breed ? picture(breedImage(breed.i), 40) : icon('user', 26)}<span><small>${escapeHtml(tr('breed'))}</small><strong>${escapeHtml(breed ? itemName(breed, state.language) : tr('chooseBreed'))}</strong></span>${icon('down', 16)}</button>${grid}
    ${group(tr('profile'), `${number('level', tr('levelLabel'), intent.level, 200, icon('user', 18))}${number('scroll', tr('scrollLabel'), scrollOf(intent), 100, statIcon('wisdom', 18))}`)}
    ${group(tr('targetsLabel'), UNIQUE_EXOS.map(key => number(key, tr(`stat.${key}`), intent.targets[key] || '', key === 'ap' ? 12 : 6, statIcon(key, 18), '—')).join(''))}
    ${group(tr('elementsLabel'), `<div class="toggles">${ELEMENT_KEYS.map(key => toggle('element', tr(`stat.${key}`), intent.elements.includes(key), key, key)).join('')}</div>`)}
    ${group(tr('exoLabel'), `<div class="toggles three">${UNIQUE_EXOS.map(key => toggle(`exo-${key}`, tr(`stat.${key}`), intent.exo[key], '', key)).join('')}</div>`)}
    ${group(tr('rulesLabel'), `<div class="toggles">${toggle('roll', tr('maxRoll'), intent.roll === 'max')}${toggle('noCrit', tr('noCrit'), intent.noCrit)}${toggle('noDofus', tr('noDofus'), intent.noDofus)}${toggle('craftable', tr('craftable'), intent.craftable)}</div>`)}
    ${dirty ? `<p class="notice">${escapeHtml(tr('dirty'))}</p>` : ''}
    <button type="button" class="button ${dirty || !ids ? 'primary' : 'secondary'}" data-action="builder-build" ${busy || !gear ? 'disabled' : ''}>${icon('refresh', 16)} ${escapeHtml(tr(ids ? 'rebuild' : 'build'))}</button>`;
  // No celular, com o set pronto, as opções ficam recolhidas entre a conversa e o resultado.
  return `<article class="card section builder-options-card">${renderDisclosure(state, 'builder-options', tr('character'), body, { open: !ids || (globalThis.innerWidth || 1200) > 980 })}</article>`;
}

function slotButton(state, tr, build, index) {
  const item = build.items[index]; const slot = SLOTS[index]; const { builder } = state;
  const label = item ? `${tr(`slot.${slot}`)}: ${itemName(item, state.language)}` : `${tr(`slot.${slot}`)}: ${tr('empty')}`;
  const forged = item && (builder.intent.forge[item.i] || Object.values(build.exos).includes(item.i));
  const locked = item && builder.intent.locked.includes(item.i);
  const inSet = item && build.sets.some(row => row.set.i === item.s);
  const marks = item ? `${item.x ? '<i class="mark passive" aria-hidden="true">✦</i>' : ''}${forged ? '<i class="mark forged" aria-hidden="true">+</i>' : ''}${locked ? `<i class="mark locked" aria-hidden="true">${icon('lock', 11)}</i>` : ''}` : '';
  return `<button type="button" class="doll-slot ${builder.selected === index ? 'selected' : ''} ${item ? '' : 'empty'} ${inSet ? 'in-set' : ''} ${item && build.broken.includes(item.i) ? 'broken' : ''}" data-action="builder-select" data-index="${index}" aria-pressed="${builder.selected === index}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${item ? picture(itemImage(item), 52) : `<span>${escapeHtml(tr(`slot.${slot}`))}</span>`}${marks}</button>`;
}

function doll(state, tr, build) {
  const breed = currentBreed(state.builder);
  const column = list => `<div class="doll-column">${list.map(index => slotButton(state, tr, build, index)).join('')}</div>`;
  const big = (key, value, label) => `<li title="${escapeHtml(label)}">${statIcon(key, 30)}<b>${value}</b><small>${escapeHtml(label)}</small></li>`;
  return `<div class="doll"><div class="doll-main">${column(LEFT)}
    <div class="doll-center"><div class="emblem">${breed ? picture(breedImage(breed.i), 120) : icon('shield', 84)}</div><strong>${escapeHtml(breed ? itemName(breed, state.language) : tr('noBreed'))}</strong><small>${escapeHtml(tr('levelLabel'))} ${state.builder.intent.level}</small>
      <ul class="doll-elements">${state.builder.intent.elements.map(key => `<li title="${escapeHtml(tr(`stat.${key}`))}">${statIcon(key, 22)}</li>`).join('')}</ul></div>
    ${column(RIGHT)}</div>
    <div class="doll-bottom">${BOTTOM.map(index => slotButton(state, tr, build, index)).join('')}</div>
    <ul class="doll-points">${big('ap', build.capped.ap, tr('stat.ap'))}${big('mp', build.capped.mp, tr('stat.mp'))}${big('range', build.capped.range, tr('stat.range'))}</ul>
    <ul class="stat-list plain">${statRow(state, tr, 'hp', build.hp)}${statRow(state, tr, 'damageAll', formatNumber(Math.round(build.damage), state.language))}${statRow(state, tr, 'res', `${formatNumber(Math.round(build.res), state.language)}%`)}</ul></div>`;
}

function conditionText(tr, node) {
  if (node[0] === 'and' || node[0] === 'or') return node.slice(1).map(child => (['and', 'or'].includes(child[0]) ? `(${conditionText(tr, child)})` : conditionText(tr, child))).join(` ${tr(node[0])} `);
  const key = node[0] === SET_BONUS_ID ? 'setBonus' : KEY_OF_ID[node[0]];
  return `${key ? tr(key === 'setBonus' ? 'setBonus' : `stat.${key}`) : '?'} ${node[1]} ${node[2]}`;
}

function setBlock(state, tr, set, count) {
  const active = set.e[count];
  const others = Object.entries(set.e).filter(([tier]) => Number(tier) !== count);
  return `<section class="set-block"><header><strong>${escapeHtml(itemName(set, state.language))}</strong><span class="set-count">${count}/${set.m.length}</span></header>
    ${active ? effectRows(state, tr, active) : `<p class="muted small">${escapeHtml(tr('noBonusYet'))}</p>`}
    ${others.length ? `<details><summary>${escapeHtml(tr('allTiers'))}</summary>${others.map(([tier, effects]) => `<h5>${escapeHtml(tr('pieces', { count: tier }))}</h5>${effectRows(state, tr, effects)}`).join('')}</details>` : ''}</section>`;
}

function swaps(state, tr, index) {
  const rows = slotAlternatives(state, index).map(row => `<li>${picture(itemImage(row.item), 42)}<div><strong>${escapeHtml(itemName(row.item, state.language))}</strong><ul class="swap-effects"><li class="${tone(row.damage)}">${statIcon('damageAll', 15)}${signed(state, row.damage, '%', 1)}</li><li class="${tone(row.hp)}">${statIcon('hp', 15)}${signed(state, row.hp)}</li>${row.ap ? `<li class="${tone(row.ap)}">${statIcon('ap', 15)}${signed(state, row.ap)}</li>` : ''}${row.mp ? `<li class="${tone(row.mp)}">${statIcon('mp', 15)}${signed(state, row.mp)}</li>` : ''}</ul>${row.broken ? `<small class="negative">${escapeHtml(tr('conditionBroken'))}</small>` : ''}</div><button type="button" class="button secondary compact" data-action="builder-use" data-index="${index}" data-id="${row.item.i}">${escapeHtml(tr('use'))}</button></li>`).join('');
  return `<section class="panel-section"><h4>${escapeHtml(tr('alternatives', { name: tr(`slot.${SLOTS[index]}`) }))}</h4>${rows ? `<ul class="swap-list">${rows}</ul>` : `<p class="muted small">${escapeHtml(t(state, 'common.noResults'))}</p>`}</section>`;
}

// Linhas do item. Fora do modo de forja, só leitura; nele, cada valor pode ser mudado.
function itemStats(state, tr, build, item) {
  const { builder } = state;
  const custom = builder.intent.forge[item.i] || {};
  const natural = itemLines(item);
  const editing = builder.forging && isForgeable(item);
  const supposed = Object.entries(build.exos).filter(([, id]) => id === item.i).map(([key]) => key);
  const tag = text => ` <em class="tag">${escapeHtml(text)}</em>`;
  const row = (key, min, max, isNatural) => {
    const value = custom[key];
    const exo = !isNatural || (value > 0 && isExo(item, key));
    const over = !exo && value !== undefined && value > max;
    const extra = exo ? tag('Exo') : over ? tag('Over') : value !== undefined ? tag(tr('edited')) : '';
    if (editing) return `<li class="stat-row edit">${statIcon(key)}<span>${escapeHtml(statName(tr, key))}${extra}${isNatural && min !== max ? `<small>${min} – ${max}</small>` : ''}</span><input class="input" type="number" data-builder-forge="${key}" data-id="${item.i}" value="${value ?? ''}" placeholder="${builder.intent.roll === 'max' ? max : Math.floor((min + max) / 2)}" max="${forgeLimit(item, key)}" aria-label="${escapeHtml(tr(`stat.${key}`))}">${value !== undefined ? `<button type="button" class="icon-button" data-action="builder-forge-clear" data-id="${item.i}" data-field="${key}" aria-label="${escapeHtml(`${tr('natural')}: ${tr(`stat.${key}`)}`)}" title="${escapeHtml(tr('natural'))}">${icon('back', 14)}</button>` : ''}</li>`;
    const shown = value !== undefined ? value : min === max ? min : `${min < 0 ? '−' : ''}${Math.abs(min)} – ${max < 0 ? '−' : ''}${Math.abs(max)}${PERCENT.has(key) ? '%' : ''}`;
    return statRow(state, tr, key, shown, extra, `${exo || over ? 'forged' : ''} ${max < 0 ? 'negative' : ''}`);
  };
  const extras = Object.keys(custom).filter(key => !natural.some(line => line[0] === key));
  const choices = editing ? FORGE_STATS.filter(key => custom[key] === undefined && !natural.some(line => line[0] === key)) : [];
  return `<ul class="stat-list">${natural.map(([key, min, max]) => row(key, min, max, true)).join('')}${extras.map(key => row(key, 0, 0, false)).join('')}${supposed.map(key => statRow(state, tr, key, 1, tag(tr('exoSupposed')), 'forged')).join('')}</ul>
    ${editing ? `<div class="forge-add"><select class="select" data-builder-exo data-id="${item.i}" aria-label="${escapeHtml(tr('addExo'))}"><option value="">+ ${escapeHtml(tr('addExo'))}</option>${choices.map(key => `<option value="${key}">${escapeHtml(tr(`stat.${key}`))}</option>`).join('')}</select><small class="muted">${escapeHtml(tr('forgeHint'))}</small></div>` : ''}`;
}

function itemPanel(state, tr, build) {
  const { builder } = state; const index = builder.selected;
  const item = build.items[index]; const off = builder.busy ? 'disabled' : '';
  const action = (name, iconName, label, cls = '') => `<button type="button" class="tool ${cls}" data-action="${name}" data-index="${index}" ${item ? `data-id="${item.i}"` : ''} ${off}>${icon(iconName, 17)}<span>${escapeHtml(label)}</span></button>`;
  const back = `<button type="button" class="button ghost compact" data-action="builder-select" data-index="${index}">${icon('back', 15)} ${escapeHtml(t(state, 'common.back'))}</button>`;
  const swapTool = action('builder-swap', 'sync', tr('swap'), builder.showSwaps ? 'on' : '');
  if (!item) return `<div class="panel">${back}<h3>${escapeHtml(tr(`slot.${SLOTS[index]}`))}</h3><p class="muted">${escapeHtml(tr('empty'))}</p><div class="tools">${swapTool}</div>${builder.showSwaps ? swaps(state, tr, index) : ''}</div>`;
  const locked = builder.intent.locked.includes(item.i);
  const owned = (state.craftInventory || []).some(row => row.quantity > 0 && Number(row.ankamaId) === item.i);
  const set = builder.gear.sets.find(row => row.i === item.s);
  const count = set ? build.items.filter(row => row?.s === set.i).length : 0;
  const link = PET_TYPES.has(item.t) && petCreature(item) ? action('builder-pet', 'heart', tr('pet')) : item.r ? action('builder-craft', 'craft', tr('craft')) : '';
  const passive = item.x?.[lang(state)];
  const broken = build.broken.includes(item.i);
  return `<div class="panel">${back}<header class="item-title">${picture(itemImage(item), 68)}<div><h3>${escapeHtml(itemName(item, state.language))}</h3><small class="muted">${escapeHtml(tr(`slot.${SLOTS[index]}`))} · ${escapeHtml(t(state, 'simulation.levelShort'))} ${item.l}${owned ? ` · ${escapeHtml(tr('inStock'))}` : ''}</small></div></header>
    <div class="tools">${action('builder-lock', 'lock', tr(locked ? 'unlock' : 'lock'), locked ? 'on' : '')}${swapTool}${isForgeable(item) ? action('builder-forge-mode', 'edit', tr(builder.forging ? 'forgeEnd' : 'forge'), builder.forging ? 'on' : '') : ''}${action('builder-ban', 'close', tr('ban'))}${link}</div>
    ${builder.showSwaps ? swaps(state, tr, index) : ''}
    <section class="panel-section">${itemStats(state, tr, build, item)}</section>
    ${passive ? `<section class="panel-section"><h4><span class="spark">✦</span> ${escapeHtml(tr('passiveTitle'))}</h4>${passiveLines(passive)}</section>` : ''}
    ${item.c ? `<section class="panel-section"><h4>${escapeHtml(tr('condition'))}</h4><p class="${broken ? 'negative' : ''}">${escapeHtml(conditionText(tr, item.c))}${broken ? ` · ${escapeHtml(tr('conditionBroken'))}` : ''}</p></section>` : ''}
    ${set ? `<section class="panel-section">${setBlock(state, tr, set, count)}</section>` : ''}</div>`;
}

function spells(state, tr, build) {
  const { builder } = state; const breed = currentBreed(builder); const { intent } = builder;
  if (!breed) return `<p class="muted">${escapeHtml(tr('spellsChoose'))}</p>`;
  const number = value => formatNumber(value, state.language);
  const targetRes = builder.targetRes;
  const rows = breed.s.map(spell => ({ spell, grade: gradeFor(spell, intent.level) })).filter(row => row.grade?.d.length).map(row => ({ ...row, test: testSpell(build.raw, row.grade, intent, targetRes) })).sort((a, b) => b.test.expected / Math.max(1, b.grade.a) - a.test.expected / Math.max(1, a.grade.a));
  const turn = bestTurn(build.raw, breed, intent, Math.max(0, build.capped.ap), targetRes);
  const line = row => `<span class="hit ${row.conditional ? 'conditional' : ''}">${statIcon(row.element, 16)}${number(row.min)} – ${number(row.max)}${row.steal ? ' ♥' : ''}${row.conditional ? ' *' : ''}</span>`;
  const list = rows.map(({ spell, grade, test }) => `<li class="spell-row">${picture(spellImage(spell), 44)}<div class="spell-name"><strong>${escapeHtml(itemName(spell, state.language))}</strong><small>${statIcon('ap', 13)}${grade.a} ${statIcon('range', 13)}${grade.r[0] === grade.r[1] ? grade.r[0] : `${grade.r[0]}–${grade.r[1]}`}${grade.t ? ` · ${escapeHtml(tr('perTurn', { count: grade.t }))}` : ''}</small></div>
    <dl><div><dt>${escapeHtml(tr('normal'))}</dt><dd>${test.normal.map(line).join('')}</dd></div>${test.chance ? `<div><dt>${escapeHtml(tr('critical'))} ${Math.round(test.chance * 100)}%</dt><dd>${test.critical.map(line).join('')}</dd></div>` : ''}</dl>
    <div class="spell-total"><b>${number(Math.round(test.expected))}</b><small>${number(Math.round(test.expected / Math.max(1, grade.a)))} ${escapeHtml(tr('perAp'))}</small></div></li>`).join('');
  return `<section class="best-turn"><div><small>${escapeHtml(tr('bestTurn', { ap: build.capped.ap }))}</small><b>${number(Math.round(turn.value))}</b></div><ul>${turn.casts.map(cast => `<li title="${escapeHtml(itemName(cast.spell, state.language))}">${picture(spellImage(cast.spell), 34)}<span>${cast.count}× ${escapeHtml(itemName(cast.spell, state.language))}</span></li>`).join('')}</ul></section>
    <label class="option-line">${statIcon('res', 18)}<span>${escapeHtml(tr('targetRes'))}</span><input class="input" type="number" min="0" max="50" data-builder-option="targetRes" data-id="targetRes" value="${targetRes || ''}" placeholder="0"></label>
    <ul class="spell-list">${list}</ul><p class="muted small">${escapeHtml(tr('spellNote'))}</p>`;
}

function statsTab(state, tr, build) {
  const { gear, ids } = state.builder;
  const cost = buildCost(state, ids);
  const groups = GROUPS.map(([label, keys]) => { const rows = keys.filter(key => build.stats[key]).map(key => statRow(state, tr, key, build.stats[key])).join(''); return rows ? `<section class="stat-group"><h4>${escapeHtml(tr(label))}</h4><ul class="stat-list">${rows}</ul></section>` : ''; }).join('');
  return `<div class="stat-groups">${groups}</div>${cost.total ? `<p class="builder-cost">${icon('craft', 17)} <span>${escapeHtml(tr('materials'))}</span> <b>${cost.known ? formatKamas(cost.cost, state.language) : '—'}</b> <small class="muted">${escapeHtml(tr('known', { known: cost.known, total: cost.total }))}</small></p>` : ''}<p class="muted small">${escapeHtml(tr('assumptions'))} ${escapeHtml(tr('badge', { version: gear.version }))}.</p>`;
}

function panel(state, tr, build) {
  const { builder } = state;
  if (builder.selected !== null && builder.selected !== undefined) return itemPanel(state, tr, build);
  const tab = TABS.includes(builder.tab) ? builder.tab : 'stats';
  const passives = build.items.filter(item => item?.x?.[lang(state)]);
  const label = { stats: tr('stats'), sets: tr('tabSets', { count: build.sets.length }), passives: tr('tabPassives', { count: passives.length }), spells: tr('tabSpells') };
  const body = tab === 'stats' ? statsTab(state, tr, build)
    : tab === 'sets' ? (build.sets.map(row => setBlock(state, tr, row.set, row.count)).join('') || `<p class="muted">${escapeHtml(tr('noSets'))}</p>`)
      : tab === 'passives' ? `${passives.length ? `<p class="muted small">${escapeHtml(tr('passivesNote'))}</p>` : `<p class="muted">${escapeHtml(tr('noPassives'))}</p>`}<ul class="passive-list">${passives.map(item => `<li>${picture(itemImage(item), 44)}<div><strong>${escapeHtml(itemName(item, state.language))}</strong>${passiveLines(item.x[lang(state)])}</div></li>`).join('')}</ul>`
        : spells(state, tr, build);
  return `<div class="panel"><nav class="tabs" aria-label="${escapeHtml(tr('items'))}">${TABS.map(key => `<button type="button" data-action="builder-tab" data-field="${key}" ${key === tab ? 'aria-current="page"' : ''}>${escapeHtml(label[key])}</button>`).join('')}</nav>${body}</div>`;
}

function result(state, tr) {
  const build = currentBuild(state);
  if (!build) return '';
  const { busy, saveName } = state.builder;
  return `<article class="card builder-result"><div class="save-bar"><label class="visually-hidden" for="builder-save-name">${escapeHtml(tr('saveName'))}</label><input class="input" id="builder-save-name" data-builder-save-name maxlength="80" placeholder="${escapeHtml(tr('saveName'))}" value="${escapeHtml(saveName)}"><button type="button" class="button primary" data-action="builder-save">${icon('check', 16)} ${escapeHtml(tr('save'))}</button><button type="button" class="button secondary" data-action="builder-new" ${busy ? 'disabled' : ''}>${icon('plus', 16)} ${escapeHtml(tr('newSet'))}</button></div>
    <div class="sheet">${doll(state, tr, build)}${panel(state, tr, build)}</div></article>`;
}

export function renderBuilderPage(state) {
  const tr = (key, vars) => t(state, `builder.${key}`, vars);
  const { saved } = state.builder;
  const mine = saved.length ? `<article class="card section builder-mine">${renderDisclosure(state, 'builder-saved', `${tr('mySets')} (${saved.length})`, `<ul class="builder-saved">${saved.map(row => `<li>${row.intent.breed ? picture(breedImage(row.intent.breed), 30) : icon('shield', 24)}<strong>${escapeHtml(row.name)}</strong><button type="button" class="button ghost compact" data-action="builder-open" data-id="${escapeHtml(row.id)}">${escapeHtml(tr('open'))}</button><button type="button" class="icon-button danger" data-action="builder-delete" data-id="${escapeHtml(row.id)}" aria-label="${escapeHtml(`${t(state, 'common.delete')}: ${row.name}`)}">${icon('trash', 15)}</button></li>`).join('')}</ul>`, { open: true })}</article>` : '';
  return `<section class="stack builder-page">${renderPageHead(state, { title: tr('title'), description: tr('intro') })}<div class="builder-layout"><div class="stack builder-side">${chat(state, tr)}${options(state, tr)}${mine}</div><div class="stack builder-content">${result(state, tr) || `<article class="card builder-empty">${icon('shield', 60)}<p>${escapeHtml(tr('emptyResult'))}</p></article>`}</div></div></section>`;
}
