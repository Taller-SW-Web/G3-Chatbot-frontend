"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cliente } from "@/domain/entities/Cliente";
import type { CarritoUI } from "@/domain/entities/CarritoUI";

type ChatState = {
  accessToken: string | null;
  chatSid: string | null;
  cliente: Cliente | null;
  carrito: CarritoUI;
  accionPendiente: string | null;
  /** Abre el modal de login/registro global (AppShell). */
  authOpen: boolean;
  /** Par user/bot que otra página deja sembrado para el chat (confirm al agregar, preguntar en el chat). */
  mensajePendiente: { user?: string; bot: string } | null;
  /** Resumen del último pedido confirmado (pantalla /exito). */
  ultimoPedido: UltimoPedido;
  setToken: (t: string | null) => void;
  setCliente: (c: Cliente | null) => void;
  setCarrito: (c: CarritoUI) => void;
  setAccionPendiente: (a: string | null) => void;
  setAuthOpen: (v: boolean) => void;
  setMensajePendiente: (m: { user?: string; bot: string } | null) => void;
  setUltimoPedido: (p: UltimoPedido) => void;
  logout: () => void;
};

const carritoVacio: CarritoUI = { lineas: [], subtotal: 0, count: 0 };

/** Resumen del último pedido confirmado (pantalla /exito). */
export type UltimoPedido = {
  subtotal: number;
  lineas: { nombre: string; cantidad: number; precio: number }[];
  direccion: string;
  distrito: string;
  nombre: string;
  tarjetaLast4: string;
} | null;

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      accessToken: null,
      chatSid: null,
      cliente: null,
      carrito: carritoVacio,
      accionPendiente: null,
      authOpen: false,
      mensajePendiente: null,
      ultimoPedido: null,
      setToken: (accessToken) => set({ accessToken }),
      setCliente: (cliente) => set({ cliente }),
      setCarrito: (carrito) => set({ carrito }),
      setAccionPendiente: (accionPendiente) => set({ accionPendiente }),
      setAuthOpen: (authOpen) => set({ authOpen }),
      setMensajePendiente: (mensajePendiente) => set({ mensajePendiente }),
      setUltimoPedido: (ultimoPedido) => set({ ultimoPedido }),
      logout: () =>
        set({
          accessToken: null,
          cliente: null,
          carrito: carritoVacio,
          accionPendiente: null,
          mensajePendiente: null,
        }),
    }),
    {
      name: "g3-chat-storage", // LocalStorage, token 15 min (refresh en cookie httpOnly backend)
      version: 1,
      // Los mensajes del chat viven en el backend (historial) y en el estado local del turno.
      migrate: (persistido) => {
        const resto = { ...(persistido as Record<string, unknown>) };
        delete resto.mensajes;
        delete resto.escribiendo;
        return resto as unknown as ChatState;
      },
      partialize: (s) => ({
        accessToken: s.accessToken,
        chatSid: s.chatSid,
        cliente: s.cliente,
        carrito: s.carrito,
        accionPendiente: s.accionPendiente,
        authOpen: s.authOpen,
        mensajePendiente: s.mensajePendiente,
        ultimoPedido: s.ultimoPedido,
      }),
    }
  )
);
