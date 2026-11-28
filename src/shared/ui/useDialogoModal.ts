"use client";

import { useEffect, useRef } from "react";

const ENFOCABLES = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function enfocables(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>(ENFOCABLES)).filter(
    (el) => !el.closest("[inert]") && el.getAttribute("aria-hidden") !== "true"
  );
}

/**
 * Comportamiento común de modales y drawers (WCAG 2.1 AA, frontend#190):
 * - mueve el foco al diálogo al abrir y lo devuelve al disparador al cerrar;
 * - Tab y Shift+Tab no salen del diálogo;
 * - Escape cierra;
 * - el resto de la página queda `inert` y sin scroll mientras está abierto.
 *
 * Se pasa la ref al contenedor con `role="dialog"`. El contenedor necesita
 * `tabIndex={-1}` para recibir el foco cuando no tiene controles, y la capa
 * (fondo incluido) se marca con `data-capa-modal` para no volverla inerte.
 * `clave` reinicia el diálogo cuando el componente cambia de contenedor.
 */
export function useDialogoModal<T extends HTMLElement>(onCerrar: () => void, clave?: unknown) {
  const ref = useRef<T>(null);
  const cerrarRef = useRef(onCerrar);

  useEffect(() => {
    cerrarRef.current = onCerrar;
  });

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    const disparador = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (enfocables(dialogo)[0] ?? dialogo).focus();

    // Todo lo que no contiene al diálogo, de su capa hacia arriba, queda inerte.
    const inertes: HTMLElement[] = [];
    const capa = dialogo.closest<HTMLElement>("[data-capa-modal]") ?? dialogo;
    for (let nodo: HTMLElement | null = capa; nodo && nodo !== document.body; nodo = nodo.parentElement) {
      for (const hermano of Array.from(nodo.parentElement?.children ?? [])) {
        if (hermano !== nodo && hermano instanceof HTMLElement && !hermano.inert) {
          hermano.inert = true;
          inertes.push(hermano);
        }
      }
    }
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrarRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = enfocables(dialogo);
      if (lista.length === 0) {
        e.preventDefault();
        dialogo.focus();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey && (activo === primero || !dialogo.contains(activo))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (activo === ultimo || !dialogo.contains(activo))) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alPresionar);

    return () => {
      document.removeEventListener("keydown", alPresionar);
      for (const el of inertes) el.inert = false;
      document.body.style.overflow = overflowPrevio;
      if (disparador?.isConnected) disparador.focus();
    };
  }, [clave]);

  return ref;
}
