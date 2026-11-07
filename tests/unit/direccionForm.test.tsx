// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DireccionForm } from "@/adapters/inbound/components/forms/DireccionForm";
import { useChatStore } from "@/application/state/chatStore";

beforeEach(() => useChatStore.setState({ cliente: null }));
afterEach(() => cleanup());

it("muestra solo los errores de los campos tocados", async () => {
  render(<DireccionForm onValid={vi.fn()} />);
  const nombre = screen.getByLabelText("Nombre completo");
  fireEvent.change(nombre, { target: { value: "Ma" } });
  expect(screen.queryByText("Elige distrito")).toBeNull();
  expect(screen.queryByText("El DNI tiene 8 dígitos")).toBeNull();
  expect(screen.queryByText("Requerido")).toBeNull();

  fireEvent.blur(nombre);
  expect(await screen.findByText("Requerido")).toBeDefined();
  expect(nombre.getAttribute("aria-invalid")).toBe("true");
  expect(nombre.getAttribute("aria-describedby")).toBe("direccion-nombre-error");
  expect(screen.queryByText("Elige distrito")).toBeNull();
});

it("avisa al padre cuando una dirección válida deja de serlo", async () => {
  const onValid = vi.fn();
  render(<DireccionForm onValid={onValid} />);
  fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Ana Pérez" } });
  fireEvent.change(screen.getByLabelText("Dirección exacta"), { target: { value: "Av. Arequipa 123" } });
  fireEvent.change(screen.getByLabelText("Distrito de entrega"), { target: { value: "Miraflores" } });
  fireEvent.change(screen.getByLabelText("Número de documento"), { target: { value: "12345678" } });
  await waitFor(() => expect(onValid).toHaveBeenLastCalledWith(expect.objectContaining({ docNum: "12345678" })));

  fireEvent.change(screen.getByLabelText("Dirección exacta"), { target: { value: "" } });
  await waitFor(() => expect(onValid).toHaveBeenLastCalledWith(null));
});

it("precarga el nombre y tipo del perfil sin copiar el documento enmascarado", () => {
  useChatStore.setState({ cliente: {
    nombreCompleto: "Ana Pérez", correo: "ana@test.pe", celularVerificado: true,
    tipoDocumento: "DNI", ultimoDocumento: { tipo: "RUC", numeroEnmascarado: "*******1234" },
  } });
  render(<DireccionForm onValid={vi.fn()} />);
  expect((screen.getByLabelText("Nombre completo") as HTMLInputElement).value).toBe("Ana Pérez");
  expect((screen.getByLabelText("Tipo de documento") as HTMLSelectElement).value).toBe("RUC");
  const numero = screen.getByLabelText("Número de documento") as HTMLInputElement;
  expect(numero.value).toBe("");
  expect(numero.inputMode).toBe("numeric");
  expect(numero.maxLength).toBe(11);
  expect((screen.getByLabelText("Dirección exacta") as HTMLInputElement).autocomplete).toBe("street-address");
});

it("revalida un número tocado al cambiar el tipo de documento", async () => {
  render(<DireccionForm onValid={vi.fn()} />);
  const numero = screen.getByLabelText("Número de documento") as HTMLInputElement;
  fireEvent.change(numero, { target: { value: "12345678" } });
  fireEvent.blur(numero);
  fireEvent.change(screen.getByLabelText("Tipo de documento"), { target: { value: "RUC" } });
  expect(await screen.findByText("El RUC tiene 11 dígitos")).toBeDefined();
  expect(numero.maxLength).toBe(11);
  fireEvent.change(screen.getByLabelText("Tipo de documento"), { target: { value: "CE" } });
  expect(numero.inputMode).toBe("text");
  expect(numero.maxLength).toBe(20);
});
