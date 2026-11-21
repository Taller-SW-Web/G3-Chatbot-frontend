/**
 * Distritos de Lima Metropolitana usados como referencia en el checkout
 * (SPEC-12). No es un catálogo de cobertura: Despacho decide la cobertura real
 * al cotizar (`POST /envio/cotizar`), que es lo que habilita o bloquea el pago.
 */
export const DISTRITOS_LIMA = [
  "Lima Cercado",
  "Miraflores",
  "San Isidro",
  "Santiago de Surco",
  "La Molina",
  "San Miguel",
  "Los Olivos",
  "San Juan de Lurigancho",
  "Villa El Salvador",
  "Callao",
] as const;

export type DistritoLima = (typeof DISTRITOS_LIMA)[number];
