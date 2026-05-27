import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';

interface LineaVenta { id: number; nombre_producto: string; codigo_producto: string; cantidad: string; precio_unitario: string; descuento: string; subtotal: string; }
interface Venta { id: number; tipo: string; estado: string; total: string; subtotal: string; iva_total: string; monto_cobrado: string; fecha: string; cliente_id: number; cliente_nombre: string; notas: string; nro_orden_compra: string; documento_origen_id: number | null; lineas: LineaVenta[]; }

const ESTADO_COLOR: Record<string, string> = {
  confirmada: '#FF9800', entregada: '#2196F3', cobrada: '#4CAF50', cancelada: '#ff6b6b'
};
const TIPO_LABEL: Record<string, string> = {
  venta: 'Venta', remito: 'Remito', presupuesto: 'Presupuesto',
  pedido: 'Pedido', nota_credito: 'N/C', nota_debito: 'N/D'
};
const TIPO_COLOR: Record<string, string> = {
  venta: '#4CAF50', remito: '#2196F3', presupuesto: '#9C27B0',
  pedido: '#FF9800', nota_credito: '#ff6b6b', nota_debito: '#FF9800'
};
const MEDIOS_PAGO = ['Débito', 'Efectivo', 'Transferencia', 'Crédito 1 cuota', 'Crédito cuotas', 'Cheque', 'Cuenta corriente', 'Dólares', 'MercadoPago', 'Otro'];

type Pestana = 'todas' | 'ventas' | 'remitos' | 'presupuestos' | 'pedidos' | 'nc_nd';

