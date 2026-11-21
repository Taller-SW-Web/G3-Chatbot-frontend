import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "modules.manifest.json");
const modulesDir = path.join(root, "src/modules");
const registryPath = path.join(modulesDir, "registry.generated.ts");

/** Convierte un literal TS simple (objeto/array/string/bool) a valor JS. */
function literalToValue(node) {
  if (!node) return undefined;
  if (ts.isSatisfiesExpression(node) || ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) {
    return literalToValue(node.expression);
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)
        ? prop.name.text
        : prop.name.getText();
      out[key] = literalToValue(prop.initializer);
    }
    return out;
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalToValue);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

/** Lee `export const manifest = {...}` de un module.manifest.ts sin ejecutarlo. */
export function readModuleManifest(file) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  let value;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "manifest" &&
      node.initializer
    ) {
      value = literalToValue(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!value) throw new Error(`No se encontró export const manifest en ${file}`);
  return value;
}

export function readCentralManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

export function readModuleManifests() {
  const central = readCentralManifest();
  return central.modules.map((entry) => {
    const file = path.join(modulesDir, entry.id, "module.manifest.ts");
    if (!fs.existsSync(file)) throw new Error(`Falta ${path.relative(root, file)}`);
    return readModuleManifest(file);
  });
}

export function renderRegistry(manifests) {
  const q = (v) => JSON.stringify(v);
  const body = manifests
    .map((m) => {
      const routes = m.routes
        .map((r) => `      { path: ${q(r.path)}, description: ${q(r.description)} },`)
        .join("\n");
      const nav = m.nav
        .map((n) => `      { href: ${q(n.href)}, label: ${q(n.label)} },`)
        .join("\n");
      const endpoints = m.endpoints.map((e) => `      ${q(e)},`).join("\n");
      const depends = m.dependsOn.map((d) => `      ${q(d)},`).join("\n");
      return `  {
    id: ${q(m.id)},
    name: ${q(m.name)},
    owner: ${q(m.owner)},
    routes: [
${routes}
    ],
    nav: [
${nav}
    ],
    endpoints: [
${endpoints}
    ],
    dependsOn: [
${depends}
    ],
  },`;
    })
    .join("\n");

  return `// AUTO-GENERADO por scripts/sync-modules.mjs — no editar a mano.
// Fuente: modules.manifest.json + src/modules/<id>/module.manifest.ts
import type { ModuleManifest } from "@/shared/config/moduleManifest";

export const moduleRegistry = [
${body}
] as const satisfies readonly ModuleManifest[];
`;
}

export function writeRegistry() {
  const content = renderRegistry(readModuleManifests());
  fs.writeFileSync(registryPath, content);
  return content;
}

export { registryPath, root };

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  writeRegistry();
  console.log(`registry actualizado: ${path.relative(root, registryPath)}`);
}
