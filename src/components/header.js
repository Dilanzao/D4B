import { APP_VERSION, SUPPORTED_LANGUAGES } from '../config/app.js';
import { translations } from '../i18n/translations.js';
import { escapeHtml, icon, t } from './common.js';

export function renderHeader(state) {
  const navItems = [
    ['dashboard','nav.dashboard'],
    ['simulations','nav.simulations'],
    ['sales','nav.sales']
  ];
  const nav = navItems.map(([view,key]) => `<button data-action="navigate" data-view="${view}" ${state.view===view?'aria-current="page"':''}>${escapeHtml(t(state,key))}</button>`).join('');
  const how = `<button data-action="open-information" data-section="how">${escapeHtml(t(state,'nav.guide'))}</button>`;
  return `<header class="header"><div class="container header-inner">
    <div class="language">
      <button class="language-trigger" data-action="toggle-language" aria-label="${escapeHtml(translations[state.language].languageName)}" aria-haspopup="listbox" aria-expanded="false">
        <img src="./assets/flags/${state.language}.svg" alt="${escapeHtml(translations[state.language].languageName)}">
      </button>
      <div class="language-menu" data-language-menu hidden role="listbox">
        ${SUPPORTED_LANGUAGES.map(lang=>`<button role="option" aria-selected="${lang===state.language}" class="${lang===state.language?'active':''}" data-action="set-language" data-language="${lang}"><img src="./assets/flags/${lang}.svg" alt=""><span>${escapeHtml(translations[lang].languageName)}</span></button>`).join('')}
      </div>
    </div>
    <button class="brand" data-action="navigate" data-view="dashboard" aria-label="Dofus4Business">
      <img class="brand-logo" src="./assets/brand/logo-header.webp" alt="Dofus4Business"><span><strong>Dofus4Business</strong><small>${escapeHtml(t(state,'common.subtitle'))}</small></span>
    </button>
    <span class="version-pill">v${APP_VERSION}</span>
    <nav class="nav" aria-label="${escapeHtml(t(state,'nav.dashboard'))}">${nav}${how}</nav>
    <div class="header-actions">
      <button class="button ghost support-top" data-action="open-support">${icon('heart',17)} ${escapeHtml(t(state,'nav.support'))}</button>
      <button class="icon-button mobile-toggle" data-action="toggle-mobile" aria-label="Menu" aria-expanded="false">${icon('menu')}</button>
    </div>
  </div><nav class="container nav mobile-nav" data-mobile-nav hidden aria-label="Mobile">${nav}${how}</nav></header>`;
}
