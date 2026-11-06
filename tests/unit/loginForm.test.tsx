// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { LoginForm } from "@/adapters/inbound/components/forms/LoginForm";

afterEach(cleanup);

describe("LoginForm", () => {
  it("muestra y oculta la contraseña con el botón de ojo", () => {
    render(createElement(LoginForm, { onOk: vi.fn() }));
    const contrasena = screen.getByLabelText("Contraseña") as HTMLInputElement;

    expect(contrasena.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(contrasena.type).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(contrasena.type).toBe("password");
  });
});
