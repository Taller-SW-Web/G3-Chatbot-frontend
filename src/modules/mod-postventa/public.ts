/**
 * Superficie pública de mod-postventa.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { DevolucionPage } from "./ui/DevolucionPage";
export { ReclamoPage } from "./ui/ReclamoPage";
export { HistorialDevoluciones, HistorialReclamos } from "./ui/HistorialPostventa";
export { ListaDevoluciones } from "./ui/blocks/ListaDevoluciones";
export { ListaReclamos } from "./ui/blocks/ListaReclamos";
export { ConstanciaDevolucion } from "./ui/blocks/ConstanciaDevolucion";
export { EstadoDevolucion } from "./ui/blocks/EstadoDevolucion";
export { ConstanciaReclamo } from "./ui/blocks/ConstanciaReclamo";
export { EstadoReclamo } from "./ui/blocks/EstadoReclamo";
export { DevolucionForm } from "./ui/forms/DevolucionForm";
export { ReclamoForm } from "./ui/forms/ReclamoForm";
export { DeliveryRating, puntuacionDeMood } from "./ui/DeliveryRating";
export type { DeliveryMood } from "./ui/DeliveryRating";

export type {
  ConstanciaDevolucionDatos,
  ConstanciaReclamoDatos,
  DevolucionBloqueResumen,
  EstadoDevolucionDatos,
  EstadoReclamoDatos,
  ReclamoBloqueResumen,
  ReembolsoBloque,
  ResolucionDevolucion,
} from "./ui/blocks/tipos";

export type {
  CrearDevolucionInput,
  CrearReclamoInput,
  DevolucionDetalle,
  DevolucionEvidenciaInput,
  DevolucionItemInput,
  DevolucionResumen,
  EvidenciaSubida,
  PaginaDevoluciones,
  PaginaReclamos,
  PostventaPort,
  ReclamoConsumidorInput,
  ReclamoDetalle,
  ReclamoResumen,
} from "./ports/postventaPort";
