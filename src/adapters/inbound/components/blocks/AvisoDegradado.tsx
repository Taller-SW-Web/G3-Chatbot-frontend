/** Aviso asociado al evento SSE `degradado` de SPEC-05 / ADR-0021. */
export function AvisoDegradado({ motivo }: { motivo?: string }) {
  const mensaje = motivo === "timeout"
    ? "La respuesta tardó demasiado. Puedes continuar con las opciones disponibles."
    : motivo === "unavailable"
      ? "El asistente no está disponible temporalmente. Puedes continuar con las opciones disponibles."
      : "Respuesta en modo degradado. Puedes continuar con las opciones disponibles.";
  return (
    <div
      className="rounded-md border border-border-default bg-surface-cloud px-3 py-2 text-[12px] text-text-secondary"
      role="status"
      data-testid="aviso-degradado"
      data-motivo={motivo}
    >
      {mensaje}
    </div>
  );
}
