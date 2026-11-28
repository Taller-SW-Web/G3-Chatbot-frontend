import { test, expect } from "@playwright/test";

// SPEC-23 Req. 1 (frontend#189): source sheet "Galería" / "Tomar foto" on a phone, backend-less fixtures.
const conversationId = "33333333-3333-4333-8333-333333333333";
const emptyCart = { lineas: [], subtotal: 0, descuentos: [], costoEnvio: null, total: 0, avisos: [] };

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("fixture adjuntar imagen en móvil ofrece Galería y Tomar foto con cámara trasera", async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path.endsWith("/carrito") ? emptyCart : [] });
  });
  await page.addInitScript(() => window.localStorage.setItem("chat-adjunto-privacidad", "1"));
  await page.goto(`/chat/${conversationId}`);

  await page.getByRole("button", { name: "Adjuntar imagen" }).click();
  const hoja = page.getByRole("dialog", { name: "Agregar imagen" });
  await expect(hoja).toBeVisible();
  await expect(hoja.getByText("JPG, PNG o WEBP de hasta 5 MB")).toBeVisible();
  await expect(hoja.getByRole("button", { name: "Galería" })).toBeFocused();

  const camara = page.getByLabel("Tomar foto con la cámara");
  await expect(camara).toHaveAttribute("capture", "environment");
  const selector = page.waitForEvent("filechooser");
  await hoja.getByRole("button", { name: "Tomar foto" }).click();
  expect((await selector).isMultiple()).toBe(false);
  await expect(hoja).toBeHidden();

  await page.getByRole("button", { name: "Adjuntar imagen" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Agregar imagen" })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
