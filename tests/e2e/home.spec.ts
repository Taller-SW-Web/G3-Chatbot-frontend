import { test, expect } from "@playwright/test";

// Flujo A: home renderiza banner + grid (SPEC-05/06)
test("home muestra hero y destacados", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ENCUENTRA TU")).toBeVisible();
  await expect(page.getByText("PRODUCTOS EN OFERTA")).toBeVisible();
});

test("home banner keeps its content and scrolls the page on a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  await page.goto("/");
  const hero = page.getByRole("button", { name: "Ver ofertas Inka Athletics" });

  for (let slide = 1; slide <= 4; slide++) {
    await page.getByRole("button", { name: `Banner ${slide}` }).click();
    await expect(hero.getByText(`${slide} / 4`, { exact: true })).toBeVisible();
    const layout = await hero.evaluate((element) => {
      const pill = Array.from(element.querySelectorAll("span")).find((span) =>
        span.textContent?.trim() === "OFERTAS DE LA SEMANA"
      );
      const title = element.querySelector(".font-heading");
      const subtitle = Array.from(element.querySelectorAll("span")).find((span) =>
        span.textContent?.startsWith("Equípate para")
      );
      const cta = Array.from(element.querySelectorAll("span")).find((span) =>
        span.textContent?.startsWith("VER OFERTAS")
      );
      const scrollArea = element.parentElement;
      const bottom = element.getBoundingClientRect().bottom;
      return {
        contentFits: element.scrollHeight <= element.clientHeight,
        pillFits: !!pill && pill.getBoundingClientRect().bottom <= bottom,
        titleFits: !!title && title.getBoundingClientRect().bottom <= bottom,
        subtitleFits: !!subtitle && subtitle.getBoundingClientRect().bottom <= bottom,
        ctaFits: !!cta && cta.getBoundingClientRect().bottom <= bottom,
        pageScrolls: !!scrollArea && scrollArea.scrollHeight > scrollArea.clientHeight,
      };
    });
    expect(layout).toEqual({
      contentFits: true,
      pillFits: true,
      titleFits: true,
      subtitleFits: true,
      ctaFits: true,
      pageScrolls: true,
    });
  }
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
