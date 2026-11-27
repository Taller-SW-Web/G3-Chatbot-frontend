#!/usr/bin/env node
/**
 * Compute the CI scope for the frontend repository.
 *
 * GitHub has no job-level `paths` filter, so the workflow computes the scope
 * once and every expensive job consumes `needs.scope.outputs.*`. If the base
 * cannot be resolved the scope falls back to full, never to "skip".
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const FULL_PATTERNS = [
  "pnpm-lock.yaml",
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "vitest.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "playwright.config.ts",
  "modules.manifest.json",
  "src/shared/**",
  "src/app/**",
  ".github/workflows/**",
  "scripts/ci/**",
  "docs/openapi.json",
];

export const DEPENDENCY_PATTERNS = ["pnpm-lock.yaml", "package.json"];
export const DOCS_PATTERNS = [
  "*.md",
  "docs/**",
  ".github/ISSUE_TEMPLATE/**",
  ".github/pull_request_template.md",
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
];
export const CODE_PATTERNS = ["src/**", "tests/**", "scripts/**"];
export const MODULE_PATH_RE =
  /^(?:src\/modules\/|tests\/unit\/)(mod[-_][a-z0-9_-]+)(?:\/|$)/;

export function globToRegExp(pattern) {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "*") {
      if (pattern[index + 1] === "*") {
        source += ".*";
        index += 1;
      } else {
        source += "[^/]*";
      }
    } else if ("\\^$.|?+()[]{}".includes(char)) {
      source += `\\${char}`;
    } else {
      source += char;
    }
  }
  return new RegExp(`${source}$`);
}

export function matches(file, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(file));
}

export function isDocsPath(file) {
  return matches(file, DOCS_PATTERNS);
}

export function isCodePath(file) {
  return matches(file, CODE_PATTERNS);
}

export function moduleIdFromPath(file) {
  const match = MODULE_PATH_RE.exec(file);
  return match ? match[1].replaceAll("_", "-") : null;
}

export function loadManifest(path = "modules.manifest.json") {
  const payload = JSON.parse(readFileSync(path, "utf8"));
  const graph = {};
  for (const entry of payload.modules ?? []) {
    graph[entry.id] = [...(entry.dependsOn ?? [])];
  }
  return graph;
}

export function dependentsClosure(changedModules, graph) {
  const reverse = new Map(Object.keys(graph).map((id) => [id, new Set()]));
  for (const [id, dependencies] of Object.entries(graph)) {
    for (const dependency of dependencies) {
      if (!reverse.has(dependency)) reverse.set(dependency, new Set());
      reverse.get(dependency).add(id);
    }
  }
  const affected = new Set();
  const queue = [...changedModules];
  while (queue.length > 0) {
    const current = queue.shift();
    if (affected.has(current)) continue;
    affected.add(current);
    for (const dependent of reverse.get(current) ?? []) {
      if (!affected.has(dependent)) queue.push(dependent);
    }
  }
  return [...affected].sort();
}

export function buildScope(
  changedFiles,
  { graph, event, labels = [], full = false },
) {
  const changed = changedFiles.map((file) => file.replaceAll("\\", "/"));
  const reasons = [];
  const forcedByLabel = labels.includes("ci:full");
  if (changed.length === 0 && ["pull_request", "push"].includes(event)) {
    // An empty diff in a PR/push means the base resolution or the diff failed
    // silently. Fail closed instead of skipping every gate.
    full = true;
    reasons.push("empty diff on PR/push");
  }
  const docsOnly =
    changed.length > 0 &&
    changed.every(isDocsPath) &&
    !changed.some((file) => matches(file, FULL_PATTERNS));
  const hasDependencies = changed.some((file) =>
    matches(file, DEPENDENCY_PATTERNS),
  );
  const hasCi = changed.some(
    (file) =>
      file.startsWith(".github/workflows/") || file.startsWith("scripts/ci/"),
  );
  const hasShared = changed.some((file) => file.startsWith("src/shared/"));
  const hasConfig = changed.some((file) => matches(file, FULL_PATTERNS));
  const hasUnknown = changed.some(
    (file) =>
      !isDocsPath(file) && !isCodePath(file) && !matches(file, FULL_PATTERNS),
  );

  if (full) reasons.push("forced by --full or ci:full label");
  if (hasCi) reasons.push("CI workflow or script changed");
  if (hasShared) reasons.push("shared code changed");
  if (hasConfig) reasons.push("build/test configuration changed");
  if (hasDependencies) reasons.push("dependency files changed");
  if (hasUnknown) reasons.push("unmapped file changed");

  const fullScope =
    full ||
    forcedByLabel ||
    changed.length === 0 ||
    hasCi ||
    hasShared ||
    hasConfig ||
    hasDependencies ||
    hasUnknown;

  let mode;
  if (changed.length === 0 && fullScope) {
    mode = "code";
    reasons.push("scheduled or dispatched full run");
  } else if (changed.length === 0) {
    mode = "none";
    reasons.push("no changed files");
  } else if (docsOnly && !fullScope) {
    mode = "docs";
    reasons.push("docs only");
  } else if (hasDependencies) {
    mode = "deps";
  } else if (hasCi) {
    mode = "ci";
  } else {
    mode = "code";
  }

  const changedModules = [
    ...new Set(changed.map(moduleIdFromPath).filter(Boolean)),
  ].sort();
  const modules = fullScope
    ? Object.keys(graph).sort()
    : dependentsClosure(changedModules, graph);
  if (changedModules.length > 0) {
    reasons.push(`modules: ${changedModules.join(", ")}`);
  }

  const isPullRequest = event === "pull_request";
  const forceExpensive = !isPullRequest || forcedByLabel || fullScope;
  const runValidate = ["code", "deps", "ci"].includes(mode);
  const runUnit = ["code", "deps", "ci"].includes(mode);
  const runBuild = ["code", "deps", "ci"].includes(mode);
  const runSecurity =
    forcedByLabel ||
    fullScope ||
    mode === "deps" ||
    ["schedule", "workflow_dispatch"].includes(event);
  const runE2E = forceExpensive && ["code", "deps", "ci"].includes(mode);
  const runSonar = ["code", "deps", "ci"].includes(mode);

  return {
    mode,
    full: fullScope,
    modules,
    run_validate: runValidate,
    run_unit: runUnit,
    run_build: runBuild,
    run_lighthouse: runBuild,
    run_security: runSecurity,
    run_e2e: runE2E,
    run_sonar: runSonar,
    sonar_sources_changed: changed.some((file) => file.startsWith("src/")),
    run_specs: isPullRequest,
    run_dependency_review: isPullRequest,
    changed_count: changed.length,
    reason: reasons.length > 0 ? reasons.join("; ") : "no scope triggers",
  };
}

export function writeGithubOutput(path, scope) {
  const lines = [];
  for (const [key, value] of Object.entries(scope)) {
    const rendered = Array.isArray(value) ? JSON.stringify(value) : String(value);
    lines.push(`${key}=${rendered}`);
  }
  appendFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

function resolveBase(base, before, repoRoot) {
  if (base) {
    try {
      const sha = execFileSync("git", ["merge-base", base, "HEAD"], {
        cwd: repoRoot,
        encoding: "utf8",
      }).trim();
      return sha || null;
    } catch {
      return null;
    }
  }
  if (before && !/^0+$/.test(before)) {
    try {
      execFileSync("git", ["cat-file", "-e", `${before}^{commit}`], {
        cwd: repoRoot,
        encoding: "utf8",
      });
      return before;
    } catch {
      return null;
    }
  }
  return null;
}

export function diffFiles(sha, repoRoot) {
  const output = execFileSync(
    "git",
    [
      "diff",
      "--name-only",
      "--no-renames",
      "--diff-filter=ACDMRTUB",
      `${sha}...HEAD`,
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseArgs(argv) {
  const args = {
    base: undefined,
    before: undefined,
    event: "other",
    labels: [],
    full: false,
    manifest: "modules.manifest.json",
    repoRoot: process.cwd(),
    githubOutput: undefined,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") args.base = argv[++index];
    else if (arg === "--before") args.before = argv[++index];
    else if (arg === "--event") args.event = argv[++index];
    else if (arg === "--labels")
      args.labels = (argv[++index] ?? "").split(",").filter(Boolean);
    else if (arg === "--manifest") args.manifest = argv[++index];
    else if (arg === "--repo-root") args.repoRoot = argv[++index];
    else if (arg === "--github-output") args.githubOutput = argv[++index];
    else if (arg === "--full") args.full = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(
      "Usage: scope.mjs [--base REF] [--before SHA] [--event NAME] " +
        "[--labels a,b] [--full] [--github-output PATH] [--json]",
    );
    return 0;
  }

  // Team decision: full pipeline on every run. The diff is still computed for
  // sonar_sources_changed and reporting.
  let changed = [];
  const base = resolveBase(args.base, args.before, args.repoRoot);
  if (base !== null) {
    try {
      changed = diffFiles(base, args.repoRoot);
    } catch {
      changed = [];
    }
  }

  const scope = buildScope(changed, {
    graph: loadManifest(args.manifest),
    event: args.event,
    labels: args.labels,
    full: true,
  });
  if (args.githubOutput) writeGithubOutput(args.githubOutput, scope);
  if (args.json) {
    console.log(JSON.stringify(scope, null, 2));
  } else {
    console.log("CI scope");
    for (const [key, value] of Object.entries(scope)) {
      console.log(`  ${key}: ${Array.isArray(value) ? value.join(",") : value}`);
    }
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
