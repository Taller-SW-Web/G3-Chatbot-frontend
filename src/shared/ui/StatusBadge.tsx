import type { ReactNode } from "react";

export type StatusVariant = "info" | "warning" | "success" | "error";

export type OrderStatus =
  | "EN_CAMINO"
  | "EN_PROCESO"
  | "EN_REVISION"
  | "ENTREGADO"
  | "APROBADO"
  | "RESUELTO"
  | "REEMBOLSADO"
  | "RECHAZADO"
  | "PAGO_FALLIDO";

/**
 * Mapa semántico acordado — Historial de Pedidos.
 * - info (azul #1971C2 / #E7F5FF): progreso logístico → EN CAMINO
 * - warning (amarillo #F08C00 / #FFF9DB): espera / gestión en curso → EN REVISIÓN, EN PROCESO
 * - success (verde #2F9E44 / #EBFBEE): final feliz → ENTREGADO, APROBADO, RESUELTO
 * - error (rojo #E03131 / #FFF5F5): solo error real → RECHAZADO, PAGO FALLIDO
 * Nunca usar ember/naranja de CTA para estados: comunica alarma.
 */
export const STATUS_VARIANT_MAP: Record<OrderStatus, StatusVariant> = {
  EN_CAMINO: "info",
  EN_PROCESO: "warning",
  EN_REVISION: "warning",
  ENTREGADO: "success",
  APROBADO: "success",
  RESUELTO: "success",
  REEMBOLSADO: "success",
  RECHAZADO: "error",
  PAGO_FALLIDO: "error",
};

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  info: "bg-info-background text-info-default",
  warning: "bg-warning-background text-warning-default",
  success: "bg-success-background text-success-default",
  error: "bg-error-background text-error-default",
};

type StatusBadgeProps = {
  status?: OrderStatus;
  variant?: StatusVariant;
  icon?: ReactNode;
  children: ReactNode;
};

/**
 * Badge de estado — Server Component por defecto.
 * Siempre combina icono + texto (no solo color) por accesibilidad.
 */
export function StatusBadge({ status, variant, icon, children }: StatusBadgeProps) {
  const resolved: StatusVariant = variant ?? (status ? STATUS_VARIANT_MAP[status] : "info");
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${VARIANT_CLASSES[resolved]}`}
    >
      {icon}
      {children}
    </span>
  );
}
