const LOCAL_KEY = 'd4b_account_session_v1';
const SESSION_KEY = 'd4b_account_session_tab_v1';

function getStorage(rememberConnected) {
  try { return rememberConnected ? localStorage : sessionStorage; } catch { return null; }
}

function parse(storage, key) {
  try {
    const value = storage?.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch { return null; }
}

export function loadAccountSession() {
  const local = parse(getStorage(true), LOCAL_KEY);
  if (local?.sessionToken) return { ...local, rememberConnected: true };
  const session = parse(getStorage(false), SESSION_KEY);
  return session?.sessionToken ? { ...session, rememberConnected: false } : null;
}

export function saveAccountSession(value) {
  clearAccountSession();
  if (!value?.sessionToken) return null;
  const rememberConnected = Boolean(value.rememberConnected);
  const storage = getStorage(rememberConnected);
  const key = rememberConnected ? LOCAL_KEY : SESSION_KEY;
  const normalized = {
    sessionToken: String(value.sessionToken),
    expiresAt: value.expiresAt || null,
    rememberConnected,
    user: value.user || null
  };
  try { storage?.setItem(key, JSON.stringify(normalized)); } catch {}
  return normalized;
}

export function updateStoredAccountUser(user) {
  const current = loadAccountSession();
  if (!current) return null;
  return saveAccountSession({ ...current, user: { ...(current.user || {}), ...(user || {}) } });
}

export function clearAccountSession() {
  try { localStorage.removeItem(LOCAL_KEY); } catch {}
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export const ACCOUNT_SESSION_KEYS = Object.freeze({ local: LOCAL_KEY, session: SESSION_KEY });
