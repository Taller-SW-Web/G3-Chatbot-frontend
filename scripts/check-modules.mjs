import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  readCentralManifest,
  readModuleManifests,
  renderRegistry,
  registryPath,
  root,
} from "./sync-modules.mjs";

const modulesDir = path.join(root, "src/modules");
const exceptionsPath = path.join(root, "scripts/module-boundaries.exceptions.json");
const exceptionsRaw = fs.existsSync(exceptionsPath)
  ? JSON.parse(fs.readFileSync(exceptionsPath, "utf8"))
  : {};
// Formato v1 (array) → v2 (objeto con moduleEdges + sharedPrivateImports).
const exceptions = Array.isArray(exceptionsRaw)
  ? { moduleEdges: exceptionsRaw, sharedPrivateImports: [] }
  : exceptionsRaw;
const allowed = new Set((exceptions.moduleEdges ?? []).map((e) => `${e.from}->${e.to}`));
const sharedPrivateImportFiles = new Set(
  (exceptions.sharedPrivateImports ?? []).map((e) => e.file)
);

const errors = [];
const warnings = new Set();
const fail = (msg) => errors.push(msg);

const central = readCentralManifest();
const ids = central.modules.map((m) => m.id);
const idsJson = JSON.parse(fs.readFileSync(path.join(root, "modules.manifest.json"), "utf8")).modules
  .map((m) => m.id)
  .sort();

// 1) Paridad de ids entre modules.manifest.json y carpetas.
const dirs = fs
  .readdirSync(modulesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name.startsWith("mod-"))
  .map((e) => e.name)
  .sort();
if (JSON.stringify(dirs) !== JSON.stringify(idsJson)) {
  fail(`ids desparejos: manifiesto=[${idsJson.join(", ")}] carpetas=[${dirs.join(", ")}]`);
}

// 2) Estructura y manifiestos por módulo.
const manifests = [];
for (const id of ids) {
  const dir = path.join(modulesDir, id);
  if (!fs.existsSync(dir)) {
    fail(`${id}: falta la carpeta`);
    continue;
  }
  for (const required of ["MODULE.md", "module.manifest.ts", "public.ts", "ui", "ports", "adapters"]) {
    if (!fs.existsSync(path.join(dir, required))) fail(`${id}: falta ${required}`);
  }
  const ports = fs.existsSync(path.join(dir, "ports"))
    ? fs.readdirSync(path.join(dir, "ports")).filter((f) => f.endsWith(".ts"))
    : [];
  const adapters = fs.existsSync(path.join(dir, "adapters"))
    ? fs.readdirSync(path.join(dir, "adapters")).filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
    : [];
  if (!ports.some((f) => /Port\.ts$/.test(f))) fail(`${id}: ningún *Port.ts en ports/`);
  if (adapters.length === 0) fail(`${id}: ningún adapter en adapters/`);

  const modFile = path.join(dir, "module.manifest.ts");
  if (!fs.existsSync(modFile)) continue;
  const manifest = readModuleManifests().find((m) => m.id === id);
  manifests.push(manifest);
  const centralEntry = central.modules.find((m) => m.id === id);
  if (!centralEntry) continue;
  if (manifest.name !== centralEntry.name) fail(`${id}: name no coincide con modules.manifest.json`);
  if (manifest.owner !== centralEntry.owner) fail(`${id}: owner no coincide con modules.manifest.json`);
  const centralDeps = JSON.stringify(centralEntry.dependsOn ?? []);
  if (JSON.stringify(manifest.dependsOn ?? []) !== centralDeps) {
    fail(`${id}: dependsOn no coincide con modules.manifest.json`);
  }
  for (const dep of manifest.dependsOn ?? []) {
    if (!ids.includes(dep)) fail(`${id}: dependsOn apunta a ${dep} inexistente`);
  }
}

// 3) Registry al día.
if (fs.existsSync(registryPath)) {
  const current = fs.readFileSync(registryPath, "utf8").replace(/\r\n/g, "\n").trim();
  const expected = renderRegistry(manifests).replace(/\r\n/g, "\n").trim();
  if (current !== expected) {
    fail("registry.generated.ts está desactualizado: ejecuta pnpm modules:sync");
  }
} else {
  fail("falta src/modules/registry.generated.ts");
}

// 4) Fronteras de importación.
const manifestsById = new Map(manifests.map((m) => [m.id, m]));
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(p.replace(/\\/g, "/"));
  }
  return acc;
}

function resolveSpec(file, spec) {
  if (spec.startsWith(".")) {
    const base = path.posix.dirname(file);
    return path.posix.normalize(path.posix.join(base, spec));
  }
  if (spec.startsWith("@/")) return "src/" + spec.slice(2);
  return null;
}

function isTypeOnly(node) {
  return node.importClause?.isTypeOnly === true ||
    (node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings) &&
      node.importClause.namedBindings.elements.length > 0 &&
      node.importClause.namedBindings.elements.every((e) => e.isTypeOnly));
}

