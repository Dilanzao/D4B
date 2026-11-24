import { SUPPORTED_LANGUAGES } from '../config/app.js';
import { translations } from '../i18n/translations.js';
import { escapeHtml, icon, t } from './common.js';

const activeFor = (routeName, group) => {
  if (group === 'home') return routeName === 'home';
  if (group === 'pets') return routeName?.startsWith('pet') || routeName === 'pets';
  if (group === 'crafts') return routeName?.startsWith('craft');
  if (group === 'builder') return routeName === 'builder';
  if (group === 'global-sales') return routeName === 'global-sales' || routeName === 'global-inventory';
  return false;
};

export function renderHeader(state) {
  const navItems = [
    ['home','v3.nav.home','home'],
    ['pets','v3.nav.pets','heart'],
    ['crafts','v3.nav.crafts','craft'],
    ['builder','builder.nav','shield'],
    ['global-sales','v3.nav.sales','sale']
  ];
  const routeName=state.route?.name||state.view;
  const nav = navItems.map(([route,key,iconName]) => `<button data-action="route" data-route="${route}" ${activeFor(routeName,route)?'aria-current="page"':''}>${icon(iconName,17)}<span>${escapeHtml(t(state,key))}</span></button>`).join('');
  const guideLabel = escapeHtml(t(state,'nav.guide'));
  const supportLabel = escapeHtml(t(state,'nav.support'));
  const user = state.account?.user;
  const serverName = state.account?.selectedServer?.name || user?.serverId || '';
  return `<header class="header"><div class="container header-inner">
    <button class="brand" data-action="route" data-route="home" aria-label="Dofus4Business">
      <img class="brand-logo" src="/assets/brand/logo-header.webp" alt=""><strong>Dofus4Business</strong>
    </button>
    <nav class="nav" aria-label="${escapeHtml(t(state,'ux.mainNav'))}">${nav}</nav>
    <div class="header-actions">
      <button class="icon-button help-top" data-action="open-information" data-section="how" aria-label="${guideLabel}" title="${guideLabel}">${icon('details',18)}</button>
      <button class="button ghost compact support-top" data-action="open-support">${icon('heart',17)} ${supportLabel}</button>
      <div class="language">
        <button class="language-trigger" data-action="toggle-language" aria-label="${escapeHtml(translations[state.language].languageName)}" aria-haspopup="listbox" aria-expanded="false">
          <img src="/assets/flags/${state.language}.svg" alt="">
        </button>
        <div class="language-menu" data-language-menu hidden role="listbox">
          ${SUPPORTED_LANGUAGES.map(lang=>`<button role="option" aria-selected="${lang===state.language}" class="${lang===state.language?'active':''}" data-action="set-language" data-language="${lang}"><img src="/assets/flags/${lang}.svg" alt=""><span>${escapeHtml(translations[lang].languageName)}</span></button>`).join('')}
        </div>
      </div>
      <button class="account-chip ${user?'connected':'anonymous'}" data-action="route" data-route="${user?'account-settings':'login'}" aria-label="${escapeHtml(user?t(state,'v310.account.settingsTitle'):t(state,'v310.account.enter'))}">
        ${icon('user',18)}
        <span><strong>${escapeHtml(user?.displayName||t(state,'v310.account.enter'))}</strong>${serverName?`<small>${escapeHtml(serverName)}</small>`:''}</span>
      </button>
      <button class="icon-button mobile-toggle" data-action="toggle-mobile" aria-label="Menu" aria-expanded="false">${icon('menu')}</button>
    </div>
  </div><nav class="container nav mobile-nav" data-mobile-nav hidden aria-label="${escapeHtml(t(state,'ux.mainNav'))}">${nav}<button data-action="open-information" data-section="how">${icon('details',17)}<span>${guideLabel}</span></button><button data-action="open-support">${icon('heart',17)}<span>${supportLabel}</span></button></nav></header>`;
}
