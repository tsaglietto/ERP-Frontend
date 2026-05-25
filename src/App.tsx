import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login/Login';
import Layout from './components/Layout';

const AppContent: React.FC = () => {
  const { usuario, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#4CAF50', fontSize: '18px' }}>Cargando...</p></div>;
  return usuario ? <Layout /> : <Login />;
};

const App: React.FC = () => (
  <AuthProvider><AppContent /></AuthProvider>
);

export default App;
