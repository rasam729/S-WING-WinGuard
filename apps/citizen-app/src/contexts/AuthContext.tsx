import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  userId: number;
  email: string;
  fullName: string;
  phone?: string;
  profilePicture?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('winguard_token');
    const storedUser = localStorage.getItem('winguard_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server is not responding correctly. Please check if the backend is running.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const { user: userData, token: userToken } = data.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('winguard_token', userToken);
      localStorage.setItem('winguard_user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Login error:', error);
      // Provide a user-friendly error message
      if (error.message.includes('JSON')) {
        throw new Error('Backend server is not running or not responding correctly');
      }
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone })
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server is not responding correctly. Please check if the backend is running.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      const { user: userData, token: userToken } = data.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('winguard_token', userToken);
      localStorage.setItem('winguard_user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Registration error:', error);
      // Provide a user-friendly error message
      if (error.message.includes('JSON')) {
        throw new Error('Backend server is not running or not responding correctly');
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('winguard_token');
    localStorage.removeItem('winguard_user');

    // Call logout API
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(console.error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
