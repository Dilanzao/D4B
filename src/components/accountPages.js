import { accountApiConfigurationMessage, isAccountApiConfigured } from '../config/accountApi.js';
import { escapeHtml, icon, t } from './common.js';

const value = input => escapeHtml(input ?? '');

function breadcrumb(state, current) {
  return `<div class="breadcrumbs"><button data-action="route" data-route="home">${escapeHtml(t(state,'v3.nav.home'))}</button><span>›</span><span aria-current="page">${escapeHtml(current)}</span></div>`;
}

function apiNotice(state) {
  if (isAccountApiConfigured()) return '';
  return `<div class="account-api-warning">${icon('alert',18)}<div><strong>${escapeHtml(t(state,'v310.account.apiNotConfiguredTitle'))}</strong><p>${escapeHtml(accountApiConfigurationMessage())}</p></div></div>`;
}

function passwordWarning(state) {
  return `<div class="password-warning">${icon('alert',18)}<span>${escapeHtml(t(state,'v310.account.passwordWarning'))}</span></div>`;
}

function serverOptions(state, selected = '') {
  return `<option value="">${escapeHtml(t(state,'v310.account.selectServer'))}</option>${(state.servers||[]).map(server=>`<option value="${value(server.id)}" ${String(server.id)===String(selected)?'selected':''}>${value(server.name)}${server.type?` — ${value(server.type)}`:''}</option>`).join('')}`;
}

function authShell(state, title, description, body) {
  return `<section class="account-page stack">${breadcrumb(state,title)}<div class="account-page-grid"><article class="card account-card"><div class="account-card-head"><span class="account-card-icon">${icon('user',24)}</span><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div></div>${apiNotice(state)}${body}</article><aside class="card account-help"><span class="eyebrow">Dofus4Business</span><h2>${escapeHtml(t(state,'v310.account.communityTitle'))}</h2><p>${escapeHtml(t(state,'v310.account.communityText'))}</p>${passwordWarning(state)}</aside></div></section>`;
}

export function renderLoginPage(state) {
  const draft=state.accountUi?.login||{};
  return authShell(state,t(state,'v310.account.loginTitle'),t(state,'v310.account.loginDescription'),`
    <form class="account-form" data-form="login">
      <label>${escapeHtml(t(state,'v310.account.email'))}<input type="email" autocomplete="email" required data-account-field="login.email" value="${value(draft.email)}"></label>
      <label>${escapeHtml(t(state,'v310.account.password'))}<input type="password" autocomplete="current-password" required data-account-field="login.password" value="${value(draft.password)}"></label>
      <label class="check-row"><input type="checkbox" data-account-field="login.rememberConnected" ${draft.rememberConnected?'checked':''}><span>${escapeHtml(t(state,'v310.account.keepConnected'))}</span></label>
      ${passwordWarning(state)}
      <button class="button primary account-submit" type="submit" ${state.accountUi?.busy?'disabled':''}>${icon('user',17)} ${escapeHtml(t(state,'v310.account.enter'))}</button>
      <div class="account-links"><button type="button" data-action="route" data-route="forgot-password">${escapeHtml(t(state,'v310.account.forgotPassword'))}</button><button type="button" data-action="route" data-route="register">${escapeHtml(t(state,'v310.account.createAccount'))}</button></div>
    </form>`);
}

export function renderRegisterPage(state) {
  const draft=state.accountUi?.register||{};
  return authShell(state,t(state,'v310.account.registerTitle'),t(state,'v310.account.registerDescription'),`
    <form class="account-form" data-form="register">
      <label>${escapeHtml(t(state,'v310.account.displayName'))}<input type="text" autocomplete="nickname" minlength="2" maxlength="40" required data-account-field="register.displayName" value="${value(draft.displayName)}"></label>
      <label>${escapeHtml(t(state,'v310.account.email'))}<input type="email" autocomplete="email" required data-account-field="register.email" value="${value(draft.email)}"></label>
      <label>${escapeHtml(t(state,'v310.account.server'))}<select required data-account-field="register.serverId">${serverOptions(state,draft.serverId)}</select></label>
      <label>${escapeHtml(t(state,'v310.account.password'))}<input type="password" autocomplete="new-password" minlength="10" required data-account-field="register.password" value="${value(draft.password)}"></label>
      <label>${escapeHtml(t(state,'v310.account.confirmPassword'))}<input type="password" autocomplete="new-password" minlength="10" required data-account-field="register.confirmPassword" value="${value(draft.confirmPassword)}"></label>
      ${passwordWarning(state)}
      <button class="button primary account-submit" type="submit" ${state.accountUi?.busy?'disabled':''}>${icon('plus',17)} ${escapeHtml(t(state,'v310.account.createAccount'))}</button>
      <div class="account-links"><button type="button" data-action="route" data-route="login">${escapeHtml(t(state,'v310.account.alreadyHaveAccount'))}</button></div>
    </form>`);
}

export function renderForgotPasswordPage(state) {
  const draft=state.accountUi?.forgot||{};
  return authShell(state,t(state,'v310.account.forgotTitle'),t(state,'v310.account.forgotDescription'),`
    <form class="account-form" data-form="forgot-password">
      <label>${escapeHtml(t(state,'v310.account.email'))}<input type="email" autocomplete="email" required data-account-field="forgot.email" value="${value(draft.email)}"></label>
      <button class="button primary account-submit" type="submit" ${state.accountUi?.busy?'disabled':''}>${escapeHtml(t(state,'v310.account.sendRecovery'))}</button>
      <div class="account-links"><button type="button" data-action="route" data-route="login">${escapeHtml(t(state,'v310.account.backToLogin'))}</button></div>
    </form>`);
}

