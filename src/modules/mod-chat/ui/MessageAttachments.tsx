"use client";

import { useEffect, useState } from "react";
import { container } from "@/shared/di/container";
import type { AdjuntoMensaje } from "@/modules/mod-chat/domain/entities/Adjunto";
import { ImageViewer } from "@/modules/mod-chat/ui/ImageViewer";

type Urls = Record<string, { urlMiniatura?: string | null; urlImagen?: string | null }>;

function primeraUrl(adjunto: AdjuntoMensaje, urls: Urls): string | undefined {
  return (
    adjunto.urlLocal ??
    urls[adjunto.adjuntoId]?.urlMiniatura ??
    adjunto.urlMiniatura ??
    adjunto.urlImagen ??
    undefined
  );
}

/**
 * Miniaturas de las imágenes de un mensaje (SPEC-23 Req. 7).
 *
 * Usa la URL firmada del historial o el blob local del mensaje recién enviado.
 * Ante un error de carga pide una URL nueva y reintenta una sola vez; si vuelve
 * a fallar muestra "Imagen no disponible" sin romper el resto del mensaje.
 */
export function MessageAttachments({ adjuntos }: { adjuntos: AdjuntoMensaje[] }) {
  const [urls, setUrls] = useState<Urls>({});
  const [fallidas, setFallidas] = useState<Record<string, boolean>>({});
  const [reintentadas, setReintentadas] = useState<Record<string, boolean>>({});
  const [visor, setVisor] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    for (const adjunto of adjuntos) {
      if (adjunto.urlLocal || adjunto.urlMiniatura || adjunto.urlImagen) continue;
      if (urls[adjunto.adjuntoId] || fallidas[adjunto.adjuntoId]) continue;
      void container.chat
        .obtenerUrlAdjunto(adjunto.adjuntoId)
        .then((data) =>
          setUrls((actuales) => ({ ...actuales, [adjunto.adjuntoId]: data }))
        )
        .catch(() => setFallidas((actuales) => ({ ...actuales, [adjunto.adjuntoId]: true })));
    }
  }, [adjuntos, urls, fallidas]);

  async function reintentar(adjunto: AdjuntoMensaje) {
    if (reintentadas[adjunto.adjuntoId]) {
      setFallidas((actuales) => ({ ...actuales, [adjunto.adjuntoId]: true }));
      return;
    }
    setReintentadas((actuales) => ({ ...actuales, [adjunto.adjuntoId]: true }));
    try {
      const data = await container.chat.obtenerUrlAdjunto(adjunto.adjuntoId);
      setUrls((actuales) => ({ ...actuales, [adjunto.adjuntoId]: data }));
    } catch {
      setFallidas((actuales) => ({ ...actuales, [adjunto.adjuntoId]: true }));
    }
  }

  async function ampliar(adjunto: AdjuntoMensaje) {
    const alt = `Imagen adjunta ${adjuntos.indexOf(adjunto) + 1} de ${adjuntos.length}`;
    const existente = adjunto.urlImagen ?? urls[adjunto.adjuntoId]?.urlImagen ?? adjunto.urlLocal;
    if (existente) {
      setVisor({ url: existente, alt });
      return;
    }
    try {
      const data = await container.chat.obtenerUrlAdjunto(adjunto.adjuntoId);
      setUrls((actuales) => ({ ...actuales, [adjunto.adjuntoId]: data }));
      const url = data.urlImagen ?? data.urlMiniatura;
      if (url) setVisor({ url, alt });
    } catch {
      setFallidas((actuales) => ({ ...actuales, [adjunto.adjuntoId]: true }));
    }
  }

  if (adjuntos.length === 0) return null;

  return (
    <>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Imágenes del mensaje">
        {adjuntos.map((adjunto, i) => {
          const url = primeraUrl(adjunto, urls);
          const alt = `Imagen adjunta ${i + 1} de ${adjuntos.length}`;
          if (fallidas[adjunto.adjuntoId] || !url) {
            return (
              <li
                key={adjunto.adjuntoId}
                className="w-20 h-16 rounded-md border border-border-default bg-surface-cloud-subtle flex items-center justify-center text-center text-[10px] text-text-secondary px-1"
              >
                Imagen no disponible
              </li>
            );
          }
          return (
            <li key={adjunto.adjuntoId}>
              <button
                type="button"
                onClick={() => void ampliar(adjunto)}
                aria-label={`Ampliar ${alt}`}
                className="block w-20 h-16 rounded-md overflow-hidden border border-border-default"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={alt}
                  className="w-full h-full object-cover"
                  onError={() => void reintentar(adjunto)}
                />
              </button>
            </li>
          );
        })}
      </ul>
      {visor && <ImageViewer url={visor.url} alt={visor.alt} onClose={() => setVisor(null)} />}
    </>
  );
}
