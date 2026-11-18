import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";
import { isKnownAvailability } from "@/domain/entities/CatalogoUI";

/** Disponibilidad puntual con datos reales (SPEC-10). Sin mocks. */
export async function consultarDisponibilidadUseCase(
  api: ChatbotApiPort,
  input: { sku: string; cantidad?: number }
): Promise<{ sku: string; status: string; veredicto?: string | null }> {
  const sku = input.sku.trim();
  if (!sku) throw new Error("sku requerido");
  const rows = await api.consultarDisponibilidad(sku, input.cantidad);
  const row = Array.isArray(rows) ? rows.find((r) => r != null && r.sku === sku && typeof r.status === "string") : undefined;
  if (!row || !isKnownAvailability(row.status)) throw new Error("Sin respuesta de disponibilidad");
  return { sku: row.sku, status: row.status, veredicto: row.veredicto ?? null };
}
