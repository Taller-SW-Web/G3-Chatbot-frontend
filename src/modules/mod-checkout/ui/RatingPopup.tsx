"use client";

import { useState } from "react";
import { useDialogoModal } from "@/shared/ui/useDialogoModal";
import { container } from "@/shared/di/container";
import { httpStatus } from "@/shared/api/httpError";

const CLAVE_DESCARTE = "compra-calificacion-descartada";

/** Marca en el navegador que el cliente descartó la valoración de ese pedido. */
export function descartarCalificacionCompra(pedidoId: string) {
  try {
    window.localStorage.setItem(`${CLAVE_DESCARTE}:${pedidoId}`, "1");
  } catch {
    // Sin localStorage el popup puede volver a mostrarse: es por dispositivo.
  }
}

export function calificacionCompraDescartada(pedidoId: string): boolean {
  try {
    return window.localStorage.getItem(`${CLAVE_DESCARTE}:${pedidoId}`) === "1";
  } catch {
    return false;
  }
}

/**
 * Popup "Califica tu compra" (SPEC-24 Req. 7): estrellas 1–5 y comentario
 * opcional. Se guarda en el chatbot, no se envía a Ventas, y no bloquea la
 * confirmación del pedido.
 */
export function RatingPopup({ onClose, pedidoId }: { onClose: () => void; pedidoId: string }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (stars <= 0 || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await container.checkout.calificarCompra(
        pedidoId,
        stars as 1 | 2 | 3 | 4 | 5,
        comentario.trim() || undefined
      );
      setEnviado(true);
    } catch (e) {
      // 409: ya existe una valoración para el pedido; no es un error visible.
      if (httpStatus(e) === 409) setEnviado(true);
      else setError("No pudimos guardar tu opinión");
    } finally {
      setEnviando(false);
    }
  }

  function ahoraNo() {
    descartarCalificacionCompra(pedidoId);
    onClose();
  }
  // Escape equivale a "Ahora no" antes de enviar y a "Entendido" después.
  const dialogoRef = useDialogoModal<HTMLDivElement>(enviado ? onClose : ahoraNo);

  return (
    <div data-capa-modal className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5">
      <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 cursor-default" onClick={ahoraNo} />
      <div ref={dialogoRef} tabIndex={-1} className="relative pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl max-h-[85%] overflow-y-auto no-scrollbar p-6 flex flex-col items-center gap-3 text-center outline-none" role="dialog" aria-modal="true" aria-labelledby="calificacion-compra-titulo">
        {!enviado ? (
          <>
            <h2 id="calificacion-compra-titulo" className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Califica tu compra</h2>
            <p className="text-[13px] text-text-secondary">Tu opinión ayuda a Botleta a mejorar. ¿Cómo fue tu experiencia?</p>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Estrellas">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  role="radio"
                  aria-checked={stars === n}
                  aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setStars(n)}
                  className={`text-[32px] leading-none transition-transform ${(hover || stars) >= n ? "text-action-primary scale-110" : "text-border-default"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-[12px] font-bold text-text-secondary h-4">
              {stars > 0 ? `${stars}/5 ${stars >= 4 ? "¡Gracias!" : stars === 3 ? "Tomamos nota" : "Cuéntanos qué falló"}` : "Toca las estrellas"}
            </p>
            <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
              placeholder="Comentario opcional (qué te gustó / qué mejorar)..." aria-label="Comentario de la compra"
              rows={2} maxLength={500} className="wf-input w-full px-3 py-2.5 text-sm outline-none text-left" />
            {error && (
              <p role="alert" className="text-[12px] text-error-default">
                {error}
              </p>
            )}
            <button onClick={() => void enviar()} disabled={stars === 0 || enviando}
              className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45 disabled:cursor-not-allowed">
              {enviando ? "ENVIANDO…" : "ENVIAR CALIFICACIÓN"}
            </button>
            <button onClick={ahoraNo} className="text-[12px] font-semibold underline text-text-secondary">Ahora no</button>
          </>
        ) : (
          <>
            <h2 id="calificacion-compra-titulo" className="font-heading text-[20px]">¡GRACIAS POR TU OPINIÓN!</h2>
            <p className="text-[13px] text-text-secondary">Registramos {stars}/5 estrellas. Usaremos tu retroalimentación para mejorar.</p>
            <button onClick={onClose} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">ENTENDIDO</button>
          </>
        )}
      </div>
    </div>
  );
}
