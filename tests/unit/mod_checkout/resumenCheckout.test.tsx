// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResumenCheckout } from "@/modules/mod-checkout/ui/blocks/ResumenCheckout";

describe("ResumenCheckout (SPEC-14)", () => {
  it("formatea el total correctamente con 2 decimales sin doble .00", () => {
    render(
      <ResumenCheckout
        total={282.4}
        direccion="Av. Larco 123, Miraflores"
        tarjetaLast4="4242"
      />
    );

    expect(screen.getByText("S/ 282.40")).toBeDefined();
    expect(screen.queryByText("S/ 282.4.00")).toBeNull();
  });
});
