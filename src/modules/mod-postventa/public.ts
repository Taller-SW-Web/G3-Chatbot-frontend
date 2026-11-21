/**
 * Superficie pública de mod-postventa.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { DevolucionPage } from "./ui/DevolucionPage";
export { ReclamoPage } from "./ui/ReclamoPage";
export { ConstanciaDevolucion } from "./ui/blocks/ConstanciaDevolucion";
export { EstadoDevolucion } from "./ui/blocks/EstadoDevolucion";
export { ConstanciaReclamo } from "./ui/blocks/ConstanciaReclamo";
export { EstadoReclamo } from "./ui/blocks/EstadoReclamo";
export { DevolucionForm } from "./ui/forms/DevolucionForm";
export { ReclamoForm } from "./ui/forms/ReclamoForm";

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
