"use client";

import { useState } from "react";

/**
 * Popup para calificar la compra con estrellas (retroalimentación con Botleta).
 * Paridad con Mockups-Wireframes.
 */
export function RatingPopup({ onClose }: { onClose: () => void }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={onClose}>
      <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl max-h-[85%] overflow-y-auto no-scrollbar p-6 flex flex-col items-center gap-3 text-center" onClick={(e) => e.stopPropagation()}>
        {!enviado ? (
          <>
            <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Califica tu compra</p>
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
            <button onClick={() => stars > 0 && setEnviado(true)} disabled={stars === 0}
              className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45 disabled:cursor-not-allowed">
              ENVIAR CALIFICACIÓN
            </button>
            <button onClick={onClose} className="text-[12px] font-semibold underline text-text-secondary">Ahora no</button>
          </>
        ) : (
          <>
            <p className="font-heading text-[20px]">¡GRACIAS POR TU OPINIÓN!</p>
            <p className="text-[13px] text-text-secondary">Registramos {stars}/5 estrellas. Usaremos tu retroalimentación para mejorar.</p>
            <button onClick={onClose} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">ENTENDIDO</button>
          </>
        )}
      </div>
    </div>
  );
}
