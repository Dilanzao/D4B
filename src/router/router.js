const ROUTES = [
  { name: 'home', pattern: /^\/$/, build: () => '/' },
  { name: 'pets', pattern: /^\/pets\/?$/, build: () => '/pets' },
  { name: 'pet-simulations', pattern: /^\/pets\/simulacoes\/?$/, build: () => '/pets/simulacoes' },
  { name: 'pet-simulation-new', pattern: /^\/pets\/simulacoes\/nova\/?$/, build: () => '/pets/simulacoes/nova' },
  { name: 'pet-simulation-edit', pattern: /^\/pets\/simulacoes\/([^/]+)\/?$/, params: ['id'], build: ({ id }) => `/pets/simulacoes/${encodeURIComponent(id)}` },
  { name: 'pet-sales', pattern: /^\/pets\/vendas\/?$/, build: () => '/pets/vendas' },
  { name: 'crafts', pattern: /^\/crafts\/?$/, build: () => '/crafts' },
  { name: 'craft-search', pattern: /^\/crafts\/busca\/?$/, build: () => '/crafts/busca' },
  { name: 'craft-projects', pattern: /^\/crafts\/projetos\/?$/, build: () => '/crafts/projetos' },
  { name: 'craft-project-new', pattern: /^\/crafts\/projetos\/novo\/?$/, build: () => '/crafts/projetos/novo' },
  { name: 'craft-project-edit', pattern: /^\/crafts\/projetos\/([^/]+)\/?$/, params: ['id'], build: ({ id }) => `/crafts/projetos/${encodeURIComponent(id)}` },
  { name: 'craft-inventory', pattern: /^\/crafts\/estoque\/?$/, build: () => '/crafts/estoque' },
  { name: 'craft-sales', pattern: /^\/crafts\/vendas\/?$/, build: () => '/crafts/vendas' },
  { name: 'global-sales', pattern: /^\/vendas\/?$/, build: () => '/vendas' },
  { name: 'global-inventory', pattern: /^\/estoque\/?$/, build: () => '/estoque' },
  { name: 'settings', pattern: /^\/configuracoes\/?$/, build: () => '/configuracoes' },
  { name: 'login', pattern: /^\/entrar\/?$/, build: () => '/entrar' },
  { name: 'register', pattern: /^\/criar-conta\/?$/, build: () => '/criar-conta' },
  { name: 'forgot-password', pattern: /^\/esqueci-senha\/?$/, build: () => '/esqueci-senha' },
  { name: 'verify-email', pattern: /^\/verificar-email\/?$/, build: () => '/verificar-email' },
  { name: 'reset-password', pattern: /^\/redefinir-senha\/?$/, build: () => '/redefinir-senha' },
  { name: 'account-settings', pattern: /^\/conta\/?$/, build: () => '/conta' },
];

function normalizedPath(pathname = '/') {
  let path = pathname || '/';
  path = path.replace(/\/index\.html$/i, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  return path.replace(/\/{2,}/g, '/');
}

export function matchRoute(pathname = globalThis.location?.pathname || '/') {
  const path = normalizedPath(pathname);
  for (const route of ROUTES) {
    const match = path.match(route.pattern);
    if (!match) continue;
    const params = {};
    (route.params || []).forEach((key, index) => { params[key] = decodeURIComponent(match[index + 1] || ''); });
    return { name: route.name, path, params };
  }
  return { name: 'home', path: '/', params: {}, redirectedFrom: path };
}

export function pathFor(name, params = {}) {
  const route = ROUTES.find(item => item.name === name);
  return route ? route.build(params) : '/';
}

export function navigateTo(name, params = {}, { replace = false } = {}) {
  const path = pathFor(name, params);
  if (globalThis.history) globalThis.history[replace ? 'replaceState' : 'pushState']({ route: name }, '', path);
  globalThis.dispatchEvent?.(new CustomEvent('d4b:navigate', { detail: matchRoute(path) }));
  return path;
}


export function navigatePath(path, { replace = false } = {}) {
  const normalized = normalizedPath(path);
  if (globalThis.history) globalThis.history[replace ? 'replaceState' : 'pushState']({}, '', normalized);
  globalThis.dispatchEvent?.(new CustomEvent('d4b:navigate', { detail: matchRoute(normalized) }));
  return normalized;
}

export function installRouter(onChange) {
  const emitCurrent = () => onChange(matchRoute());
  const custom = event => onChange(event.detail || matchRoute());
  globalThis.addEventListener?.('popstate', emitCurrent);
  globalThis.addEventListener?.('d4b:navigate', custom);
  emitCurrent();
  return () => {
    globalThis.removeEventListener?.('popstate', emitCurrent);
    globalThis.removeEventListener?.('d4b:navigate', custom);
  };
}

export function legacyViewToRoute(view) {
  return ({ dashboard: 'pets', simulations: 'pet-simulations', sales: 'pet-sales', editor: 'pet-simulations' })[view] || 'home';
}
