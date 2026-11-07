import { problemCode } from "@/domain/utils/httpError";

/** Recupera una conversación anónima guardada que ya no pertenece a la sesión. */
export async function agregarCarritoAnonimoUseCase({
  conversacionGuardada,
  conversacionCreada,
  crearConversacion,
  limpiarConversacion,
  agregar,
}: {
  conversacionGuardada?: string;
  conversacionCreada?: string | null;
  crearConversacion: () => Promise<string>;
  limpiarConversacion: () => void;
  agregar: (conversacionId: string) => Promise<void>;
}): Promise<string> {
  const conversacion = conversacionGuardada ?? conversacionCreada ?? await crearConversacion();
  try {
    await agregar(conversacion);
    return conversacion;
  } catch (error) {
    if (!conversacionGuardada || problemCode(error) !== "RECURSO_NO_ENCONTRADO") throw error;
    limpiarConversacion();
    const nuevaConversacion = await crearConversacion();
    await agregar(nuevaConversacion);
    return nuevaConversacion;
  }
}
