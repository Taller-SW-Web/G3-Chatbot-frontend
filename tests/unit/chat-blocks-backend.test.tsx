// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { MessageBubble } from "@/adapters/inbound/components/MessageBubble";
import { useChatStore } from "@/application/state/chatStore";
import { mapProductDetail } from "@/domain/entities/CatalogoUI";
import type { Bloque } from "@/domain/entities/Bloque";

const h = vi.hoisted(() => ({ push: vi.fn(), detalle: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock("@/infrastructure/di/container", () => ({ container: { api: {} } }));
vi.mock("@/application/use_cases/verDetalleProductoUseCase", () => ({
  verDetalleProductoUseCase: h.detalle,
}));

// Real backend shapes (production sample, backend main).
const PRODUCTO = {
  ref: 1,
  product_id: "prod-001",
  name: "Nike Revolution 7",
  brand: "brand-nike",
  image: "https://cdn.example.com/p/prod-001-1.jpg",
  price: "279.9",
  price_text: "S/ 279.90",
  short_description: "Zapatillas de running con amortiguación diaria",
  has_variants: true,
  single_sku: null,
  availability: "DISPONIBLE",
  variants: [
    { sku: "NIK-REV7-42-NEG", talla: "42", color: "negro" },
    { sku: "NIK-REV7-42-BLA", talla: "42", color: "blanco" },
  ],
};

const CARRUSEL = {
  id: "387146c2b2394d968a34bea6e681473e",
  tipo: "CARRUSEL_PRODUCTOS",
  datos: { productos: [PRODUCTO] },
} as unknown as Bloque;

function bubble(bloques: Bloque[], onQuickAction?: (a: unknown) => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(
    <MessageBubble rol="bot" texto="" bloques={bloques} onQuickAction={onQuickAction} />,
    { wrapper }
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useChatStore.setState({ cliente: null, authOpen: false, authVista: "login" });
});

describe("chat blocks with the backend contract", () => {
  it("renders CARRUSEL_PRODUCTOS from datos.productos using price_text", () => {
    bubble([CARRUSEL], vi.fn());
    expect(screen.getByTestId("bloque-carrusel-productos")).toBeTruthy();
    expect(screen.getByText("Nike Revolution 7")).toBeTruthy();
    expect(screen.getByText("S/ 279.90")).toBeTruthy();
  });

  it("adds a variant product by product_id and opens its detail by product_id", () => {
    const onAction = vi.fn();
    bubble([CARRUSEL], onAction);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Nike Revolution 7" }));
    expect(onAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "AGREGAR_AL_CARRITO",
        payload: { product_id: "prod-001" },
      })
    );
    fireEvent.click(screen.getByText("Nike Revolution 7"));
    expect(onAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "VER_DETALLE_PRODUCTO",
        payload: { product_id: "prod-001" },
      })
    );
  });

  it("adds a single-SKU product by sku", () => {
    const onAction = vi.fn();
    const unico = {
      ...CARRUSEL,
      datos: { productos: [{ ...PRODUCTO, has_variants: false, single_sku: "SKU-UNICO" }] },
    } as unknown as Bloque;
    bubble([unico], onAction);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Nike Revolution 7" }));
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "AGREGAR_AL_CARRITO", payload: { sku: "SKU-UNICO" } })
    );
  });

  it("renders DETALLE_PRODUCTO from datos.producto", () => {
    const detalle = {
      id: "d1",
      tipo: "DETALLE_PRODUCTO",
      datos: { producto: PRODUCTO },
    } as unknown as Bloque;
    bubble([detalle]);
    expect(screen.getByTestId("bloque-detalle-producto")).toBeTruthy();
    expect(screen.getByText("Nike Revolution 7")).toBeTruthy();
    expect(screen.getByText("S/ 279.90")).toBeTruthy();
  });

  it("ignores carousel and detail blocks without a datos payload", () => {
    const rotos = [
      { id: "a", tipo: "CARRUSEL_PRODUCTOS" },
      { id: "b", tipo: "DETALLE_PRODUCTO", datos: {} },
    ] as unknown as Bloque[];
    bubble(rotos);
    expect(screen.queryByTestId("bloque-carrusel-productos")).toBeNull();
    expect(screen.queryByTestId("bloque-detalle-producto")).toBeNull();
  });

  const CARRITO = {
    id: "c1",
    tipo: "CARRITO",
    datos: {
      lineas: [
        {
          item_id: "l1",
          sku: "NIK-REV7-42-NEG",
          nombre: "Nike Revolution 7",
          variante: "42 / negro",
          cantidad: 2,
          precio: 279.9,
          disponible: true,
          imagen: null,
        },
      ],
      subtotal: 559.8,
      descuentos: [],
      costoEnvio: null,
      envio: "se calcula al elegir la dirección",
      total: 559.8,
      avisos: ["Precio actualizado"],
      promociones_ok: true,
    },
  } as unknown as Bloque;

  it("renders CARRITO and routes its buttons", () => {
    bubble([CARRITO]);
    expect(screen.getByTestId("bloque-carrito")).toBeTruthy();
    expect(screen.getByText("Precio actualizado")).toBeTruthy();
    fireEvent.click(screen.getByTestId("btn-ver-carrito"));
    expect(h.push).toHaveBeenCalledWith("/carrito");
  });

  it("asks anonymous users to sign in before paying", () => {
    bubble([CARRITO]);
    fireEvent.click(screen.getByTestId("btn-pagar"));
    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBe("/checkout");
    expect(h.push).not.toHaveBeenCalled();
  });

  it("renders SELECTOR_VARIANTE options and sends the add action once complete", async () => {
    h.detalle.mockResolvedValue(mapProductDetail(PRODUCTO));
    const onAction = vi.fn();
    const selector = {
      id: "s1",
      tipo: "SELECTOR_VARIANTE",
      datos: { product_id: "prod-001", faltantes: ["talla", "color"] },
    } as unknown as Bloque;
    bubble([selector], onAction);
    await waitFor(() => expect(screen.getByRole("button", { name: "42" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "42" }));
    expect(onAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "negro" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "AGREGAR_AL_CARRITO",
        payload: { product_id: "prod-001", talla: "42", color: "negro" },
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "blanco" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("opens the sign-up tab from FORMULARIO REGISTRO", () => {
    const formulario = { id: "f1", tipo: "FORMULARIO", formulario: "REGISTRO" } as unknown as Bloque;
    bubble([formulario]);
    fireEvent.click(screen.getByRole("button", { name: "CREAR CUENTA" }));
    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().authVista).toBe("registro");
  });

  it("does not paint FORMULARIO for other forms and keeps unknown types silent", () => {
    const otros = [
      { id: "f2", tipo: "FORMULARIO", formulario: "LOGIN" },
      { id: "x", tipo: "LISTA_PEDIDOS" },
    ] as unknown as Bloque[];
    const { container } = bubble(otros);
    expect(screen.queryByTestId("bloque-formulario-registro")).toBeNull();
    expect(container.querySelectorAll("[data-testid^='bloque-']").length).toBe(0);
  });
});
