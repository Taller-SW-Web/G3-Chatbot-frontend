// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { CartDiscounts } from "@/adapters/inbound/components/CartDiscounts";

afterEach(() => cleanup());

it("mantiene el descuento en una línea y alineado a la derecha", () => {
  const { container } = render(<CartDiscounts value={[{ nombre: "Cupón", monto: 40 }]} />);
  const row = container.firstElementChild as HTMLElement;
  const amount = screen.getByText("S/ 40.00");
  const value = amount.parentElement?.parentElement;

  expect(value?.textContent).toBe("- S/ 40.00");
  expect(value?.className).toContain("inline-flex");
  expect(value?.className).toContain("whitespace-nowrap");
  expect(value?.className).toContain("shrink-0");
  expect(value?.className).toContain("text-success-default");
  expect(row.className).toContain("justify-between");
});
