ventas = open('src/pages/Ventas/Ventas.tsx', encoding='utf-8').read()

# Cambiar firma del componente
ventas = ventas.replace(
    "const Ventas: React.FC = () => {",
    "const Ventas: React.FC<{ onNuevaVenta?: () => void }> = ({ onNuevaVenta }) => {"
)

# Sacar estados internos de mostrarNueva y ventaPadre
ventas = ventas.replace(
    "  const [mostrarNueva, setMostrarNueva] = useState(false);\n  const [ventaPadre, setVentaPadre] = useState<Venta | null>(null);\n",
    ""
)

# Sacar el import de NuevaVenta
ventas = ventas.replace(
    "import NuevaVenta from './NuevaVenta';\n",
    ""
)

# Sacar el bloque if (mostrarNueva)
bloque = """  if (mostrarNueva) {
    return <NuevaVenta onVolver={() => { setMostrarNueva(false); setVentaPadre(null); }} onVentaCreada={() => { cargarVentas(); setMostrarNueva(false); setVentaPadre(null); }} documentoPadreId={ventaPadre?.id} tipoPadre={ventaPadre?.tipo} clientePrecargado={ventaPadre ? { id: ventaPadre.cliente_id, nombre: ventaPadre.cliente_nombre, tipo: '', cuit: '', lista_precio_default: ''} : null} />;
  }

  return ("""
ventas = ventas.replace(bloque, "  return (")

# Cambiar boton nueva venta
ventas = ventas.replace(
    "        <button onClick={() => setMostrarNueva(true)}\n          style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>\n          + Nueva venta\n        </button>",
    "        <button onClick={() => onNuevaVenta?.()}\n          style={{ padding: '10px 20px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>\n          + Nueva venta\n        </button>"
)

# Botones del modal detalle - Factura
ventas = ventas.replace(
    "onClick={() => { setVentaPadre(ventaDetalle); setVentaDetalle(null); setMostrarNueva(true); }}\n                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar factura vinculada'}",
    "onClick={() => { setVentaDetalle(null); onNuevaVenta?.(); }}\n                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar factura vinculada'}"
)

# Botones del modal detalle - Remito
ventas = ventas.replace(
    "onClick={() => { setVentaPadre(ventaDetalle); setVentaDetalle(null); setMostrarNueva(true); }}\n                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar remito de entrega'}",
    "onClick={() => { setVentaDetalle(null); onNuevaVenta?.(); }}\n                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar remito de entrega'}"
)

# Botones del modal detalle - Pedido
ventas = ventas.replace(
    "onClick={() => { setVentaPadre(ventaDetalle); setVentaDetalle(null); setMostrarNueva(true); }}\n                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar pedido vinculado'}",
    "onClick={() => { setVentaDetalle(null); onNuevaVenta?.(); }}\n                    title={bloqueado ? 'No aplica para este tipo de documento' : 'Generar pedido vinculado'}"
)

# Boton NC
ventas = ventas.replace(
    "onClick={() => { setModalNC(false); setMostrarNueva(true); }}",
    "onClick={() => { setModalNC(false); onNuevaVenta?.(); }}"
)

with open('src/pages/Ventas/Ventas.tsx', 'w', encoding='utf-8') as f:
    f.write(ventas)
print('Ventas.tsx OK')
