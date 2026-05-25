import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface Usuario { id: number; nombre: string; email: string; rol: string; permisos: string[]; }
interface AuthContextType { usuario: Usuario | null; login: (email: string, password: string) => Promise<void>; logout: () => void; loading: boolean; }

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me').then(r => setUsuario(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const r = await api.post('/auth/login', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    localStorage.setItem('token', r.data.access_token);
    setUsuario(r.data.usuario);
  };

  const logout = () => { localStorage.removeItem('token'); setUsuario(null); };

  return <AuthContext.Provider value={{ usuario, login, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
