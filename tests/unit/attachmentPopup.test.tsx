// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AttachmentPopup } from "@/adapters/inbound/components/AttachmentPopup";

const onClose = vi.fn();
const onSend = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:foto"),
  });
});

afterEach(cleanup);

describe("AttachmentPopup", () => {
  it("ofrece galería y cámara, y no deja enviar sin imagen", () => {
    render(<AttachmentPopup onClose={onClose} onSend={onSend} />);

    expect(screen.getByRole("button", { name: /GALER/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /TOMAR FOTO/ })).toBeDefined();
    expect((screen.getByRole("button", { name: "ENVIAR FOTO" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("previsualiza la imagen elegida y la envía", () => {
    render(<AttachmentPopup onClose={onClose} onSend={onSend} />);
    const archivo = new File(["x"], "zapatilla.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText(/Elegir imagen de galer/), { target: { files: [archivo] } });
    expect(screen.getByAltText("zapatilla.png")).toBeDefined();
    expect(screen.getByText(/JPG\/PNG\/WEBP/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "ENVIAR FOTO" }));
    expect(onSend).toHaveBeenCalledWith("zapatilla.png");
  });

  it("también acepta una foto de cámara", () => {
    render(<AttachmentPopup onClose={onClose} onSend={onSend} />);
    const archivo = new File(["x"], "camara.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText("Tomar foto"), { target: { files: [archivo] } });
    expect(screen.getByAltText("camara.jpg")).toBeDefined();
  });

  it("permite quitar la vista previa y volver a elegir", () => {
    render(<AttachmentPopup onClose={onClose} onSend={onSend} />);
    const archivo = new File(["x"], "zapatilla.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText(/Elegir imagen de galer/), { target: { files: [archivo] } });
    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));

    expect(screen.queryByAltText("zapatilla.png")).toBeNull();
    expect(screen.getByRole("button", { name: /GALER/ })).toBeDefined();
  });

  it("cierra con el botón del popup", () => {
    render(<AttachmentPopup onClose={onClose} onSend={onSend} />);
    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
