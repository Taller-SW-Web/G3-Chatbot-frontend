// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MessageAttachments } from "@/modules/mod-chat/ui/MessageAttachments";

const h = vi.hoisted(() => ({ obtener: vi.fn() }));
vi.mock("@/shared/di/container", () => ({
  container: { chat: { obtenerUrlAdjunto: h.obtener } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.obtener.mockResolvedValue({
    urlMiniatura: "https://firmada/nueva-mini",
    urlImagen: "https://firmada/nueva",
  });
});
afterEach(cleanup);

describe("MessageAttachments (SPEC-23 Req. 7)", () => {
  it("muestra la miniatura local y la amplía en un visor", () => {
    render(
      <MessageAttachments
        adjuntos={[
          {
            adjuntoId: "a-1",
            mimeType: "image/png",
            urlLocal: "blob:local-1",
            urlImagen: "blob:local-1-grande",
          },
        ]}
      />
    );

    expect(screen.getByAltText("Imagen adjunta 1 de 1")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Ampliar Imagen adjunta 1 de 1" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar imagen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("pide una URL nueva cuando la firmada falla y reintenta una vez", async () => {
    render(
      <MessageAttachments
        adjuntos={[
          {
            adjuntoId: "a-2",
            mimeType: "image/png",
            urlMiniatura: "https://firmada/vencida",
          },
        ]}
      />
    );

    fireEvent.error(screen.getByAltText("Imagen adjunta 1 de 1"));

    await waitFor(() => expect(h.obtener).toHaveBeenCalledWith("a-2"));
    await waitFor(() =>
      expect(screen.getByAltText("Imagen adjunta 1 de 1").getAttribute("src")).toBe(
        "https://firmada/nueva-mini"
      )
    );
  });

  it("muestra 'Imagen no disponible' si el adjunto no tiene URL ni se puede emitir", async () => {
    h.obtener.mockRejectedValue(new Error("sin red"));
    render(
      <MessageAttachments adjuntos={[{ adjuntoId: "a-3", mimeType: "image/png" }]} />
    );

    expect(await screen.findByText("Imagen no disponible")).toBeDefined();
  });
});
