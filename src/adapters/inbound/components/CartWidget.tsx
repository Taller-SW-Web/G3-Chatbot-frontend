"use client";

import { useChatStore } from "@/application/state/chatStore";

/** Badge carrito + resumen compacto. Solo lee store sincronizado desde el servidor. */
export function CartWidget({ onVerCarrito }: { onVerCarrito: () => void }) {
  const carrito = useChatStore((s) => s.carrito);
  if (carrito.count === 0) return null;
  return (
    <button
      onClick={onVerCarrito}
      data-testid="cart-widget"
      aria-label={`Ver carrito, ${carrito.count} productos, subtotal ${carrito.subtotal.toFixed(2)} soles`}
      className="wf-chip px-3 py-1.5 text-[12px] font-bold bg-white"
    >
      🛒 {carrito.count} · S/ {carrito.subtotal.toFixed(2)}
    </button>
  );
}