const Ventas: React.FC<{ onNuevaVenta?: () => void }> = ({ onNuevaVenta }) => {
  const [pestana, setPestana] = useState<Pestana>('todas');
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);
  const [tooltip, setTooltip] = useState<{ venta: Venta; x: number; y: number } | null>(null);
  const [modalOP, setModalOP] = useState(false);
  const [modalNC, setModalNC] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [pendientesCobro, setPendientesCobro] = useState<any[]>([]);
  const [montoOP, setMontoOP] = useState('');
  const [medioOP, setMedioOP] = useState('');
  const [notasOP, setNotasOP] = useState('');
  const [guardandoOP, setGuardandoOP] = useState(false);
  const [errorOP, setErrorOP] = useState('');
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargarVentas = () => {
    setLoading(true);
    api.get('/ventas/?limit=200').then(r => setVentas(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { cargarVentas(); }, []);

  const ventasFiltradas = ventas.filter(v => {
    if (pestana === 'ventas') return v.tipo === 'venta';
    if (pestana === 'remitos') return v.tipo === 'remito';
    if (pestana === 'presupuestos') return v.tipo === 'presupuesto';
    if (pestana === 'pedidos') return v.tipo === 'pedido';
    if (pestana === 'nc_nd') return v.tipo === 'nota_credito' || v.tipo === 'nota_debito';
    return true;
  });

  const handleMouseEnter = (e: React.MouseEvent, venta: Venta) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hoverTimer.current = setTimeout(() => {
      setTooltip({ venta, x: rect.left, y: rect.bottom + window.scrollY });
    }, 700);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setTooltip(null);
  };

  const abrirOrdenPago = async (venta: Venta) => {
    setVentaSeleccionada(venta);
    setModalOP(true);
    setErrorOP('');
    setMontoOP('');
    setMedioOP('');
    setNotasOP('');
    if (venta.cliente_id) {
      const r = await api.get(`/ventas/pendientes-cobro/${venta.cliente_id}`);
      setPendientesCobro(r.data);
    }
  };

  const confirmarOrdenPago = async () => {
    if (!montoOP || !medioOP) { setErrorOP('Completá monto y medio de pago'); return; }
    if (!ventaSeleccionada?.cliente_id) { setErrorOP('La venta no tiene cliente asignado'); return; }
    setGuardandoOP(true); setErrorOP('');
    try {
      await api.post('/ventas/ordenes-pago/', {
        cliente_id: ventaSeleccionada.cliente_id,
        monto_total: parseFloat(montoOP),
        medio_pago: medioOP,
        notas: notasOP
      });
      cargarVentas();
      setModalOP(false);
    } catch (e: any) { setErrorOP(e?.response?.data?.detail || 'Error'); }
    setGuardandoOP(false);
  };

  const tabStyle = (tab: Pestana): React.CSSProperties => ({
    padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '13px',
    fontWeight: '500', whiteSpace: 'nowrap', background: pestana === tab ? '#0f3460' : 'transparent',
    color: pestana === tab ? '#4CAF50' : '#888',
    borderBottom: pestana === tab ? '2px solid #4CAF50' : '2px solid transparent',
  });

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '8px', border: '1px solid #1a3a6a',
    background: '#0f3460', color: '#fff', fontSize: '13px', outline: 'none',
    width: '100%', boxSizing: 'border-box'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>🛒 Ventas</h1>
        <button onClick={() => onNuevaVenta?.()}
          style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          + Nueva venta
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #0f3460', marginBottom: '20px', overflowX: 'auto' }}>
        <button onClick={() => setPestana('todas')} style={tabStyle('todas')}>📋 Todas</button>
        <button onClick={() => setPestana('ventas')} style={tabStyle('ventas')}>💰 Ventas</button>
        <button onClick={() => setPestana('remitos')} style={tabStyle('remitos')}>🚛 Remitos</button>
        <button onClick={() => setPestana('presupuestos')} style={tabStyle('presupuestos')}>📄 Presupuestos</button>
        <button onClick={() => setPestana('pedidos')} style={tabStyle('pedidos')}>📋 Pedidos</button>
        <button onClick={() => setPestana('nc_nd')} style={tabStyle('nc_nd')}>↩ NC / ND</button>
      </div>

      {loading ? <p style={{ color: '#888' }}>Cargando...</p> : (
        <div style={{ background: '#16213e', borderRadius: '12px', overflow: 'hidden', border: '1px solid #0f3460' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f3460' }}>
                {['#', 'Fecha', 'Cliente', 'Tipo', 'Total', 'Cobrado', 'Pendiente', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: '#4CAF50', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#555' }}>No hay registros</td></tr>
              ) : ventasFiltradas.map((v, i) => {
                const pendiente = parseFloat(v.total) - parseFloat(v.monto_cobrado || '0');
                return (
                  <tr key={v.id}
                    onMouseEnter={e => handleMouseEnter(e, v)}
                    onMouseLeave={handleMouseLeave}
                    onDoubleClick={() => setVentaDetalle(v)}
                    style={{ borderTop: '1px solid #0f3460', background: i % 2 === 0 ? '#16213e' : '#1a2545', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 16px', color: '#aaa' }}>#{v.id}</td>
                    <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '12px' }}>
                      {new Date(v.fecha).toLocaleDateString('es-AR')} {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff' }}>{v.cliente_nombre || <span style={{ color: '#555' }}>Sin cliente</span>}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: (TIPO_COLOR[v.tipo] || '#555') + '33', color: TIPO_COLOR[v.tipo] || '#aaa' }}>
                        {TIPO_LABEL[v.tipo] || v.tipo}{v.notas?.includes('SIN_COMPROBANTE') ? ' S/C' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 'bold' }}>
                      ${parseFloat(v.total).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4CAF50' }}>
                      ${parseFloat(v.monto_cobrado || '0').toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '12px 16px', color: pendiente > 0 ? '#FF9800' : '#4CAF50', fontWeight: pendiente > 0 ? 'bold' : 'normal' }}>
                      {pendiente > 0 ? `$${pendiente.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '✓'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', background: (ESTADO_COLOR[v.estado] || '#555') + '33', color: ESTADO_COLOR[v.estado] || '#aaa' }}>
                        {v.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={e => { e.stopPropagation(); setVentaDetalle(v); }}
                          style={{ padding: '4px 10px', background: '#0f3460', border: 'none', borderRadius: '6px', color: '#4CAF50', cursor: 'pointer', fontSize: '12px' }}>
                          Ver
                        </button>
                        {v.cliente_id && v.tipo !== 'presupuesto' && v.tipo !== 'nota_credito' && v.tipo !== 'nota_debito' && (
                          <button onClick={e => { e.stopPropagation(); abrirOrdenPago(v); }}
                            style={{ padding: '4px 10px', background: '#1a3a6a', border: 'none', borderRadius: '6px', color: '#FFD700', cursor: 'pointer', fontSize: '12px' }}>
                            $ Cobrar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TOOLTIP */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: Math.min(tooltip.x, window.innerWidth - 340),
          top: tooltip.y - window.scrollY + 8, zIndex: 1000,
          background: '#0a1628', border: '1px solid #0f3460', borderRadius: '10px',
          padding: '12px', width: '320px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '600', marginBottom: '8px' }}>
            {TIPO_LABEL[tooltip.venta.tipo]} #{tooltip.venta.id} — {tooltip.venta.cliente_nombre || 'Sin cliente'}
          </div>
          {tooltip.venta.lineas.length === 0
            ? <div style={{ color: '#555', fontSize: '12px' }}>Sin artículos cargados</div>
            : tooltip.venta.lineas.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #0f3460' }}>
                <span style={{ color: '#ccc' }}>{l.nombre_producto} <span style={{ color: '#666' }}>x{parseFloat(l.cantidad).toFixed(0)}</span></span>
                <span style={{ color: '#fff', fontWeight: '500' }}>${parseFloat(l.subtotal).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            ))
          }
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #1a3a6a' }}>
            <span style={{ color: '#888' }}>Total</span>
            <span style={{ color: '#FFD700' }}>${parseFloat(tooltip.venta.total).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
          </div>
          <div style={{ color: '#555', fontSize: '11px', marginTop: '6px', textAlign: 'center' }}>doble click para ver detalle completo</div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {ventaDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setVentaDetalle(null)}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '28px', width: '620px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #0f3460' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: (TIPO_COLOR[ventaDetalle.tipo] || '#555') + '33', color: TIPO_COLOR[ventaDetalle.tipo] || '#aaa' }}>
                    {TIPO_LABEL[ventaDetalle.tipo]}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', background: (ESTADO_COLOR[ventaDetalle.estado] || '#555') + '33', color: ESTADO_COLOR[ventaDetalle.estado] || '#aaa' }}>
                    {ventaDetalle.estado}
                  </span>
                  {ventaDetalle.documento_origen_id && (
                    <span style={{ fontSize: '11px', color: '#888' }}>→ origen #{ventaDetalle.documento_origen_id}</span>
                  )}
                </div>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '20px' }}>#{ventaDetalle.id}</h2>
              </div>
              <button onClick={() => setVentaDetalle(null)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                ['Cliente', ventaDetalle.cliente_nombre || 'Sin cliente'],
                ['Fecha', new Date(ventaDetalle.fecha).toLocaleString('es-AR')],
                ['N° OC', ventaDetalle.nro_orden_compra || '—'],
                ['Notas', ventaDetalle.notas || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#0f3460', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ color: '#666', fontSize: '11px', marginBottom: '2px' }}>{k}</div>
                  <div style={{ color: '#fff', fontSize: '13px' }}>{v}</div>
                </div>
              ))}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#0f3460' }}>
                  {['Producto', 'Cant.', 'Precio', 'Desc.', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', color: '#4CAF50', textAlign: h === 'Producto' ? 'left' : 'right', fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ventaDetalle.lineas.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #0f3460' }}>
                    <td style={{ padding: '8px 12px', color: '#fff' }}>
                      {l.nombre_producto}
                      <span style={{ color: '#555', fontSize: '11px', marginLeft: '6px' }}>{l.codigo_producto}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#aaa', textAlign: 'right' }}>{parseFloat(l.cantidad).toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', color: '#aaa', textAlign: 'right' }}>${parseFloat(l.precio_unitario).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: '8px 12px', color: '#aaa', textAlign: 'right' }}>{parseFloat(l.descuento) > 0 ? `${parseFloat(l.descuento)}%` : '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#fff', fontWeight: 'bold', textAlign: 'right' }}>${parseFloat(l.subtotal).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: '#0f3460', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              {[
                ['Subtotal', ventaDetalle.subtotal, '#aaa'],
                ['IVA', ventaDetalle.iva_total, '#aaa'],
                ['Cobrado', ventaDetalle.monto_cobrado || '0', '#4CAF50'],
                ['Pendiente', String(parseFloat(ventaDetalle.total) - parseFloat(ventaDetalle.monto_cobrado || '0')), '#FF9800'],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#888' }}>{k}</span>
                  <span style={{ color: c as string }}>${parseFloat(v as string).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 'bold', borderTop: '1px solid #1a3a6a', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ color: '#fff' }}>Total</span>
                <span style={{ color: '#FFD700' }}>${parseFloat(ventaDetalle.total).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {/* GENERAR FACTURA */}
              {(() => {
                const tieneFC = false; // futuro: buscar hijos tipo factura
                const bloqueado = ventaDetalle.tipo === 'nota_credito' || ventaDetalle.tipo === 'nota_debito' || ventaDetalle.tipo === 'venta';
                return (
                  <button
                    disabled={bloqueado}
                    onClick={() => { setVentaDetalle(null); onNuevaVenta?.(); }}
                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar factura vinculada'}
                    style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? 0.4 : 1, background: '#0f3460', borderColor: '#1a3a6a', color: '#fff' }}>
                    📄 Factura
                  </button>
                );
              })()}
              {/* NUEVO REMITO */}
              {(() => {
                const bloqueado = ventaDetalle.tipo === 'remito' || ventaDetalle.tipo === 'nota_credito' || ventaDetalle.tipo === 'nota_debito';
                return (
                  <button
                    disabled={bloqueado}
                    onClick={() => { setVentaDetalle(null); onNuevaVenta?.(); }}
                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar remito de entrega'}
                    style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? 0.4 : 1, background: '#0f3460', borderColor: '#1a3a6a', color: '#2196F3' }}>
                    🚛 Remito
                  </button>
                );
              })()}
              {/* GENERAR PEDIDO */}
              {(() => {
                const bloqueado = ventaDetalle.tipo === 'pedido' || ventaDetalle.tipo === 'remito' || ventaDetalle.tipo === 'nota_credito' || ventaDetalle.tipo === 'nota_debito';
                return (
                  <button
                    disabled={bloqueado}
                    onClick={() => { setVentaDetalle(null); onNuevaVenta?.(); }}
                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar pedido vinculado'}
                    style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? 0.4 : 1, background: '#0f3460', borderColor: '#1a3a6a', color: '#FF9800' }}>
                    📋 Pedido
                  </button>
                );
              })()}
              {/* REGISTRAR COBRO */}
              {(() => {
                const cobrado = parseFloat(ventaDetalle.monto_cobrado || '0');
                const total = parseFloat(ventaDetalle.total);
                const bloqueado = ventaDetalle.tipo === 'presupuesto' || ventaDetalle.tipo === 'nota_credito' || ventaDetalle.tipo === 'nota_debito' || !ventaDetalle.cliente_id || cobrado >= total;
                return (
                  <button
                    disabled={bloqueado}
                    onClick={() => { setVentaDetalle(null); abrirOrdenPago(ventaDetalle); }}
                    title={bloqueado ? (cobrado >= total ? 'Ya cobrado 100%' : 'No aplica') : 'Registrar cobro'}
                    style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? 0.4 : 1, background: bloqueado ? '#0f3460' : '#FFD700', borderColor: bloqueado ? '#1a3a6a' : '#FFD700', color: bloqueado ? '#aaa' : '#000', fontWeight: 'bold' }}>
                    💰 Cobrar
                  </button>
                );
              })()}
              {/* NOTA DE CREDITO */}
              {(() => {
                const bloqueado = ventaDetalle.tipo !== 'venta';
                return (
                  <button
                    disabled={bloqueado}
                    onClick={() => { setVentaSeleccionada(ventaDetalle); setVentaDetalle(null); setModalNC(true); }}
                    title={bloqueado ? 'Solo disponible para ventas/facturas' : 'Emitir nota de crédito'}
                    style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? 0.4 : 1, background: '#0f3460', borderColor: '#ff6b6b', color: '#ff6b6b' }}>
                    ↩ N/C
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ORDEN DE PAGO */}
      {modalOP && ventaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '28px', width: '560px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #0f3460' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', margin: 0 }}>$ Registrar cobro — {ventaSeleccionada.cliente_nombre}</h3>
              <button onClick={() => setModalOP(false)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            {pendientesCobro.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#4CAF50', fontWeight: '600', marginBottom: '10px', letterSpacing: '1px' }}>DOCUMENTOS PENDIENTES DEL CLIENTE</div>
                {pendientesCobro.map((d: any) => (
                  <div key={d.id} style={{ background: '#0f3460', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>{TIPO_LABEL[d.tipo] || d.tipo} #{d.id}</span>
                      <span style={{ color: '#888', fontSize: '11px', marginLeft: '8px' }}>{new Date(d.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '13px' }}>${d.pendiente.toLocaleString('es-AR', { maximumFractionDigits: 0 })} pendiente</div>
                      <div style={{ color: '#555', fontSize: '11px' }}>total ${d.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Monto recibido</div>
                <input type="number" value={montoOP} onChange={e => setMontoOP(e.target.value)}
                  placeholder="$0" style={inputStyle} autoFocus />
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>Medio de pago</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {MEDIOS_PAGO.map(m => (
                    <button key={m} onClick={() => setMedioOP(medioOP === m ? '' : m)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid', fontSize: '12px', cursor: 'pointer',
                        background: medioOP === m ? '#1565C0' : '#0f3460',
                        borderColor: medioOP === m ? '#1976D2' : '#1a3a6a',
                        color: medioOP === m ? '#fff' : '#aaa' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Notas (opcional)</div>
                <input value={notasOP} onChange={e => setNotasOP(e.target.value)}
                  placeholder="Observaciones..." style={inputStyle} />
              </div>
              {errorOP && <div style={{ background: '#4a0000', borderRadius: '8px', padding: '10px', color: '#ff6b6b', fontSize: '13px' }}>{errorOP}</div>}
              <button onClick={confirmarOrdenPago} disabled={guardandoOP}
                style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: guardandoOP ? '#555' : '#4CAF50', color: '#fff', fontSize: '15px', fontWeight: 'bold', cursor: guardandoOP ? 'not-allowed' : 'pointer' }}>
                {guardandoOP ? 'Registrando...' : '✓ Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTA DE CRÉDITO */}
      {modalNC && ventaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#16213e', borderRadius: '12px', padding: '28px', width: '420px', border: '1px solid #0f3460' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#fff', margin: 0 }}>↩ Nota de crédito</h3>
              <button onClick={() => setModalNC(false)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ background: '#0f3460', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Documento origen</div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{TIPO_LABEL[ventaSeleccionada.tipo]} #{ventaSeleccionada.id} — {ventaSeleccionada.cliente_nombre}</div>
              <div style={{ color: '#FFD700', fontSize: '13px' }}>${parseFloat(ventaSeleccionada.total).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
            </div>
            <div style={{ background: '#1a0000', border: '1px solid #ff6b6b', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
              <div style={{ color: '#ff6b6b', fontSize: '12px' }}>⚠ La nota de crédito queda vinculada a esta venta/factura. Según AFIP, una NC sin factura asociada no es válida.</div>
            </div>
            <button onClick={() => { setModalNC(false); onNuevaVenta?.(); }}
              style={{ width: '100%', padding: '12px', background: '#ff6b6b', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              Continuar → crear NC
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;
