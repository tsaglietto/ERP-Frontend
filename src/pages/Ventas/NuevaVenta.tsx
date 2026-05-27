import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

interface Producto { id: number; nombre: string; codigo: string; iva: string; stock_fisico: string; }
interface Cliente { id: number; nombre: string; tipo: string; cuit: string; lista_precio_default: string; }
interface LineaVenta { producto_id: number; nombre: string; codigo: string; presentacion_id: number | null; presentacion_nombre: string; cantidad: number; precio_unitario: number; descuento: number; subtotal: number; }

const MEDIOS_PAGO = ['Débito', 'Efectivo', 'Transferencia', 'Crédito 1 cuota', 'Crédito cuotas', 'Cheque', 'Cuenta corriente', 'Dólares', 'MercadoPago', 'Otro'];
const DESCUENTOS_RAPIDOS = [5, 10, 15, 20];
const LISTAS_PRECIO = ['Débito', 'Efectivo', 'Transferencia', 'Crédito 1 cuota', 'Crédito cuotas', 'Cuenta corriente'];
const CUOTAS_OPCIONES = [3, 6, 9, 12, 18, 24];
const RECARGOS_CUOTAS: Record<number, number> = { 3: 5, 6: 10, 9: 15, 12: 20, 18: 28, 24: 35 };

interface VentaTab { id: string; label: string; data: VentaData; }
interface VentaData {
  cliente: Cliente | null; buscarCliente: string; buscarProducto: string;
  lineas: LineaVenta[]; listaPrecio: string; medioPago: string;
  cuotas: number; recargoCuotas: number; descuentoGlobal: number;
  notas: string; nroOC: string;
}

const nuevaVentaData = (): VentaData => ({
  cliente: null, buscarCliente: '', buscarProducto: '',
  lineas: [], listaPrecio: 'Débito', medioPago: '',
  cuotas: 3, recargoCuotas: 5, descuentoGlobal: 0,
  notas: '', nroOC: '',
});

let tabCounter = 1;