function scanSource(file) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const imports = [];
  const containerKeys = [];
  const dynamicImports = [];
  const add = (spec, typeOnly = false) => { if (spec) imports.push({ spec, typeOnly }); };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, isTypeOnly(node));
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier.text, node.isTypeOnly);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
        add(node.arguments[0].text);
      } else {
        dynamicImports.push(node.arguments.map((a) => a.getText(source)).join(", "));
      }
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "container"
    ) {
      containerKeys.push(node.name.text);
    } else if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "container" &&
      node.argumentExpression &&
      ts.isStringLiteral(node.argumentExpression)
    ) {
      containerKeys.push(node.argumentExpression.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { imports, containerKeys, dynamicImports };
}

/** Alias de `container` → módulo dueño del adapter (evita llamadas cruzadas encubiertas). */
const CONTAINER_KEY_MODULE = {
  auth: "mod-auth",
  catalogo: "mod-catalog",
  carrito: "mod-cart",
  envio: "mod-shipping",
  checkout: "mod-checkout",
  pedidos: "mod-orders",
  postventa: "mod-postventa",
  chat: "mod-chat",
  stream: "mod-chat",
};

const sourceFiles = walk(path.join(root, "src"));
const STRANGLER = ["adapters", "application", "domain", "ports", "infrastructure"];
for (const dir of STRANGLER) {
  if (fs.existsSync(path.join(root, "src", dir))) {
    fail(`queda el directorio legacy src/${dir}/ tras la modularización`);
  }
}

for (const file of sourceFiles) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const moduleMatch = rel.match(/^src\/modules\/(mod-[a-z-]+)\//);
  const own = moduleMatch?.[1];
  const privateImportAllowed = sharedPrivateImportFiles.has(rel);
  const scanned = scanSource(file);

  if (scanned.dynamicImports.length) {
    fail(`${rel}: import() dinámico no permitido (usa un string literal): ${scanned.dynamicImports.join(" | ")}`);
  }

  // El agregado `container.api` no deja rastro estático de qué módulo se llama:
  // dentro de un módulo se usa `container.<alias>` propio o el port público.
  if (own) {
    if (scanned.containerKeys.includes("api")) {
      fail(`${rel}: usa container.api dentro de ${own}; usa container.<alias> o el port de public.ts`);
    }
    for (const key of new Set(scanned.containerKeys)) {
      const targetModule = CONTAINER_KEY_MODULE[key];
      if (!targetModule || targetModule === own) continue;
      const declared = (manifestsById.get(own)?.dependsOn ?? []).includes(targetModule);
      const key2 = `${own}->${targetModule}`;
      if (declared) continue;
      if (allowed.has(key2)) {
        warnings.add(`${rel}: container.${key} → ${targetModule} (excepción documentada)`);
      } else {
        fail(`${rel}: container.${key} llama a ${targetModule} sin declararlo en dependsOn`);
      }
    }
  }

  for (const { spec } of scanned.imports) {
    const target = resolveSpec(file, spec);
    if (!target || !target.startsWith("src/")) continue;

    const targetModule = target.match(/^src\/modules\/(mod-[a-z-]+)\//)?.[1];

    if (own) {
      if (!targetModule) {
        if (!target.startsWith("src/shared/") && !target.startsWith(`src/modules/${own}/`)) {
          fail(`${rel}: import fuera de shared/ y del propio módulo (${spec})`);
        }
        continue;
      }
      if (targetModule === own) continue;

      const publicPath = `src/modules/${targetModule}/public`;
      const normalized = target.replace(/\.(ts|tsx)$/, "");
      if (normalized !== publicPath) {
        fail(`${rel}: import profundo a ${targetModule} (${spec}); usa ${publicPath}`);
        continue;
      }
      const dep = manifestsById.get(own);
      if (!(dep.dependsOn ?? []).includes(targetModule)) {
        const key = `${own}->${targetModule}`;
        if (allowed.has(key)) {
          warnings.add(`${rel}: ${key} (excepción documentada)`);
        } else {
          fail(`${rel}: ${own} importa ${targetModule} sin declararlo en dependsOn`);
        }
      }
    } else if (targetModule) {
      // shared/ y app/ pueden componer módulos, pero solo por su public.ts.
      const isPublic = target.replace(/\.(ts|tsx)$/, "") === `src/modules/${targetModule}/public`;
      if (!isPublic && !privateImportAllowed) {
        fail(`${rel}: shared/app importa ${targetModule} por dentro (${spec}); usa public.ts`);
      }
    }
  }
}

// 5) Reporte.
if (warnings.size) {
  console.warn(`Avisos (${warnings.size}):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}
if (errors.length) {
  console.error(`Fronteras de módulos: ${errors.length} error(es)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `OK: ${ids.length} módulos, registry al día, estructura y fronteras válidas ` +
    `(${warnings.size} excepción(es) documentada(s)).`
);
