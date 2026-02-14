
const AUTH_KEY = 'friday_auth_token';
const MOCK_TOKEN = 'fr_access_granted_v2';

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === MOCK_TOKEN;
};

export const login = (username: string, pass: string): boolean => {
  // For production, you would validate against a backend or secure env var
  // Simple "Access Code" style for the demo
  if (username.toLowerCase() === 'admin' && pass === 'friday') {
    localStorage.setItem(AUTH_KEY, MOCK_TOKEN);
    return true;
  }
  return false;
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
  window.location.reload();
};
