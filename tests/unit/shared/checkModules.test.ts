import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * El checker se prueba contra una copia real del repo dentro de `node_modules`
 * (así Node resuelve `typescript` y eslint/tsc no escanean la copia). Cada caso
 * muta un archivo y exige que el proceso salga con error y explique la regla.
 */

const repoRoot = process.cwd();
const temporales: string[] = [];

function copiarRepo(): string {
  const dir = fs.mkdtempSync(path.join(repoRoot, "node_modules/.tmp-check-modules-"));
  temporales.push(dir);
  for (const entry of ["scripts", "src", "modules.manifest.json"]) {
    fs.cpSync(path.join(repoRoot, entry), path.join(dir, entry), { recursive: true });
  }
  return dir;
}

function ejecutar(dir: string) {
  const r = spawnSync(process.execPath, ["scripts/check-modules.mjs"], {
    cwd: dir,
    encoding: "utf8",
  });
  return { status: r.status, salida: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
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
