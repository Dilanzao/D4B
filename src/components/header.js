import { APP_VERSION, SUPPORTED_LANGUAGES } from '../config/app.js';
import { translations } from '../i18n/translations.js';
import { escapeHtml, icon, t } from './common.js';

const activeFor = (routeName, group) => {
  if (group === 'home') return routeName === 'home';
  if (group === 'pets') return routeName?.startsWith('pet') || routeName === 'pets';
  if (group === 'crafts') return routeName?.startsWith('craft');
  if (group === 'global-sales') return routeName === 'global-sales';
  if (group === 'settings') return routeName === 'settings';
  return false;
};

export function renderHeader(state) {
  const navItems = [
    ['home','v3.nav.home','home'],
    ['pets','v3.nav.pets','heart'],
    ['crafts','v3.nav.crafts','craft'],
    ['global-sales','v3.nav.sales','sale']
  ];
  const routeName=state.route?.name||state.view;
  const nav = navItems.map(([route,key,iconName]) => `<button data-action="route" data-route="${route}" ${activeFor(routeName,route)?'aria-current="page"':''}>${icon(iconName,16)}<span>${escapeHtml(t(state,key))}</span></button>`).join('');
  const how = `<button data-action="open-information" data-section="how">${icon('details',16)}<span>${escapeHtml(t(state,'nav.guide'))}</span></button>`;
  return `<header class="header"><div class="container header-inner">
    <div class="language">
      <button class="language-trigger" data-action="toggle-language" aria-label="${escapeHtml(translations[state.language].languageName)}" aria-haspopup="listbox" aria-expanded="false">
        <img src="/assets/flags/${state.language}.svg" alt="${escapeHtml(translations[state.language].languageName)}">
      </button>
      <div class="language-menu" data-language-menu hidden role="listbox">
        ${SUPPORTED_LANGUAGES.map(lang=>`<button role="option" aria-selected="${lang===state.language}" class="${lang===state.language?'active':''}" data-action="set-language" data-language="${lang}"><img src="/assets/flags/${lang}.svg" alt=""><span>${escapeHtml(translations[lang].languageName)}</span></button>`).join('')}
      </div>
    </div>
    <button class="brand" data-action="route" data-route="home" aria-label="Dofus4Business">
      <img class="brand-logo" src="/assets/brand/logo-header.webp" alt="Dofus4Business"><span><strong>Dofus4Business</strong><small>${escapeHtml(t(state,'v3.common.platformSubtitle'))}</small></span>
    </button>
    <span class="version-pill">v${APP_VERSION}</span>
    <nav class="nav" aria-label="${escapeHtml(t(state,'v3.nav.home'))}">${nav}${how}</nav>
    <div class="header-actions">
      <button class="button ghost support-top" data-action="open-support">${icon('heart',17)} ${escapeHtml(t(state,'nav.support'))}</button>
      <button class="icon-button mobile-toggle" data-action="toggle-mobile" aria-label="Menu" aria-expanded="false">${icon('menu')}</button>
    </div>
  </div><nav class="container nav mobile-nav" data-mobile-nav hidden aria-label="Mobile">${nav}${how}</nav></header>`;
}
