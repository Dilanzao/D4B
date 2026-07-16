import { APP_VERSION, CATALOG_UPDATED_AT } from '../config/app.js';
import { adSlot, escapeHtml, t } from './common.js';

function localizedDate(language) {
  try { return new Intl.DateTimeFormat(language).format(new Date(`${CATALOG_UPDATED_AT}T12:00:00`)); } catch { return CATALOG_UPDATED_AT; }
}

export function renderFooter(state) {
  const date = localizedDate(state.language);
  return `${adSlot('ad-slot-footer','footer-ad container',state)}<footer class="footer"><div class="container compact-footer">
    <div class="footer-brand"><img src="./assets/brand/logo-header.webp" alt="Dofus4Business"><div><strong>Dofus4Business</strong><small>v${APP_VERSION}</small></div></div>
    <div class="footer-actions">
      <button class="button ghost" data-action="open-information" data-section="about">${escapeHtml(t(state,'footer.transparency'))}</button>
      <button class="button ghost" data-action="open-consent">${escapeHtml(t(state,'footer.privacyPreferences'))}</button>
      <button class="button ghost" data-action="open-support">${escapeHtml(t(state,'support.button'))}</button>
    </div>
    <p class="footer-source-summary">${escapeHtml(t(state,'footer.sourceSummary',{date}))}</p>
    <p class="footer-disclaimer">${escapeHtml(t(state,'footer.disclaimer'))}</p>
  </div></footer>`;
}
