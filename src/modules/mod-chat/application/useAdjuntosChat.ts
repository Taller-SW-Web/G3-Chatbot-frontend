"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { container } from "@/shared/di/container";
import {
  MENSAJE_ADJUNTO_FALLO,
  MENSAJE_ADJUNTO_LIMITE,
  MENSAJE_ADJUNTO_PROCESAR,
  type AdjuntoMensaje,
} from "@/modules/mod-chat/domain/entities/Adjunto";
import { validarImagenAdjunta } from "@/modules/mod-chat/domain/utils/validarImagenAdjunta";
import { problemCode } from "@/shared/api/httpError";

export type EstadoAdjuntoPendiente = "SUBIENDO" | "LISTO" | "ERROR";

export type AdjuntoPendiente = {
  id: string;
  nombre: string;
  urlLocal: string;
  estado: EstadoAdjuntoPendiente;
  progreso: number;
  archivo: File;
  adjunto?: AdjuntoMensaje;
  error?: string;
};

function mensajeDeError(error: unknown): string {
  switch (problemCode(error)) {
    case "ADJUNTO_INVALIDO":
      return MENSAJE_ADJUNTO_PROCESAR;
    case "LIMITE_ADJUNTOS":
      return MENSAJE_ADJUNTO_LIMITE;
    case "DEMASIADAS_SOLICITUDES":
      return "Vas muy rápido, espera un momento.";
    default:
      return MENSAJE_ADJUNTO_FALLO;
  }
}

/**
 * Adjuntos pendientes de la conversación activa (SPEC-23).
 *
 * Sube cada imagen en cuanto se elige, muestra progreso y permite quitarla
 * (el backend borra el pendiente) o reintentar la carga. El envío del mensaje
 * solo referencia los `adjuntoId` ya listos.
 */
export function useAdjuntosChat(conversacionId: string) {
  const [pendientes, setPendientes] = useState<AdjuntoPendiente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const contador = useRef(0);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const lista = urls.current;
    return () => {
      for (const url of lista) URL.revokeObjectURL(url);
      lista.length = 0;
    };
  }, []);

  const actualizar = useCallback((id: string, cambios: Partial<AdjuntoPendiente>) => {
    setPendientes((actuales) => actuales.map((a) => (a.id === id ? { ...a, ...cambios } : a)));
  }, []);

  const subir = useCallback(
    async (item: AdjuntoPendiente) => {
      actualizar(item.id, { estado: "SUBIENDO", progreso: 0, error: undefined });
      try {
        const adjunto = await container.chat.subirAdjunto(
          conversacionId,
          item.archivo,
          (progreso) => actualizar(item.id, { progreso })
        );
        actualizar(item.id, { estado: "LISTO", progreso: 100, adjunto });
      } catch (e) {
        actualizar(item.id, {
          estado: "ERROR",
          progreso: 0,
          error: mensajeDeError(e),
        });
      }
    },
    [actualizar, conversacionId]
  );

  const agregarArchivos = useCallback(
    (archivos: FileList | File[]) => {
      const lista = Array.from(archivos);
      if (lista.length === 0) return;
      setError(null);
      const nuevos: AdjuntoPendiente[] = [];
      let problema: string | null = null;
      for (const archivo of lista) {
        problema = validarImagenAdjunta(archivo, pendientes.length + nuevos.length);
        if (problema) break;
        contador.current += 1;
        const urlLocal = URL.createObjectURL(archivo);
        urls.current.push(urlLocal);
        nuevos.push({
          id: `adj-${Date.now()}-${contador.current}`,
          nombre: archivo.name || "imagen",
          urlLocal,
          estado: "SUBIENDO",
          progreso: 0,
          archivo,
        });
      }
      if (problema) setError(problema);
      if (nuevos.length === 0) return;
      setPendientes((actuales) => [...actuales, ...nuevos]);
      for (const item of nuevos) void subir(item);
    },
    [pendientes.length, subir]
  );

  const quitar = useCallback(
    (id: string) => {
      const item = pendientes.find((a) => a.id === id);
      if (!item) return;
      if (item.adjunto) {
        void container.chat.eliminarAdjunto(conversacionId, item.adjunto.adjuntoId).catch(() => undefined);
      }
      URL.revokeObjectURL(item.urlLocal);
      urls.current = urls.current.filter((url) => url !== item.urlLocal);
      setPendientes((actuales) => actuales.filter((a) => a.id !== id));
    },
    [conversacionId, pendientes]
  );

  const reintentar = useCallback(
    (id: string) => {
      const item = pendientes.find((a) => a.id === id);
      if (item) void subir(item);
    },
    [pendientes, subir]
  );

  const limpiar = useCallback(() => {
    setPendientes([]);
    setError(null);
  }, []);

  const listos = pendientes.filter((a) => a.estado === "LISTO" && a.adjunto);
  const subiendo = pendientes.some((a) => a.estado === "SUBIENDO");
  const conError = pendientes.some((a) => a.estado === "ERROR");

  return {
    pendientes,
    error,
    limpiarError: () => setError(null),
    agregarArchivos,
    quitar,
    reintentar,
    limpiar,
    listos,
    subiendo,
    conError,
    puedeEnviarAdjuntos: listos.length > 0 && !subiendo && !conError,
  };
}
