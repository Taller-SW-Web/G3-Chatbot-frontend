"use client";

import { AppShell } from "@/shared/ui/shell/AppShell";
import { HomePage } from "@/modules/mod-catalog/public";
import { MENSAJE_MAX_CARACTERES } from "@/modules/mod-chat/public";
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
