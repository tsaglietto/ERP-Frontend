import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Cliente { id: number; nombre: string; tipo: string; cuit: string; telefono: string; email: string; direccion: string; lista_precio_default: string; limite_credito: string; activo: boolean; }
interface Saldo { saldo: number; estado: string; }

const TIPOS = ['particular', 'empresa', 'productor'];
const LISTAS = ['efectivo', 'transferencia', 'cuenta_corriente', 'debito', 'credito'];
const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #1a3a6a', background: '#0f3460', color: '#fff', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' };

const ClienteForm: React.FC<{ cliente?: Cliente | null; onGuardar: () => void; onCancelar: () => void }> = ({ cliente, onGuardar, onCancelar }) => {
  const [form, setForm] = useState({ nombre: cliente?.nombre || '', tipo: cliente?.tipo || 'particular', cuit: cliente?.cuit || '', email: cliente?.email || '', telefono: cliente?.telefono || '', direccion: cliente?.direccion || '', lista_precio_default: cliente?.lista_precio_default || 'efectivo', limite_credito: cliente?.limite_credito || '0' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [buscandoAfip, setBuscandoAfip] = useState(false);

  const buscarAfip = async () => {
    if (!form.cuit || form.cuit.length < 10) { setError('Ingresá un CUIT válido'); return; }
    setBuscandoAfip(true); setError('');
    try {
      const r = await api.get(`/afip/cuit/${form.cuit.replace(/-/g, '')}`);
      if (r.data?.nombre) setForm(f => ({ ...f, nombre: r.data.nombre, tipo: r.data.tipo || f.tipo }));
    } catch { setError('AFIP no respondió — cargá manualmente'); }
    setBuscandoAfip(false);
  };

  const guardar = async () => {
    if (!form.nombre) { setError('El nombre es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      if (cliente) await api.put(`/clientes/${cliente.id}`, form);
      else await api.post('/clientes/', form);
      onGuardar();
    } catch (e: any) { setError(e?.response?.data?.detail || 'Error al guardar'); }
    setGuardando(false);
  };

  return (
    <div style={{ background: '#16213e', borderRadius: '12px', padding: '24px', border: '1px solid #0f3460', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <button onClick={onCancelar} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>CUIT</div>
            <input value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="20-12345678-9" style={inputStyle} />
          </div>
          <button onClick={buscarAfip} disabled={buscandoAfip}
            style={{ padding: '8px 16px', background: '#1565C0', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '12px', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
            {buscandoAfip ? 'Buscando...' : '🔍 Consultar AFIP'}
          </button>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Nombre / Razón social *</div>
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo o razón social" style={inputStyle} />
        </div>

        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Tipo</div>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inputStyle}>
            {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Lista de precio default</div>
          <select value={form.lista_precio_default} onChange={e => setForm(f => ({ ...f, lista_precio_default: e.target.value }))} style={inputStyle}>
            {LISTAS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1).replace('_', ' ')}</option>)}
          </select>
        </div>

        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Teléfono</div>
          <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="2804-000000" style={inputStyle} />
        </div>

        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Email</div>
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="mail@ejemplo.com" style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Dirección</div>
          <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Calle y número" style={inputStyle} />
        </div>

        <div>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Límite de crédito ($)</div>
          <input type="number" value={form.limite_credito} onChange={e => setForm(f => ({ ...f, limite_credito: e.target.value }))} placeholder="0" style={inputStyle} />
        </div>
      </div>

      {error && <div style={{ background: '#4a0000', borderRadius: '8px', padding: '10px', color: '#ff6b6b', fontSize: '13px', marginTop: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button onClick={guardar} disabled={guardando}
          style={{ flex: 1, padding: '12px', background: guardando ? '#555' : '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
          {guardando ? 'Guardando...' : '✓ Guardar'}
        </button>
        <button onClick={onCancelar} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#aaa', cursor: 'pointer' }}>Cancelar</button>
      </div>
    </div>
  );
};

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const cargar = () => {
    setLoading(true);
    api.get(`/clientes/?limit=200&activo=${!mostrarInactivos}`).then(r => setClientes(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [mostrarInactivos]);

  const abrirDetalle = async (c: Cliente) => {
    setClienteDetalle(c);
    try {
      const r = await api.get(`/clientes/${c.id}/saldo`);
      setSaldo(r.data);
    } catch { setSaldo(null); }
  };

  const desactivar = async (id: number) => {
    if (!window.confirm('¿Desactivar este cliente?')) return;
    await api.delete(`/clientes/${id}`);
    cargar();
  };

  const filtrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    c.cuit?.includes(buscar) ||
    c.telefono?.includes(buscar) ||
    c.email?.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>👥 Clientes</h1>
        <button onClick={() => { setClienteEditar(null); setMostrarForm(true); }}
          style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          + Nuevo cliente
        </button>
      </div>

      {(mostrarForm || clienteEditar) && (
        <ClienteForm
          cliente={clienteEditar}
          onGuardar={() => { setMostrarForm(false); setClienteEditar(null); cargar(); }}
          onCancelar={() => { setMostrarForm(false); setClienteEditar(null); }}
        />
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input value={buscar} onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar por nombre, CUIT, teléfono o email..."
          style={{ ...inputStyle, flex: 1 }} />
        <button onClick={() => setMostrarInactivos(!mostrarInactivos)}
          style={{ padding: '8px 16px', background: mostrarInactivos ? '#1a3a6a' : '#0f3460', border: '1px solid #1a3a6a', borderRadius: '8px', color: mostrarInactivos ? '#4CAF50' : '#888', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {mostrarInactivos ? '✓ Ver inactivos' : 'Ver inactivos'}
        </button>
      </div>

      {loading ? <p style={{ color: '#888' }}>Cargando...</p> : (
        <div style={{ background: '#16213e', borderRadius: '12px', overflow: 'hidden', border: '1px solid #0f3460' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f3460' }}>
                {['Nombre', 'Tipo', 'CUIT', 'Teléfono', 'Email', 'Lista precio', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: '#4CAF50', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#555' }}>No hay clientes</td></tr>
              ) : filtrados.map((c, i) => (
                <tr key={c.id} style={{ borderTop: '1px solid #0f3460', background: i % 2 === 0 ? '#16213e' : '#1a2545', cursor: 'pointer' }}
                  onDoubleClick={() => abrirDetalle(c)}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '500' }}>{c.nombre}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa', textTransform: 'capitalize' }}>{c.tipo}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.cuit || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.email || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#aaa', textTransform: 'capitalize' }}>{c.lista_precio_default?.replace('_', ' ') || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: c.activo ? '#1b5e2033' : '#4a000033', color: c.activo ? '#4CAF50' : '#ff6b6b' }}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={e => { e.stopPropagation(); abrirDetalle(c); }}
                        style={{ padding: '4px 10px', background: '#0f3460', border: 'none', borderRadius: '6px', color: '#4CAF50', cursor: 'pointer', fontSize: '12px' }}>Ver</button>
                      <button onClick={e => { e.stopPropagation(); setClienteEditar(c); setMostrarForm(true); }}
                        style={{ padding: '4px 10px', background: '#0f3460', border: 'none', borderRadius: '6px', color: '#FFD700', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                      {c.activo && <button onClick={e => { e.stopPropagation(); desactivar(c.id); }}
                        style={{ padding: '4px 10px', background: '#0f3460', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px' }}>Baja</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DETALLE */}
      {clienteDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => { setClienteDetalle(null); setSaldo(null); }}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '28px', width: '500px', border: '1px solid #0f3460' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', margin: 0 }}>{clienteDetalle.nombre}</h2>
              <button onClick={() => { setClienteDetalle(null); setSaldo(null); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                ['Tipo', clienteDetalle.tipo],
                ['CUIT', clienteDetalle.cuit || '—'],
                ['Teléfono', clienteDetalle.telefono || '—'],
                ['Email', clienteDetalle.email || '—'],
                ['Dirección', clienteDetalle.direccion || '—'],
                ['Lista precio', clienteDetalle.lista_precio_default?.replace('_', ' ') || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#0f3460', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>{k}</div>
                  <div style={{ color: '#fff', fontSize: '13px', textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>

            {saldo !== null && (
              <div style={{ background: saldo.saldo > 0 ? '#4a000033' : saldo.saldo < 0 ? '#1b5e2033' : '#0f3460', borderRadius: '8px', padding: '14px', border: `1px solid ${saldo.saldo > 0 ? '#ff6b6b' : saldo.saldo < 0 ? '#4CAF50' : '#1a3a6a'}` }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Cuenta corriente</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: saldo.saldo > 0 ? '#ff6b6b' : saldo.saldo < 0 ? '#4CAF50' : '#aaa' }}>
                  ${Math.abs(saldo.saldo).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ color: '#888', fontSize: '12px', marginTop: '2px', textTransform: 'capitalize' }}>{saldo.estado}</div>
              </div>
            )}

            <button onClick={() => { setClienteEditar(clienteDetalle); setClienteDetalle(null); setSaldo(null); setMostrarForm(true); }}
              style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#0f3460', border: '1px solid #1a3a6a', borderRadius: '8px', color: '#FFD700', cursor: 'pointer', fontSize: '13px' }}>
              ✏️ Editar cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
