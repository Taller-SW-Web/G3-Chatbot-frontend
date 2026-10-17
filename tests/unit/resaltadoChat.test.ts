import { describe, it, expect } from "vitest";
import { dividirResaltado } from "@/adapters/inbound/components/resaltadoChat";

const resaltados = (texto: string) => dividirResaltado(texto).filter((s) => s.resaltado).map((s) => s.texto);

describe("dividirResaltado", () => {
  it.each(["#A-1043", "#A-0312", "REC-2026-0042", "#REC-2026-0042", "#DEV-2026-00017", "DEV-2026-00017", "R-0312", "#R-0312"])(
    "resalta el código %s",
    (codigo) => {
      expect(dividirResaltado(`Tu código ${codigo} listo`)).toEqual([
        { texto: "Tu código ", resaltado: false },
        { texto: codigo, resaltado: true },
        { texto: " listo", resaltado: false },
      ]);
    }
  );

  it.each([
    "Running -20% hasta 30 sep",
    "Running -20%",
    "urbano 2x1",
    "Urbano 2×1 hasta 28 sep",
    "URBANO 2X1 HASTA 28 SEP",
  ])("resalta la promoción %s sin duplicar fechas", (promo) => {
    expect(dividirResaltado(`Hay ${promo}.`)).toEqual([
      { texto: "Hay ", resaltado: false },
      { texto: promo, resaltado: true },
      { texto: ".", resaltado: false },
    ]);
  });

  it("los códigos distinguen mayúsculas", () => {
    expect(resaltados("rec-2026-0042")).toEqual([]);
  });

  it("separa códigos y promociones en el mismo texto", () => {
    expect(resaltados("#A-1043 con Running -20% hasta 30 sep")).toEqual(["#A-1043", "Running -20% hasta 30 sep"]);
  });

  it("maneja coincidencias adyacentes sin segmentos vacíos", () => {
    const segmentos = dividirResaltado("#A-1043#A-0312Running -20%");
    expect(segmentos).toEqual([
      { texto: "#A-1043", resaltado: true },
      { texto: "#A-0312", resaltado: true },
      { texto: "Running -20%", resaltado: true },
    ]);
    expect(segmentos.every((s) => s.texto !== "")).toBe(true);
  });

  it("sin coincidencias devuelve un único segmento no resaltado", () => {
    expect(dividirResaltado("Hola, ¿en qué te ayudo?")).toEqual([
      { texto: "Hola, ¿en qué te ayudo?", resaltado: false },
    ]);
  });

  it("cadena vacía devuelve lista vacía", () => {
    expect(dividirResaltado("")).toEqual([]);
  });
});
