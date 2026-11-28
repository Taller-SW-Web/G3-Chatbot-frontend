// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { LoginForm } from "@/modules/mod-auth/ui/forms/LoginForm";

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

  it("el enlace de recuperación apunta a la URL configurada", () => {
    const customUrl = "https://seguridad.marketplace.com/custom-recuperar";
    render(createElement(LoginForm, { onOk: vi.fn(), urlRecuperacion: customUrl }));

    const link = screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" });
    expect(link.getAttribute("href")).toBe(customUrl);
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("si no hay URL de recuperación configurada, no muestra el enlace (SPEC-03)", () => {
    render(createElement(LoginForm, { onOk: vi.fn(), urlRecuperacion: "" }));
    expect(screen.queryByRole("link", { name: "¿Olvidaste tu contraseña?" })).toBeNull();
  });

  it("tras recibir error limpia el campo de contraseña (SPEC-03)", () => {
    const { rerender } = render(
      createElement(LoginForm, { onOk: vi.fn(), error: null })
    );

    const contrasena = screen.getByLabelText("Contraseña") as HTMLInputElement;
    fireEvent.change(contrasena, { target: { value: "MiClave123!" } });
    expect(contrasena.value).toBe("MiClave123!");

    // Al recibir error de credenciales inválidas (401), se resetea la contraseña
    rerender(
      createElement(LoginForm, {
        onOk: vi.fn(),
        error: "Correo o contraseña incorrectos",
      })
    );

    expect(contrasena.value).toBe("");
  });
});
