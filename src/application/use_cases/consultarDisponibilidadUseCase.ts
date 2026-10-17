import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** Disponibilidad puntual con datos reales (SPEC-10). Sin mocks. */
export async function consultarDisponibilidadUseCase(
  api: ChatbotApiPort,
  input: { sku: string; cantidad?: number }
): Promise<{ sku: string; status: string; veredicto?: string | null }> {
  const sku = input.sku.trim();
  if (!sku) throw new Error("sku requerido");
  const rows = await api.consultarDisponibilidad(sku, input.cantidad);
  const row = rows.find((r) => r.sku === sku) ?? rows[0];
  if (!row) throw new Error("Sin respuesta de disponibilidad");
  return { sku: row.sku, status: row.status, veredicto: row.veredicto ?? null };
}
