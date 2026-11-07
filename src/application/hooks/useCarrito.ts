"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "@/application/state/chatStore";
import { container } from "@/infrastructure/di/container";
import { listarCarritoUseCase } from "@/application/use_cases/listarCarritoUseCase";
import { conversacionParaCarrito } from "@/domain/utils/carrito";
import { problemCode } from "@/domain/utils/httpError";

/** Clave única en caché: dueño (cliente o anónimo) + conversación. */
export function carritoQueryKey(dueno: string, conversacion?: string) {
  return ["carrito", dueno, conversacion ?? "cliente"] as const;
}

/**
 * Fuente de verdad del carrito: `GET /carrito`. Sincroniza el badge del store
 * (count/subtotal) con el servidor y expone la caché compartida. Los precios y
 * el stock nunca se inventan en el front.
 */
export function useCarrito() {
  const cliente = useChatStore((s) => s.cliente);
  const ultimaConversacionId = useChatStore((s) => s.ultimaConversacionId);
  const setCarrito = useChatStore((s) => s.setCarrito);
  const setUltimaConversacionId = useChatStore((s) => s.setUltimaConversacionId);
  const conversacion = conversacionParaCarrito(ultimaConversacionId, Boolean(cliente));
  const dueno = cliente?.correo ?? "anonimo";
  const queryKey = carritoQueryKey(dueno, conversacion);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await listarCarritoUseCase(container.api, conversacion);
      } catch (error) {
        if (!cliente && conversacion && problemCode(error) === "RECURSO_NO_ENCONTRADO" &&
          useChatStore.getState().ultimaConversacionId === conversacion &&
          !useChatStore.getState().cliente) {
          setUltimaConversacionId(null);
          setCarrito({ lineas: [], subtotal: 0, count: 0 });
        }
        throw error;
      }
    },
  });

  const data = query.data;
  useEffect(() => {
    if (!data) return;
    setCarrito({
      lineas: data.lineas.map((l) => ({
        producto: {
          sku: l.sku,
          nombre: l.nombre,
          categoria: "",
          talla: l.variante ?? "",
          color: "",
          precio: l.precio,
        },
        cantidad: l.cantidad,
      })),
      subtotal: data.subtotal,
      count: data.lineas.reduce((a, l) => a + l.cantidad, 0),
    });
  }, [data, setCarrito]);

  return { query, queryKey, conversacion, dueno };
}
