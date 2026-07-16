import { SALES_API_KEY, SALES_API_URL } from '../config/salesApi.js';

const activeRequests = new Map();

export async function registerSaleInApi(payload, signal) {
  const response = await fetch(SALES_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    keepalive: true,
    signal
  });
  const responseText = await response.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    throw new Error('Invalid API response.');
  }
  if (!responseData.ok) throw new Error(responseData.message || 'Unable to register sale.');
  return responseData;
}

export function buildSalePayload(sale) {
  return {
    action: 'criarVenda',
    apiKey: SALES_API_KEY,
    nomeCriatura: sale.creatureCanonicalName,
    tipoCriatura: sale.creatureType,
    nomeSimulacao: sale.simulationName,
    custoCriaturaOrigem: sale.originCost,
    custoUp: sale.upCost,
    precoVenda: sale.salePrice,
    canalVenda: sale.saleChannel
  };
}

export async function syncSale(sale, onSuccess, onFailure) {
  if (!sale || sale.apiRegistered || sale.syncStatus === 'synced' || activeRequests.has(sale.id)) return;
  const controller = new AbortController();
  activeRequests.set(sale.id, controller);
  try {
    const responseData = await registerSaleInApi(buildSalePayload(sale), controller.signal);
    onSuccess?.({ apiRegistered: true, syncStatus: 'synced', apiRow: responseData.data?.linha ?? null });
  } catch (error) {
    if (error?.name !== 'AbortError') onFailure?.({ apiRegistered: false, syncStatus: 'failed' });
  } finally {
    activeRequests.delete(sale.id);
  }
}

export function cancelSaleSync(saleId) {
  const request = activeRequests.get(saleId);
  if (request) request.abort();
  activeRequests.delete(saleId);
}
