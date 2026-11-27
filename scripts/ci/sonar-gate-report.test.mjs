import assert from "node:assert/strict";
import test from "node:test";

import { blockingIssues, measureFailures } from "./sonar-gate-report.mjs";

test("measureFailures passes a fully covered new-code PR", () => {
  const measures = {
    new_lines: "52",
    new_lines_to_cover: "9",
    new_coverage: "100.0",
    new_duplicated_lines_density: "0.0",
  };
  assert.deepEqual(measureFailures(measures, 80, 3), []);
});

test("measureFailures fails closed when new_coverage is missing", () => {
  const failures = measureFailures(
    {
      new_lines: "52",
      new_lines_to_cover: "9",
      new_duplicated_lines_density: "0.0",
    },
    80,
    3,
  );
  assert.deepEqual(failures, [
    "new code tiene líneas que cubrir pero Sonar no publicó new_coverage",
  ]);
});

test("measureFailures fails closed when base metrics are missing and src changed", () => {
  assert.deepEqual(measureFailures({}, 80, 3, true), [
    "el PR toca src/ pero Sonar no publicó new_lines/new_lines_to_cover",
  ]);
  assert.deepEqual(measureFailures({}, 80, 3, false), []);
});

test("measureFailures rejects low coverage and high duplication", () => {
  assert.deepEqual(
    measureFailures(
      {
        new_lines: "52",
        new_lines_to_cover: "9",
        new_coverage: "75.0",
        new_duplicated_lines_density: "1.0",
      },
      80,
      3,
    ),
    ["cobertura de new code 75% < 80%"],
  );
  assert.deepEqual(
    measureFailures(
      {
        new_lines: "52",
        new_lines_to_cover: "9",
        new_coverage: "90.0",
        new_duplicated_lines_density: "4.5",
      },
      80,
      3,
    ),
    ["duplicación de new code 4.5% > 3%"],
  );
});

test("blockingIssues filters by severity", () => {
  const issues = [
    { severity: "INFO" },
    { severity: "MINOR" },
    { severity: "MAJOR" },
    { severity: "BLOCKER" },
  ];
  assert.equal(blockingIssues(issues, "MINOR").length, 3);
  assert.equal(blockingIssues(issues, "MAJOR").length, 2);
  assert.equal(blockingIssues(issues, "BLOCKER").length, 1);
});
