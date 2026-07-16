export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

export function includesNormalized(haystack, needle) {
  return normalizeSearchText(haystack).includes(normalizeSearchText(needle));
}
