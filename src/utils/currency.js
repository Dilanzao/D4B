const LOCALE_MAP = {
  'pt-BR': 'pt-BR',
  'fr-FR': 'fr-FR',
  'en-US': 'en-US',
  'es-ES': 'es-ES'
};

export function sanitizeNumericInput(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const cleaned = String(value ?? '').replace(/[^\d]/g, '');
  return cleaned ? Number.parseInt(cleaned, 10) : 0;
}

export function parseKamas(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const text = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (!text) return 0;
  const match = text.match(/^([\d.,]+)(mk|kk|k)?$/i);
  if (!match) return sanitizeNumericInput(text);
  const suffix = match[2]?.toLowerCase() || '';
  let numeric = match[1];
  const lastComma = numeric.lastIndexOf(',');
  const lastDot = numeric.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);
  if ((suffix === 'mk' || suffix === 'kk') && decimalIndex >= 0) {
    const intPart = numeric.slice(0, decimalIndex).replace(/[.,]/g, '');
    const decPart = numeric.slice(decimalIndex + 1).replace(/[.,]/g, '');
    numeric = `${intPart}.${decPart}`;
  } else {
    numeric = numeric.replace(/[.,]/g, '');
  }
  const number = Number(numeric);
  const multiplier = suffix === 'mk' ? 1_000_000 : suffix === 'kk' ? 1_000 : 1;
  return Number.isFinite(number) ? Math.max(0, Math.round(number * multiplier)) : 0;
}

export function validateKamas(value) {
  const parsed = parseKamas(value);
  return Number.isSafeInteger(parsed) && parsed >= 0;
}

export function formatKamas(value, language = 'pt-BR') {
  const safe = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
  return `${new Intl.NumberFormat(LOCALE_MAP[language] || language).format(safe)} K`;
}

export function formatCompactKamas(value, language = 'pt-BR') {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  const absolute = Math.abs(safe);
  const locale = LOCALE_MAP[language] || language;
  const formatter = (number, digits = 1) => new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(number);
  if (absolute >= 1_000_000) return `${formatter(safe / 1_000_000, 2)} MK`;
  if (absolute >= 1_000) return `${formatter(safe / 1_000, 1)} KK`;
  return `${formatter(safe, 0)} K`;
}

export function formatNumber(value, language = 'pt-BR', digits = 0) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat(LOCALE_MAP[language] || language, { maximumFractionDigits: digits }).format(safe);
}
