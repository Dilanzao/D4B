// Últimos preços informados neste navegador, separados por servidor.
export const PET_PRICES_KEY = 'd4b_pet_prices_v1';

const positive = value => Math.max(0, Math.round(Number(value) || 0));

function clean(raw) {
  const resources = Object.fromEntries(Object.entries(raw?.resources || {}).map(([id, price]) => [id, positive(price)]).filter(([, price]) => price > 0));
  return { ration: positive(raw?.ration), bag: positive(raw?.bag), resources };
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(PET_PRICES_KEY) || '{}') || {}; } catch { return {}; }
}

// Sem conta, usa a lista geral. No primeiro acesso a um servidor, ela serve de ponto de partida
// somente se nenhum outro servidor já a tiver herdado.
export function loadPetPrices(serverId = '') {
  const all = readAll();
  const servers = all.servers || {};
  if (!serverId) return clean(all);
  if (servers[serverId]) return clean(servers[serverId]);
  return clean(Object.keys(servers).length ? {} : all);
}

export function savePetPrices(prices, serverId = '') {
  const all = readAll();
  const next = serverId
    ? { ...all, servers: { ...(all.servers || {}), [serverId]: clean(prices) } }
    : { ...clean(prices), servers: all.servers || {} };
  try { localStorage.setItem(PET_PRICES_KEY, JSON.stringify(next)); return true; } catch { return false; }
}