const NuevaVenta: React.FC<{ onVolver: () => void; onVentaCreada: () => void; documentoPadreId?: number; tipoPadre?: string; clientePrecargado?: Cliente | null; lineasPrecargadas?: LineaVenta[] }> = ({ onVolver, onVentaCreada, documentoPadreId, tipoPadre, clientePrecargado, lineasPrecargadas }) => {
  const [tabs, setTabs] = useState<VentaTab[]>([{ id: '1', label: 'Venta 1', data: nuevaVentaData() }]);
  const [tabActiva, setTabActiva] = useState('1');
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([]);
  const [productosSugeridos, setProductosSugeridos] = useState<Producto[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [modalSF, setModalSF] = useState(false);
  const [medioPagoSF, setMedioPagoSF] = useState('');

  const tab = tabs.find(t => t.id === tabActiva)!;
  const data = tab.data;

  const updateData = (updates: Partial<VentaData>) => {
    setTabs(prev => prev.map(t => t.id === tabActiva ? { ...t, data: { ...t.data, ...updates } } : t));
  };

  const agregarTab = () => {
    tabCounter++;
    const id = String(tabCounter);
    setTabs(prev => [...prev, { id, label: `Venta ${tabCounter}`, data: nuevaVentaData() }]);
    setTabActiva(id);
    setError('');
  };

  const cerrarTab = (id: string) => {
    if (tabs.length === 1) return;
    const nuevas = tabs.filter(t => t.id !== id);
    setTabs(nuevas);
    if (tabActiva === id) setTabActiva(nuevas[nuevas.length - 1].id);
  };


  // Cargar datos precargados si vienen de otro documento
  useEffect(() => {
    if (clientePrecargado) updateData({ cliente: clientePrecargado });
    if (lineasPrecargadas && lineasPrecargadas.length > 0) updateData({ lineas: lineasPrecargadas });
  }, []);

  useEffect(() => {
    if (data.buscarCliente.length < 2) { setClientesSugeridos([]); return; }
    api.get(`/clientes/?buscar=${data.buscarCliente}`).then(r => setClientesSugeridos(r.data.slice(0, 5)));
  }, [data.buscarCliente]);

  useEffect(() => {
    if (data.buscarProducto.length < 2) { setProductosSugeridos([]); return; }
    api.get(`/productos/?buscar=${data.buscarProducto}`).then(r => setProductosSugeridos(r.data.slice(0, 8)));
  }, [data.buscarProducto]);

  const agregarProducto = async (prod: Producto) => {
    try {
      const precioR = await api.get(`/precios/calcular/${prod.id}`);
      const precio = precioR.data.precios_por_canal?.mostrador?.precio || 0;
      updateData({ lineas: [...data.lineas, { producto_id: prod.id, nombre: prod.nombre, codigo: prod.codigo, presentacion_id: null, presentacion_nombre: 'Unidad', cantidad: 1, precio_unitario: precio, descuento: 0, subtotal: precio }], buscarProducto: '' });
    } catch { updateData({ buscarProducto: '' }); }
    setProductosSugeridos([]);
  };

  const actualizarLinea = (i: number, campo: string, valor: any) => {
    const nuevas = [...data.lineas];
    nuevas[i] = { ...nuevas[i], [campo]: valor };
    const qty = campo === 'cantidad' ? parseFloat(valor) || 0 : nuevas[i].cantidad;
    const precio = campo === 'precio_unitario' ? parseFloat(valor) || 0 : nuevas[i].precio_unitario;
    const desc = campo === 'descuento' ? parseFloat(valor) || 0 : nuevas[i].descuento;
    nuevas[i].subtotal = qty * precio * (1 - desc / 100);
    updateData({ lineas: nuevas });
  };

  const eliminarLinea = (i: number) => updateData({ lineas: data.lineas.filter((_, idx) => idx !== i) });

  const subtotal = data.lineas.reduce((a, l) => a + l.subtotal, 0);
  const descuentoMonto = subtotal * data.descuentoGlobal / 100;
  const recargoCuotasMonto = data.medioPago === 'Crédito cuotas' ? (subtotal - descuentoMonto) * data.recargoCuotas / 100 : 0;
  const total = subtotal - descuentoMonto + recargoCuotasMonto;
  const vuelto = montoRecibido ? Math.max(0, parseFloat(montoRecibido) - total) : 0;

  const handleF2 = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F2') { e.preventDefault(); setModalSF(true); }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleF2);
    return () => window.removeEventListener('keydown', handleF2);
  }, [handleF2]);

  const confirmarSF = async () => {
    if (!medioPagoSF) { setError('Seleccioná un medio de pago para S/F'); return; }
    if (data.lineas.length === 0) { setError('Agregá al menos un producto'); return; }
    setModalSF(false); setGuardando(true); setError('');
    try {
      const datos = {
        tipo: 'venta', cliente_id: data.cliente?.id || null,
        notas: 'SIN_COMPROBANTE',
        lineas: data.lineas.map(l => ({ producto_id: l.producto_id, presentacion_id: l.presentacion_id, cantidad: l.cantidad, precio_unitario: l.precio_unitario, descuento: l.descuento, mostrar_marca: true }))
      };
      const r = await api.post('/ventas/', datos);
      await api.post(`/ventas/${r.data.id}/remito`);
      await api.post(`/ventas/${r.data.id}/cobro`, { venta_id: r.data.id, monto: total, medio_pago: medioPagoSF.toLowerCase().replace(/ /g, '_') });
      onVentaCreada();
    } catch (e: any) { setError(e?.response?.data?.detail || 'Error'); }
    setGuardando(false);
  };

  const confirmar = async (tipo: 'cobrar' | 'remito' | 'presupuesto' | 'pedido') => {
    if (data.lineas.length === 0) { setError('Agregá al menos un producto'); return; }
    if (tipo !== 'presupuesto' && !data.medioPago) { setError('Seleccioná un medio de pago'); return; }
    if ((tipo === 'remito' || tipo === 'pedido') && !data.cliente) { setError(`El ${tipo} requiere un cliente`); return; }
    setError(''); setGuardando(true);
    try {
      const notasFinal = [data.notas, data.medioPago === 'Crédito cuotas' ? `CUOTAS:${data.cuotas}:${data.recargoCuotas}` : ''].filter(Boolean).join('|');
      const tipoDoc = tipo === 'presupuesto' ? 'presupuesto' : tipo === 'pedido' ? 'pedido' : 'venta';
      const datos = {
        tipo: tipoDoc, cliente_id: data.cliente?.id || null,
        notas: notasFinal, nro_orden_compra: data.nroOC || null,
        lineas: data.lineas.map(l => ({ producto_id: l.producto_id, presentacion_id: l.presentacion_id, cantidad: l.cantidad, precio_unitario: l.precio_unitario, descuento: l.descuento, mostrar_marca: true }))
      };
      const r = await api.post('/ventas/', datos);
      const ventaId = r.data.id;
      if (tipo === 'cobrar') {
        await api.post(`/ventas/${ventaId}/remito`);
        await api.post(`/ventas/${ventaId}/cobro`, { venta_id: ventaId, monto: total, medio_pago: data.medioPago.toLowerCase().replace(/ /g, '_') });
      } else if (tipo === 'remito') {
        await api.post(`/ventas/${ventaId}/remito`);
        await api.post(`/ventas/${ventaId}/cobro`, { venta_id: ventaId, monto: total, medio_pago: data.medioPago.toLowerCase().replace(/ /g, '_') });
      } else if (tipo === 'pedido') {
        await api.post(`/ventas/${ventaId}/cobro`, { venta_id: ventaId, monto: total, medio_pago: data.medioPago.toLowerCase().replace(/ /g, '_') });
      }
      onVentaCreada();
    } catch (e: any) { setError(e?.response?.data?.detail || 'Error al confirmar'); }
    setGuardando(false);
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #1a3a6a', background: '#0f3460', color: '#fff', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: '0' }}>

      {/* PESTAÑAS DE VENTAS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => { setTabActiva(t.id); setError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '13px', border: '1px solid #0f3460', borderBottom: 'none',
              background: tabActiva === t.id ? '#16213e' : '#0a1628', color: tabActiva === t.id ? '#4CAF50' : '#888' }}>
            <span>{t.label}</span>
            {tabs.length > 1 && (
              <span onClick={e => { e.stopPropagation(); cerrarTab(t.id); }}
                style={{ color: '#ff6b6b', fontSize: '14px', lineHeight: 1, marginLeft: '4px' }}>×</span>
            )}
          </div>
        ))}
        <button onClick={agregarTab}
          style={{ padding: '6px 12px', borderRadius: '8px 8px 0 0', border: '1px solid #0f3460', borderBottom: 'none', background: '#0a1628', color: '#4CAF50', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>
          +
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', flex: 1, overflow: 'hidden' }}>
        <div style={{ background: '#16213e', borderRadius: '0 12px 12px 12px', border: '1px solid #0f3460', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input autoComplete="off" value={data.cliente ? data.cliente.nombre : data.buscarCliente}
                onChange={e => { updateData({ cliente: null, buscarCliente: e.target.value }); }}
                placeholder="👤 Buscar cliente o continuar sin cliente..." style={inputStyle} />
              {clientesSugeridos.length > 0 && !data.cliente && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#16213e', border: '1px solid #0f3460', borderRadius: '8px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {clientesSugeridos.map(c => (
                    <div key={c.id} onClick={() => { updateData({ cliente: c, buscarCliente: '' }); setClientesSugeridos([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #0f3460', fontSize: '13px', color: '#fff' }}
                      onMouseOver={e => (e.currentTarget.style.background = '#0f3460')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ fontWeight: '500' }}>{c.nombre}</div>
                      <div style={{ color: '#888', fontSize: '11px' }}>{c.cuit || c.tipo}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select value={data.listaPrecio} onChange={e => updateData({ listaPrecio: e.target.value })} style={{ ...inputStyle, width: '160px' }}>
              {LISTAS_PRECIO.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input autoComplete="off" value={data.nroOC} onChange={e => updateData({ nroOC: e.target.value })} placeholder="Nº OC" style={{ ...inputStyle, width: '100px' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <input autoComplete="off" value={data.buscarProducto} onChange={e => updateData({ buscarProducto: e.target.value })}
              placeholder="🔍 Buscar por nombre, código, categoría o marca..." style={inputStyle} />
            {productosSugeridos.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#16213e', border: '1px solid #0f3460', borderRadius: '8px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {productosSugeridos.map(p => (
                  <div key={p.id} onClick={() => agregarProducto(p)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #0f3460', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseOver={e => (e.currentTarget.style.background = '#0f3460')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: '500' }}>{p.nombre}</span>
                      <span style={{ color: '#888', fontSize: '11px', marginLeft: '8px' }}>{p.codigo}</span>
                    </div>
                    <span style={{ color: parseFloat(p.stock_fisico) < 0 ? '#ff6b6b' : '#4CAF50', fontSize: '12px' }}>Stock: {parseFloat(p.stock_fisico).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f3460' }}>
                  {['Producto', 'Presentación', 'Cant.', 'Precio unit.', 'Desc.%', 'Subtotal', ''].map(h => (
                    <th key={h} style={{ padding: '8px', color: '#4CAF50', textAlign: ['Cant.','Precio unit.','Desc.%','Subtotal'].includes(h) ? 'right' : 'left', fontSize: '12px', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.lineas.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '13px' }}>Buscá un producto arriba para agregarlo</td></tr>
                ) : data.lineas.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #0f3460', background: i % 2 === 0 ? '#16213e' : '#1a2545' }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ color: '#fff', fontWeight: '500' }}>{l.nombre}</div>
                      <div style={{ color: '#666', fontSize: '11px' }}>{l.codigo}</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ background: '#0f3460', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#aaa', display: 'inline-block' }}>{l.presentacion_nombre}</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <input autoComplete="off" type="number" value={l.cantidad} onChange={e => actualizarLinea(i, 'cantidad', e.target.value)} style={{ ...inputStyle, width: '60px', textAlign: 'right', padding: '4px 6px' }} />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <input autoComplete="off" type="number" value={l.precio_unitario} onChange={e => actualizarLinea(i, 'precio_unitario', e.target.value)} style={{ ...inputStyle, width: '90px', textAlign: 'right', padding: '4px 6px' }} />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <input autoComplete="off" type="number" value={l.descuento} onChange={e => actualizarLinea(i, 'descuento', e.target.value)} style={{ ...inputStyle, width: '55px', textAlign: 'right', padding: '4px 6px' }} />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#fff', fontWeight: '500' }}>${l.subtotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button onClick={() => eliminarLinea(i)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '16px' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#888', fontSize: '13px', whiteSpace: 'nowrap' }}>Descuento:</span>
            {DESCUENTOS_RAPIDOS.map(d => (
              <button key={d} onClick={() => updateData({ descuentoGlobal: data.descuentoGlobal === d ? 0 : d })}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #333', background: data.descuentoGlobal === d ? '#4CAF50' : '#0f3460', color: data.descuentoGlobal === d ? '#fff' : '#aaa', cursor: 'pointer', fontSize: '12px' }}>
                {d}%
              </button>
            ))}
            <input autoComplete="off" type="number" value={data.descuentoGlobal || ''} onChange={e => updateData({ descuentoGlobal: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, width: '60px', padding: '4px 6px', textAlign: 'right' }} placeholder="%" />
          </div>
          <input autoComplete="off" value={data.notas} onChange={e => updateData({ notas: e.target.value })} placeholder="📝 Notas u observaciones..." style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div style={{ background: '#16213e', borderRadius: '12px', border: '1px solid #0f3460', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#4CAF50', fontWeight: '600', marginBottom: '12px', letterSpacing: '1px' }}>RESUMEN</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: '#888' }}>Subtotal</span>
              <span style={{ color: '#fff' }}>${subtotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
            </div>
            {data.descuentoGlobal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#888' }}>Descuento {data.descuentoGlobal}%</span>
                <span style={{ color: '#ff6b6b' }}>-${descuentoMonto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            {recargoCuotasMonto > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#888' }}>Recargo {data.cuotas}x ({data.recargoCuotas}%)</span>
                <span style={{ color: '#FF9800' }}>+${recargoCuotasMonto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #0f3460', paddingTop: '10px', marginTop: '6px' }}>
              <span style={{ color: '#fff' }}>Total</span>
              <span style={{ color: '#FFD700' }}>${total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <div style={{ background: '#16213e', borderRadius: '12px', border: '1px solid #0f3460', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#4CAF50', fontWeight: '600', marginBottom: '12px', letterSpacing: '1px' }}>COBRO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              {MEDIOS_PAGO.map(m => (
                <button key={m} onClick={() => updateData({ medioPago: data.medioPago === m ? '' : m })}
                  style={{ padding: '7px 4px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', textAlign: 'center',
                    background: data.medioPago === m ? '#1565C0' : '#0f3460',
                    borderColor: data.medioPago === m ? '#1976D2' : '#1a3a6a',
                    color: data.medioPago === m ? '#fff' : '#aaa' }}>
                  {m}
                </button>
              ))}
            </div>
            {data.medioPago === 'Crédito cuotas' && (
              <div style={{ background: '#0f3460', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Cantidad de cuotas</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {CUOTAS_OPCIONES.map(c => (
                    <button key={c} onClick={() => updateData({ cuotas: c, recargoCuotas: RECARGOS_CUOTAS[c] })}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #333', background: data.cuotas === c ? '#4CAF50' : '#16213e', color: data.cuotas === c ? '#fff' : '#aaa', cursor: 'pointer', fontSize: '12px' }}>
                      {c}x
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#888', fontSize: '12px' }}>Recargo %</span>
                  <input autoComplete="off" type="number" value={data.recargoCuotas} onChange={e => updateData({ recargoCuotas: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, width: '70px', padding: '4px 8px', textAlign: 'right' }} />
                  <span style={{ color: '#FF9800', fontSize: '12px' }}>+${recargoCuotasMonto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            )}
            <input autoComplete="off" type="number" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)}
              placeholder={`Monto: $${total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
              style={{ ...inputStyle, marginBottom: '8px' }} />
            {montoRecibido && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500' }}>
                <span style={{ color: '#888' }}>Vuelto</span>
                <span style={{ color: '#4CAF50' }}>${vuelto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </div>

          {error && <div style={{ background: '#4a0000', borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b', fontSize: '13px' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => confirmar('cobrar')} disabled={guardando}
              style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: guardando ? '#555' : '#4CAF50', color: '#fff', fontSize: '15px', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}>
              {guardando ? 'Procesando...' : '✓ Cobrar y confirmar'}
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => confirmar('remito')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#aaa', fontSize: '12px', cursor: 'pointer' }}>🚛 Solo remito</button>
              <button onClick={() => confirmar('presupuesto')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#aaa', fontSize: '12px', cursor: 'pointer' }}>📄 Presupuesto</button>
            </div>
            <button onClick={() => confirmar('pedido')} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0f3460', color: '#aaa', fontSize: '13px', cursor: 'pointer' }}>📋 Guardar como pedido</button>
            <button onClick={onVolver} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: 'transparent', color: '#ff6b6b', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
          </div>
          <div style={{ textAlign: 'center', color: '#333', fontSize: '11px' }}>F2 → S/F</div>
        </div>
      </div>

      {/* MODAL S/F */}
      {modalSF && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '32px', width: '400px', border: '1px solid #0f3460' }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>Venta S/F</h3>
            <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>Total: <strong style={{ color: '#FFD700' }}>${total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
              {MEDIOS_PAGO.map(m => (
                <button key={m} onClick={() => setMedioPagoSF(medioPagoSF === m ? '' : m)}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid', fontSize: '12px', cursor: 'pointer',
                    background: medioPagoSF === m ? '#1565C0' : '#0f3460',
                    borderColor: medioPagoSF === m ? '#1976D2' : '#1a3a6a',
                    color: medioPagoSF === m ? '#fff' : '#aaa' }}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={confirmarSF} style={{ flex: 1, padding: '12px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar S/F</button>
              <button onClick={() => { setModalSF(false); setMedioPagoSF(''); }} style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaVenta;
