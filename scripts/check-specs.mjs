#!/usr/bin/env node
/**
 * Gate de specs: un PR que toca modulos debe enlazar la spec que gobierna el cambio.
 *
 * Uso (CI):
 *   node scripts/check-specs.mjs --base origin/development \
 *     --specs-repo specs-repo --body pr-body.md
 *
 * Reglas:
 * - Si el diff no toca `src/modules/mod-*`, el gate pasa.
 * - Cada modulo tocado debe declarar `specs` en `modules.manifest.json`.
 * - La descripcion del PR debe incluir `openspec/specs/<capability>` de ese modulo.
 * - La spec enlazada debe existir en el checkout del repo de specs.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "modules.manifest.json");
const moduleRe = /^src\/modules\/(mod-[a-z-]+)\//;

function readArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || !process.argv[index + 1]) {
    console.error(`Falta --${name}`);
    process.exit(2);
  }
  return process.argv[index + 1];
}

const base = readArg("base");
const specsRepo = readArg("specs-repo");
const body = readFileSync(readArg("body"), "utf8");

const changed = execSync(`git diff --name-only ${base}...HEAD`, { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const modules = new Set(
  changed.map((file) => moduleRe.exec(file)?.[1]).filter((id) => Boolean(id)),
);
if (modules.size === 0) {
  console.log("OK: el PR no toca src/modules/mod-*");
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const byId = new Map(manifest.modules.map((module) => [module.id, module]));
const errors = [];

for (const moduleId of [...modules].sort()) {
  const declared = byId.get(moduleId)?.specs ?? [];
  if (declared.length === 0) {
    errors.push(`${moduleId}: no declara specs en modules.manifest.json`);
    continue;
  }
  const linked = declared.filter((spec) => body.includes(`openspec/specs/${spec}`));
  if (linked.length === 0) {
    errors.push(`${moduleId}: el PR no enlaza ninguna de sus specs (${declared.join(", ")})`);
    continue;
  }
  for (const spec of linked) {
    const specFile = path.join(specsRepo, "openspec", "specs", spec, "spec.md");
    if (!existsSync(specFile)) {
      errors.push(`${moduleId}: la spec enlazada no existe: ${specFile}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Gate de specs: FALLO");
  for (const error of errors) console.error(` - ${error}`);
  console.error("Añade en la descripción del PR: `Spec: openspec/specs/<capability>`");
  process.exit(1);
}
console.log(`OK: specs enlazadas y existentes para ${[...modules].sort().join(", ")}`);
