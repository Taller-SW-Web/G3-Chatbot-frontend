/**
 * Utilidades para resolver motivo de anulación y aviso de reembolso (SPEC-17, RN-SGT-07).
 */

export type ReembolsoInfo = {
  estado?: string | null;
  monto?: number | null;
  moneda?: string | null;
  fecha?: string | null;
  mensaje?: string | null;
};

export type InfoAnulacion = {
  esAnulado: boolean;
  esFaltaStock: boolean;
  tituloMotivo: string;
  descripcionMotivo: string;
  reembolsoTexto: string;
};

export function esMotivoFaltaStock(motivoRaw?: string | null, etiqueta?: string | null): boolean {
  if (!motivoRaw && !etiqueta) return false;
  const texto = `${motivoRaw ?? ""} ${etiqueta ?? ""}`.toUpperCase();
  return (
    texto.includes("STOCK_NO_DISPONIBLE") ||
    texto.includes("FALTA DE STOCK") ||
    texto.includes("FALTA_DE_STOCK") ||
    texto.includes("STOCK_INSUFICIENTE") ||
    texto.includes("AGOTADO") ||
    texto.includes("STOCK")
  );
}

export function resolverInfoAnulacion(pedido?: {
  estado?: string | null;
  estadoEtiqueta?: string | null;
  motivoAnulacion?: string | null;
  motivo?: string | null;
  reembolso?: string | ReembolsoInfo | null;
  historial?: { estado: string; motivo?: string | null; etiqueta?: string | null }[];
}): InfoAnulacion {
  const estado = (pedido?.estado ?? "").trim().toUpperCase();
  const esAnulado = estado === "ANULADO";

  if (!esAnulado) {
    return {
      esAnulado: false,
      esFaltaStock: false,
      tituloMotivo: "",
      descripcionMotivo: "",
      reembolsoTexto: "",
    };
  }

  const hitoAnulado = pedido?.historial?.find((h) => h.estado === "ANULADO");
  const motivoRaw = (
    pedido?.motivoAnulacion ??
    pedido?.motivo ??
    hitoAnulado?.motivo ??
    ""
  ).trim();

  // Solo se clasifica como falta de stock si existe un motivo explícito que lo indique.
  // Si el campo falta, el fallback es neutro ("Anulado") sin asumir falta de stock.
  const tieneMotivoStock =
    (motivoRaw && esMotivoFaltaStock(motivoRaw, pedido?.estadoEtiqueta)) ||
    (hitoAnulado?.etiqueta && esMotivoFaltaStock(hitoAnulado.etiqueta));

  const esFaltaStock = Boolean(tieneMotivoStock);

  let tituloMotivo = "Anulado";
  let descripcionMotivo = "El pedido fue anulado.";

  if (esFaltaStock) {
    tituloMotivo = "Anulado por falta de stock";
    descripcionMotivo =
      "El pedido fue anulado debido a que no hay stock disponible para completar tu compra.";
  } else if (motivoRaw) {
    tituloMotivo =
      motivoRaw === "PAGO_NO_COMPLETADO"
        ? "Pago no completado"
        : motivoRaw;
    descripcionMotivo = `El pedido fue anulado (${tituloMotivo}).`;
  } else if (pedido?.estadoEtiqueta && pedido.estadoEtiqueta !== "Anulado") {
    tituloMotivo = pedido.estadoEtiqueta;
    descripcionMotivo = `El pedido fue anulado (${tituloMotivo}).`;
  }

  let reembolsoTexto = "Si corresponde un reembolso, se procesará al medio de pago original.";
  if (typeof pedido?.reembolso === "string" && pedido.reembolso.trim()) {
    reembolsoTexto = pedido.reembolso.trim();
  } else if (pedido?.reembolso && typeof pedido.reembolso === "object") {
    const r = pedido.reembolso as ReembolsoInfo;
    if (r.mensaje) {
      reembolsoTexto = r.mensaje;
    } else if (typeof r.monto === "number") {
      const prefijo = r.moneda === "USD" ? "$" : "S/";
      const estadoReb = r.estado ? ` (${r.estado.toLowerCase()})` : "";
      reembolsoTexto = `Reembolso de ${prefijo} ${r.monto.toFixed(2)}${estadoReb} al medio de pago original.`;
    }
  }

  return {
    esAnulado: true,
    esFaltaStock,
    tituloMotivo,
    descripcionMotivo,
    reembolsoTexto,
  };
}
