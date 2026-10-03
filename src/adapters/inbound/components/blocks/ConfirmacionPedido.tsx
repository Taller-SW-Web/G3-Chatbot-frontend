"use client";

import { useState } from "react";
import { container } from "@/infrastructure/di/container";

/** CONFIRMACION_PEDIDO + Reenviar correo. SPEC-15,16 (max 2) */
export function ConfirmacionPedido({
  pedidoId,
  correoEnmascarado,
}: {
  pedidoId: string;
  correoEnmascarado: string;
}) {
  const [envios, setEnvios] = useState(0);
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 text-center">
      <p className="font-heading text-[20px]">¡PEDIDO {pedidoId} CONFIRMADO!</p>
      <p className="text-[13px] text-text-secondary">Confirmación enviada a {correoEnmascarado}.</p>
      <button
        disabled={envios >= 2}
        onClick={async () => { await container.api.reenviarConfirmacion(pedidoId); setEnvios((e) => e + 1); }}
        className="text-[12px] font-semibold underline text-text-secondary disabled:opacity-40">
        Reenviar correo ({envios}/2)
      </button>
    </div>
  );
}
