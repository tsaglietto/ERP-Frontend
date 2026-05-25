import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Moneda { id: number; codigo: string; simbolo: string; }
interface Categoria { id: number; nombre: string; }
interface Marca { id: number; nombre: string; }

interface Producto {
  id?: number;
  codigo: string;
  nombre: string;
  categoria_id: number | null;
  marca_id: number | null;
  costo: string;
  moneda_costo_id: number | null;
  indexar_por_moneda_id: number | null;
  flete: string;
  flete_tipo: string;
  iva: string;
  margen_base: string;
  stock_fisico: string;
  stock_comprometido: string;
  stock_minimo: string;
  vende_online: boolean;
  activo: boolean;
  esNuevo?: boolean;
  modificado?: boolean;
}

const IVA_OPCIONES = ['10.5', '21'];
const FLETE_TIPOS = ['porcentaje', 'monto'];

const COLUMNAS_DEF = [
  { key: 'codigo', label: 'Código', visible: true },
  { key: 'nombre', label: 'Nombre', visible: true },
  { key: 'categoria_id', label: 'Categoría', visible: true },
  { key: 'marca_id', label: 'Marca', visible: true },
  { key: 'costo', label: 'Costo', visible: true },
  { key: 'moneda_costo_id', label: 'Moneda', visible: true },
  { key: 'indexar_por_moneda_id', label: 'Índice', visible: true },
  { key: 'flete', label: 'Flete', visible: false },
  { key: 'flete_tipo', label: 'Tipo flete', visible: false },
  { key: 'iva', label: 'IVA%', visible: true },
  { key: 'margen_base', label: 'Margen%', visible: true },
  { key: 'stock_fisico', label: 'Stock', visible: true },
  { key: 'stock_comprometido', label: 'Comprometido', visible: false },
  { key: 'stock_minimo', label: 'Mín.', visible: false },
  { key: 'vende_online', label: 'Online', visible: false },
  { key: 'precio', label: 'Precio $', visible: true },
  { key: 'acciones', label: 'Acciones', visible: true },
];

const fmt = (val: any) => {
  const n = parseFloat(val);
  if (isNaN(n)) return '0';
  return n % 1 === 0 ? n.toString() : n.toString();
};

