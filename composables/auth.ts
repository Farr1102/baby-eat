export function useAuth() {
  const token = useState<string | null>('auth:token', () => null);
  const user = useState<{ id: number; username: string } | null>('auth:user', () => null);
  const loading = useState('auth:loading', () => true);

  function setAuth(newToken: string, newUser: { id: number; username: string }) {
    token.value = newToken;
    user.value = newUser;
    if (process.client) {
      localStorage.setItem('auth:token', newToken);
      localStorage.setItem('auth:user', JSON.stringify(newUser));
    }
  }

  function clearAuth() {
    token.value = null;
    user.value = null;
    if (process.client) {
      localStorage.removeItem('auth:token');
      localStorage.removeItem('auth:user');
    }
  }

  async function initAuth() {
    if (!process.client) {
      loading.value = false;
      return;
    }
    const savedToken = localStorage.getItem('auth:token');
    const savedUser = localStorage.getItem('auth:user');
    if (!savedToken || !savedUser) {
      loading.value = false;
      return;
    }
    try {
      const res = await fetch('https://baby-eat-api.farr1102work.workers.dev/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
    loading.value = false;
  }

  async function login(username: string, password: string) {
    const res = await fetch('https://baby-eat-api.farr1102work.workers.dev/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setAuth(data.token, data.user);
    return data;
  }

  async function register(username: string, password: string) {
    const res = await fetch('https://baby-eat-api.farr1102work.workers.dev/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setAuth(data.token, data.user);
    return data;
  }

  async function logout() {
    const t = token.value;
    if (t) {
      try {
        await fetch('https://baby-eat-api.farr1102work.workers.dev/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        });
      } catch { /* ignore */ }
    }
    clearAuth();
    navigateTo('/login');
  }

  const isLoggedIn = computed(() => !!token.value && !!user.value);

  return { token, user, loading, isLoggedIn, login, register, logout, initAuth };
}
