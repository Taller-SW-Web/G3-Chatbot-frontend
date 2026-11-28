"use client";

import { AppShell } from "@/shared/ui/shell/AppShell";
import { HomePage } from "@/modules/mod-catalog/public";
// El límite vive en el kernel: importarlo de `mod-chat/public` arrastraba al
// primer render el grafo de UI del chat (markdown, bloques y formularios).
import { MENSAJE_MAX_CARACTERES } from "@/shared/config/chatContract";
import { useHomeActions } from "@/app/_home/useHomeActions";

/**
 * Composition root de `/`: cablea catálogo (pantalla), carrito y chat sin que
 * `mod-catalog` dependa de esos módulos (ADR-0024).
 */
export default function HomeRoute() {
  const { onAgregar, onAbrirChat } = useHomeActions();

  return (
    <AppShell initialScreen="home">
      <HomePage
        onAgregar={onAgregar}
        onAbrirChat={onAbrirChat}
        mensajeMaxCaracteres={MENSAJE_MAX_CARACTERES}
      />
    </AppShell>
  );
}
