import { afterAll, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * El checker se prueba contra una copia real del repo dentro de `node_modules`
 * (así Node resuelve `typescript` y eslint/tsc no escanean la copia). Cada caso
 * muta un archivo y exige que el proceso salga con error y explique la regla.
 */

// Cada caso copia el repo y arranca un proceso: con la suite completa en
// paralelo, 5 s (el default) no alcanzan.
vi.setConfig({ testTimeout: 30_000 });

const repoRoot = process.cwd();
const temporales: string[] = [];
const openapiReal = path.resolve(repoRoot, "../G3-Chatbot-backend/docs/openapi.json");
const hayBackend = fs.existsSync(openapiReal);

function copiarRepo(): string {
  const dir = fs.mkdtempSync(path.join(repoRoot, "node_modules/.tmp-check-modules-"));
  temporales.push(dir);
  for (const entry of ["scripts", "src", "modules.manifest.json"]) {
    fs.cpSync(path.join(repoRoot, entry), path.join(dir, entry), { recursive: true });
  }
  return dir;
}

function ejecutar(dir: string, env: Record<string, string> = {}) {
  const r = spawnSync(process.execPath, ["scripts/check-modules.mjs"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { status: r.status, salida: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}

type Openapi = { paths: Record<string, Record<string, { tags?: string[] }>> };

function copiarOpenapi(dir: string, mutar: (o: Openapi) => void): string {
  const openapi = JSON.parse(fs.readFileSync(openapiReal, "utf8")) as Openapi;
  mutar(openapi);
  const destino = path.join(dir, "openapi-test.json");
  fs.writeFileSync(destino, JSON.stringify(openapi));
  return destino;
}

function escribir(dir: string, rel: string, contenido: string) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), contenido);
}

afterAll(() => {
  for (const dir of temporales) fs.rmSync(dir, { recursive: true, force: true });
});

describe("check-modules.mjs", () => {
  it("acepta la estructura modular actual", () => {
    const r = ejecutar(copiarRepo());
    expect(r.salida).toContain("OK: 8 módulos");
    expect(r.status).toBe(0);
  });

  it("falla si un módulo no tiene carpeta ui", () => {
    const dir = copiarRepo();
    fs.rmSync(path.join(dir, "src/modules/mod-shipping/ui"), { recursive: true, force: true });
    const r = ejecutar(dir);
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("mod-shipping: falta ui");
  });

  it("falla si un módulo usa container.api", () => {
    const dir = copiarRepo();
    escribir(dir, "src/modules/mod-catalog/ui/_violacion.ts", "export const fuga = container.api;\n");
    const r = ejecutar(dir);
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("usa container.api dentro de mod-catalog");
  });

  it("falla con import() cuyo argumento no es un string literal", () => {
    const dir = copiarRepo();
    escribir(
      dir,
      "src/modules/mod-cart/ui/_violacion.ts",
      "export const cargar = (ruta: string) => import(ruta);\n"
    );
    const r = ejecutar(dir);
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("import() dinámico no permitido");
  });

  it("acepta import() con string literal", () => {
    const dir = copiarRepo();
    escribir(
      dir,
      "src/modules/mod-cart/ui/_permitido.ts",
      'export const cargar = () => import("@/modules/mod-cart/public");\n'
    );
    const r = ejecutar(dir);
    expect(r.status).toBe(0);
  });

  it("solo permite el import profundo de container.ts por la excepción del JSON", () => {
    const dir = copiarRepo();
    const exceptions = path.join(dir, "scripts/module-boundaries.exceptions.json");
    const json = JSON.parse(fs.readFileSync(exceptions, "utf8"));
    json.sharedPrivateImports = [];
    fs.writeFileSync(exceptions, JSON.stringify(json, null, 2));

    const r = ejecutar(dir);
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("src/shared/di/container.ts: shared/app importa mod-auth por dentro");
  });

  it.skipIf(!hayBackend)("valida el contrato real: paths y tag del módulo", () => {
    const r = ejecutar(copiarRepo(), { OPENAPI_PATH: openapiReal });
    expect(r.status).toBe(0);
    expect(r.salida).toContain("OK: 8 módulos");
    expect(r.salida).toContain("etiquetado [mod-postventa]");
  });

  it.skipIf(!hayBackend)("falla si un endpoint del manifiesto no está en el openapi", () => {
    const dir = copiarRepo();
    const openapi = copiarOpenapi(dir, (o) => {
      delete o.paths["/api/v1/carrito"];
    });
    const r = ejecutar(dir, { OPENAPI_PATH: openapi });
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("mod-cart: /carrito no existe en openapi-test.json");
  });

  it.skipIf(!hayBackend)("falla si el tag del openapi no coincide con el id del módulo", () => {
    const dir = copiarRepo();
    const openapi = copiarOpenapi(dir, (o) => {
      for (const operacion of Object.values(o.paths["/api/v1/carrito"])) {
        operacion.tags = ["mod-catalog"];
      }
    });
    const r = ejecutar(dir, { OPENAPI_PATH: openapi });
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("mod-cart: /carrito tiene tag [mod-catalog] y no mod-cart");
  });

  it.skipIf(!hayBackend)("falla si el OTP de celular desaparece del openapi", () => {
    const dir = copiarRepo();
    const exceptions = path.join(dir, "scripts/module-boundaries.exceptions.json");
    const json = JSON.parse(fs.readFileSync(exceptions, "utf8"));
    json.contractPending = json.contractPending.filter(
      (e: { path: string }) => e.path !== "/contacto/celular/verificar-otp"
    );
    fs.writeFileSync(exceptions, JSON.stringify(json, null, 2));
    const openapi = copiarOpenapi(dir, (o) => {
      delete o.paths["/api/v1/contacto/celular/verificar-otp"];
    });

    const r = ejecutar(dir, { OPENAPI_PATH: openapi });
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("mod-auth: /contacto/celular/verificar-otp no existe");
  });

  it.skipIf(!hayBackend)("falla si una allowlist de contrato está vencida", () => {
    const dir = copiarRepo();
    const exceptions = path.join(dir, "scripts/module-boundaries.exceptions.json");
    const json = JSON.parse(fs.readFileSync(exceptions, "utf8"));
    // La allowlist del repo puede estar vacía: el caso crea su propia entrada vencida.
    json.contractPending = [
      {
        module: "mod-cart",
        path: "/carrito",
        todo: "TODO: fixture de prueba",
        reviewBy: "2020-01-01",
      },
    ];
    fs.writeFileSync(exceptions, JSON.stringify(json, null, 2));

    const r = ejecutar(dir, { OPENAPI_PATH: openapiReal });
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("allowlist de contrato vencida");
  });

  it("falla si OPENAPI_PATH no existe", () => {
    const dir = copiarRepo();
    const r = ejecutar(dir, { OPENAPI_PATH: path.join(dir, "no-existe.json") });
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("OPENAPI_PATH no existe");
  });

  it("falla si un módulo declara un dependsOn que no existe", () => {
    const dir = copiarRepo();
    const manifestPath = path.join(dir, "modules.manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.modules.find((m: { id: string }) => m.id === "mod-cart").dependsOn = ["mod-fantasma"];
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    const moduleManifest = path.join(dir, "src/modules/mod-cart/module.manifest.ts");
    fs.writeFileSync(
      moduleManifest,
      fs.readFileSync(moduleManifest, "utf8").replace('["mod-catalog"]', '["mod-fantasma"]')
    );

    const r = ejecutar(dir);
    expect(r.status).not.toBe(0);
    expect(r.salida).toContain("dependsOn apunta a mod-fantasma inexistente");
  });
});
