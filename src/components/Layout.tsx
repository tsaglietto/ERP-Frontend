import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard/Dashboard';
import Productos from '../pages/Productos/Productos';
import Ventas from '../pages/Ventas/Ventas';
import Clientes from '../pages/Clientes/Clientes';
import Caja from '../pages/Caja/Caja';
import Configuracion from '../pages/Configuracion/Configuracion';

const Layout: React.FC = () => {
  const [pagina, setPagina] = useState('/dashboard');

  const renderPagina = () => {
    switch(pagina) {
      case '/dashboard': return <Dashboard />;
      case '/productos': return <Productos />;
      case '/ventas': return <Ventas />;
      case '/clientes': return <Clientes />;
      case '/caja': return <Caja />;
      case '/configuracion': return <Configuracion />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1a1a2e' }}>
      <Sidebar paginaActual={pagina} onNavegar={setPagina} />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {renderPagina()}
      </main>
    </div>
  );
};

export default Layout;
