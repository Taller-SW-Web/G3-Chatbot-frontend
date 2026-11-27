// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cotizacionEnvioQueryKey,
  firmaCarritoEnvio,
  useCotizacionEnvio,
  type LineaCotizable,
} from "@/modules/mod-shipping/application/useCotizacionEnvio";

const h = vi.hoisted(() => ({ cotizarEnvio: vi.fn() }));
vi.mock("@/shared/di/container", () => ({ container: { envio: { cotizarEnvio: h.cotizarEnvio } } }));

const DIRECCION = { nombre: "Ana Díaz", direccion: "Av. Larco 1234", distrito: "Miraflores" };
const cotizacion = (costoEnvio: number) => ({
  coberturaDisponible: true, costoEnvio, moneda: "PEN", plazoEstimadoDias: 1, distrito: "Miraflores",
});

function montar(lineas: readonly LineaCotizable[] | undefined) {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(({ l }) => useCotizacionEnvio(DIRECCION, l), { wrapper, initialProps: { l: lineas } });
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("recotización al cambiar el carrito (SPEC-12 Req. 5)", () => {
  it("la firma no depende del orden de las líneas y sí de las cantidades", () => {
    const a = firmaCarritoEnvio([{ sku: "B", cantidad: 1 }, { sku: "A", cantidad: 2 }]);
    expect(a).toBe(firmaCarritoEnvio([{ sku: "A", cantidad: 2 }, { sku: "B", cantidad: 1 }]));
    expect(a).not.toBe(firmaCarritoEnvio([{ sku: "A", cantidad: 3 }, { sku: "B", cantidad: 1 }]));
    expect(cotizacionEnvioQueryKey(DIRECCION, a)).not.toEqual(cotizacionEnvioQueryKey(DIRECCION, "A:3|B:1"));
  });

  it("Scenario: El carrito cambia después de cotizar — recotiza y usa el costo nuevo", async () => {
    h.cotizarEnvio.mockResolvedValueOnce(cotizacion(10)).mockResolvedValueOnce(cotizacion(15));
    const { result, rerender } = montar([{ sku: "SKU-1", cantidad: 1 }]);
    await waitFor(() => expect(result.current.cotizacion?.costoEnvio).toBe(10));

    rerender({ l: [{ sku: "SKU-1", cantidad: 3 }] });

    await waitFor(() => expect(result.current.cotizacion?.costoEnvio).toBe(15));
    expect(h.cotizarEnvio).toHaveBeenCalledTimes(2);
  });

  it("el mismo contenido en otro orden no recotiza", async () => {
    h.cotizarEnvio.mockResolvedValue(cotizacion(10));
    const { result, rerender } = montar([{ sku: "A", cantidad: 1 }, { sku: "B", cantidad: 2 }]);
    await waitFor(() => expect(result.current.cotizacion).not.toBeNull());

    rerender({ l: [{ sku: "B", cantidad: 2 }, { sku: "A", cantidad: 1 }] });

    expect(h.cotizarEnvio).toHaveBeenCalledTimes(1);
  });

  it("no cotiza hasta conocer el carrito", () => {
    montar(undefined);
    expect(h.cotizarEnvio).not.toHaveBeenCalled();
  });
});
