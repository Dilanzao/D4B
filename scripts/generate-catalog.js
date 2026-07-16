import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'src/data/catalog-source.tsv');
const outputPath = resolve(root, 'src/data/creatures.js');

const normalizeSpace = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const slugify = value => normalizeSpace(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const extractItemId = url => String(url).match(/item\/(\d+)-/)?.[1] || '';

const raw = await readFile(sourcePath, 'utf8');
const [header, ...lines] = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
const columns = header.split('\t').map(normalizeSpace);
const expected = ['Tipo','Criatura em Portugues','Criatura em Francês','Criatura em Inglês','Criatura em Espanhol','Imagem URL'];
if (columns.length < expected.length) throw new Error('Catálogo TSV com colunas insuficientes.');

const items = lines.map((line, index) => {
  const [type, pt, fr = '', en = '', es = '', imageUrl = ''] = line.split('\t').map(normalizeSpace);
  const itemId = extractItemId(imageUrl);
  const canonicalName = pt || fr || en || es || `Criatura ${index + 1}`;
  return {
    id: `${itemId ? `item-${itemId}-` : ''}${slugify(canonicalName)}`,
    type,
    canonicalName,
    names: {'pt-BR': pt, 'fr-FR': fr, 'en-US': en, 'es-ES': es},
    imageUrl: imageUrl || '/assets/placeholders/creature-fallback.svg',
    imageSource: {
      name: imageUrl ? 'Dofusdude API — URL fornecida no catálogo Dofus4Business' : 'Placeholder Dofus4Business',
      url: imageUrl,
      license: imageUrl ? 'Condição de uso não informada no catálogo anexado' : 'Arte própria do projeto',
      attribution: imageUrl ? 'DOFUS e seus elementos pertencem aos respectivos titulares; referência informativa.' : 'Dofus4Business',
      accessedAt: '2026-07-16'
    }
  };
});

const module = `/**\n * Catálogo gerado a partir do arquivo multilíngue fornecido pelo proprietário.\n * Não é feita busca ao vivo nem scraping no navegador.\n */\nexport const creatureCatalog = ${JSON.stringify(items, null, 2)};\n\nexport const normalizeCreatureText = (value = '') => String(value).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLocaleLowerCase().replace(/\\s+/g, ' ').trim();\n\nexport function getCreatureById(id) {\n  return creatureCatalog.find(item => item.id === id) || null;\n}\n\nexport function getCreatureName(creature, language = 'pt-BR') {\n  if (!creature) return '';\n  return creature.names?.[language]?.trim() || creature.canonicalName?.trim() || creature.names?.['pt-BR']?.trim() || 'Nome não disponível';\n}\n\nexport function findCreatureMatch(value, type = '') {\n  const wanted = normalizeCreatureText(value);\n  if (!wanted) return null;\n  return creatureCatalog.find(item => (!type || item.type === type) && [item.id, item.canonicalName, ...Object.values(item.names || {})].some(name => normalizeCreatureText(name) === wanted)) || null;\n}\n\nexport function searchCreatures({ type, query = '', language = 'pt-BR', limit = 30 } = {}) {\n  const wanted = normalizeCreatureText(query);\n  return creatureCatalog\n    .filter(item => !type || item.type === type)\n    .filter(item => !wanted || [getCreatureName(item, language), item.canonicalName, ...Object.values(item.names || {})].some(name => normalizeCreatureText(name).includes(wanted)))\n    .sort((a, b) => getCreatureName(a, language).localeCompare(getCreatureName(b, language), language))\n    .slice(0, Math.max(1, limit));\n}\n`;
await writeFile(outputPath, module);
console.log(`Catálogo gerado: ${items.length} criaturas.`);
