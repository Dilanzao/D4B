import { escapeHtml, t } from './common.js';

// Navegação interna de cada área. Toda tela de listagem precisa estar em um destes grupos,
// para que nenhuma rota fique acessível apenas por URL.
const TAB_GROUPS = {
  pets: [['pets', 'nav.dashboard'], ['pet-simulations', 'nav.simulations'], ['pet-resources', 'pet.tab'], ['pet-sales', 'nav.sales']],
  crafts: [['crafts', 'ux.tabs.projects'], ['craft-inventory', 'v3.nav.inventory'], ['craft-sales', 'v3.nav.sales']],
  sales: [['global-sales', 'ux.tabs.history'], ['global-inventory', 'ux.tabs.forSale']]
};

export function renderTabs(state, group) {
  const current = state.route?.name === 'craft-projects' ? 'crafts' : state.route?.name;
  return `<nav class="tabs" aria-label="${escapeHtml(t(state, 'ux.sections'))}">${TAB_GROUPS[group].map(([route, key]) => `<button data-action="route" data-route="${route}" ${current === route ? 'aria-current="page"' : ''}>${escapeHtml(t(state, key))}</button>`).join('')}</nav>`;
}

export function renderPageHead(state, { title, description = '', actions = '', tabs = '' }) {
  return `<div class="page-head"><div><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ''}</div>${actions ? `<div class="button-row">${actions}</div>` : ''}</div>${tabs ? renderTabs(state, tabs) : ''}`;
}

// O estado aberto/fechado sobrevive às renderizações (ver listener "toggle" em main.js).
export function renderDisclosure(state, id, label, body, { open = false, className = '' } = {}) {
  const isOpen = state.disclosures?.[id] ?? open;
  return `<details class="disclosure ${className}" data-disclosure="${escapeHtml(id)}" ${isOpen ? 'open' : ''}><summary>${escapeHtml(label)}</summary><div class="disclosure-body">${body}</div></details>`;
}

export function moreFiltersLabel(state, activeCount) {
  return `${t(state, 'ux.moreFilters')}${activeCount ? ` (${activeCount})` : ''}`;
}
