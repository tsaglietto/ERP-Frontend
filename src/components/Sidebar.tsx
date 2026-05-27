import React from 'react';
import { useAuth } from '../context/AuthContext';
interface MenuItem { icon: string; label: string; path: string; permiso?: string; }
const MENU: MenuItem[] = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '➕', label: 'Nueva Venta', path: '/nueva-venta', permiso: 'ventas' },
  { icon: '🛒', label: 'Ventas', path: '/ventas', permiso: 'ventas' },
  { icon: '📦', label: 'Productos', path: '/productos', permiso: 'productos_ver' },
  { icon: '👥', label: 'Clientes', path: '/clientes', permiso: 'clientes' },
  { icon: '💰', label: 'Caja', path: '/caja', permiso: 'caja' },
  { icon: '⚙', label: 'Configuración', path: '/configuracion' },
];
const Sidebar: React.FC<{ paginaActual: string; onNavegar: (path: string) => void }> = ({ paginaActual, onNavegar }) => {
  const { usuario, logout } = useAuth();
  const tienePermiso = (permiso?: string) => {
    if (!permiso) return true;
    if (!usuario) return false;
    const permisos = usuario.permisos || [];
    return permisos.includes('todo') || permisos.includes(permiso);
  };
  return (
    <div style={{ width: '240px', minHeight: '100vh', background: '#16213e', display: 'flex', flexDirection: 'column', borderRight: '1px solid #0f3460' }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #0f3460' }}>
        <h2 style={{ color: '#4CAF50', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>🌾 CampoSur</h2>
        <p style={{ color: '#666', margin: '4px 0 0', fontSize: '12px' }}>Gestión Agropecuaria</p>
      </div>
      <div style={{ padding: '12px 0', flex: 1 }}>
        {MENU.filter(m => tienePermiso(m.permiso)).map(item => (
          <button key={item.path} onClick={() => onNavegar(item.path)}
            style={{
              width: '100%', padding: '12px 20px', border: 'none',
              background: item.path === '/nueva-venta'
                ? (paginaActual === item.path ? '#1a4a1a' : '#0d2b0d')
                : (paginaActual === item.path ? '#0f3460' : 'transparent'),
              color: item.path === '/nueva-venta' ? '#4CAF50' : (paginaActual === item.path ? '#4CAF50' : '#aaa'),
              cursor: 'pointer', textAlign: 'left' as const, fontSize: '15px',
              borderLeft: paginaActual === item.path ? '3px solid #4CAF50' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: '10px',
              fontWeight: item.path === '/nueva-venta' ? 'bold' : 'normal',
            }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '16px 20px', borderTop: '1px solid #0f3460' }}>
        <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px' }}>{usuario?.nombre}</p>
        <p style={{ color: '#555', fontSize: '11px', margin: '0 0 12px', textTransform: 'capitalize' }}>{usuario?.rol?.replace(/_/g, ' ')}</p>
        <button onClick={logout} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #333', background: 'transparent', color: '#ff6b6b', cursor: 'pointer', fontSize: '13px' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
export default Sidebar;