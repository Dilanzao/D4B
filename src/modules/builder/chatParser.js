import { SLOTS } from './gearSchema.js';

export const normalizeText = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();

const ELEMENT_WORDS = {
  strength: 'forca|str|strength|terra|earth|terre|force|fuerza|tierra', intelligence: 'inteligencia|intel|int|intelligence|fogo|fire|feu|fuego',
  chance: 'sorte|cha|chance|agua|water|eau|suerte', agility: 'agilidade|agi|agility|agilite|agilidad|ar|air|aire'
};
const MULTI = /\b(multi|omni|multielement\w*|multi-element\w*|todos os elementos|all elements|quatro elementos)\b/;
const SLOT_WORDS = {
  hat: 'chapeu|capacete|elmo|hat|coiffe|chapeau|sombrero', cloak: 'capa|manto|cloak|cape', amulet: 'amuleto|colar|amulet|amulette', ring: 'anel|aneis|ring|rings|anneau|anillo',
  belt: 'cinto|belt|ceinture|cinturon', boots: 'bota|botas|boots|bottes', weapon: 'arma|weapon|arme', shield: 'escudo|shield|bouclier',
  companion: 'mascote|montascote|pet|montaria|mount|familier|monture|montura|mascota', trophy: 'trofeu|trofeus|dofus|trophy|trophee|trofeo'
};
// Características que aceitam meta numérica ("60 de critico") ou reforço ("mais fuga").
const STAT_WORDS = {
  ap: 'pa|ap|pontos de acao', mp: 'pm|mp|pontos de movimento', range: 'alcance|al|po|range|portee', hp: 'vida|hp|pv|vitalidade|vitality|vitalite|vitalidad', wisdom: 'sabedoria|sab|wisdom|sagesse|sabiduria',
  prospecting: 'prospeccao|pp|prospecting|prospection|prospeccion', initiative: 'iniciativa|ini|initiative', lock: 'bloqueio|lock|tacle|placaje', dodge: 'fuga|esquiva|dodge|fuite',
  critical: 'critico|criticos|crit|critical|critique', heals: 'cura|curas|heals?|soins?|curacion', summons: 'invocacao|invocacoes|summons?|invocations?', apParry: 'esquiva de pa|esquiva pa|ap parry', mpParry: 'esquiva de pm|esquiva pm|mp parry',
  apReduction: 'retirada de pa|retirada pa|ret pa|ap reduction|retrait pa', mpReduction: 'retirada de pm|retirada pm|ret pm|mp reduction|retrait pm', pushDamage: 'empurrao|dano de empurrao|pushback|poussee|empuje',
  power: 'potencia|power|puissance', pods: 'pods', trapDamage: 'armadilha|armadilhas|trap|pieges?', res: 'res|resis|resistencias?|resistances?', damageAll: 'danos?|damage|degats|dano'
};
const CLASSES = ['iop', 'cra', 'eniripsa', 'sacrier', 'sacrieur', 'feca', 'osamodas', 'enutrof', 'sram', 'xelor', 'ecaflip', 'sadida', 'pandawa', 'rogue', 'roublard', 'ladino', 'masqueraider', 'zobal', 'foggernaut', 'steamer', 'eliotrope', 'huppermage', 'ouginak', 'forgelance', 'pelutrof', 'cramunho', 'hipermago', 'uginak', 'forjalanca'];
const word = list => new RegExp(`(?<![\\w])(?:${list})(?![\\w])`);
const USE = /\b(usar|use|usa|com o|com a|coloca\w*|bota o|bota a|trava\w*|fixa\w*|quero o|quero a|mant\w+|lock|keep|avec|garde\w*|utilis\w+|pon|usar el|fija\w*|equipa\w*)\b/;
const BAN = /\b(sem o|sem a|sem|tira\w*|remov\w+|retir\w+|nao quero|nao usa\w*|without|remove|no quiero|sin|sans|enleve\w*|quita\w*|bani\w*|ban)\b/;
const SWAP = /\b(troca\w*|mud[ae]\w*|outr[oa]|substitu\w+|swap|change|another|autre|chang\w+|cambia\w*|otro|otra)\b/;
const KEEP = /\b(trava\w*|mant[eé]\w*|fixa\w*|lock|keep|garde\w*|fija\w*|segura\w*)\b/;
const MORE = /\b(bastante|muit[oa]s?|lots of|a lot of|beaucoup|much[oa]s?|mais|aumenta\w*|more|plus|mas|sobe|prioriza\w*|foco em|focad\w+ em|foca em)\b/;
const LESS = /\b(menos|less|moins|diminui\w*|reduz\w*)\b/;

