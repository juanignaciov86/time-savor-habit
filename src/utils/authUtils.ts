
// Simple authentication utils for the app

interface User {
  email: string;
  password: string;
}

// Hardcoded user for now
const VALID_USER: User = {
  email: "juanignaciov86@gmail.com",
  password: "123"
};

// Check if user is logged in
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

// Login function
export const login = (email: string, password: string): boolean => {
  if (email === VALID_USER.email && password === VALID_USER.password) {
    localStorage.setItem('isLoggedIn', 'true');
    return true;
  }
  return false;
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem('isLoggedIn');
};
