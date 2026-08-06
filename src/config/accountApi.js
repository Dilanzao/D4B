const runtime = globalThis.D4B_RUNTIME_CONFIG || {};

export const ACCOUNT_API_URL = String(runtime.accountApiUrl || '').trim();

export function isAccountApiConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/i.test(ACCOUNT_API_URL);
}

export function accountApiConfigurationMessage() {
  return isAccountApiConfigured()
    ? ''
    : 'Configure a URL /exec do Google Apps Script em public/runtime-config.js.';
}
