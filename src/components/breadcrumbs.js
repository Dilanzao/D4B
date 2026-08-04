import { escapeHtml, icon, t } from './common.js';

export function renderBreadcrumbs(state, items = []) {
  if (!items.length) return '';
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><button data-action="route" data-route="home">${escapeHtml(t(state,'v3.nav.home'))}</button>${items.map((item,index)=>`<span aria-hidden="true">${icon('chevron',13)}</span>${item.route&&index<items.length-1?`<button data-action="route" data-route="${escapeHtml(item.route)}">${escapeHtml(item.label)}</button>`:`<span aria-current="page">${escapeHtml(item.label)}</span>`}`).join('')}</nav>`;
}