export function renderVerifyEmailPage(state) {
  const status=state.accountUi?.verificationStatus||'idle';
  return authShell(state,t(state,'v310.account.verifyTitle'),t(state,'v310.account.verifyDescription'),`
    <div class="account-status ${status}">
      ${status==='loading'?`<span class="spinner"></span><p>${escapeHtml(t(state,'v310.account.verifying'))}</p>`:''}
      ${status==='success'?`${icon('check',28)}<p>${escapeHtml(t(state,'v310.account.verified'))}</p><button class="button primary" data-action="route" data-route="login">${escapeHtml(t(state,'v310.account.enter'))}</button>`:''}
      ${status==='error'?`${icon('alert',28)}<p>${escapeHtml(state.accountUi?.verificationMessage||t(state,'v310.account.verificationFailed'))}</p>`:''}
      ${status==='idle'?`<p>${escapeHtml(t(state,'v310.account.verificationWaiting'))}</p>`:''}
    </div>`);
}

export function renderResetPasswordPage(state) {
  const draft=state.accountUi?.reset||{};
  return authShell(state,t(state,'v310.account.resetTitle'),t(state,'v310.account.resetDescription'),`
    <form class="account-form" data-form="reset-password">
      <label>${escapeHtml(t(state,'v310.account.newPassword'))}<input type="password" autocomplete="new-password" minlength="10" required data-account-field="reset.password" value="${value(draft.password)}"></label>
      <label>${escapeHtml(t(state,'v310.account.confirmPassword'))}<input type="password" autocomplete="new-password" minlength="10" required data-account-field="reset.confirmPassword" value="${value(draft.confirmPassword)}"></label>
      ${passwordWarning(state)}
      <button class="button primary account-submit" type="submit" ${state.accountUi?.busy?'disabled':''}>${escapeHtml(t(state,'v310.account.saveNewPassword'))}</button>
    </form>`);
}

export function renderAccountSettingsPage(state) {
  if (!state.account?.user) {
    return authShell(state,t(state,'v310.account.settingsTitle'),t(state,'v310.account.loginRequired'),`<button class="button primary" data-action="route" data-route="login">${escapeHtml(t(state,'v310.account.enter'))}</button>`);
  }
  const user=state.account.user;
  const draft=state.accountUi?.settings||{displayName:user.displayName||'',serverId:user.serverId||'',priceMode:user.priceMode||'COMUNIDADE'};
  return `<section class="account-page stack">${breadcrumb(state,t(state,'v310.account.settingsTitle'))}<div class="section-head"><div><span class="eyebrow">${escapeHtml(user.email||'')}</span><h1>${escapeHtml(t(state,'v310.account.settingsTitle'))}</h1><p>${escapeHtml(t(state,'v310.account.settingsDescription'))}</p></div></div>${apiNotice(state)}
  <div class="account-settings-grid">
    <article class="card section">
      <h2>${escapeHtml(t(state,'v310.account.preferences'))}</h2>
      <form class="account-form" data-form="account-settings">
        <label>${escapeHtml(t(state,'v310.account.displayName'))}<input type="text" minlength="2" maxlength="40" required data-account-field="settings.displayName" value="${value(draft.displayName)}"></label>
        <label>${escapeHtml(t(state,'v310.account.currentServer'))}<select data-account-field="settings.serverId">${serverOptions(state,draft.serverId)}</select></label>
        <fieldset class="price-mode-fieldset"><legend>${escapeHtml(t(state,'v310.account.pricePreference'))}</legend>
          <label class="radio-card"><input type="radio" name="priceMode" value="COMUNIDADE" data-account-field="settings.priceMode" ${draft.priceMode!=='PROPRIOS'?'checked':''}><span><strong>${escapeHtml(t(state,'v310.account.communityPrices'))}</strong><small>${escapeHtml(t(state,'v310.account.communityPricesHelp'))}</small></span></label>
          <label class="radio-card"><input type="radio" name="priceMode" value="PROPRIOS" data-account-field="settings.priceMode" ${draft.priceMode==='PROPRIOS'?'checked':''}><span><strong>${escapeHtml(t(state,'v310.account.ownPrices'))}</strong><small>${escapeHtml(t(state,'v310.account.ownPricesHelp'))}</small></span></label>
        </fieldset>
        <button class="button primary" type="submit" ${state.accountUi?.busy?'disabled':''}>${escapeHtml(t(state,'common.save'))}</button>
      </form>
    </article>
    <article class="card section">
      <h2>${escapeHtml(t(state,'v310.account.changePassword'))}</h2>
      <form class="account-form" data-form="change-password">
        <label>${escapeHtml(t(state,'v310.account.currentPassword'))}<input type="password" autocomplete="current-password" required data-account-field="changePassword.currentPassword"></label>
        <label>${escapeHtml(t(state,'v310.account.newPassword'))}<input type="password" autocomplete="new-password" minlength="10" required data-account-field="changePassword.newPassword"></label>
        <label>${escapeHtml(t(state,'v310.account.confirmPassword'))}<input type="password" autocomplete="new-password" minlength="10" required data-account-field="changePassword.confirmPassword"></label>
        ${passwordWarning(state)}
        <button class="button secondary" type="submit" ${state.accountUi?.busy?'disabled':''}>${escapeHtml(t(state,'v310.account.changePassword'))}</button>
      </form>
      <div class="account-session-actions"><button class="button ghost" data-action="account-logout">${icon('logout',17)} ${escapeHtml(t(state,'v310.account.logout'))}</button><button class="button danger ghost" data-action="account-logout-all">${escapeHtml(t(state,'v310.account.logoutAll'))}</button></div>
    </article>
  </div></section>`;
}
