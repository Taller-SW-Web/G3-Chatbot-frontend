// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { RegistroForm } from "@/adapters/inbound/components/forms/RegistroForm";

afterEach(cleanup);

function llenar(contrasena: string) {
  fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Quispe" } });
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@ejemplo.com" } });
  fireEvent.change(screen.getByLabelText("Celular"), { target: { value: "+51987654321" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: contrasena } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: contrasena } });
  fireEvent.click(screen.getByLabelText(/Acepto los/));
}

describe("RegistroForm", () => {
  it("bloquea el envío si la contraseña no cumple la política cargada", async () => {
    const onOk = vi.fn();
    render(createElement(RegistroForm, { onOk, politica: { minLength: 8, requireSymbol: true } }));
    llenar("secreto123");
    fireEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));
    expect(await screen.findByText("La contraseña no cumple la política de seguridad")).toBeTruthy();
    expect(onOk).not.toHaveBeenCalled();
  });

  it("envía cuando la contraseña cumple la política", async () => {
    const onOk = vi.fn();
    render(createElement(RegistroForm, { onOk, politica: { minLength: 8, requireSymbol: true } }));
    llenar("secreto123!");
    fireEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));
    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
  });

  it("ofrece Iniciar sesión cuando el padre lo indica", () => {
    const onIniciarSesion = vi.fn();
    render(createElement(RegistroForm, { onOk: vi.fn(), error: "Si el correo es válido", onIniciarSesion }));
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(onIniciarSesion).toHaveBeenCalled();
  });

  it("tras un error del servidor conserva los valores salvo las contraseñas", async () => {
    const props = { onOk: vi.fn() };
    const { rerender } = render(createElement(RegistroForm, props));
    llenar("secreto123");
    rerender(
      createElement(RegistroForm, {
        ...props,
        error: "Revisa los campos marcados",
        erroresCampo: { contrasena: "Debe incluir un símbolo" },
      })
    );
    expect(await screen.findByText("Debe incluir un símbolo")).toBeTruthy();
    expect((screen.getByLabelText("Correo") as HTMLInputElement).value).toBe("ana@ejemplo.com");
    expect((screen.getByLabelText("Nombres") as HTMLInputElement).value).toBe("Ana");
    expect((screen.getByLabelText("Contraseña") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Confirmar contraseña") as HTMLInputElement).value).toBe("");
  });
});
