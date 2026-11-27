import assert from "node:assert/strict";
import test from "node:test";

import { buildMarkdown, successMarkdown } from "./notify-failure.mjs";

test("successMarkdown reports a recovered pipeline", () => {
  const body = successMarkdown({
    runUrl: "https://github.com/Taller-SW-Web/G3-Chatbot-frontend/actions/runs/1",
    reason: "full run",
  });
  assert.match(body, /CI recuperado/);
  assert.match(body, /actions\/runs\/1/);
});

test("buildMarkdown lists failed jobs and escapes fences", () => {
  const body = buildMarkdown({
    runUrl: "https://github.com/Taller-SW-Web/G3-Chatbot-frontend/actions/runs/2",
    reason: "unit",
    jobs: [{ id: 1, name: "unit-tests", conclusion: "failure" }],
    logs: { 1: "```text\nboom\n```" },
    needsJson: JSON.stringify({ "unit-tests": { result: "failure" } }),
  });
  assert.match(body, /CI falló/);
  assert.match(body, /unit-tests/);
  assert.match(body, /~~~text/);
});
