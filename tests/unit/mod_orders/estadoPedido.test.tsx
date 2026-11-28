// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EstadoPedido } from "@/modules/mod-orders/ui/blocks/EstadoPedido";

afterEach(cleanup);

describe("EstadoPedido (SPEC-17 · Scenario: Pedido en preparación)", () => {
  it("los pasos que aún no ocurren van en gris, sin icono de avance", () => {
    render(
      <EstadoPedido
        hitos={[
          { titulo: "Pedido registrado", fecha: "10/11/2026 10:00", done: true },
          { titulo: "En preparación", fecha: "10/11/2026 12:00", done: true },
          { titulo: "Despachado", fecha: "", done: false },
        ]}
      />
    );

    const pendiente = screen.getByText("Despachado");
    expect(pendiente.className).toContain("text-text-secondary");
    expect(screen.getByText("Pendiente")).toBeDefined();
    expect(screen.getByText("En preparación").className).toContain("text-text-primary");
    expect(document.querySelector(".bg-accent-volt")).toBeNull();
  });
});
