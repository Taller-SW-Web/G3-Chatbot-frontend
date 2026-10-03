import { test } from "@playwright/test";

// Visual-check hexagonal: home, chat, carrito, checkout, pedidos
const rutas = [
  ["/", "visual-home.png"],
  ["/chat/talla-42", "visual-chat.png"],
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
