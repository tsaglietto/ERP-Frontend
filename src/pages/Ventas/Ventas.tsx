import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Venta { id: number; tipo: string; estado: string; total: string; fecha: string; cliente_id: number; }

const ESTADO_COLOR: Record<string, string> = { confirmada: '#FF9800', entregada: '#2196F3', cobrada: '#4CAF50', cancelada: '#ff6b6b' };

const Ventas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ventas/').then(r => setVentas(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#fff', margin: 0 }}>🛒 Ventas</h1>
        <button style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Nueva venta</button>
      </div>
      {loading ? <p style={{ color: '#888' }}>Cargando...</p> : (
        <div style={{ background: '#16213e', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f3460' }}>
                {['#', 'Fecha', 'Cliente', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', color: '#4CAF50', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No hay ventas registradas</td></tr>
              ) : ventas.map((v, i) => (
                <tr key={v.id} style={{ borderTop: '1px solid #0f3460', background: i % 2 === 0 ? '#16213e' : '#1a2545' }}>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>#{v.id}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '13px' }}>{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{v.cliente_id || 'Sin cliente'}</td>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 'bold' }}>${parseFloat(v.total).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: ESTADO_COLOR[v.estado] + '33', color: ESTADO_COLOR[v.estado] }}>
                      {v.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ padding: '6px 12px', background: '#0f3460', border: 'none', borderRadius: '6px', color: '#4CAF50', cursor: 'pointer', fontSize: '12px' }}>Ver</button>
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
