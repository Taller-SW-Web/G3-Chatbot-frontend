"use client";

import { Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/shared/ui/shell/AppShell";
import { AuthGuard } from "@/shared/auth/AuthGuard";
import { container } from "@/shared/di/container";
import { OrderDetailPage } from "@/modules/mod-orders/public";
import { DeliveryRating, puntuacionDeMood } from "@/modules/mod-postventa/public";

/**
 * `/pedido?pedidoId=...`: detalle del pedido con el CSAT de `mod-postventa`
 * inyectado como slot. Este wrapper es el composition root que conecta ambos
 * módulos: arma el bloque y refresca el pedido si Ventas responde que ya no
 * está entregado.
 */
function PedidoContent() {
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

export default function PedidoRoute() {
  return (
    <AppShell initialScreen="pedido">
      <AuthGuard>
        <Suspense fallback={<p className="p-6 text-[14px] text-text-secondary">Cargando pedido…</p>}>
          <PedidoContent />
        </Suspense>
      </AuthGuard>
    </AppShell>
  );
}
