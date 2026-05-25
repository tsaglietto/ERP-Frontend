import React, { useEffect, useState } from 'react';
import api from '../../services/api';

type Pestana = 'categorias' | 'marcas' | 'monedas' | 'usuarios';

interface Item { id: number; nombre: string; activa?: boolean; activo?: boolean; }
interface Moneda { id: number; codigo: string; nombre: string; simbolo: string; activa: boolean; valor_actual?: number; }
interface Usuario { id: number; nombre: string; email: string; rol: string; activo: boolean; }

const ROLES: Record<string, string> = {
  propietario: 'Propietario',
  administrativo: 'Administrativo',
  vendedor_mostrador: 'Vendedor mostrador',
  vendedor_externo: 'Vendedor externo',
};

const Configuracion: React.FC = () => {
  const [pestana, setPestana] = useState<Pestana>('categorias');
  const [categorias, setCategorias] = useState<Item[]>([]);
  const [marcas, setMarcas] = useState<Item[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaMoneda, setNuevaMoneda] = useState({ codigo: '', nombre: '', simbolo: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', password: '', rol: 'vendedor_mostrador' });
  const [tcActualizar, setTcActualizar] = useState<{ [id: number]: string }>({});

  const cargar = async () => {
    setLoading(true);
    try {
      const [c, m, mo, u] = await Promise.all([
        api.get('/categorias/'), api.get('/marcas/'),
        api.get('/tipos-cambio/'), api.get('/usuarios/'),
      ]);
      setCategorias(c.data);
      setMarcas(m.data);
      setMonedas(mo.data);
      setUsuarios(u.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const agregarCategoria = async () => {
    if (!nuevoNombre.trim()) return;
    await api.post('/categorias/', { nombre: nuevoNombre });
    setNuevoNombre(''); cargar();
  };

  const agregarMarca = async () => {
    if (!nuevoNombre.trim()) return;
    await api.post('/marcas/', { nombre: nuevoNombre });
    setNuevoNombre(''); cargar();
  };

  const agregarMoneda = async () => {
    if (!nuevaMoneda.codigo || !nuevaMoneda.nombre) return;
    await api.post('/monedas/', nuevaMoneda);
    setNuevaMoneda({ codigo: '', nombre: '', simbolo: '' });
    cargar();
  };

  const actualizarTC = async (monedaId: number) => {
    const valor = tcActualizar[monedaId];
    if (!valor) return;
    await api.post('/tipos-cambio/', { moneda_id: monedaId, valor: parseFloat(valor), fuente: 'manual' });
    setTcActualizar(prev => ({ ...prev, [monedaId]: '' }));
    cargar();
  };

  const agregarUsuario = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) return;
    await api.post('/usuarios/', nuevoUsuario);
    setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'vendedor_mostrador' });
    cargar();
  };

  const desactivarUsuario = async (id: number) => {
    await api.delete(`/usuarios/${id}`);
    cargar();
  };

  const tabStyle = (tab: Pestana): React.CSSProperties => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
    background: pestana === tab ? '#0f3460' : 'transparent',
    color: pestana === tab ? '#4CAF50' : '#888',
    borderBottom: pestana === tab ? '2px solid #4CAF50' : '2px solid transparent',
  });

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #333',
    background: '#0f3460', color: '#fff', fontSize: '14px', outline: 'none',
  };

  return (
    <div>
      <h1 style={{ color: '#fff', marginBottom: '24px', fontSize: '24px' }}>⚙ Configuración</h1>
      <div style={{ display: 'flex', borderBottom: '1px solid #0f3460', marginBottom: '24px' }}>
        {(['categorias', 'marcas', 'monedas', 'usuarios'] as Pestana[]).map(tab => (
          <button key={tab} onClick={() => { setPestana(tab); setNuevoNombre(''); }} style={tabStyle(tab)}>
            {tab === 'categorias' ? '🏷 Categorías' : tab === 'marcas' ? '🏭 Marcas' : tab === 'monedas' ? '💱 Monedas y TC' : '👤 Usuarios'}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#888' }}>Cargando...</p>}

      {pestana === 'categorias' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
              placeholder="Nueva categoría..." style={{ ...inputStyle, flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && agregarCategoria()} />
            <button onClick={agregarCategoria}
              style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              + Agregar
            </button>
          </div>
          <div style={{ background: '#16213e', borderRadius: '10px', overflow: 'hidden', border: '1px solid #0f3460' }}>
            {categorias.length === 0 ? <p style={{ padding: '24px', color: '#888', textAlign: 'center' }}>Sin categorías cargadas</p> :
              categorias.map((cat, i) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < categorias.length - 1 ? '1px solid #0f3460' : 'none', background: i % 2 === 0 ? '#16213e' : '#1a2545' }}>
                  <span style={{ flex: 1, color: '#fff' }}>{cat.nombre}</span>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: cat.activa ? '#1b5e20' : '#4a0000', color: cat.activa ? '#4CAF50' : '#ff6b6b' }}>
                    {cat.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {pestana === 'marcas' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
              placeholder="Nueva marca..." style={{ ...inputStyle, flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && agregarMarca()} />
            <button onClick={agregarMarca}
              style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              + Agregar
            </button>
          </div>
          <div style={{ background: '#16213e', borderRadius: '10px', overflow: 'hidden', border: '1px solid #0f3460' }}>
            {marcas.length === 0 ? <p style={{ padding: '24px', color: '#888', textAlign: 'center' }}>Sin marcas cargadas</p> :
              marcas.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < marcas.length - 1 ? '1px solid #0f3460' : 'none', background: i % 2 === 0 ? '#16213e' : '#1a2545' }}>
                  <span style={{ flex: 1, color: '#fff' }}>{m.nombre}</span>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: m.activa ? '#1b5e20' : '#4a0000', color: m.activa ? '#4CAF50' : '#ff6b6b' }}>
                    {m.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {pestana === 'monedas' && (
        <div>
          <div style={{ background: '#16213e', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #0f3460' }}>
            <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>Nueva moneda</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <input value={nuevaMoneda.codigo} onChange={e => setNuevaMoneda({ ...nuevaMoneda, codigo: e.target.value.toUpperCase() })}
                placeholder="Código (ej: EUR)" style={inputStyle} maxLength={10} />
              <input value={nuevaMoneda.nombre} onChange={e => setNuevaMoneda({ ...nuevaMoneda, nombre: e.target.value })}
                placeholder="Nombre (ej: Euro)" style={inputStyle} />
              <input value={nuevaMoneda.simbolo} onChange={e => setNuevaMoneda({ ...nuevaMoneda, simbolo: e.target.value })}
                placeholder="Símbolo (ej: €)" style={inputStyle} maxLength={5} />
            </div>
            <button onClick={agregarMoneda}
              style={{ padding: '10px 24px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              + Agregar moneda
            </button>
          </div>
          <div style={{ background: '#16213e', borderRadius: '10px', overflow: 'hidden', border: '1px solid #0f3460' }}>
            <div style={{ padding: '12px 16px', background: '#0f3460', display: 'grid', gridTemplateColumns: '80px 1fr 80px 1fr 140px', gap: '8px' }}>
              {['Código', 'Nombre', 'Símbolo', 'Valor actual', 'Actualizar TC'].map(h => (
                <span key={h} style={{ color: '#4CAF50', fontSize: '12px', fontWeight: '600' }}>{h}</span>
              ))}
            </div>
            {monedas.map((m, i) => (
              <div key={m.id} style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '80px 1fr 80px 1fr 140px', gap: '8px', alignItems: 'center', borderTop: '1px solid #0f3460', background: i % 2 === 0 ? '#16213e' : '#1a2545' }}>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{m.codigo}</span>
                <span style={{ color: '#fff' }}>{m.nombre}</span>
                <span style={{ color: '#aaa' }}>{m.simbolo}</span>
                <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                  {m.codigo === 'ARS' ? 'Base' : m.valor_actual ? `$${m.valor_actual.toLocaleString('es-AR')}` : '-'}
                </span>
                {m.codigo !== 'ARS' ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input value={tcActualizar[m.id] || ''} onChange={e => setTcActualizar(prev => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder="Nuevo valor" type="number"
                      style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '80px' }}
                      onKeyDown={e => e.key === 'Enter' && actualizarTC(m.id)} />
                    <button onClick={() => actualizarTC(m.id)}
                      style={{ padding: '6px 10px', background: '#1565C0', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                      OK
                    </button>
                  </div>
                ) : <span style={{ color: '#555', fontSize: '12px' }}>Moneda base</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {pestana === 'usuarios' && (
        <div>
          <div style={{ background: '#16213e', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #0f3460' }}>
            <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>Nuevo usuario</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} placeholder="Nombre" style={inputStyle} />
              <input value={nuevoUsuario.email} onChange={e => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })} placeholder="Email" type="email" style={inputStyle} />
              <input value={nuevoUsuario.password} onChange={e => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })} placeholder="Contraseña" type="password" style={inputStyle} />
              <select value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button onClick={agregarUsuario}
              style={{ padding: '10px 24px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              + Crear usuario
            </button>
          </div>
          <div style={{ background: '#16213e', borderRadius: '10px', overflow: 'hidden', border: '1px solid #0f3460' }}>
            {usuarios.map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < usuarios.length - 1 ? '1px solid #0f3460' : 'none', background: i % 2 === 0 ? '#16213e' : '#1a2545', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', margin: 0, fontWeight: '500' }}>{u.nombre}</p>
                  <p style={{ color: '#666', margin: '2px 0 0', fontSize: '13px' }}>{u.email}</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#0f3460', color: '#4CAF50' }}>{ROLES[u.rol] || u.rol}</span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: u.activo ? '#1b5e20' : '#4a0000', color: u.activo ? '#4CAF50' : '#ff6b6b' }}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
                {u.activo && (
                  <button onClick={() => desactivarUsuario(u.id)}
                    style={{ padding: '6px 12px', background: '#4a0000', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontSize: '13px' }}>
                    Desactivar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;
