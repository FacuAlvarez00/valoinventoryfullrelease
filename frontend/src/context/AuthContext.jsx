import React, { createContext, useContext, useState, useEffect } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore a saved session when the application starts
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        const result = await verifyTokenValidity(savedToken);

        if (result === 'expired') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        } else {
          // Preserve the session when the token is valid or the API is temporarily unreachable
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Sign in with username and password
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  // Register a user
  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  // Sign out locally
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Validate a token against the profile endpoint
  const verifyTokenValidity = async (tokenToVerify) => {
    if (!tokenToVerify) return 'expired';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${tokenToVerify}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response.status === 401 ? 'expired' : 'valid';
    } catch (error) {
      // Keep the local session during a timeout or temporary network error
      return 'unreachable';
    }
  };

  // Validate the current token
  const verifyToken = async () => {
    if (!token) return false;
    const result = await verifyTokenValidity(token);
    return result === 'valid';
  };

  // Make authenticated requests and handle unauthorized responses
  const makeAuthenticatedRequest = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token is available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    // Clear the session when the API rejects the token
    if (response.status === 401) {
      logout();
      throw new Error('Your session has expired. Please sign in again.');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    verifyToken,
    makeAuthenticatedRequest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
