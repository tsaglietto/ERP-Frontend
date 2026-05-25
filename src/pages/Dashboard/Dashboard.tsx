import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Dashboard: React.FC = () => {
  const { usuario } = useAuth();
  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '8px' }}>Bienvenido, {usuario?.nombre} 👋</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>Panel de control — CampoSur Trelew</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Ventas hoy', valor: '$0', icon: '🛒', color: '#4CAF50' },
          { label: 'Clientes activos', valor: '0', icon: '👥', color: '#2196F3' },
          { label: 'Productos', valor: '0', icon: '📦', color: '#FF9800' },
          { label: 'Caja actual', valor: '$0', icon: '💰', color: '#9C27B0' },
        ].map(card => (
          <div key={card.label} style={{ background: '#16213e', borderRadius: '12px', padding: '24px', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ color: card.color, fontSize: '24px', fontWeight: 'bold' }}>{card.valor}</div>
            <div style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