// Jeito de falar → pedido. A ordem importa: "tomo muito dano" não pode virar "mais dano".
const PHRASES = [
  [/\b(tom\w+ (?:muito|mta?|mto|demais) dano|(?:muito )?dano recebido|morr\w+(?: (?:demais|muito|mto|rapido|facil|toda hora|sempre))?|sou (?:de )?papel|fragil|squishy|i die\w*|dying|je meurs|muero|pouca vida|falta vida|aguent\w+ (?:mais|nada|pouco)|nao aguento)\b/g, ' mais vida '],
  [/\b((?:sem|pouca|pouco|nao tenho) (?:grana|dinheiro|kamas?)|to (?:liso|duro|quebrado|pobre)|falido|novato|comec\w+ (?:agora|no jogo)|no money|poor|broke|sans argent|fauche|sin dinero|sin kamas)\b/g, ' barato '],
  [/\b((?:bat[oe]|bater|bate) (?:pouco|fraco)|(?:mato|mata) devagar|(?:pouco|dano baixo|falta) dano|(?:quero )?(?:bater|bata) (?:mais(?: forte)?|forte)|hit harder|(?:ta|esta|estou|to) fraco|taper plus fort|pegar? mas(?: fuerte)?)\b/g, ' mais dano '],
  [/\b((?:pouca|falta|mais) mobilidade|andar mais|(?:ando|anda) pouco|more mobility)\b/g, ' mais pm '],
  [/\b((?:jogar|comecar|agir) (?:primeiro|antes)|play first|jouer en premier|empezar primero)\b/g, ' iniciativa '],
  [/\b((?:fugir|escapar) (?:mais|melhor)|(?:fico|ficar) preso)\b/g, ' mais fuga '],
  [/\b(longe|de longe|mais alcance|long range)\b/g, ' mais alcance '],
  [/\b(todo mundo|todos os elementos)\b/g, ' multi ']
];
const VOCABULARY = ['nivel', 'level', 'niveau', 'forca', 'terra', 'inteligencia', 'fogo', 'sorte', 'agilidade', 'elemento', 'barato', 'critico', 'alcance', 'resistencia', 'sabedoria', 'iniciativa', 'prospeccao', 'vitalidade', 'bloqueio', 'invocacao', 'potencia', 'empurrao', 'chapeu', 'cinto', 'escudo', 'amuleto', 'trofeu', 'mascote', 'bastante', 'dofus', 'desfazer', 'salvar', 'trocar', 'distancia', 'strength', 'agility', 'intelligence', 'chance', 'feitico', 'custo', 'preco', 'multi', 'tanque'];
const KNOWN = new Set([...VOCABULARY, 'tropa', 'froca', 'terras', 'forte', 'conta', 'fogos', 'norte', 'corte', 'porte', 'custa', 'curto', 'certo', 'cerca', 'gosto', 'muita', 'multa', 'troca', 'prefiro', 'forge', 'force', 'cinta', 'chances']);

