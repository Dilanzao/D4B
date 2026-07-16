export const APP_VERSION = "2.2.0";
export const APP_NAME = "Dofus4Business";
export const APP_DOMAIN = "https://dofus4business.com.br";
export const PIX_KEY = "Apoie@dofus4business.com.br";
export const MARKET_FEE_PERCENT = 2;
export const RATION_XP = 500;
export const KOLIFICHAS_PER_RATION = 100;
export const KOLIFICHAS_PER_BAG = 1000;
export const RATIONS_PER_BAG = KOLIFICHAS_PER_BAG / KOLIFICHAS_PER_RATION;
export const CATALOG_UPDATED_AT = "2026-07-16";
export const DEFAULT_LANGUAGE = "pt-BR";
export const SUPPORTED_LANGUAGES = ["pt-BR", "fr-FR", "en-US", "es-ES"];
export const ADS_ENABLED = false;
export const CONSENT_POLICY_VERSION = "1.1";
export const DEFAULT_CONSENT = Object.freeze({
  version: CONSENT_POLICY_VERSION,
  essential: true,
  preferences: true,
  analytics: false,
  advertising: false,
  decidedAt: null
});
