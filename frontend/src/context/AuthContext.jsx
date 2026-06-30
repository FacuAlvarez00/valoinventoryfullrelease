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

  // Verificar si hay un token guardado al cargar la app
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
          // 'valid' o 'unreachable' — conservar la sesión
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Función para hacer login
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

  // Función para registrar usuario
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

  // Función para hacer logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Función para verificar si el token es válido (función interna)
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
      // Timeout o error de red — asumir que el token sigue siendo válido
      return 'unreachable';
    }
  };

  // Función para verificar si el token actual es válido
  const verifyToken = async () => {
    if (!token) return false;
    const result = await verifyTokenValidity(token);
    return result === 'valid';
  };

  // Función para hacer requests con manejo automático de errores 401
  const makeAuthenticatedRequest = async (url, options = {}) => {
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    // Si el token es inválido, hacer logout automático
    if (response.status === 401) {
      logout();
      throw new Error('Token expirado. Por favor, inicia sesión nuevamente.');
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