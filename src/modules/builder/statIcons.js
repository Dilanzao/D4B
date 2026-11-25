// Ícones próprios das características. Cor = família; escudo = resistência.
const G = {
  earth: '<path d="M4 18 10 7l4 6 2-3 4 8Z"/>', fire: '<path d="M12 3c1 4 5 5.5 5 10.5A5 5 0 0 1 7 14c0-2.500 1.500-3.500 2-6 1 1 1.500 2 1.500 3C12 9.500 12.500 6 12 3Z"/>',
  water: '<path d="M12 3c3 4.500 6 7.500 6 11.200A6 6 0 0 1 6 14.200C6 10.500 9 7.500 12 3Z"/>', air: '<path d="M3 9h10.500a2.500 2.500 0 1 0-2.500-2.500M3 13h14.500a2.800 2.800 0 1 1-2.800 2.800M3 17h7" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>',
  neutral: '<circle cx="12" cy="12" r="6.500"/>', heart: '<path d="M12 20 4.500 12.500A4.700 4.700 0 0 1 12 7a4.700 4.700 0 0 1 7.500 5.500Z"/>', book: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4Zm16 0h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6Z"/>',
  star: '<path d="m12 3 2.700 5.700 6.300.800-4.600 4.300 1.200 6.200L12 17l-5.600 3 1.200-6.200L3 9.500l6.300-.800Z"/>', boot: '<path d="M7 3h7v9l6 3a3 3 0 0 1 1 2.500V20H7Z"/>', eye: '<path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12Z"/><circle cx="12" cy="12" r="3" fill="#fff"/>',
  bolt: '<path d="M13.500 2 5 13.500h5.500L9.500 22 19 9.500h-6Z"/>', burst: '<path d="m12 2 1.800 5.200L18.500 4l-1.700 5.300 5.200.700-4.500 2.800 3.500 4.200-5.200-.600.200 5.600L12 18l-4 4 .200-5.600-5.200.600 3.500-4.200L2 10l5.200-.700L5.500 4l4.700 3.200Z"/>',
  sword: '<path d="M20 3h-5L7 11l-2-1-1.500 1.500 2 2L3 17l4 4 3.500-2.500 2 2L14 19l-1-2 8-8V4Z"/>', clock: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/><path d="M12 7.500V12l3.500 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  coin: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500v9M9.500 9.500h4a1.500 1.500 0 0 1 0 3h-3a1.500 1.500 0 0 0 0 3h4" fill="none" stroke="#fff" stroke-width="1.700"/>', link: '<path d="M10 14 14 10M8.500 11.500 6 14a3.500 3.500 0 0 0 5 5l2.500-2.500M15.500 12.500 18 10a3.500 3.500 0 0 0-5-5l-2.500 2.500" fill="none" stroke="currentColor" stroke-width="2.300" stroke-linecap="round"/>',
  wing: '<path d="M3 17C5 8 11 4 21 4c-1 3-2.500 4.500-5 5.500 1 .300 2 .300 3 0-1.500 3-4 4.500-7 4.700.700.500 1.500.700 2.300.600C11.500 18 7 18.500 3 17Z"/>', plus: '<path d="M9.500 3h5v6.500H21v5h-6.500V21h-5v-6.500H3v-5h6.500Z"/>', paw: '<ellipse cx="12" cy="16" rx="5" ry="4.200"/><circle cx="5.500" cy="11" r="2.200"/><circle cx="9.500" cy="6.500" r="2.300"/><circle cx="14.500" cy="6.500" r="2.300"/><circle cx="18.500" cy="11" r="2.200"/>',
  push: '<path d="M3 10h9V5l9 7-9 7v-5H3Z"/>', bag: '<path d="M9 3h6l-1 3c3.500 1 6 4.500 6 8.500 0 4-3 6.500-8 6.500s-8-2.500-8-6.500C4 10.500 6.500 7 10 6Z"/>', target: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" fill-rule="evenodd"/><circle cx="12" cy="12" r="2"/>',
  bow: '<path d="M5 4c9 1 14 6 15 15M5 4l15 15M4 20 13 11M4 20v-4m0 4h4" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>', trap: '<path d="M3 17h18l-2-6-2.500 3-2-5-2.500 4-2.500-4-2 5L5 11Z"/>', mirror: '<path d="M12 4v16M9 7 4 12l5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/>',
  minus: '<path d="M4 9.500h16v5H4Z"/>'
};
const C = { earth: '#8a5a2b', fire: '#d2452f', water: '#2c86c4', air: '#3f9b4b', neutral: '#86796a', life: '#cf3f5d', mind: '#7650b5', ap: '#e09a1b', mp: '#3f9b4b', range: '#3a7f93', power: '#b3541e', crit: '#d9663b', gold: '#b98a1f', steel: '#5d6b78', heal: '#d0578c' };
// [desenho, cor, é resistência]
const MAP = {
  strength: ['earth', 'earth'], intelligence: ['fire', 'fire'], chance: ['water', 'water'], agility: ['air', 'air'], vitality: ['heart', 'life'], hp: ['heart', 'life'], wisdom: ['book', 'mind'], ap: ['star', 'ap'], mp: ['boot', 'mp'], range: ['eye', 'range'],
  power: ['bolt', 'power'], damage: ['sword', 'power'], damageAll: ['sword', 'power'], neutralDamage: ['neutral', 'neutral'], earthDamage: ['earth', 'earth'], fireDamage: ['fire', 'fire'], waterDamage: ['water', 'water'], airDamage: ['air', 'air'], critical: ['burst', 'crit'], criticalDamage: ['burst', 'fire'],
  spellDamage: ['star', 'mind'], meleeDamage: ['sword', 'steel'], rangedDamage: ['bow', 'range'], weaponDamage: ['sword', 'earth'], initiative: ['clock', 'range'], prospecting: ['coin', 'gold'], lock: ['link', 'steel'], dodge: ['wing', 'air'], heals: ['plus', 'heal'], summons: ['paw', 'earth'],
  apParry: ['star', 'ap', 1], mpParry: ['boot', 'mp', 1], apReduction: ['minus', 'ap'], mpReduction: ['minus', 'mp'], pushDamage: ['push', 'power'], trapDamage: ['trap', 'steel'], trapPower: ['trap', 'power'], pods: ['bag', 'earth'], reflect: ['mirror', 'steel'],
  strengthHit: ['earth', 'earth'], intelligenceHit: ['fire', 'fire'], chanceHit: ['water', 'water'], agilityHit: ['air', 'air'],
  neutralRes: ['neutral', 'neutral', 1], earthRes: ['earth', 'earth', 1], fireRes: ['fire', 'fire', 1], waterRes: ['water', 'water', 1], airRes: ['air', 'air', 1], neutralFlat: ['neutral', 'neutral', 1], earthFlat: ['earth', 'earth', 1], fireFlat: ['fire', 'fire', 1], waterFlat: ['water', 'water', 1], airFlat: ['air', 'air', 1],
  criticalRes: ['burst', 'crit', 1], pushRes: ['push', 'power', 1], meleeRes: ['sword', 'steel', 1], rangedRes: ['bow', 'range', 1], res: ['plus', 'steel', 1], neutral: ['neutral', 'neutral'], best: ['star', 'mind']
};
const SHIELD = '<path d="M12 1.500 3 4.800v6.700c0 5.500 3.800 9.300 9 11 5.200-1.700 9-5.500 9-11V4.800Z"/>';

export const statColor = key => C[MAP[key]?.[1]] || C.steel;
export function statIcon(key, size = 20) {
  const [glyph, color, shield] = MAP[key] || ['target', 'steel'];
  const body = shield
    ? `<g fill="${C[color]}">${SHIELD}</g><g transform="translate(5.500 5) scale(.54)" fill="#fff" color="#fff">${G[glyph].replaceAll('fill="#fff"', `fill="${C[color]}"`).replaceAll('stroke="#fff"', `stroke="${C[color]}"`)}</g>`
    : `<g fill="${C[color]}" color="${C[color]}">${G[glyph]}</g>`;
  return `<svg class="stat-icon" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24">${body}</svg>`;
}
export const STAT_ICON_KEYS = Object.keys(MAP);
