import { test } from "@playwright/test";

// Visual-check hexagonal: home, chat, carrito, checkout, pedidos
const rutas = [
  ["/", "visual-home.png"],
  ["/carrito", "visual-carrito.png"],
  ["/checkout", "visual-checkout.png"],
  ["/pedidos", "visual-pedidos.png"],
] as const;

for (const [ruta, archivo] of rutas) {
  test(`visual ${ruta}`, async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 880 });
    await page.goto(ruta);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `docs/${archivo}` });
  });
}

const CONVERSACION_ID = "3f2b8c1e-6a4d-4e0b-9c57-1d8a2f4b7e90";

// Historial fijo con la forma exacta de GET /chat/conversaciones/{id}/mensajes.
const historial = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    conversacionId: CONVERSACION_ID,
    rol: "user",
    texto: "Busco zapatillas running talla 42",
    bloques: null,
    creadoEn: "2026-09-10T10:00:00Z",
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    conversacionId: CONVERSACION_ID,
    rol: "bot",
    texto: "¡Claro! Tengo **dos opciones** en talla 42. ¿Qué te gustaría hacer?",
    bloques: {
      blocks: [
        {
          id: "b1",
          tipo: "ACCIONES_RAPIDAS",
          pregunta: "¿Cómo seguimos?",
          acciones: [
            { id: "ver", etiqueta: "Ver opciones" },
            { id: "otra", etiqueta: "Buscar otra talla" },
          ],
        },
      ],
    },
    creadoEn: "2026-09-10T10:00:02Z",
  },
];

test("visual chat con historial simulado", async ({ page }) => {
  await page.route(`**/api/v1/chat/conversaciones/${CONVERSACION_ID}/mensajes`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(historial) })
  );
  await page.setViewportSize({ width: 430, height: 880 });
  await page.goto(`/chat/${CONVERSACION_ID}`);
  await page.getByText("Busco zapatillas running talla 42").waitFor();
  await page.getByText("dos opciones").waitFor();
  await page.getByText("Ver opciones").waitFor();
  // Las burbujas entran con una animación de opacidad: se completa antes de capturar.
  await page.screenshot({ path: "docs/visual-chat.png", animations: "disabled" });
});
