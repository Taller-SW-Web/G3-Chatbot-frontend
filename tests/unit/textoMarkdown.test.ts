import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { TextoMarkdown } from "@/adapters/inbound/components/TextoMarkdown";

const html = (texto: string) => renderToStaticMarkup(createElement(TextoMarkdown, { texto }));

describe("TextoMarkdown", () => {
  it("convierte negrita en strong", () => {
    expect(html("hola **mundo**")).toContain("<strong");
  });

  it("convierte guiones en lista ul con li", () => {
    const out = html("- uno\n- dos");
    expect(out).toContain("<ul");
    expect(out.match(/<li/g)).toHaveLength(2);
  });

  it("convierte numeración en lista ol", () => {
    expect(html("1. uno\n2. dos")).toContain("<ol");
  });

  it("separa párrafos por línea en blanco", () => {
    expect(html("uno\n\ndos").match(/<p/g)).toHaveLength(2);
  });

  it("renderiza tablas GFM", () => {
    expect(html("| a | b |\n|---|---|\n| 1 | 2 |")).toContain("<table");
  });

  it("descarta script e img con HTML crudo", () => {
    const out = html("<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<img");
    expect(out).not.toContain("onerror");
  });

  it("no emite hrefs javascript:", () => {
    expect(html("[x](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("abre enlaces https en pestaña nueva con rel seguro", () => {
    const out = html("[sitio](https://example.com)");
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toMatch(/rel="[^"]*noopener/);
  });

  it("no renderiza imágenes Markdown", () => {
    expect(html("![alt](https://evil.example/p.png)")).not.toContain("<img");
  });

  it("deja el texto plano dentro de un párrafo", () => {
    expect(html("Hola, ¿en qué te ayudo?")).toContain("Hola, ¿en qué te ayudo?</p>");
  });

  it("no falla con cadena vacía", () => {
    expect(() => html("")).not.toThrow();
  });

  describe("resaltado de códigos y promociones", () => {
    const fuerte = (t: string) => new RegExp(`<strong[^>]*>${t}</strong>`);

    it("resalta un código de pedido en un párrafo", () => {
      expect(html("Tu pedido #A-1043 está en camino")).toMatch(fuerte("#A-1043"));
    });

    it("resalta una promoción en un párrafo", () => {
      expect(html("Hoy Running -20% hasta 30 sep en tienda")).toMatch(fuerte("Running -20% hasta 30 sep"));
    });

    it("no envuelve un código dentro de código en línea", () => {
      expect(html("Usa `#A-1043` aquí")).not.toContain("<strong");
    });

    it("no envuelve un código dentro de un bloque de código", () => {
      expect(html("```\n#A-1043\n```")).not.toContain("<strong");
    });

    it("no toca el texto ni la URL de un enlace", () => {
      const out = html("[ver #A-1043](https://example.com/#A-1043)");
      expect(out).not.toContain("<strong");
      expect(out).toContain('href="https://example.com/#A-1043"');
    });

    it("no anida strong cuando el código ya está en negrita", () => {
      const out = html("**#A-1043**");
      expect(out.match(/<strong/g)).toHaveLength(1);
      expect(out).not.toMatch(/<strong[^>]*>\s*<strong/);
    });

    it("resalta códigos en ítems de lista y celdas de tabla", () => {
      expect(html("- pedido #A-1043")).toMatch(fuerte("#A-1043"));
      expect(html("| a |\n|---|\n| #A-0312 |")).toMatch(fuerte("#A-0312"));
    });
  });
});
