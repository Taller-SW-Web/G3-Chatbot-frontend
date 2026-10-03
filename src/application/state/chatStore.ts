"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mensaje } from "@/domain/entities/Mensaje";
import type { Cliente } from "@/domain/entities/Cliente";
import type { CarritoUI } from "@/domain/entities/CarritoUI";

type ChatState = {
  accessToken: string | null;
  chatSid: string | null;
  cliente: Cliente | null;
  mensajes: Mensaje[];
  escribiendo: boolean;
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
  pushMensaje: (m: Mensaje) => void;
  setMensajes: (m: Mensaje[]) => void;
  setEscribiendo: (v: boolean) => void;
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
      mensajes: [],
      escribiendo: false,
      carrito: carritoVacio,
      accionPendiente: null,
      authOpen: false,
      mensajePendiente: null,
      ultimoPedido: null,
      setToken: (accessToken) => set({ accessToken }),
      setCliente: (cliente) => set({ cliente }),
      pushMensaje: (m) => set((s) => ({ mensajes: [...s.mensajes, m] })),
      setMensajes: (mensajes) => set({ mensajes }),
      setEscribiendo: (escribiendo) => set({ escribiendo }),
      setCarrito: (carrito) => set({ carrito }),
      setAccionPendiente: (accionPendiente) => set({ accionPendiente }),
      setAuthOpen: (authOpen) => set({ authOpen }),
      setMensajePendiente: (mensajePendiente) => set({ mensajePendiente }),
      setUltimoPedido: (ultimoPedido) => set({ ultimoPedido }),
      logout: () =>
        set({
          accessToken: null,
          cliente: null,
          mensajes: [],
          carrito: carritoVacio,
          accionPendiente: null,
          mensajePendiente: null,
        }),
    }),
    { name: "g3-chat-storage" } // LocalStorage, token 15 min (refresh en cookie httpOnly backend)
  )
);
