// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PedidoContent } from "@/app/pedido/PedidoContent";

const params = vi.hoisted(() => ({ value: new URLSearchParams("pedidoId=PED-1") }));
const invalidateQueries = vi.hoisted(() => vi.fn());
const calificarPedido = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => params.value,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("@/shared/di/container", () => ({
  container: { postventa: { calificarPedido } },
}));

vi.mock("@/modules/mod-orders/public", () => ({
  OrderDetailPage: ({ csatSlot }: { csatSlot?: ReactNode }) => <section>{csatSlot ?? null}</section>,
}));

vi.mock("@/modules/mod-postventa/public", () => ({
  puntuacionDeMood: (mood: "mal" | "regular" | "bien") =>
    mood === "bien" ? 5 : mood === "regular" ? 3 : 1,
  DeliveryRating: ({
    pedidoId,
    onRate,
    onNotDelivered,
  }: {
    pedidoId: string;
    onRate: (
      pedidoId: string,
      mood: "mal" | "regular" | "bien",
      comentario?: string
    ) => Promise<unknown>;
    onNotDelivered?: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => void onRate(pedidoId, "regular", "Llegó bien")}>
        CALIFICAR
      </button>
      <button type="button" onClick={() => onNotDelivered?.()}>
        NO ENTREGADO
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  params.value = new URLSearchParams("pedidoId=PED-1");
  calificarPedido.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("PedidoContent (composition root del CSAT)", () => {
  it("refresca el pedido cuando Ventas responde ORDER_NOT_DELIVERED", () => {
    render(<PedidoContent />);

    fireEvent.click(screen.getByRole("button", { name: "NO ENTREGADO" }));

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["pedido", "PED-1"] });
  });

  it("envía el CSAT con la puntuación mapeada desde la carita", async () => {
    render(<PedidoContent />);

    fireEvent.click(screen.getByRole("button", { name: "CALIFICAR" }));

    await waitFor(() =>
      expect(calificarPedido).toHaveBeenCalledWith("PED-1", 3, "Llegó bien")
    );
  });

  it("no arma el slot CSAT cuando falta pedidoId", () => {
    params.value = new URLSearchParams();
    render(<PedidoContent />);

    expect(screen.queryByRole("button", { name: "CALIFICAR" })).toBeNull();
    expect(screen.queryByRole("button", { name: "NO ENTREGADO" })).toBeNull();
  });
});
