import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MessageBubble } from "@/adapters/inbound/components/MessageBubble";
import type { Bloque } from "@/domain/entities/Bloque";

describe("bloques del chat de H3-11", () => {
  it("renderiza acciones rápidas del contrato y habilita el botón con callback", () => {
    const bloque: Bloque = {
      id: "acciones-1",
      tipo: "ACCIONES_RAPIDAS",
      pregunta: "¿Qué necesitas?",
      acciones: [{ id: "VER_CARRITO", etiqueta: "Ver carrito" }],
    };
    const html = renderToStaticMarkup(
      createElement(MessageBubble, {
        rol: "bot",
        texto: "Elige una opción.",
        bloques: [bloque],
        onQuickAction: () => undefined,
      })
    );

    expect(html).toContain('data-testid="acciones-rapidas"');
    expect(html).toContain("¿Qué necesitas?");
    expect(html).toContain("Ver carrito");
    const button = html.match(/<button[^>]*>/)?.[0] ?? "";
    expect(button).not.toMatch(/\sdisabled(?:=""|(?=[\s>]))/);
  });

  it("renderiza errores con código y detalle saneado, sin botón de reintento ficticio", () => {
    const bloque: Bloque = {
      id: "error-1",
      tipo: "ERROR",
      code: "STOCK_INSUFICIENTE",
      mensaje: "<script>alert(1)</script>No hay stock suficiente.",
    };
    const html = renderToStaticMarkup(
      createElement(MessageBubble, {
        rol: "bot",
        texto: "",
        bloques: [bloque],
      })
    );

    expect(html).toContain('data-testid="bloque-error"');
    expect(html).toContain('data-code="STOCK_INSUFICIENTE"');
    expect(html).toContain("No hay stock suficiente para esa cantidad.");
    expect(html).not.toContain("Stock insuficiente · STOCK_INSUFICIENTE");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("REINTENTAR");
  });

  it("presenta el aviso de modo degradado como estado accesible", () => {
    const html = renderToStaticMarkup(
      createElement(MessageBubble, {
        rol: "bot",
        texto: "Estoy teniendo problemas para entenderte.",
        degradado: true,
        motivoDegradado: "llm_no_disponible",
      })
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('data-testid="aviso-degradado"');
    expect(html).toContain("El asistente no está disponible temporalmente.");
  });
});
