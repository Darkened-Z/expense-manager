export interface AuthSession {
  username: string;
  vaultId: string;
  rememberMe: boolean;
}

const AUTH_KEYS = {
  SAVED_SESSION: 'expense_manager_saved_auth_v1',
  SESSION_ONLY: 'expense_manager_session_auth_v1',
  REMEMBERED_USERNAME: 'expense_manager_remembered_username_v1',
};

export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessRaw = sessionStorage.getItem(AUTH_KEYS.SESSION_ONLY);
    if (sessRaw) {
      const parsed = JSON.parse(sessRaw);
      if (parsed?.username && parsed?.vaultId) {
        return parsed as AuthSession;
      }
    }

    const savedRaw = localStorage.getItem(AUTH_KEYS.SAVED_SESSION);
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw);
      if (parsed?.username && parsed?.vaultId && parsed?.rememberMe) {
        sessionStorage.setItem(AUTH_KEYS.SESSION_ONLY, JSON.stringify(parsed));
        return parsed as AuthSession;
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  return null;
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(session);
  sessionStorage.setItem(AUTH_KEYS.SESSION_ONLY, serialized);

  if (session.rememberMe) {
    localStorage.setItem(AUTH_KEYS.SAVED_SESSION, serialized);
    localStorage.setItem(AUTH_KEYS.REMEMBERED_USERNAME, session.username);
  } else {
    localStorage.removeItem(AUTH_KEYS.SAVED_SESSION);
    localStorage.removeItem(AUTH_KEYS.REMEMBERED_USERNAME);
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_KEYS.SESSION_ONLY);
  localStorage.removeItem(AUTH_KEYS.SAVED_SESSION);
}

export function getRememberedUsername(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_KEYS.REMEMBERED_USERNAME) || '';
}

export async function authenticateAccount(
  action: 'login' | 'register',
  username: string,
  password: string
): Promise<{ success: boolean; user?: { username: string; vaultId: string }; error?: string }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.user) {
      return {
        success: false,
        error: data?.error || 'Authentication failed.',
      };
    }
    return { success: true, user: data.user };
  } catch {
    return {
      success: false,
      error: 'Unable to reach authentication server. Please try again.',
    };
  }
}
