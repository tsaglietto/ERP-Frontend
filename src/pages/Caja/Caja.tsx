import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface CajaInfo { id: number; nombre: string; sesion_abierta: number | null; fecha_apertura: string | null; }

const Caja: React.FC = () => {
  const [cajas, setCajas] = useState<CajaInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/caja/cajas').then(r => setCajas(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ color: '#fff', marginBottom: '24px' }}>💰 Caja</h1>
      {loading ? <p style={{ color: '#888' }}>Cargando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {cajas.map(caja => (
            <div key={caja.id} style={{ background: '#16213e', borderRadius: '12px', padding: '24px', borderLeft: `4px solid ${caja.sesion_abierta ? '#4CAF50' : '#555'}` }}>
              <h3 style={{ color: '#fff', margin: '0 0 8px' }}>{caja.nombre}</h3>
              <p style={{ color: caja.sesion_abierta ? '#4CAF50' : '#888', fontSize: '14px', margin: '0 0 16px' }}>
                {caja.sesion_abierta ? '🟢 Turno abierto' : '⚪ Sin turno activo'}
              </p>
              {caja.fecha_apertura && <p style={{ color: '#666', fontSize: '12px', margin: '0 0 16px' }}>Desde: {new Date(caja.fecha_apertura).toLocaleTimeString('es-AR')}</p>}
              <button style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: caja.sesion_abierta ? '#0f3460' : '#4CAF50', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                {caja.sesion_abierta ? 'Ver rendición' : 'Abrir turno'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Caja;
