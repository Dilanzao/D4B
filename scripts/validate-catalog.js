import { creatureCatalog } from '../src/data/creatures.js';
import { SUPPORTED_LANGUAGES } from '../src/config/app.js';

const critical = [];
const warnings = [];
const ids = new Set();
const namesByLanguage = Object.fromEntries(SUPPORTED_LANGUAGES.map(lang => [lang, new Map()]));
const imageOwners = new Map();
const allowedTypes = new Set(['Mascote','Montascote']);

for (const item of creatureCatalog) {
  if (!item.id?.trim()) critical.push('Registro sem ID.');
  else if (ids.has(item.id)) critical.push(`ID duplicado: ${item.id}`);
  else ids.add(item.id);
  if (!allowedTypes.has(item.type)) critical.push(`Tipo inválido em ${item.id}: ${item.type}`);
  if (!item.canonicalName?.trim()) critical.push(`Nome canônico ausente: ${item.id}`);
  if (!item.names?.['pt-BR']?.trim()) warnings.push(`Português ausente: ${item.id}`);
  for (const lang of SUPPORTED_LANGUAGES) {
    const name = String(item.names?.[lang] || '').trim();
    if (!name) { warnings.push(`Tradução ${lang} ausente: ${item.id}`); continue; }
    const key = name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if (namesByLanguage[lang].has(key)) warnings.push(`Nome duplicado em ${lang}: ${name}`);
    else namesByLanguage[lang].set(key,item.id);
  }
  if (!item.imageUrl) warnings.push(`Imagem ausente: ${item.id}`);
  else {
    try { new URL(item.imageUrl, 'https://dofus4business.com.br'); } catch { critical.push(`URL inválida: ${item.id}`); }
    const previous = imageOwners.get(item.imageUrl);
    if (previous) warnings.push(`Imagem compartilhada: ${previous} e ${item.id}`);
    else imageOwners.set(item.imageUrl,item.id);
  }
  if (item.canonicalName !== item.canonicalName.trim()) warnings.push(`Espaços no nome: ${item.id}`);
}

if (critical.length) {
  console.error(critical.join('\n'));
  process.exit(1);
}
console.log(`Catálogo válido: ${creatureCatalog.length} criaturas, ${warnings.length} avisos não bloqueantes.`);
if (warnings.length) console.log(warnings.slice(0,20).map(item=>`- ${item}`).join('\n') + (warnings.length>20?'\n- …':'') );
