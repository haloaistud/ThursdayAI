
const AUTH_KEY = 'friday_auth_token';
const USERS_KEY = 'friday_users_db'; // Mock DB for local storage
const GUEST_TOKEN = 'fr_guest_access';
const ADMIN_TOKEN = 'fr_admin_access';
const USER_TOKEN = 'fr_user_access';

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(AUTH_KEY);
};

export const getAuthRole = (): 'guest' | 'user' | 'admin' | null => {
  const token = localStorage.getItem(AUTH_KEY);
  if (token === GUEST_TOKEN) return 'guest';
  if (token === ADMIN_TOKEN) return 'admin';
  if (token === USER_TOKEN) return 'user';
  return null;
};

export const login = (identifier: string, pass: string): boolean => {
  // Hardcoded Admin
  if (identifier.toLowerCase() === 'admin' && pass === 'friday') {
    localStorage.setItem(AUTH_KEY, ADMIN_TOKEN);
    return true;
  }
  
  // Check mock DB
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  if (users[identifier] === pass) {
    localStorage.setItem(AUTH_KEY, USER_TOKEN);
    return true;
  }
  return false;
};

export const register = (identifier: string, pass: string): boolean => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  if (users[identifier]) return false; // User already exists

  users[identifier] = pass;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(AUTH_KEY, USER_TOKEN);
  return true;
};

export const loginAsGuest = (): void => {
  localStorage.setItem(AUTH_KEY, GUEST_TOKEN);
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
  // Clear profile to prevent data leakage between sessions
  localStorage.removeItem('friday_user_profile');
  window.location.reload();
};
