#!/usr/bin/env node
/**
 * Run every blocking frontend validator in one job and fail only at the end.
 * The report is kept as evidence for 90 days by the workflow.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PROJECT_ROOT = resolve(import.meta.dirname, "../..");

const VALIDATORS = [
  {
    name: "eslint",
    description: "Lint and React/Next rules",
    command: "pnpm",
    args: ["exec", "eslint", "."],
  },
  {
    name: "tsc",
    description: "Static types",
    command: "pnpm",
    args: ["exec", "tsc", "--noEmit"],
  },
  {
    name: "modules",
    description: "Module structure, boundaries and OpenAPI contract",
    command: "pnpm",
    args: ["run", "modules:check"],
  },
  {
    name: "ci-tests",
    description: "Scope, deletion, ci:full and Sonar gate regression tests",
    command: "node",
    args: [
      "--test",
      "scripts/ci/scope.test.mjs",
      "scripts/ci/sonar-gate-report.test.mjs",
      "scripts/ci/notify-failure.test.mjs",
    ],
  },
];

function selected(names) {
  if (!names || names.length === 0) return VALIDATORS;
  const wanted = new Set(names);
  const unknown = [...wanted].filter(
    (name) => !VALIDATORS.some((validator) => validator.name === name),
  );
  if (unknown.length > 0) {
    console.error(`Unknown validator(s): ${unknown.join(", ")}`);
    console.error(`Available: ${VALIDATORS.map((validator) => validator.name).join(", ")}`);
    process.exit(2);
  }
  return VALIDATORS.filter((validator) => wanted.has(validator.name));
}

function runValidator(validator) {
  const started = Date.now();
  const result = spawnSync(validator.command, validator.args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    timeout: 600_000,
    shell: process.platform === "win32",
    env: process.env,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return {
    validator,
    exitCode: result.status ?? 1,
    durationSeconds: (Date.now() - started) / 1000,
    output,
  };
}

function renderReport(results, generatedAt) {
  const passed = results.every((result) => result.exitCode === 0);
  const lines = [
    "# Validation report",
    "",
    `- Generated: ${generatedAt}`,
    `- Commit: ${process.env.GITHUB_SHA ?? "local"}`,
    `- Result: ${passed ? "PASS" : "FAIL"}`,
    "",
    "## Summary",
    "",
    "| Validator | Result | Duration |",
    "|---|---|---|",
  ];
  for (const result of results) {
    const status =
      result.exitCode === 0 ? "PASS" : `FAIL (exit ${result.exitCode})`;
    lines.push(
      `| ${result.validator.name} | ${status} | ${result.durationSeconds.toFixed(1)}s |`,
    );
  }
  for (const result of results) {
    lines.push(
      "",
      `## ${result.validator.name}`,
      "",
      `_${result.validator.description}_`,
      "",
      "```text",
      result.output || "(no output)",
      "```",
    );
  }
  return `${lines.join("\n")}\n`;
}

function main(argv) {
  const only = [];
  let reportPath = resolve(PROJECT_ROOT, "validation-report.txt");
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--only") only.push(argv[++index]);
    else if (argv[index] === "--report") reportPath = resolve(argv[++index]);
    else if (argv[index] === "--list") {
      for (const validator of VALIDATORS) {
        console.log(`${validator.name}: ${validator.description}`);
      }
      return 0;
    }
  }

  const results = [];
  for (const validator of selected(only)) {
    console.log(`\n=== ${validator.name} ===`);
    const result = runValidator(validator);
    results.push(result);
    if (result.output) console.log(result.output);
    const status =
      result.exitCode === 0 ? "PASS" : `FAIL (exit ${result.exitCode})`;
    console.log(`[${status}] ${validator.name} in ${result.durationSeconds.toFixed(1)}s`);
  }

  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(reportPath, renderReport(results, generatedAt), "utf8");

  const failed = results.filter((result) => result.exitCode !== 0);
  console.log("\nValidation summary");
  console.log(`  passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`  failed: ${failed.map((result) => result.validator.name).join(", ")}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
