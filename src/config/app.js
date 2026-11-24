export const APP_VERSION = "3.1.0";
export const APP_NAME = "Dofus4Business";
export const APP_DOMAIN = "https://dofus4business.com.br";
export const PIX_KEY = "Apoie@dofus4business.com.br";
export const MARKET_FEE_PERCENT = 2;
export const RATION_XP = 500;
export const RATION_ANKAMA_ID = 20125;
export const BAG_ANKAMA_ID = 684;
export const KOLIFICHAS_PER_RATION = 100;
export const KOLIFICHAS_PER_BAG = 1000;
export const RATIONS_PER_BAG = KOLIFICHAS_PER_BAG / KOLIFICHAS_PER_RATION;
// Conferido contra os 76 recursos da planilha do projeto: XP = recyclingNuggets × 10.
export const FEEDING_XP_FACTOR = 10;
export const CATALOG_UPDATED_AT = "2026-07-21";
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

export const STORAGE_SCHEMA_VERSION = 5;
export const DOFUSDUDE_API_BASE = "https://api.dofusdu.de/dofus3/v1";
