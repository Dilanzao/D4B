import { ADS_ENABLED } from '../config/app.js';
import { getTranslation } from '../i18n/translations.js';
import { advertisingAllowed } from '../services/consentService.js';

export const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export function t(state, path, variables = {}) {
  return getTranslation(state.language, path, variables);
}

export function icon(name, size = 20) {
  const paths = {
    coin:'<circle cx="12" cy="12" r="9"/><path d="M9 9.2c0-1.1 1.2-2 3-2s3 .9 3 2-1.2 2-3 2-3 .9-3 2 1.2 2 3 2 3-.9 3-2M12 5v14"/>',
    plus:'<path d="M12 5v14M5 12h14"/>', edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    sale:'<path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7"/><path d="M8 9l4-4 4 4M12 5v10"/>',
    details:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', close:'<path d="M5 5l14 14M19 5L5 19"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>', down:'<path d="m6 9 6 6 6-6"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    check:'<path d="m5 12 4 4L19 6"/>', back:'<path d="m15 18-6-6 6-6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    sync:'<path d="M20 7h-5V2M4 17h5v5"/><path d="M5.1 9a8 8 0 0 1 13.2-3L20 7M4 17l1.7 1a8 8 0 0 0 13.2-3"/>',
    pix:'<path d="M8.4 4.4 4.8 8a2.8 2.8 0 0 0 0 4l3.6 3.6a2.8 2.8 0 0 0 4 0l3.6-3.6a2.8 2.8 0 0 0 0-4l-3.6-3.6a2.8 2.8 0 0 0-4 0Z"/><path d="m8 12 2-2a2.8 2.8 0 0 1 4 0l2 2"/>',
    external:'<path d="M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/>',
    home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    craft:'<path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L3 18l3 3 6.1-6.1a4 4 0 0 0 5.6-5.6l-2.4 2.4-3-3Z"/><path d="m16 4 4 4"/>',
    box:'<path d="m21 8-9 5-9-5 9-5 9 5Z"/><path d="m3 8 9 5 9-5v9l-9 5-9-5Z"/><path d="M12 13v9"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    alert:'<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.details}</svg>`;
}

export function adSlot(id, className, state) {
  const canLoadAds = advertisingAllowed(state.consent);
  const placeholder = `<div><strong>${escapeHtml(t(state,'common.advertisement'))}</strong><small>${escapeHtml(t(state,'common.adHelp'))}</small></div>`;
  return `<aside id="${id}" class="ad-slot ${className}" data-ad-slot="${id}" data-ads-enabled="${ADS_ENABLED}" data-ad-consent="${Boolean(state.consent?.advertising)}" aria-label="${escapeHtml(t(state,'common.advertisement'))}">${canLoadAds ? '<div class="adsense-mount" aria-hidden="true"></div>' : placeholder}</aside>`;
}

export function imageTag(src, alt, className = '') {
  return `<img class="${className}" src="${escapeHtml(src || './assets/placeholders/creature-fallback.svg')}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="128" height="128" onerror="this.onerror=null;this.src='./assets/placeholders/creature-fallback.svg'">`;
}