// Erro de digitação: uma letra trocada, a mais, a menos ou invertida.
function oneSlip(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
KNOWN.delete('froca');
export const fixTypos = text => text.replace(/[a-z]{5,}/g, found => { if (KNOWN.has(found)) return found; const hits = VOCABULARY.filter(item => oneSlip(found, item)); return hits.length === 1 ? hits[0] : found; });

// Índice de nomes: só quando a frase pede item é que procuramos, do nome mais longo ao mais curto.
export function findItems(text, gear, langIndex) {
  const haystack = ` ${text.replace(/[^\w' -]/g, ' ')} `;
  const hits = [];
  for (const item of gear.items) for (const index of new Set([langIndex, 0, 2])) {
    const name = normalizeText(item.n[index]).replace(/[^\w' -]/g, ' ');
    if (name.length >= 4 && haystack.includes(` ${name} `)) { hits.push({ item, name }); break; }
  }
  hits.sort((a, b) => b.name.length - a.name.length);
  return hits.filter((hit, index) => !hits.slice(0, index).some(other => other.name !== hit.name && other.name.includes(hit.name))).filter((hit, index, list) => list.findIndex(other => other.name === hit.name) === index);
}

function findSet(text, gear, langIndex) {
  if (!/\b(conjunto|set|panoplia|panoplie|panoply)\b/.test(text)) return null;
  const haystack = ` ${text.replace(/[^\w' -]/g, ' ')} `;
  const strip = name => normalizeText(name).replace(/^(conjunto|panoplie|panoplia|set) (do|da|dos|das|de la|de los|de las|de l'|du|des|de|d')?\s*/, '').replace(/ set$/, '').trim();
  return gear.sets.map(set => ({ set, name: strip(set.n[langIndex]) })).filter(row => row.name.length >= 4 && haystack.includes(` ${row.name} `)).sort((a, b) => b.name.length - a.name.length)[0]?.set || null;
}

// Interpreta a mensagem e devolve só o que ela muda no pedido.
export function parseMessage(message, gear, langIndex = 0, current = null) {
  const original = normalizeText(message);
  let text = ` ${original} `;
  const out = { patch: {}, lockNames: [], banNames: [], slots: [], action: null, notes: [], cues: 0 };
  const cue = () => { out.cues += 1; };
  const eat = regex => { const match = text.match(regex); if (match) { text = text.replace(match[0], ' '); cue(); } return match; };

  if (/\b(recomec\w+|novo set|do zero|reset|limpa\w*|start over|new build|nouveau|nuevo set)\b/.test(text)) { out.action = 'reset'; cue(); text = text.replace(/\b(novo set|new build|nuevo set)\b/, ' '); }
  const asksStat = original.match(/^(?:e )?(?:quant[oa]s?(?: de| tenho de| tem de| eu tenho de)?|qual (?:e |o |a |meu |minha |é )*|how much|combien de|cuant[oa]s?(?: de)?) ?(.{2,30}?)(?: (?:tem|tenho|esse set|o set|do i have|ai-je|tengo).*)?\??$/);
  if (asksStat && !/\d|cust|preco|price|kama/.test(original)) { const key = Object.keys(STAT_WORDS).find(name => word(STAT_WORDS[name]).test(asksStat[1])); if (key) return { ...out, action: 'stat', stat: key, cues: 1 }; }
  if (/^(oi+|ola|opa|eai|e ai|salve|bom dia|boa tarde|boa noite|hi|hello|hey|salut|bonjour|hola|buenas)[\s!.,?]*(?:tudo bem|beleza|blz)?[\s!.?]*$/.test(original)) return { ...out, action: 'greet', cues: 1 };
  if (/^(obrigad[oa]|valeu|vlw|brigad[oa]|show|perfeito|top|thanks?(?: you)?|merci|gracias)\b[\s\w!.]{0,20}$/.test(original)) return { ...out, action: 'thanks', cues: 1 };
  if (/\b(tanto faz|qualquer (?:um|uma|elemento)|voce escolhe|whatever|^any$|peu importe|me da igual)\b/.test(original)) { out.any = true; cue(); }
  if (/\b(desfa\w+|volta\w* (?:o|ao) anterior|undo|annule\w*|deshacer)\b/.test(text)) return { ...out, action: 'undo', cues: 1 };
  if (/^ ?\s*(ajuda|help|aide|ayuda|o que voce faz)\b/.test(text)) return { ...out, action: 'help', cues: 1 };
  if (/\b(por que|porque|explica\w*|explain|why|pourquoi|por que)\b/.test(text)) { out.action = 'explain'; cue(); }
  if (/\b(quanto custa|custo|preco|cost|price|combien|cuanto cuesta|materia\w*|ingredientes)\b/.test(text)) { out.action = 'cost'; cue(); }
  if (/\b(salva\w*|save|sauvegard\w*|enregistr\w*|guarda\w*)\b/.test(text)) { out.action = 'save'; cue(); }
  if (/\b(outra opcao|outra versao|outro set|alternativa\w*|another build|autre version|otra opcion|diferente)\b/.test(text)) { out.action = 'reroll'; cue(); }

  // Itens e conjuntos citados saem do texto antes das palavras-chave, para "Capa do Tofu" não virar pedido de capa.
  if (USE.test(text) || BAN.test(text)) {
    // "sem X com Y": a ação vale para o verbo mais próximo à esquerda do nome.
    for (const { item, name } of findItems(original, gear, langIndex)) {
      const at = original.indexOf(name); const before = ` ${at < 0 ? original : original.slice(0, at)} `;
      const last = source => { let found = -1; for (const match of before.matchAll(new RegExp(source.source, 'g'))) found = match.index; return found; };
      const ban = last(BAN); const use = last(USE);
      // Nome de uma palavra só vale logo depois do verbo, e nome de classe nunca é item.
      if ((ban < 0 && use < 0) || CLASSES.includes(name) || (!name.includes(' ') && before.length - Math.max(ban, use) > 24)) continue;
      (ban > use ? out.banNames : out.lockNames).push(item.i); text = text.replace(name, ' '); cue();
    }
  }
  const set = findSet(text, gear, langIndex);
  text = ` ${fixTypos(text)} `;
  for (const [pattern, meaning] of PHRASES) text = text.replace(pattern, meaning);
  if (set) { (BAN.test(text) ? out.banNames : out.lockNames).push(...set.m); out.setId = set.i; cue(); }

  const trio = eat(/(?<!\d)([6-9]|1[0-2])\s*[\/x]\s*([3-6])(?:\s*[\/x]\s*([0-6]))?(?!\d)/);
  const targets = {};
  if (trio) { targets.ap = +trio[1]; targets.mp = +trio[2]; if (trio[3]) targets.range = +trio[3]; }
  const level = eat(/\b(?:nivel|niv|nv|lvl|lv|level|niveau)\.?\s*(\d{1,3})\b/) || eat(/\b(\d{1,3})\s*(?:de nivel|lvl)\b/);
  if (level) out.patch.level = Math.min(200, Math.max(1, +level[1]));
  const money = eat(/\b\d+(?:[.,]\d+)?\s*(?:kk|mk|kamas?|milhoes|milhao)\b/);
  if (money) out.notes.push('budget');
  if (eat(/\b(barat\w+|economic\w+|cheap|pas cher|budget|iniciante|pobre|craftave\w+|fabricave\w+|craftable)\b/) || money) { out.patch.craftable = true; out.patch.noDofus = true; }
  if (eat(/\b(sem dofus|no dofus|sans dofus|sin dofus)\b/)) out.patch.noDofus = true;
  if (eat(/\b(pode usar dofus|com dofus|with dofus|avec dofus|con dofus)\b/)) out.patch.noDofus = false;
  if (eat(/\b(sem limite|qualquer preco|rico|no limit|caro)\b/)) { out.patch.craftable = false; out.patch.noDofus = false; }
  if (eat(/\b(meu estoque|que eu tenho|o que tenho|ja tenho|my stock|mon stock|mi stock)\b/)) out.patch.preferOwned = true;
  if (eat(/\b(sem critico?s?|sem crit|no crit|sans critique|sin critico)\b/)) out.patch.noCrit = true;
  else if (eat(/\b(com critico?s?|full crit|crit build|tudo critico)\b(?!\s*\d)/)) { out.patch.noCrit = false; (out.boost ??= {}).critical = 0.5; }
  if (eat(/\b(perfeit\w+|jet max|max roll|roll maximo|rolagem maxima)\b/)) out.patch.roll = 'max';
  if (eat(/\b(corpo a corpo|cac|melee|mele|close combat)\b/)) out.patch.distance = 'melee';
  else if (eat(/\b(a distancia|distancia|ranged|distance)\b/)) out.patch.distance = 'ranged';
  const klass = text.match(word(CLASSES.join('|'))); if (klass) { out.patch.className = klass[0]; cue(); text = text.replace(klass[0], ' '); }

  // Metas numéricas.
  for (const [key, words] of Object.entries(STAT_WORDS)) {
    if (key === 'damageAll' || key === 'power') continue;
    const match = eat(new RegExp(`(?<![\\w])(\\d{1,5})\\s*%?\\s*(?:de |of |en )?(?:${words})(?![\\w])`)) || eat(new RegExp(`(?<![\\w])(?:${words})\\s*(?:de|:|=|minimo|min)?\\s*(\\d{1,5})(?![\\w])`));
    if (match && +match[1] > 0) targets[key] = +match[1];
  }
  if (targets.ap) targets.ap = Math.min(12, targets.ap);
  if (targets.mp) targets.mp = Math.min(6, targets.mp);
  if (targets.range) targets.range = Math.min(6, targets.range);
  if (Object.keys(targets).length) out.patch.targets = targets;

  // "mais vida", "menos dano"
  const boost = out.boost || {};
  for (const [key, words] of Object.entries(STAT_WORDS)) {
    const pattern = new RegExp(`(?:${MORE.source}|${LESS.source})\\s+(?:de |em |of |d')?(?:${words})(?![\\w])`);
    const match = text.match(pattern);
    if (match) { boost[key] = LESS.test(match[0]) ? -1 : 1; text = text.replace(match[0], ' '); cue(); }
  }
  // Estilos.
  const styles = [];
  const style = (name, regex) => { if (eat(regex)) styles.push(name); };
  style('tank', /\b(tank|tanque|resistente|defensiv\w+|sobreviv\w+|aguentar)\b/);
  style('damage', /\b(dano maximo|full dano|muito dano|dps|glass cannon|max damage|ofensiv\w+|danos?|damage|degats)\b/);
  style('drop', /\b(drop|dropar|pp|prospeccao|prospecting|farmar)\b/); style('xp', /\b(xp|upar|sabedoria|wisdom|sagesse|leveling)\b/);
  style('heal', /\b(cura|curar|curandeiro|healer|heal|suporte|support|soin)\b/); style('lock', /\b(bloqueio|tackle|lock|tacle)\b/); style('dodge', /\b(fuga|dodge|fuite)\b/);
  style('init', /\b(iniciativa|initiative)\b/); style('summon', /\b(invocador|invocacao|invocacoes|summoner|summons?)\b/); style('push', /\b(empurrao|pushback|poussee|empuje)\b/);
  style('pvp', /\b(pvp|kolisseu|kolizeu|koli|koliseu|kolossium|1v1)\b/); style('retap', /\b(retirada de pa|ret pa|retrait pa|entrave)\b/); style('pods', /\b(pods|carga)\b/); style('trap', /\b(armadilhas?|trap|pieges?)\b/);
  if (styles.length) out.styles = styles;
  if (Object.keys(boost).length) out.boost = boost;

  // Resistências citam elementos; não são o elemento do dano.
  text = text.replace(/\bresist\w+\s+(?:a |ao |de |do |da |em )?(?:terra|fogo|agua|ar|fire|earth|water|air|neutr\w+)\b/g, ' ');
  // Espaços do set.
  const slots = Object.entries(SLOT_WORDS).filter(([, words]) => word(words).test(text)).map(([slot]) => slot);
  if (slots.length && current) {
    if (KEEP.test(text)) { out.action = 'keep-slot'; out.slots = slots; cue(); }
    else if (SWAP.test(text) || BAN.test(text)) { out.action = 'swap-slot'; out.slots = slots; cue(); }
    else if (out.action === 'explain') out.slots = slots;
  }
  for (const slot of slots) text = text.replace(new RegExp(word(SLOT_WORDS[slot]).source, 'g'), ' ');
  const elements = Object.entries(ELEMENT_WORDS).filter(([, words]) => word(words).test(text)).map(([key]) => key);
  if (MULTI.test(text)) { out.patch.elements = Object.keys(ELEMENT_WORDS); cue(); }
  else if (elements.length) { out.patch.elements = elements; cue(); }
  if (out.patch.level === undefined) { const bare = text.match(/(?<![\d%])(\d{2,3})(?![\d%])/); if (bare && +bare[1] >= 10 && +bare[1] <= 200) { out.patch.level = +bare[1]; cue(); } }
  return out;
}

const STYLE_PRESETS = {
  tank: { damage: 0.35, survival: 1.5, extras: { criticalRes: 0.1 } }, damage: { damage: 1.3, survival: 0.3 }, drop: { damage: 0.35, survival: 0.35, extras: { prospecting: 1.6 } }, xp: { damage: 0.45, survival: 0.35, extras: { wisdom: 1.6 } },
  heal: { damage: 0.7, survival: 0.7, extras: { heals: 0.9 } }, lock: { extras: { lock: 0.7 } }, dodge: { extras: { dodge: 0.7 } }, init: { extras: { initiative: 0.9 } }, summon: { extras: { summons: 0.6 } }, push: { extras: { pushDamage: 1.2 } },
  pvp: { damage: 0.9, survival: 0.9, extras: { initiative: 0.15, apParry: 0.15, mpParry: 0.15 } }, retap: { extras: { wisdom: 0.3, apReduction: 0.9 } }, pods: { damage: 0.2, survival: 0.2, extras: { pods: 1.5 } }, trap: { extras: { trapDamage: 0.5 } }
};

export function defaultTargets(level) {
  return level >= 190 ? { ap: 11, mp: 6 } : level >= 150 ? { ap: 10, mp: 5 } : level >= 100 ? { ap: 9, mp: 4 } : level >= 50 ? { ap: 7, mp: 4 } : {};
}

export function applyParsed(base, parsed, { gear, ids = null, defaults }) {
  const fresh = parsed.action === 'reset';
  const intent = structuredClone(fresh ? defaults : base);
  const { targets, ...patch } = parsed.patch;
  Object.assign(intent, patch);
  if (parsed.styles) {
    const start = { damage: 1, survival: 0.55, extras: {} };
    for (const name of parsed.styles) { const preset = STYLE_PRESETS[name]; start.damage = preset.damage ?? start.damage; start.survival = preset.survival ?? start.survival; Object.assign(start.extras, preset.extras); }
    Object.assign(intent, start);
  }
  // As metas padrão seguem o nível até a pessoa escolher as dela.
  if (!fresh && intent.level !== base.level) intent.customTargets = false;
  const custom = intent.customTargets || Boolean(targets);
  if (!custom) intent.targets = defaultTargets(intent.level);
  else if (targets) intent.targets = { ...(intent.customTargets ? intent.targets : targets.ap || targets.mp ? {} : defaultTargets(intent.level)), ...targets };
  intent.customTargets = custom;
  for (const [key, amount] of Object.entries(parsed.boost || {})) {
    if (key === 'hp' || key === 'res') intent.survival = Math.max(0.1, intent.survival * (amount > 0 ? 1.6 : 0.6));
    else if (key === 'damageAll' || key === 'power') intent.damage = Math.max(0.1, intent.damage * (amount > 0 ? 1.4 : 0.65));
    else if (['ap', 'mp', 'range'].includes(key)) { const cap = key === 'ap' ? 12 : 6; intent.targets[key] = Math.max(0, Math.min(cap, (intent.targets[key] ?? parsed.currentStats?.[key] ?? 0) + amount)); intent.customTargets = true; }
    else intent.extras[key] = Math.max(0, (intent.extras[key] || 0) + (amount > 0 ? Math.max(0.5, amount * 0.5) : -0.5));
  }
  const lock = list => { intent.locked = [...new Set([...intent.locked, ...list])]; intent.banned = intent.banned.filter(id => !list.includes(id)); };
  const ban = list => { intent.banned = [...new Set([...intent.banned, ...list])]; intent.locked = intent.locked.filter(id => !list.includes(id)); };
  if (parsed.lockNames.length) {
    // Um item novo travado no mesmo espaço substitui o travado antes.
    const limit = { ring: 2, trophy: 6 };
    const slotOf = id => gear.slotOf(id);
    for (const id of parsed.lockNames) { const slot = slotOf(id); const same = intent.locked.filter(other => slotOf(other) === slot); if (same.length >= (limit[slot] || 1) && !same.includes(id)) intent.locked = intent.locked.filter(other => other !== same[0]); lock([id]); }
  }
  ban(parsed.banNames);
  if (ids && parsed.slots.length && ['keep-slot', 'swap-slot'].includes(parsed.action)) {
    const inSlots = ids.filter((id, index) => id && parsed.slots.includes(SLOTS[index]));
    if (parsed.action === 'keep-slot') lock(inSlots);
    else { ban(inSlots); lock(ids.filter((id, index) => id && !parsed.slots.includes(SLOTS[index]))); intent.temporaryLocks = true; }
  }
  return intent;
}
