"use client";

import { useCallback, useState } from "react";
import { container } from "@/shared/di/container";
import { enviarReaccionUseCase } from "@/modules/mod-chat/application/enviarReaccionUseCase";
import type { ReaccionMensaje } from "@/modules/mod-chat/ports/chatApiPort";

/** Estado optimista de la reacción de un mensaje (SPEC-24 Req. 1). */
export function useReaccion(mensajeId: string) {
  const [reaccion, setReaccion] = useState<ReaccionMensaje | null>(null);

  const votar = useCallback(
    (nueva: ReaccionMensaje) => {
      setReaccion(nueva);
      void enviarReaccionUseCase(container.chat, mensajeId, nueva);
    },
    [mensajeId]
  );

  return { reaccion, votar };
}
