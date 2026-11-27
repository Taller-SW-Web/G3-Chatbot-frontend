// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatPage } from "@/modules/mod-chat/ui/ChatPage";

const h = vi.hoisted(() => ({
  send: vi.fn(),
  subir: vi.fn(),
  eliminar: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/shared/di/container", () => ({
  container: {
    chat: {
      subirAdjunto: h.subir,
      eliminarAdjunto: h.eliminar,
      obtenerUrlAdjunto: vi.fn(),
    },
  },
}));
vi.mock("@/modules/mod-chat/application/useChat", () => ({
  useChat: () => ({
    mensajes: [],
    borrador: null,
    estado: "inactivo",
    error: null,
    incompleto: false,
    historialCargado: true,
    ultimoTexto: "",
    enviar: h.send,
    reintentar: vi.fn(),
    recargar: vi.fn(),
    recargarSilencioso: vi.fn(),
  }),
}));

function archivo() {
  return new File([new Uint8Array(4)], "foto.png", { type: "image/png" });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
  h.subir.mockResolvedValue({
    adjuntoId: "a-1",
    mimeType: "image/png",
    ancho: 640,
    alto: 480,
  });
  h.eliminar.mockResolvedValue(undefined);
  h.send.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function montar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ChatPage conversationId="c-1" />
    </QueryClientProvider>
  );
}

it("muestra el aviso de privacidad solo antes de la primera carga", async () => {
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Adjuntar imagen" }));
  expect(screen.getByRole("dialog", { name: /Antes de adjuntar una imagen/ })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));
  expect(screen.queryByRole("dialog")).toBeNull();

  // El aviso vuelve a mostrarse si el cliente no confirmó.
  fireEvent.click(screen.getByRole("button", { name: "Adjuntar imagen" }));
  expect(screen.getByRole("dialog", { name: /Antes de adjuntar una imagen/ })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Entendido, adjuntar" }));
  expect(screen.queryByRole("dialog", { name: /Antes de adjuntar una imagen/ })).toBeNull();
  expect(screen.getByRole("dialog", { name: "Agregar imagen" })).toBeDefined();
  expect(window.localStorage.getItem("chat-adjunto-privacidad")).toBe("1");
});

it("ofrece Galería y Tomar foto con el recordatorio de formatos (SPEC-23 · Scenario: Elegir el origen de la imagen)", () => {
  window.localStorage.setItem("chat-adjunto-privacidad", "1");
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Adjuntar imagen" }));
  const hoja = screen.getByRole("dialog", { name: "Agregar imagen" });
  expect(hoja.textContent).toContain("JPG, PNG o WEBP de hasta 5 MB");
  expect(screen.getByRole("button", { name: "Galería" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Tomar foto" })).toBeDefined();

  const camara = screen.getByLabelText("Tomar foto con la cámara", { selector: "input" });
  expect(camara.getAttribute("capture")).toBe("environment");
  expect(camara.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp");
  const clic = vi.spyOn(camara, "click").mockImplementation(() => {});
  fireEvent.click(screen.getByRole("button", { name: "Tomar foto" }));
  expect(clic).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("la foto de la cámara pasa por las mismas validaciones (SPEC-23 · Scenario: Tomar una foto con la cámara)", async () => {
  window.localStorage.setItem("chat-adjunto-privacidad", "1");
  montar();

  fireEvent.change(screen.getByLabelText("Tomar foto con la cámara", { selector: "input" }), {
    target: { files: [archivo()] },
  });

  expect(await screen.findByAltText("Imagen adjunta 1 de 1")).toBeDefined();
  await waitFor(() => expect(h.subir).toHaveBeenCalledWith("c-1", expect.any(File), expect.any(Function)));
});

it("Escape cierra la hoja de origen sin adjuntar", () => {
  window.localStorage.setItem("chat-adjunto-privacidad", "1");
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Adjuntar imagen" }));
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(h.subir).not.toHaveBeenCalled();
});

it("sube la imagen, la envía como adjuntoIds y permite quitarla antes", async () => {
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Adjuntar imagen" }));
  fireEvent.click(screen.getByRole("button", { name: "Entendido, adjuntar" }));

  fireEvent.change(screen.getByLabelText("Adjuntar imagen", { selector: "input" }), {
    target: { files: [archivo()] },
  });

  expect(await screen.findByAltText("Imagen adjunta 1 de 1")).toBeDefined();
  await waitFor(() => expect(h.subir).toHaveBeenCalledWith("c-1", expect.any(File), expect.any(Function)));

  const enviar = screen.getByRole("button", { name: "Enviar" });
  await waitFor(() => expect(enviar.hasAttribute("disabled")).toBe(false));
  fireEvent.click(enviar);

  expect(h.send).toHaveBeenCalledWith("", [
    expect.objectContaining({ adjuntoId: "a-1", mimeType: "image/png" }),
  ]);
});

it("quita una imagen pendiente sin enviarla", async () => {
  montar();
  fireEvent.click(screen.getByRole("button", { name: "Adjuntar imagen" }));
  fireEvent.click(screen.getByRole("button", { name: "Entendido, adjuntar" }));
  fireEvent.change(screen.getByLabelText("Adjuntar imagen", { selector: "input" }), {
    target: { files: [archivo()] },
  });

  expect(await screen.findByAltText("Imagen adjunta 1 de 1")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Quitar imagen 1" }));

  await waitFor(() => expect(screen.queryByAltText("Imagen adjunta 1 de 1")).toBeNull());
  expect(h.eliminar).toHaveBeenCalledWith("c-1", "a-1");
  expect(h.send).not.toHaveBeenCalled();
});
