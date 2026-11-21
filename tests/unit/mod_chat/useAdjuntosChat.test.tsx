// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useAdjuntosChat } from "@/modules/mod-chat/application/useAdjuntosChat";
import { validarImagenAdjunta } from "@/modules/mod-chat/domain/utils/validarImagenAdjunta";

const h = vi.hoisted(() => ({
  subir: vi.fn(),
  eliminar: vi.fn(),
  obtener: vi.fn(),
}));

vi.mock("@/shared/di/container", () => ({
  container: {
    chat: {
      subirAdjunto: h.subir,
      eliminarAdjunto: h.eliminar,
      obtenerUrlAdjunto: h.obtener,
    },
  },
}));

function archivo(nombre = "foto.png", tipo = "image/png"): File {
  return new File([new Uint8Array(4)], nombre, { type: tipo, lastModified: Date.now() });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:adjunto"),
    revokeObjectURL: vi.fn(),
  });
  h.subir.mockResolvedValue({
    adjuntoId: "adj-1",
    mimeType: "image/png",
    ancho: 100,
    alto: 80,
    tamanioBytes: 1024,
  });
  h.eliminar.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("validarImagenAdjunta (SPEC-23 Req. 1)", () => {
  it("acepta JPG, PNG y WebP dentro del límite", () => {
    expect(validarImagenAdjunta(archivo("a.jpg", "image/jpeg"), 0)).toBeNull();
    expect(validarImagenAdjunta(archivo("a.webp", "image/webp"), 2)).toBeNull();
  });

  it("rechaza PDF, GIF, archivos de más de 5 MB y una cuarta imagen", () => {
    expect(validarImagenAdjunta(archivo("a.pdf", "application/pdf"), 0)).toContain("JPG, PNG o WebP");
    expect(validarImagenAdjunta(archivo("a.gif", "image/gif"), 0)).toContain("JPG, PNG o WebP");
    const grande = archivo("grande.png");
    Object.defineProperty(grande, "size", { value: 5 * 1024 * 1024 + 1 });
    expect(validarImagenAdjunta(grande, 0)).toContain("5 MB");
    expect(validarImagenAdjunta(archivo(), 3)).toContain("hasta 3 imágenes");
  });
});

describe("useAdjuntosChat (SPEC-23)", () => {
  it("sube la imagen y la deja lista con su adjuntoId", async () => {
    const { result } = renderHook(() => useAdjuntosChat("c1"));
    act(() => result.current.agregarArchivos([archivo()]));

    await waitFor(() => expect(result.current.pendientes[0]?.estado).toBe("LISTO"));
    expect(h.subir).toHaveBeenCalledWith("c1", expect.any(File), expect.any(Function));
    expect(result.current.pendientes[0].adjunto?.adjuntoId).toBe("adj-1");
    expect(result.current.puedeEnviarAdjuntos).toBe(true);
  });

  it("marca error y permite reintentar cuando falla la subida", async () => {
    h.subir.mockRejectedValueOnce({ response: { status: 503, data: { code: "SERVICIO_NO_DISPONIBLE" } } });
    const { result } = renderHook(() => useAdjuntosChat("c1"));
    act(() => result.current.agregarArchivos([archivo()]));

    await waitFor(() => expect(result.current.pendientes[0]?.estado).toBe("ERROR"));
    expect(result.current.pendientes[0].error).toContain("No pudimos subir la imagen");

    act(() => result.current.reintentar(result.current.pendientes[0].id));
    await waitFor(() => expect(result.current.pendientes[0]?.estado).toBe("LISTO"));
  });

  it("no sube el cuarto archivo y muestra el límite", () => {
    const { result } = renderHook(() => useAdjuntosChat("c1"));
    act(() => result.current.agregarArchivos([archivo("1.png"), archivo("2.png"), archivo("3.png"), archivo("4.png")]));

    expect(h.subir).toHaveBeenCalledTimes(3);
    expect(result.current.pendientes).toHaveLength(3);
    expect(result.current.error).toContain("hasta 3 imágenes");
  });

  it("quita el pendiente y borra el adjunto en el backend", async () => {
    const { result } = renderHook(() => useAdjuntosChat("c1"));
    act(() => result.current.agregarArchivos([archivo()]));
    await waitFor(() => expect(result.current.pendientes[0]?.estado).toBe("LISTO"));

    act(() => result.current.quitar(result.current.pendientes[0].id));
    expect(result.current.pendientes).toHaveLength(0);
    expect(h.eliminar).toHaveBeenCalledWith("c1", "adj-1");
  });
});
