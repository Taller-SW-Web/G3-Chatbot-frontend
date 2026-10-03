'use client';
/** ProductCard (H2-05 David, SPEC-09 tarjetas-detalle-producto Req. 1).
 *
 * Componente estático con datos mock (H2-05): pinta un ProductoUI ya validado.
 * Sin variantes → Agregar dispara AGREGAR_AL_CARRITO directo (sin LLM/WS).
 * Con variantes/agotado → delega a selector/detalle (otros issues).
 * Estilos provisionales con clases utilitarias: H2-08 Diego trae tokens Tailwind.
 */
import type { ProductoUI } from "../../domain/entities/ProductoUI";
import { sanitizeText } from "../../domain/utils/sanitize";

export interface AgregarAlCarrito {
  tipo: "AGREGAR_AL_CARRITO";
  payload: { sku: string; cantidad: number };
}

export interface ProductCardProps {
  producto: ProductoUI;
  onVerDetalle: (productoId: string) => void;
  onAgregar: (accion: AgregarAlCarrito) => void;
}

export function ProductCard({ producto, onVerDetalle, onAgregar }: ProductCardProps) {
  const agotado = producto.disponibilidad === "AGOTADO";
  const puedeAgregarDirecto = !producto.tieneVariantes && !agotado && producto.skuUnico;

  const handleAgregar = () => {
    if (puedeAgregarDirecto && producto.skuUnico) {
      onAgregar({ tipo: "AGREGAR_AL_CARRITO", payload: { sku: producto.skuUnico, cantidad: 1 } });
    } else {
      onVerDetalle(producto.productoId);
    }
  };

  return (
    <article data-testid="product-card" aria-label={sanitizeText(producto.nombre)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={producto.imagenUrl}
        alt={sanitizeText(producto.nombre)}
        loading="lazy"
        data-testid="product-imagen"
      />
      <p data-testid="product-marca">{sanitizeText(producto.marca)}</p>
      <h3 data-testid="product-nombre">{sanitizeText(producto.nombre)}</h3>
      <p data-testid="product-descripcion">{sanitizeText(producto.descripcionBreve.slice(0, 90))}</p>
      <p data-testid="product-precio">{sanitizeText(producto.precioTexto)}</p>
      {producto.disponibilidad === "POCAS_UNIDADES" && (
        <span data-testid="badge-pocas-unidades">¡Quedan pocas unidades!</span>
      )}
      {agotado && <span data-testid="badge-agotado">Agotado</span>}
      <button
        type="button"
        data-testid="btn-agregar"
        disabled={agotado}
        onClick={handleAgregar}
      >
        {producto.tieneVariantes ? "Ver opciones" : "Agregar"}
      </button>
      <button type="button" data-testid="btn-detalle" onClick={() => onVerDetalle(producto.productoId)}>
        Ver detalle
      </button>
    </article>
  );
}

/** Mock canónico H2-05 (carrusel lo reemplaza por datos de Productos). */
export const mockProducto: ProductoUI = {
  productoId: "prod-1",
  nombre: "Zapatillas Runner Pro",
  marca: "Deportiva",
  imagenUrl: "https://ejemplo.test/img/runner-pro.jpg",
  precioTexto: "S/ 299.90",
  descripcionBreve: "Zapatillas running talla 42 con amortiguación.",
  tieneVariantes: false,
  disponibilidad: "DISPONIBLE",
  skuUnico: "RUN-PRO-42",
};
