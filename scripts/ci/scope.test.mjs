import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildScope,
  dependentsClosure,
  diffFiles,
  moduleIdFromPath,
} from "./scope.mjs";

const GRAPH = {
  "mod-auth": [],
  "mod-catalog": [],
  "mod-cart": ["mod-catalog"],
  "mod-shipping": ["mod-cart"],
  "mod-checkout": ["mod-cart", "mod-shipping"],
  "mod-orders": ["mod-checkout"],
  "mod-postventa": ["mod-orders"],
  "mod-chat": [
    "mod-auth",
    "mod-catalog",
    "mod-cart",
    "mod-shipping",
    "mod-checkout",
    "mod-orders",
    "mod-postventa",
  ],
};

function git(repo, args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
}

test("moduleIdFromPath normalizes test directories with underscores", () => {
  assert.equal(moduleIdFromPath("src/modules/mod-auth/ui/x.ts"), "mod-auth");
  assert.equal(moduleIdFromPath("tests/unit/mod_auth/x.test.ts"), "mod-auth");
  assert.equal(moduleIdFromPath("src/shared/x.ts"), null);
});

test("dependentsClosure follows reverse edges", () => {
  assert.deepEqual(dependentsClosure(["mod-catalog"], GRAPH), [
    "mod-cart",
    "mod-catalog",
    "mod-chat",
    "mod-checkout",
    "mod-orders",
    "mod-postventa",
    "mod-shipping",
  ]);
});

test("docs only skips code jobs without ci:full", () => {
  const scope = buildScope(["README.md", "docs/ci.md"], {
    graph: GRAPH,
    event: "pull_request",
    labels: [],
    full: false,
  });
  assert.equal(scope.mode, "docs");
  assert.equal(scope.run_validate, false);
  assert.equal(scope.run_unit, false);
  assert.equal(scope.run_build, false);
  assert.equal(scope.run_e2e, false);
  assert.equal(scope.run_sonar, false);
});

test("an empty PR diff fails closed", () => {
  const scope = buildScope([], {
    graph: GRAPH,
    event: "pull_request",
    labels: [],
    full: false,
  });
  assert.equal(scope.mode, "code");
  assert.equal(scope.full, true);
  assert.equal(scope.run_validate, true);
  assert.equal(scope.run_unit, true);
});

test("ci:full forces every job even on a docs-only diff", () => {
  const scope = buildScope(["README.md"], {
    graph: GRAPH,
    event: "pull_request",
    labels: ["ci:full"],
    full: true,
  });
  assert.equal(scope.mode, "code");
  assert.equal(scope.run_validate, true);
  assert.equal(scope.run_unit, true);
  assert.equal(scope.run_build, true);
  assert.equal(scope.run_security, true);
  assert.equal(scope.run_e2e, true);
  assert.equal(scope.run_sonar, true);
});

test("sonarSourcesChanged only for src changes", () => {
  const source = buildScope(["src/modules/mod-auth/ui/x.ts"], {
    graph: GRAPH,
    event: "pull_request",
    labels: [],
    full: false,
  });
  assert.equal(source.sonar_sources_changed, true);

  const tooling = buildScope(["scripts/ci/scope.mjs"], {
    graph: GRAPH,
    event: "pull_request",
    labels: [],
    full: false,
  });
  assert.equal(tooling.sonar_sources_changed, false);
});

test("deleted files and renames are visible to the diff", () => {
  const repo = mkdtempSync(join(tmpdir(), "g3-scope-"));
  try {
    git(repo, ["init"]);
    git(repo, ["config", "user.email", "ci@example.com"]);
    git(repo, ["config", "user.name", "CI"]);
    writeFileSync(join(repo, "README.md"), "base\n", "utf8");
    mkdirSync(join(repo, "src"), { recursive: true });
    writeFileSync(join(repo, "src", "code.ts"), "export const x = 1;\n", "utf8");
    mkdirSync(join(repo, "tests", "unit", "mod_auth"), { recursive: true });
    writeFileSync(join(repo, "tests", "unit", "mod_auth", "x.test.ts"), "test\n", "utf8");
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "base"]);
    const base = git(repo, ["rev-parse", "HEAD"]);

    rmSync(join(repo, "tests", "unit", "mod_auth", "x.test.ts"));
    mkdirSync(join(repo, "docs"), { recursive: true });
    git(repo, ["mv", "src/code.ts", "docs/code.md"]);
    git(repo, ["add", "-A"]);
    git(repo, ["commit", "-m", "delete and rename"]);

    const changed = diffFiles(base, repo);
    assert.ok(changed.includes("tests/unit/mod_auth/x.test.ts"));
    assert.ok(changed.includes("src/code.ts"));
    assert.ok(changed.includes("docs/code.md"));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
