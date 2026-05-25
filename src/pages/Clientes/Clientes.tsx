import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Cliente { id: number; nombre: string; tipo: string; cuit: string; telefono: string; email: string; activo: boolean; }

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    api.get('/clientes/').then(r => setClientes(r.data)).finally(() => setLoading(false));
  }, []);

  const filtrados = clientes.filter(c => c.nombre?.toLowerCase().includes(buscar.toLowerCase()) || c.cuit?.includes(buscar));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#fff', margin: 0 }}>👥 Clientes</h1>
        <button style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Nuevo cliente</button>
      </div>
      <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre o CUIT..."
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#16213e', color: '#fff', marginBottom: '20px', boxSizing: 'border-box', fontSize: '15px' }} />
      {loading ? <p style={{ color: '#888' }}>Cargando...</p> : (
        <div style={{ background: '#16213e', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f3460' }}>
                {['Nombre', 'Tipo', 'CUIT', 'Teléfono', 'Email', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', color: '#4CAF50', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No hay clientes cargados</td></tr>
              ) : filtrados.map((c, i) => (
                <tr key={c.id} style={{ borderTop: '1px solid #0f3460', background: i % 2 === 0 ? '#16213e' : '#1a2545' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '500' }}>{c.nombre}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa', textTransform: 'capitalize' }}>{c.tipo}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.cuit || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.telefono || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.email || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: c.activo ? '#1b5e20' : '#4a0000', color: c.activo ? '#4CAF50' : '#ff6b6b' }}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
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

export default Clientes;
