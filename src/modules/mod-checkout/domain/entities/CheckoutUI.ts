import type { CarritoUI } from "@/modules/mod-cart/public";

/** Datos de checkout (solo tarjeta en este canal). Sin PAN persistido. */
export type CheckoutUI = {
  nombre: string;
  direccion: string;
  distrito: string;
  referencia?: string;
  docTipo: "DNI" | "RUC" | "CE" | "PASAPORTE";
  docNum: string;
  tarjetaLast4: string;
  carrito: CarritoUI;
  total: number;
};
