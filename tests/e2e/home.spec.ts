import { test, expect } from "@playwright/test";

// Flujo A: home renderiza banner + grid (SPEC-05/06)
test("home muestra hero y destacados", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ENCUENTRA TU")).toBeVisible();
  await expect(page.getByText("PRODUCTOS EN OFERTA")).toBeVisible();
});

test("el campo de mensaje permanece dentro de la pantalla principal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const marco = await page.locator(".wf-phone").boundingBox();
  const campo = await page.getByLabel("Mensaje").boundingBox();
  expect(marco).not.toBeNull();
  expect(campo).not.toBeNull();
  expect(campo!.y).toBeGreaterThanOrEqual(marco!.y);
  expect(campo!.y + campo!.height).toBeLessThanOrEqual(marco!.y + marco!.height);

  await page.getByText("PRODUCTOS EN OFERTA").evaluate((heading) => {
    heading.closest(".overflow-y-auto")?.scrollTo(0, 500);
  });
  await expect(page.getByLabel("Mensaje")).toBeVisible();
});

test("el ojo permite mostrar y ocultar las contraseñas del modal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "INICIAR SESIÓN" }).first().click();

  const acceso = page.getByLabel("Contraseña", { exact: true });
  await expect(acceso).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(acceso).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña" }).click();
  await expect(acceso).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "CREAR CUENTA" }).click();
  const confirmacion = page.getByLabel("Confirmar contraseña", { exact: true });
  await page.getByRole("button", { name: "Mostrar confirmación de contraseña" }).click();
  await expect(confirmacion).toHaveAttribute("type", "text");
});
