"use client";

import { useRouter } from "next/navigation";
import { SugerenciaForm } from "../components/SugerenciaForm";
import { useChatStore } from "@/application/state/chatStore";

/** `/sugerencias`: reportar bug o enviar sugerencia con captura. */
export function SugerenciasPage() {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);

  return (
    <div className="relative min-h-full p-4 flex flex-col gap-3">
      <SugerenciaForm
        correo={cliente?.correo ?? "cliente.demo@correo.com"}
        onEnviado={() => router.push("/cuenta")}
        onCancelar={() => router.push("/cuenta")}
      />
    </div>
  );
}
