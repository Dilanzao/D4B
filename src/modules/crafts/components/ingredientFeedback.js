import { escapeHtml, t } from '../../../components/common.js';

// Só aponta o próprio campo quando é o preço deste ingrediente que falta
// (e não o de um item da sua sub-receita).
export function missingPriceError(state, line) {
  const missing = line.acquisitionMode === 'buy' && (line.missing || []).some(item => item.reason === 'price');
  return missing ? `<span class="error">${escapeHtml(t(state, 'ux.missingPrice'))}</span>` : '';
}
