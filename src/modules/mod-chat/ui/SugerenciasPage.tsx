"use client";

import { useRouter } from "next/navigation";
import { SugerenciaForm } from "@/modules/mod-chat/ui/SugerenciaForm";
import { enviarSugerenciaUseCase } from "@/modules/mod-chat/application/enviarSugerenciaUseCase";
import { useChatStore } from "@/shared/auth/chatStore";
import { container } from "@/shared/di/container";

/** `/sugerencias`: reportar bug o enviar sugerencia con captura. Solo para clientes (SPEC-24 Req. 3). */
export function SugerenciasPage() {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);

  return (
    <div className="relative min-h-full p-4 flex flex-col gap-3">
      <SugerenciaForm
        correo={cliente?.correo ?? ""}
        onEnviar={(input) =>
          enviarSugerenciaUseCase(container.chat, {
            tipo: input.tipo,
            titulo: input.titulo,
            descripcion: input.descripcion,
            correoContacto: input.correo,
            captura: input.captura,
          })
        }
        onEnviado={() => router.push("/cuenta")}
        onCancelar={() => router.push("/cuenta")}
      />
    </div>
  );
}
