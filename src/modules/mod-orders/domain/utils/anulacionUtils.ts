/**
 * Utilidades para resolver motivo de anulación y aviso de reembolso (SPEC-17, RN-SGT-07).
 */

export type InfoAnulacion = {
  esAnulado: boolean;
  esFaltaStock: boolean;
  tituloMotivo: string;
  descripcionMotivo: string;
  reembolsoTexto: string | null;
};

export const MOTIVOS_CONOCIDOS: Record<
  string,
  { esStock: boolean; descripcion: string; etiquetaHito: string }
> = {
  STOCK_NO_DISPONIBLE: {
    esStock: true,
    descripcion:
      "El pedido fue anulado debido a que no hay stock disponible para completar tu compra.",
    etiquetaHito: "Falta de stock",
  },
  FALTA_DE_STOCK: {
    esStock: true,
    descripcion:
      "El pedido fue anulado debido a que no hay stock disponible para completar tu compra.",
    etiquetaHito: "Falta de stock",
  },
  PAGO_NO_COMPLETADO: {
    esStock: false,
    descripcion: "El pedido fue anulado porque el pago no fue completado.",
    etiquetaHito: "Pago no completado",
  },
  SOLICITUD_CLIENTE: {
    esStock: false,
    descripcion: "El pedido fue anulado a solicitud del cliente.",
    etiquetaHito: "Solicitud del cliente",
  },
};

export function esMotivoFaltaStock(motivoRaw?: string | null): boolean {
  if (!motivoRaw) return false;
  const normalizado = motivoRaw.trim().toUpperCase();
  return (
    normalizado === "STOCK_NO_DISPONIBLE" ||
    normalizado === "FALTA_DE_STOCK" ||
    normalizado.includes("STOCK")
  );
}

/** Sanitiza motivos de historial para no exponer detalles internos arbitrarios (SPEC-17 :123-126). */
export function sanitizarMotivoHito(motivoRaw?: string | null): string | null {
  if (!motivoRaw) return null;
  const normalizado = motivoRaw.trim().toUpperCase();
  if (MOTIVOS_CONOCIDOS[normalizado]) {
    return MOTIVOS_CONOCIDOS[normalizado].etiquetaHito;
  }
  return null;
}

function formatFechaAnulado(fechaIso?: string | null): string {
  if (!fechaIso) return "";
  try {
    const d = new Date(fechaIso);
    if (Number.isNaN(d.getTime())) return fechaIso;
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return fechaIso;
  }
}

export function resolverInfoAnulacion(pedido?: {
  estado?: string | null;
  estadoEtiqueta?: string | null;
  fechaCreacion?: string | null;
  motivoAnulacion?: string | null;
  reembolso?: string | null;
  historial?: { estado: string; fecha?: string | null; motivo?: string | null }[];
}): InfoAnulacion {
  const estado = (pedido?.estado ?? "").trim().toUpperCase();
  const esAnulado = estado === "ANULADO";

  if (!esAnulado) {
    return {
      esAnulado: false,
      esFaltaStock: false,
      tituloMotivo: "",
      descripcionMotivo: "",
      reembolsoTexto: null,
    };
  }

  const hitoAnulado = pedido?.historial?.find((h) => h.estado === "ANULADO");
  const fechaAnulacion = hitoAnulado?.fecha ?? pedido?.fechaCreacion;
  const fechaTexto = formatFechaAnulado(fechaAnulacion);
  const tituloMotivo = fechaTexto ? `Anulado el ${fechaTexto}` : "Anulado";

  // SPEC-17 :123-126: consume solo motivoAnulacion del BFF; motivo desconocido produce mensaje genérico
  const motivoClave = (pedido?.motivoAnulacion ?? "").trim().toUpperCase();
  const conocido = MOTIVOS_CONOCIDOS[motivoClave];

  let esFaltaStock = false;
  let descripcionMotivo = "El pedido fue anulado.";

  if (conocido) {
    esFaltaStock = conocido.esStock;
    descripcionMotivo = conocido.descripcion;
  }

  // SPEC-17 :119-121: sin promesa de reembolso si no hay reembolso / evidencia de pago
  let reembolsoTexto: string | null = null;
  if (typeof pedido?.reembolso === "string" && pedido.reembolso.trim()) {
    reembolsoTexto = pedido.reembolso.trim();
  }

  return {
    esAnulado: true,
    esFaltaStock,
    tituloMotivo,
    descripcionMotivo,
    reembolsoTexto,
  };
}
