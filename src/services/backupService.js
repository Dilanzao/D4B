// Exporta e importa os dados locais do usuário. Sessões e caches nunca entram no arquivo.
export const BACKUP_KEYS = [
  'd4b_language_v2', 'd4b_simulations_v2', 'd4b_sales_v2', 'd4b_preferences_v2',
  'd4b_craft_projects_v1', 'd4b_craft_batches_v1', 'd4b_craft_inventory_v1', 'd4b_craft_sales_v1',
  'd4b_craft_prices_v1', 'd4b_global_activities_v1', 'd4b_resource_xp_memory_v1', 'd4b_pet_prices_v1', 'd4b_builds_v1'
];
const ARRAY_KEYS = new Set(BACKUP_KEYS.filter(key => /simulations|sales|projects|batches|inventory|activities|builds/.test(key)));
// Estes campos são usados como atributos na página: aceitamos apenas texto simples.
const IDENTIFIER_FIELD = /^(id|status|syncStatus|module|.*Id|.*Ids)$/;
const SAFE_IDENTIFIER = /^[\w .:+-]*$/u;

function assertSafe(value, key = '') {
  if (Array.isArray(value)) { value.forEach(item => assertSafe(item, key)); return; }
  if (value && typeof value === 'object') { Object.entries(value).forEach(([name, item]) => assertSafe(item, name)); return; }
  if (typeof value === 'string' && IDENTIFIER_FIELD.test(key) && !SAFE_IDENTIFIER.test(value)) throw new Error('invalid');
}

export function createBackup(version) {
  const data = {};
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) data[key] = raw;
  }
  return { app: 'dofus4business', format: 1, version, exportedAt: new Date().toISOString(), data };
}

export function parseBackup(text) {
  const backup = JSON.parse(text);
  if (backup?.app !== 'dofus4business' || backup.format !== 1 || !backup.data || typeof backup.data !== 'object') throw new Error('invalid');
  const entries = Object.entries(backup.data).filter(([key, raw]) => BACKUP_KEYS.includes(key) && typeof raw === 'string');
  if (!entries.length) throw new Error('invalid');
  for (const [key, raw] of entries) {
    if (key === 'd4b_language_v2') continue; // gravado como texto puro
    const parsed = JSON.parse(raw);
    if (ARRAY_KEYS.has(key) && !Array.isArray(parsed)) throw new Error('invalid');
    assertSafe(parsed);
  }
  return { exportedAt: backup.exportedAt || '', entries };
}

// Substitui os dados atuais; se a gravação falhar no meio, volta ao estado anterior.
export function restoreBackup({ entries }) {
  const previous = BACKUP_KEYS.map(key => [key, localStorage.getItem(key)]);
  const write = rows => rows.forEach(([key, raw]) => { if (raw === null) localStorage.removeItem(key); else localStorage.setItem(key, raw); });
  try {
    BACKUP_KEYS.forEach(key => localStorage.removeItem(key));
    write(entries);
  } catch (error) {
    BACKUP_KEYS.forEach(key => localStorage.removeItem(key));
    write(previous);
    throw error;
  }
}
