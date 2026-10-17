import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { renderChatText } from "@/adapters/inbound/components/MessageBubble";

/*
 * Regresión: salidas de referencia capturadas con la implementación original de
 * renderChatText. Se comparan sin los <span> envolventes, que no afectan lo que se ve.
 */
const sinSpans = (html: string) => html.replace(/<\/?span>/g, "");
const html = (texto: string, dark: boolean) =>
  sinSpans(renderToStaticMarkup(createElement("div", null, renderChatText(texto, dark))));

const CASOS: [string, string, string][] = [
  ["Tu pedido #A-1043 está en camino", "<div>Tu pedido <strong class=\"font-bold text-text-primary\">#A-1043</strong> está en camino</div>", "<div>Tu pedido <strong class=\"font-bold text-text-inverse\">#A-1043</strong> está en camino</div>"],
  ["#A-0312 y #B-9999", "<div><strong class=\"font-bold text-text-primary\">#A-0312</strong> y <strong class=\"font-bold text-text-primary\">#B-9999</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">#A-0312</strong> y <strong class=\"font-bold text-text-inverse\">#B-9999</strong></div>"],
  ["Reembolso REC-2026-0042 listo", "<div>Reembolso <strong class=\"font-bold text-text-primary\">REC-2026-0042</strong> listo</div>", "<div>Reembolso <strong class=\"font-bold text-text-inverse\">REC-2026-0042</strong> listo</div>"],
  ["rec-2026-0042", "<div>rec-2026-0042</div>", "<div>rec-2026-0042</div>"],
  ["Devolución #DEV-2026-00017 y DEV-2026-00017", "<div>Devolución <strong class=\"font-bold text-text-primary\">#DEV-2026-00017</strong> y <strong class=\"font-bold text-text-primary\">DEV-2026-00017</strong></div>", "<div>Devolución <strong class=\"font-bold text-text-inverse\">#DEV-2026-00017</strong> y <strong class=\"font-bold text-text-inverse\">DEV-2026-00017</strong></div>"],
  ["Reclamo R-0312 abierto", "<div>Reclamo <strong class=\"font-bold text-text-primary\">R-0312</strong> abierto</div>", "<div>Reclamo <strong class=\"font-bold text-text-inverse\">R-0312</strong> abierto</div>"],
  ["#R-0312", "<div><strong class=\"font-bold text-text-primary\">#R-0312</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">#R-0312</strong></div>"],
  ["Running -20% hasta 30 sep", "<div><strong class=\"font-bold text-text-primary\">Running -20% hasta 30 sep</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">Running -20% hasta 30 sep</strong></div>"],
  ["running  -20%", "<div><strong class=\"font-bold text-text-primary\">running  -20%</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">running  -20%</strong></div>"],
  ["urbano 2x1", "<div><strong class=\"font-bold text-text-primary\">urbano 2x1</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">urbano 2x1</strong></div>"],
  ["Urbano 2×1 hasta 28 sep", "<div><strong class=\"font-bold text-text-primary\">Urbano 2×1 hasta 28 sep</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">Urbano 2×1 hasta 28 sep</strong></div>"],
  ["URBANO 2X1 HASTA 28 SEP", "<div><strong class=\"font-bold text-text-primary\">URBANO 2X1 HASTA 28 SEP</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">URBANO 2X1 HASTA 28 SEP</strong></div>"],
  ["#A-1043 Running -20% hasta 30 sep y Urbano 2x1", "<div><strong class=\"font-bold text-text-primary\">#A-1043</strong> <strong class=\"font-bold text-text-primary\">Running -20% hasta 30 sep</strong> y <strong class=\"font-bold text-text-primary\">Urbano 2x1</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">#A-1043</strong> <strong class=\"font-bold text-text-inverse\">Running -20% hasta 30 sep</strong> y <strong class=\"font-bold text-text-inverse\">Urbano 2x1</strong></div>"],
  ["#A-1043#A-0312", "<div><strong class=\"font-bold text-text-primary\">#A-1043</strong><strong class=\"font-bold text-text-primary\">#A-0312</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">#A-1043</strong><strong class=\"font-bold text-text-inverse\">#A-0312</strong></div>"],
  ["Sin coincidencias aquí", "<div>Sin coincidencias aquí</div>", "<div>Sin coincidencias aquí</div>"],
  ["<b>hola</b> #A-1043<script>alert(1)</script>", "<div>hola <strong class=\"font-bold text-text-primary\">#A-1043</strong></div>", "<div>hola <strong class=\"font-bold text-text-inverse\">#A-1043</strong></div>"],
  ["Running -20%Urbano 2x1", "<div><strong class=\"font-bold text-text-primary\">Running -20%</strong><strong class=\"font-bold text-text-primary\">Urbano 2x1</strong></div>", "<div><strong class=\"font-bold text-text-inverse\">Running -20%</strong><strong class=\"font-bold text-text-inverse\">Urbano 2x1</strong></div>"],
  ["", "<div></div>", "<div></div>"],
  ["a\nb #A-1043", "<div>a\nb <strong class=\"font-bold text-text-primary\">#A-1043</strong></div>", "<div>a\nb <strong class=\"font-bold text-text-inverse\">#A-1043</strong></div>"],
];

describe("renderChatText (paridad con la implementación original)", () => {
  it.each(CASOS)("mantiene el marcado de %j", (texto, claro, oscuro) => {
    expect(html(texto, false)).toBe(claro);
    expect(html(texto, true)).toBe(oscuro);
  });

  it("el valor por defecto de dark es falso", () => {
    const out = sinSpans(renderToStaticMarkup(createElement("div", null, renderChatText("#A-1043"))));
    expect(out).toContain("text-text-primary");
  });
});
