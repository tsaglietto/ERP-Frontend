import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await login(email, password); }
    catch { setError('Email o contraseña incorrectos'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#16213e', padding: '48px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>🌾 CampoSur</h1>
          <p style={{ color: '#888', marginTop: '8px', fontSize: '14px' }}>Sistema de Gestión Agropecuaria</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
              placeholder="tu@email.com" />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#ccc', fontSize: '14px', display: 'block', marginBottom: '6px' }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
              placeholder="••••••••" />
          </div>
          {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: loading ? '#555' : '#4CAF50', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>Trelew, Chubut — 2026</p>
      </div>
    </div>
  );
};

export default Login;
