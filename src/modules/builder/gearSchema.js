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
export const LANGUAGES = ['pt-BR', 'fr-FR', 'en-US', 'es-ES'];
export const itemName = (row, language) => row.n[Math.max(0, LANGUAGES.indexOf(language))] || row.n[0];
export const itemImage = row => `https://api.dofusdu.de/dofus3/v1/img/item/${row.p}-128.png`;
