// Identificadores de efeito usados pela API do DofusDude.
export const STAT = {
  vitality: 9, wisdom: 10, critical: 29, agility: 36, intelligence: 13, strength: 45, chance: 22, prospecting: 25,
  dodge: 59, range: 31, power: 32, lock: 26, initiative: 24, fireDamage: 61, waterDamage: 27, earthDamage: 48,
  airDamage: 47, neutralDamage: 49, airRes: 16, waterRes: 17, fireRes: 37, earthRes: 63, neutralRes: 34, heals: 121,
  summons: 28, mp: 8, damage: 30, ap: 12, criticalRes: 46, mpParry: 39, apParry: 75, mpReduction: 50, pushDamage: 62,
  criticalDamage: 38, apReduction: 64, pushRes: 70, airFlat: 60, fireFlat: 14, waterFlat: 82, earthFlat: 15,
  neutralFlat: 33, rangedRes: 108, meleeRes: 65, weaponDamage: 41, rangedDamage: 71, spellDamage: 93, meleeDamage: 40,
  pods: 220, trapPower: 106, trapDamage: 112, reflect: 249
};
export const STAT_IDS = Object.values(STAT);
export const STAT_INDEX = Object.fromEntries(STAT_IDS.map((id, index) => [id, index]));
export const SET_BONUS_ID = 72;

export const SLOTS = ['hat', 'cloak', 'amulet', 'ring', 'ring', 'belt', 'boots', 'weapon', 'shield', 'companion', 'trophy', 'trophy', 'trophy', 'trophy', 'trophy', 'trophy'];

export const SLOT_OF_TYPE = {
  27: 'hat', 43: 'cloak', 33: 'amulet', 17: 'ring', 58: 'belt', 45: 'boots', 87: 'shield',
  80: 'weapon', 39: 'weapon', 93: 'weapon', 65: 'weapon', 125: 'weapon', 42: 'weapon', 52: 'weapon', 73: 'weapon', 163: 'weapon', 111: 'weapon', 182: 'weapon',
  1: 'companion', 180: 'companion', 247: 'companion', 242: 'companion', 245: 'companion',
  177: 'trophy', 23: 'trophy', 124: 'trophy'
};
export const TYPE_PRYSMARADITE = 124;
export const TYPE_DOFUS = 177;
export const PET_TYPES = new Set([1, 180]);
// Peças que passam por forjamagia. Mascotes, montarias, Dofus e troféus não passam.
export const FORGE_SLOTS = new Set(['hat', 'cloak', 'amulet', 'ring', 'belt', 'boots', 'weapon', 'shield']);
export const isForgeable = item => Boolean(item) && !item.f && FORGE_SLOTS.has(SLOT_OF_TYPE[item.t]);
// Peso de 1 ponto de cada característica. Uma linha forjada vai até peso 101 (ou o máximo natural, se for maior).
const FORGE_WEIGHT = {
  vitality: 0.2, wisdom: 3, critical: 10, agility: 1, intelligence: 1, strength: 1, chance: 1, prospecting: 3, dodge: 4, range: 51, power: 2, lock: 4, initiative: 0.1,
  fireDamage: 5, waterDamage: 5, earthDamage: 5, airDamage: 5, neutralDamage: 5, airRes: 6, waterRes: 6, fireRes: 6, earthRes: 6, neutralRes: 6, heals: 10, summons: 30, mp: 90, damage: 20, ap: 100,
  criticalRes: 2, mpParry: 7, apParry: 7, mpReduction: 7, pushDamage: 5, criticalDamage: 5, apReduction: 7, pushRes: 2, airFlat: 2, fireFlat: 2, waterFlat: 2, earthFlat: 2, neutralFlat: 2,
  rangedRes: 15, meleeRes: 15, weaponDamage: 15, rangedDamage: 15, spellDamage: 15, meleeDamage: 15, pods: 0.25, trapPower: 2, trapDamage: 5, reflect: 10
};
export const FORGE_STATS = Object.keys(FORGE_WEIGHT);
const STAT_KEY = Object.fromEntries(Object.entries(STAT).map(([key, id]) => [id, key]));
// Linhas naturais do item: [característica, mínimo, máximo].
export function itemLines(item) { const out = []; for (let i = 0; i < item.e.length; i += 3) { const [a, b] = [item.e[i + 1], item.e[i + 2]]; out.push([STAT_KEY[item.e[i]], Math.min(a, b), Math.max(a, b)]); } return out; }
export const naturalMax = (item, key) => itemLines(item).filter(line => line[0] === key).reduce((sum, line) => sum + line[2], 0);
export const isExo = (item, key) => !itemLines(item).some(line => line[0] === key && line[2] > 0);
export function forgeLimit(item, key) { return Math.max(naturalMax(item, key), Math.floor(101 / FORGE_WEIGHT[key] + 1e-9)); }
export const UNIQUE_EXOS = ['ap', 'mp', 'range'];
export const breedImage = id => `https://api.dofusdb.fr/img/breeds/symbol_${id}.png`;
export const spellImage = spell => `https://api.dofusdb.fr/img/spells/sort_${spell.p}.png`;
export const LANGUAGES = ['pt-BR', 'fr-FR', 'en-US', 'es-ES'];
export const itemName = (row, language) => row.n[Math.max(0, LANGUAGES.indexOf(language))] || row.n[0];
export const itemImage = row => `https://api.dofusdu.de/dofus3/v1/img/item/${row.p}-128.png`;
