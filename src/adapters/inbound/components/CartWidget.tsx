"use client";

import { useChatStore } from "@/application/state/chatStore";

/** Badge carrito + resumen compacto. Solo lee store, no Axios. */
export function CartWidget({ onVerCarrito }: { onVerCarrito: () => void }) {
  const carrito = useChatStore((s) => s.carrito);
  if (carrito.count === 0) return null;
  return (
    <button
      onClick={onVerCarrito}
      className="wf-chip px-3 py-1.5 text-[12px] font-bold bg-white"
    >
      🛒 {carrito.count} · S/ {carrito.subtotal}.00
    </button>
  );
}
