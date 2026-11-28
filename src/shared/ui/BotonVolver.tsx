"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Botón "volver" para páginas estáticas que no necesitan ser Client Components.
 * Si la página se abrió en una pestaña nueva o por carga directa no hay
 * historial previo (`history.length <= 1`): en ese caso vuelve a `/`.
 */
export function BotonVolver({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  function volver() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <button type="button" aria-label={label} onClick={volver} className={className}>
      {children}
    </button>
  );
}
