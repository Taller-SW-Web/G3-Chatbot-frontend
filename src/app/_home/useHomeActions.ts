"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { problemCode, problemFaltantes } from "@/shared/api/httpError";
import { useChatStore } from "@/shared/auth/chatStore";
import { container } from "@/shared/di/container";
import type { HomeAgregarInput, HomeAgregarResultado } from "@/modules/mod-catalog/public";
import {
  agregarCarritoAnonimoUseCase,
  agregarProductoAlCarritoUseCase,
  conversacionParaCarrito,
  mensajeCarrito,
} from "@/modules/mod-cart/public";

/**
 * Crea una conversación cargando `mod-chat` bajo demanda: el chat (markdown,
 * bloques, formularios y SSE) no forma parte del render inicial de la home.
 */
async function crearConversacionChat() {
  const { crearConversacionUseCase } = await import("@/modules/mod-chat/public");
  return crearConversacionUseCase(container.chat);
}

/** Mensaje del agregado; en 409 VARIANTE_REQUERIDA indica qué falta (talla/color). */
function mensajeAgregar(error: unknown): string {
  if (problemCode(error) === "VARIANTE_REQUERIDA") {
    const faltan = problemFaltantes(error);
    if (faltan.length > 0) return `Elige ${faltan.join(" y ")} antes de agregar.`;
  }
  return mensajeCarrito(problemCode(error));
}

/**
 * Composición de la home (ADR-0024): el route file es el único que conoce a la
 * vez `mod-catalog`, `mod-cart` y `mod-chat`. `HomePage` recibe las acciones ya
 * cableadas y no importa esos módulos.
 */
export function useHomeActions() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cliente = useChatStore((s) => s.cliente);
  const ultimaConversacionId = useChatStore((s) => s.ultimaConversacionId);
  const setUltimaConversacionId = useChatStore((s) => s.setUltimaConversacionId);
  const setPrimerMensaje = useChatStore((s) => s.setPrimerMensaje);

  /** Conversación creada por este intento: se reutiliza si el agregado se reintenta. */
  const convCreadaRef = useRef<string | null>(null);

  async function onAgregar({ item, sel }: HomeAgregarInput): Promise<HomeAgregarResultado> {
    if (sel.sku == null) return { ok: false, mensaje: mensajeAgregar(new Error("sku requerido")) };
    const sku = sel.sku;
    const crearConversacion = async () => {
      const { conversacionId } = await crearConversacionChat();
      convCreadaRef.current = conversacionId;
      return conversacionId;
    };
    const agregarEnConversacion = async (conversacionId?: string) => {
      await agregarProductoAlCarritoUseCase(container.carrito, {
        sku,
        cantidad: 1,
        product_id: item.product_id,
        talla: sel.talla ?? undefined,
        color: sel.color ?? undefined,
        conversacionId,
      });
    };
    try {
      // SPEC-09 Req. 2: la línea la crea el backend con nombre, imagen e id reales.
      // Sin sesión se abre una conversación anónima y solo se persiste si funcionó.
      let conversacion: string | undefined;
      if (cliente) {
        await agregarEnConversacion();
      } else {
        conversacion = await agregarCarritoAnonimoUseCase({
          conversacionGuardada: conversacionParaCarrito(ultimaConversacionId),
          conversacionCreada: convCreadaRef.current,
          crearConversacion,
          limpiarConversacion: () => setUltimaConversacionId(null),
          agregar: agregarEnConversacion,
        });
      }
      if (conversacion) setUltimaConversacionId(conversacion);
      void queryClient.invalidateQueries({ queryKey: ["carrito"] });
      return { ok: true, mensaje: `${item.name} se agregó a tu carrito.` };
    } catch (error) {
      return { ok: false, mensaje: mensajeAgregar(error) };
    }
  }

  /** Crea una conversación real, deja el texto como primer mensaje y abre el chat. */
  async function onAbrirChat(texto: string): Promise<void> {
    const { conversacionId } = await crearConversacionChat();
    setPrimerMensaje(texto);
    router.push(`/chat/${encodeURIComponent(conversacionId)}`);
  }

  return { onAgregar, onAbrirChat };
}
