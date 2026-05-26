import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import NuevaVenta from './NuevaVenta';

interface Venta { id: number; tipo: string; estado: string; total: string; fecha: string; cliente_id: number; notas: string; }

const ESTADO_COLOR: Record<string, string> = {
  confirmada: '#FF9800', entregada: '#2196F3', cobrada: '#4CAF50', cancelada: '#ff6b6b'
};

type Pestana = 'hoy' | 'remitos' | 'presupuestos' | 'cobros_cc';

const Ventas: React.FC = () => {
  const [pestana, setPestana] = useState<Pestana>('hoy');
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarNueva, setMostrarNueva] = useState(false);

  const cargarVentas = () => {
    setLoading(true);
    api.get('/ventas/?limit=100').then(r => setVentas(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { cargarVentas(); }, []);

  const tabStyle = (tab: Pestana): React.CSSProperties => ({
    padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap',
    background: pestana === tab ? '#0f3460' : 'transparent',
    color: pestana === tab ? '#4CAF50' : '#888',
    borderBottom: pestana === tab ? '2px solid #4CAF50' : '2px solid transparent',
  });

  if (mostrarNueva) {
    return <NuevaVenta onVolver={() => setMostrarNueva(false)} onVentaCreada={() => { cargarVentas(); setMostrarNueva(false); }} />;
  }

  const ventasFiltradas = ventas.filter(v => {
    if (pestana === 'remitos') return v.estado === 'entregada' || v.estado === 'confirmada';
    if (pestana === 'presupuestos') return v.tipo === 'presupuesto';
    if (pestana === 'cobros_cc') return v.estado !== 'cobrada' && v.estado !== 'cancelada';
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>🛒 Ventas</h1>
        <button onClick={() => setMostrarNueva(true)}
          style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          + Nueva venta
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #0f3460', marginBottom: '20px', overflowX: 'auto' }}>
        <button onClick={() => setPestana('hoy')} style={tabStyle('hoy')}>📋 Todas</button>
        <button onClick={() => setPestana('remitos')} style={tabStyle('remitos')}>🚛 Remitos</button>
        <button onClick={() => setPestana('presupuestos')} style={tabStyle('presupuestos')}>📄 Presupuestos</button>
        <button onClick={() => setPestana('cobros_cc')} style={tabStyle('cobros_cc')}>💳 Cobros pendientes</button>
      </div>

      {loading ? <p style={{ color: '#888' }}>Cargando...</p> : (
        <div style={{ background: '#16213e', borderRadius: '12px', overflow: 'hidden', border: '1px solid #0f3460' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f3460' }}>
                {['#', 'Fecha', 'Cliente', 'Total', 'Tipo', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: '#4CAF50', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#555' }}>No hay registros en esta categoría</td></tr>
              ) : ventasFiltradas.map((v, i) => (
                <tr key={v.id} style={{ borderTop: '1px solid #0f3460', background: i % 2 === 0 ? '#16213e' : '#1a2545' }}>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>#{v.id}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '12px' }}>
                    {new Date(v.fecha).toLocaleDateString('es-AR')} {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{v.cliente_id || 'Sin cliente'}</td>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 'bold' }}>${parseFloat(v.total).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {v.notas?.includes('SIN_COMPROBANTE') && <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: '#333', color: '#aaa' }}>S/C</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', background: (ESTADO_COLOR[v.estado] || '#555') + '33', color: ESTADO_COLOR[v.estado] || '#aaa' }}>
                      {v.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ padding: '5px 12px', background: '#0f3460', border: 'none', borderRadius: '6px', color: '#4CAF50', cursor: 'pointer', fontSize: '12px' }}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Ventas;
