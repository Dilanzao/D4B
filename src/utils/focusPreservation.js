const DEFAULT_ATTRIBUTES = [
  'data-field', 'data-resource-field', 'data-resource-draft', 'data-resource-picker-search', 'data-sale-field',
  'data-sales-filter', 'data-dashboard-filter', 'data-consent-field', 'data-resource-new', 'data-craft-field',
  'data-craft-ingredient-field', 'data-craft-item-search', 'data-craft-sale-field', 'data-inventory-adjust-field',
  'data-global-sales-filter', 'data-inventory-filter'
];

function escapeSelectorValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function focusSelectorFor(element, root, attributes = DEFAULT_ATTRIBUTES) {
  if (!(element instanceof HTMLElement) || !root?.contains(element)) return null;
  if (element.id) return `#${globalThis.CSS?.escape ? globalThis.CSS.escape(element.id) : escapeSelectorValue(element.id)}`;
  for (const attribute of attributes) {
    if (!element.hasAttribute(attribute)) continue;
    let selector = `[${attribute}]`;
    const value = element.getAttribute(attribute);
    if (value) selector = `[${attribute}="${escapeSelectorValue(value)}"]`;
    if (element.dataset.id) selector += `[data-id="${escapeSelectorValue(element.dataset.id)}"]`;
    if ((element.type === 'radio' || element.type === 'checkbox') && element.value) selector += `[value="${escapeSelectorValue(element.value)}"]`;
    return selector;
  }
  return null;
}

export function captureFocusSnapshot(root) {
  const element = document.activeElement;
  const selector = focusSelectorFor(element, root);
  if (!selector) return null;
  return {
    selector,
    inModal: Boolean(element.closest('.modal')),
    selectionStart: typeof element.selectionStart === 'number' ? element.selectionStart : null,
    selectionEnd: typeof element.selectionEnd === 'number' ? element.selectionEnd : null,
    selectionDirection: element.selectionDirection || 'none',
    scrollLeft: element.scrollLeft || 0,
    scrollTop: element.scrollTop || 0
  };
}

export function restoreFocusSnapshot(root, snapshot) {
  if (!snapshot || !root) return false;
  const element = root.querySelector(snapshot.selector);
  if (!element) return false;
  element.focus({ preventScroll: true });
  element.scrollLeft = snapshot.scrollLeft || 0;
  element.scrollTop = snapshot.scrollTop || 0;
  if (typeof element.setSelectionRange === 'function' && snapshot.selectionStart !== null) {
    const length = String(element.value ?? '').length;
    const start = Math.min(snapshot.selectionStart, length);
    const end = Math.min(snapshot.selectionEnd ?? snapshot.selectionStart, length);
    element.setSelectionRange(start, end, snapshot.selectionDirection || 'none');
  }
  return true;
}