const Productos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [guardando, setGuardando] = useState<number | null>(null);
  const [modalFotos, setModalFotos] = useState<number | null>(null);
  const [modalDoc, setModalDoc] = useState<number | null>(null);
  const [urlFoto, setUrlFoto] = useState('');
  const [urlDoc, setUrlDoc] = useState('');
  const [nombreDoc, setNombreDoc] = useState('');
  const [columnas, setColumnas] = useState(COLUMNAS_DEF);
  const [mostrarColumnas, setMostrarColumnas] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/productos/'),
      api.get('/tipos-cambio/'),
      api.get('/categorias/'),
      api.get('/marcas/'),
    ]).then(([p, m, c, ma]) => {
      setProductos(p.data.map((prod: any) => ({
        ...prod,
        costo: fmt(prod.costo),
        flete: fmt(prod.flete),
        iva: fmt(prod.iva) === '0' ? '10.5' : fmt(prod.iva),
        margen_base: fmt(prod.margen_base),
        stock_minimo: fmt(prod.stock_minimo),
      })));
      setMonedas(m.data);
      setCategorias(c.data);
      setMarcas(ma.data);
    }).finally(() => setLoading(false));
  }, []);

  const colVisible = (key: string) => columnas.find(c => c.key === key)?.visible;

  const toggleColumna = (key: string) => {
    if (key === 'nombre' || key === 'acciones') return;
    setColumnas(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const calcularPrecio = (prod: Producto) => {
    const costo = parseFloat(prod.costo) || 0;
    const flete = parseFloat(prod.flete) || 0;
    const iva = parseFloat(prod.iva) || 0;
    const margen = parseFloat(prod.margen_base) || 0;
    const costoFlete = prod.flete_tipo === 'porcentaje' ? costo * (1 + flete / 100) : costo + flete;
    const costoIva = costoFlete * (1 + iva / 100);
    const precio = costoIva * (1 + margen / 100);
    return Math.ceil(precio / 500) * 500;
  };

  const guardarFila = async (prod: Producto, index: number) => {
    if (!prod.nombre || !prod.modificado) return;
    setGuardando(index);
    try {
      const datos = {
        nombre: prod.nombre, codigo: prod.codigo,
        categoria_id: prod.categoria_id, marca_id: prod.marca_id,
        costo: prod.costo || null, moneda_costo_id: prod.moneda_costo_id,
        indexar_por_moneda_id: prod.indexar_por_moneda_id,
        flete: prod.flete || 0, flete_tipo: prod.flete_tipo,
        iva: prod.iva || 21, margen_base: prod.margen_base || 0,
        stock_minimo: prod.stock_minimo || 0, vende_online: prod.vende_online,
      };
      if (prod.id) {
        await api.put(`/productos/${prod.id}`, datos);
        const nuevos = [...productos];
        nuevos[index] = { ...nuevos[index], modificado: false };
        setProductos(nuevos);
      } else {
        const r = await api.post('/productos/', datos);
        const nuevos = [...productos];
        nuevos[index] = { ...r.data, costo: fmt(r.data.costo), flete: fmt(r.data.flete), iva: fmt(r.data.iva), margen_base: fmt(r.data.margen_base), stock_minimo: fmt(r.data.stock_minimo), esNuevo: false, modificado: false };
        setProductos(nuevos);
      }
    } catch (e) { console.error(e); }
    setGuardando(null);
  };

  const actualizarFila = (index: number, campo: string, valor: any) => {
    const nuevos = [...productos];
    nuevos[index] = { ...nuevos[index], [campo]: valor, modificado: true };
    setProductos(nuevos);
  };

  const duplicarFila = (prod: Producto) => {
    const timestamp = Date.now().toString().slice(-4);
    const nueva: Producto = { ...prod, id: undefined, codigo: `${prod.codigo || 'PROD'}-${timestamp}`, nombre: `${prod.nombre} (copia)`, stock_fisico: '0', stock_comprometido: '0', esNuevo: true, modificado: true };
    setProductos([...productos, nueva]);
    setTimeout(() => { document.getElementById('tabla-productos')?.scrollTo({ top: 99999, behavior: 'smooth' }); }, 100);
  };

  const nuevaFila = () => {
    const ultima = productos[productos.length - 1];
    const timestamp = Date.now().toString().slice(-4);
    const nueva: Producto = {
      codigo: `PROD-${timestamp}`, nombre: '',
      categoria_id: ultima?.categoria_id || null, marca_id: ultima?.marca_id || null,
      costo: ultima?.costo || '', moneda_costo_id: ultima?.moneda_costo_id || null,
      indexar_por_moneda_id: ultima?.indexar_por_moneda_id || null,
      flete: ultima?.flete || '0', flete_tipo: ultima?.flete_tipo || 'porcentaje',
      iva: ultima?.iva || '21', margen_base: ultima?.margen_base || '0',
      stock_fisico: '0', stock_comprometido: '0', stock_minimo: '0',
      vende_online: false, activo: true, esNuevo: true, modificado: true,
    };
    setProductos([...productos, nueva]);
    setTimeout(() => { document.getElementById('tabla-productos')?.scrollTo({ top: 99999, behavior: 'smooth' }); }, 100);
  };

  const agregarFoto = async () => {
    if (!urlFoto || !modalFotos) return;
    await api.post(`/productos/${modalFotos}/documentos/`, { nombre: 'Foto', url: urlFoto, tipo: 'foto', visible_en_ventas: true });
    setUrlFoto(''); alert('Foto agregada ✅');
  };

  const agregarDoc = async () => {
    if (!urlDoc || !modalDoc) return;
    await api.post(`/productos/${modalDoc}/documentos/`, { nombre: nombreDoc || 'Documento', url: urlDoc, tipo: 'pdf', visible_en_ventas: true });
    setUrlDoc(''); setNombreDoc(''); alert('Documento agregado ✅');
  };

  const filtrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(buscar.toLowerCase())
  );

  const inputStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: '#fff', width: '100%', padding: '4px', fontSize: '13px', outline: 'none' };
  const selectStyle: React.CSSProperties = { background: '#0f3460', border: 'none', color: '#fff', width: '100%', padding: '4px', fontSize: '13px', outline: 'none', borderRadius: '4px' };
  const tdStyle = (mod?: boolean): React.CSSProperties => ({ padding: '4px 8px', borderBottom: '1px solid #0f3460', borderRight: '1px solid #0f3460', background: mod ? '#0d2010' : 'transparent', minWidth: '90px' });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>📦 Productos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMostrarColumnas(!mostrarColumnas)}
              style={{ padding: '10px 16px', background: '#0f3460', border: '1px solid #1a3a6a', borderRadius: '8px', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}>
              ⚙ Columnas
            </button>
            {mostrarColumnas && (
              <div style={{ position: 'absolute', top: '44px', right: 0, background: '#16213e', border: '1px solid #0f3460', borderRadius: '10px', padding: '16px', zIndex: 50, width: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <p style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold', margin: '0 0 12px' }}>MOSTRAR COLUMNAS</p>
                {columnas.map(col => (
                  <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: col.key === 'nombre' || col.key === 'acciones' ? 'not-allowed' : 'pointer', opacity: col.key === 'nombre' || col.key === 'acciones' ? 0.5 : 1 }}>
                    <input type="checkbox" checked={col.visible} onChange={() => toggleColumna(col.key)}
                      disabled={col.key === 'nombre' || col.key === 'acciones'} />
                    <span style={{ color: '#ccc', fontSize: '13px' }}>{col.label}</span>
                  </label>
                ))}
                <button onClick={() => setMostrarColumnas(false)}
                  style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#0f3460', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                  Cerrar
                </button>
              </div>
            )}
          </div>
          <button onClick={nuevaFila}
            style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            + Nuevo producto
          </button>
        </div>
      </div>

      <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre o código..."
        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #333', background: '#16213e', color: '#fff', marginBottom: '12px', boxSizing: 'border-box', fontSize: '14px', flexShrink: 0 }} />

      {loading ? <p style={{ color: '#888' }}>Cargando...</p> : (
        <div id="tabla-productos" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', borderRadius: '10px', border: '1px solid #0f3460' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#0f3460' }}>
                {columnas.filter(c => c.visible).map(col => (
                  <th key={col.key} style={{ padding: '10px 8px', color: '#4CAF50', textAlign: 'left', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', borderRight: '1px solid #1a3a6a' }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={columnas.filter(c => c.visible).length} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No hay productos. Hacé clic en "+ Nuevo producto" para agregar.</td></tr>
              ) : filtrados.map((prod, i) => {
                const precio = calcularPrecio(prod);
                const mod = prod.modificado;
                return (
                  <tr key={prod.id || `new-${i}`}
                    style={{ background: prod.esNuevo ? '#0d2010' : i % 2 === 0 ? '#16213e' : '#1a2545' }}
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) guardarFila(prod, i); }}>
                    {colVisible('codigo') && <td style={tdStyle(mod)}><input style={inputStyle} value={prod.codigo} onChange={e => actualizarFila(i, 'codigo', e.target.value)} /></td>}
                    {colVisible('nombre') && <td style={{ ...tdStyle(mod), minWidth: '160px' }}><input style={inputStyle} value={prod.nombre} onChange={e => actualizarFila(i, 'nombre', e.target.value)} placeholder="Nombre del producto" /></td>}
                    {colVisible('categoria_id') && <td style={tdStyle(mod)}>
                      <select style={selectStyle} value={prod.categoria_id || ''} onChange={e => actualizarFila(i, 'categoria_id', e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">-</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </td>}
                    {colVisible('marca_id') && <td style={tdStyle(mod)}>
                      <select style={selectStyle} value={prod.marca_id || ''} onChange={e => actualizarFila(i, 'marca_id', e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">-</option>{marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </td>}
                    {colVisible('costo') && <td style={tdStyle(mod)}><input style={{ ...inputStyle, textAlign: 'right' }} type="number" value={prod.costo} onChange={e => actualizarFila(i, 'costo', e.target.value)} placeholder="0" /></td>}
                    {colVisible('moneda_costo_id') && <td style={tdStyle(mod)}>
                      <select style={selectStyle} value={prod.moneda_costo_id || ''} onChange={e => actualizarFila(i, 'moneda_costo_id', e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">-</option>{monedas.map(m => <option key={m.id} value={m.id}>{m.codigo}</option>)}
                      </select>
                    </td>}
                    {colVisible('indexar_por_moneda_id') && <td style={tdStyle(mod)}>
                      <select style={selectStyle} value={prod.indexar_por_moneda_id || ''} onChange={e => actualizarFila(i, 'indexar_por_moneda_id', e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">-</option>{monedas.map(m => <option key={m.id} value={m.id}>{m.codigo}</option>)}
                      </select>
                    </td>}
                    {colVisible('flete') && <td style={tdStyle(mod)}><input style={{ ...inputStyle, textAlign: 'right' }} type="number" value={prod.flete} onChange={e => actualizarFila(i, 'flete', e.target.value)} /></td>}
                    {colVisible('flete_tipo') && <td style={tdStyle(mod)}>
                      <select style={selectStyle} value={prod.flete_tipo} onChange={e => actualizarFila(i, 'flete_tipo', e.target.value)}>
                        {FLETE_TIPOS.map(f => <option key={f} value={f}>{f === 'porcentaje' ? '%' : '$'}</option>)}
                      </select>
                    </td>}
                    {colVisible('iva') && <td style={tdStyle(mod)}>
                      <select style={selectStyle} value={prod.iva} onChange={e => actualizarFila(i, 'iva', e.target.value)}>
                        {IVA_OPCIONES.map(v => <option key={v} value={v}>{v}%</option>)}
                      </select>
                    </td>}
                    {colVisible('margen_base') && <td style={tdStyle(mod)}><input style={{ ...inputStyle, textAlign: 'right' }} type="number" value={prod.margen_base} onChange={e => actualizarFila(i, 'margen_base', e.target.value)} /></td>}
                    {colVisible('stock_fisico') && <td style={{ ...tdStyle(mod), color: parseFloat(prod.stock_fisico) < 0 ? '#ff6b6b' : '#4CAF50' }}>{fmt(prod.stock_fisico)}</td>}
                    {colVisible('stock_comprometido') && <td style={{ ...tdStyle(mod), color: '#aaa' }}>{fmt(prod.stock_comprometido)}</td>}
                    {colVisible('stock_minimo') && <td style={tdStyle(mod)}><input style={{ ...inputStyle, textAlign: 'right' }} type="number" value={prod.stock_minimo} onChange={e => actualizarFila(i, 'stock_minimo', e.target.value)} /></td>}
                    {colVisible('vende_online') && <td style={{ ...tdStyle(mod), textAlign: 'center' }}>
                      <input type="checkbox" checked={prod.vende_online} onChange={e => actualizarFila(i, 'vende_online', e.target.checked)} />
                    </td>}
                    {colVisible('precio') && <td style={{ ...tdStyle(mod), color: '#FFD700', fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {precio > 0 ? `$${precio.toLocaleString('es-AR')}` : '-'}
                    </td>}
                    {colVisible('acciones') && <td style={{ ...tdStyle(mod), minWidth: '130px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {guardando === i ? <span style={{ color: '#4CAF50', fontSize: '11px' }}>Guardando...</span> : (
                          <>
                            <button onClick={() => prod.id && setModalFotos(prod.id)} title="Fotos ML/Tiendanube" style={{ padding: '4px 7px', background: '#1565C0', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>📷</button>
                            <button onClick={() => prod.id && setModalDoc(prod.id)} title="Documento técnico" style={{ padding: '4px 7px', background: '#6A1B9A', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>📄</button>
                            <button onClick={() => duplicarFila(prod)} title="Duplicar fila" style={{ padding: '4px 7px', background: '#E65100', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>📋</button>
                          </>
                        )}
                      </div>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalFotos && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '32px', width: '480px', border: '1px solid #0f3460' }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>📷 Fotos del producto</h3>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>Estas fotos se usan en MercadoLibre y Tiendanube</p>
            <input value={urlFoto} onChange={e => setUrlFoto(e.target.value)} placeholder="URL de la foto (Google Drive, Dropbox, etc.)"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={agregarFoto} style={{ flex: 1, padding: '10px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Agregar foto</button>
              <button onClick={() => setModalFotos(null)} style={{ flex: 1, padding: '10px', background: '#333', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modalDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '32px', width: '480px', border: '1px solid #0f3460' }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>📄 Documento técnico</h3>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>Fichas técnicas, curvas de bomba, manuales, etc.</p>
            <input value={nombreDoc} onChange={e => setNombreDoc(e.target.value)} placeholder="Nombre (ej: Ficha técnica bomba X)"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
            <input value={urlDoc} onChange={e => setUrlDoc(e.target.value)} placeholder="URL del PDF (Google Drive, Dropbox, etc.)"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={agregarDoc} style={{ flex: 1, padding: '10px', background: '#6A1B9A', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Agregar documento</button>
              <button onClick={() => setModalDoc(null)} style={{ flex: 1, padding: '10px', background: '#333', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
