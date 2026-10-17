"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cliente } from "@/domain/entities/Cliente";
import type { CarritoUI } from "@/domain/entities/CarritoUI";
import { isTokenExpiringSoon } from "@/domain/utils/sesion";

type ChatState = {
  accessToken: string | null;
  /** Epoch ms when the access token expires (SPEC-03: 15 min lifetime). */
  expiraEn: number | null;
  chatSid: string | null;
  cliente: Cliente | null;
  carrito: CarritoUI;
  accionPendiente: string | null;
  /** Abre el modal de login/registro global (AppShell). */
  authOpen: boolean;
  /** Resumen del último pedido confirmado (pantalla /exito). */
  ultimoPedido: UltimoPedido;
  /**
   * Primer mensaje que Home deja para la conversación recién creada; el chat lo envía una
   * sola vez y lo limpia. Es transitorio: no se persiste.
   */
  primerMensaje: string | null;
  /** Última conversación abierta: ubica el carrito anónimo desde /carrito. */
  ultimaConversacionId: string | null;
  setUltimaConversacionId: (id: string | null) => void;
  setToken: (t: string | null) => void;
  setCliente: (c: Cliente | null) => void;
  setExpiraEn: (v: number | null) => void;
  /** Stores a freshly opened session (SPEC-03 Req. 1/2/5). */
  applySession: (token: string, expiresIn: number, cliente?: Cliente | null) => void;
  /** True when the token expires within the next 60 s (SPEC-03 Req. 5). */
  isTokenExpiringSoon: () => boolean;
  setCarrito: (c: CarritoUI) => void;
  setAccionPendiente: (a: string | null) => void;
  setAuthOpen: (v: boolean) => void;
  setUltimoPedido: (p: UltimoPedido) => void;
  setPrimerMensaje: (m: string | null) => void;
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
    (set, get) => ({
      accessToken: null,
      expiraEn: null,
      chatSid: null,
      cliente: null,
      carrito: carritoVacio,
      accionPendiente: null,
      authOpen: false,
      ultimoPedido: null,
      primerMensaje: null,
      ultimaConversacionId: null,
      setUltimaConversacionId: (ultimaConversacionId) => set({ ultimaConversacionId }),
      setToken: (accessToken) => set({
        accessToken,
        expiraEn: accessToken ? Date.now() + 15 * 60 * 1000 : null,
      }),
      setCliente: (cliente) => set({ cliente }),
      setExpiraEn: (expiraEn) => set({ expiraEn }),
      applySession: (accessToken, expiresIn, cliente) => set((s) => ({
        accessToken,
        expiraEn: Date.now() + expiresIn * 1000,
        cliente: cliente === undefined ? s.cliente : cliente,
      })),
      isTokenExpiringSoon: () => {
        const { accessToken, expiraEn } = get();
        if (!accessToken) return false;
        return isTokenExpiringSoon(expiraEn);
      },
      setCarrito: (carrito) => set({ carrito }),
      setAccionPendiente: (accionPendiente) => set({ accionPendiente }),
      setAuthOpen: (authOpen) => set({ authOpen }),
      setUltimoPedido: (ultimoPedido) => set({ ultimoPedido }),
      setPrimerMensaje: (primerMensaje) => set({ primerMensaje }),
      logout: () =>
        set({
          accessToken: null,
          expiraEn: null,
          cliente: null,
          carrito: carritoVacio,
          accionPendiente: null,
        }),
    }),
    {
      name: "g3-chat-storage", // LocalStorage, token 15 min (refresh en cookie httpOnly backend)
      version: 2,
      // Los mensajes del chat viven en el backend (historial) y en el estado local del turno.
      migrate: (persistido) => {
        const resto = { ...(persistido as Record<string, unknown>) };
        delete resto.mensajes;
        delete resto.escribiendo;
        delete resto.mensajePendiente;
        return resto as unknown as ChatState;
      },
      partialize: (s) => ({
        accessToken: s.accessToken,
        chatSid: s.chatSid,
        cliente: s.cliente,
        carrito: s.carrito,
        accionPendiente: s.accionPendiente,
        authOpen: s.authOpen,
        ultimoPedido: s.ultimoPedido,
        // El carrito anónimo vive por conversación: sobrevive a un recargado de /carrito.
        ultimaConversacionId: s.ultimaConversacionId,
      }),
    }
  )
);
