import { test, expect } from "@playwright/test";

// Flujo A: home renderiza banner + grid (SPEC-05/06)
test("home muestra hero y destacados", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ENCUENTRA TU")).toBeVisible();
  await expect(page.getByText("PRODUCTOS EN OFERTA")).toBeVisible();
});
