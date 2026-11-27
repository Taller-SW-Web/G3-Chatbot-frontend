"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { container } from "@/shared/di/container";
import { OrderDetailPage } from "@/modules/mod-orders/public";
import { DeliveryRating, puntuacionDeMood } from "@/modules/mod-postventa/public";

/**
 * Composition root cliente de `/pedido`: arma el `csatSlot` de `mod-postventa`
 * y refresca el pedido si Ventas responde 422 ORDER_NOT_DELIVERED. La página
 * queda como Server Component; solo este bloque necesita hooks de cliente.
 */
export function PedidoContent() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const pedidoId = params.get("pedidoId") ?? "";

  return (
    <OrderDetailPage
      csatSlot={
        pedidoId ? (
          <DeliveryRating
            pedidoId={pedidoId}
            onRate={(id, mood, comentario) =>
              container.postventa.calificarPedido(id, puntuacionDeMood(mood), comentario)
            }
            onNotDelivered={() =>
              void queryClient.invalidateQueries({ queryKey: ["pedido", pedidoId] })
            }
          />
        ) : undefined
      }
    />
  );
}
