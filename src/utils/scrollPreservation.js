export function captureScrollSnapshot(root = document) {
  const elements = [];
  root?.querySelectorAll?.('[data-scroll-key]').forEach(element => {
    elements.push({
      key: element.getAttribute('data-scroll-key'),
      top: element.scrollTop,
      left: element.scrollLeft
    });
  });
  return {
    windowX: globalThis.scrollX || 0,
    windowY: globalThis.scrollY || 0,
    elements
  };
}

export function restoreScrollSnapshot(root = document, snapshot) {
  if (!snapshot) return false;
  for (const item of snapshot.elements || []) {
    const element = [...(root?.querySelectorAll?.('[data-scroll-key]') || [])]
      .find(node => node.getAttribute('data-scroll-key') === item.key);
    if (element) {
      element.scrollTop = item.top || 0;
      element.scrollLeft = item.left || 0;
    }
  }
  globalThis.scrollTo?.({ left: snapshot.windowX || 0, top: snapshot.windowY || 0, behavior: 'auto' });
  return true;
}
