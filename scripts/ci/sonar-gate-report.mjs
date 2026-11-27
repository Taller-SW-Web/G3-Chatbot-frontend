#!/usr/bin/env node
/**
 * Explain a failed SonarCloud quality gate for the current PR or branch.
 * Reporting must never mask the real scan failure, so API errors exit 0.
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const HOST = (process.env.SONAR_HOST_URL ?? "https://sonarcloud.io").replace(/\/$/, "");
const TOKEN = process.env.SONAR_TOKEN ?? "";
const MAX_PAGES = 5;
const MEASURE_KEYS =
  "new_lines,new_lines_to_cover,new_coverage,new_duplicated_lines_density,new_violations";
const SEVERITY_ORDER = { INFO: 0, MINOR: 1, MAJOR: 2, CRITICAL: 3, BLOCKER: 4 };

function parseArgs(argv) {
  const args = {
    projectKey: "",
    pullRequest: "",
    branch: "",
    output: "sonar-gate-report.md",
    maxIssues: 50,
    failOnSeverity: "",
    minNewCoverage: 80,
    maxNewDuplication: 3,
    requireNewCodeMetrics: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--project-key") args.projectKey = argv[++index];
    else if (arg === "--pull-request") args.pullRequest = argv[++index];
    else if (arg === "--branch") args.branch = argv[++index];
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--max-issues") args.maxIssues = Number(argv[++index]);
    else if (arg === "--fail-on-severity") args.failOnSeverity = argv[++index];
    else if (arg === "--min-new-coverage") args.minNewCoverage = Number(argv[++index]);
    else if (arg === "--max-new-duplication") args.maxNewDuplication = Number(argv[++index]);
    else if (arg === "--require-new-code-metrics") args.requireNewCodeMetrics = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

async function apiGet(path, params) {
  const query = new URLSearchParams(params);
  const response = await fetch(`${HOST}${path}?${query}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function fetchIssues({ projectKey, pullRequest, branch, limit, fetchAll = false }) {
  const issues = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const params = {
      componentKeys: projectKey,
      resolved: "false",
      p: String(page),
      ps: "100",
      s: "SEVERITY",
      asc: "false",
    };
    if (pullRequest) params.pullRequest = pullRequest;
    else if (branch) {
      params.branch = branch;
      params.inNewCodePeriod = "true";
    }
    const payload = await apiGet("/api/issues/search", params);
    const batch = payload.issues ?? [];
    issues.push(...batch);
    const total = Number(payload.total ?? issues.length);
    if (!fetchAll && issues.length >= limit) break;
    if (batch.length === 0 || issues.length >= total) break;
  }
  return fetchAll ? issues : issues.slice(0, limit);
}

function measureValue(measure) {
  const periods = measure.periods ?? [];
  if (periods.length > 0) return String(periods.at(-1)?.value ?? "");
  return String(measure.value ?? "");
}

async function fetchMeasures({ projectKey, pullRequest, branch }) {
  const params = { component: projectKey, metricKeys: MEASURE_KEYS };
  if (pullRequest) params.pullRequest = pullRequest;
  else if (branch) params.branch = branch;
  const payload = await apiGet("/api/measures/component", params);
  const measures = payload.component?.measures ?? [];
  return Object.fromEntries(
    measures.map((measure) => [measure.metric, measureValue(measure)]),
  );
}

function asNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function measureFailures(
  measures,
  minNewCoverage,
  maxNewDuplication,
  requireMetrics = false,
) {
  const failures = [];
  const newLines = asNumber(measures.new_lines);
  const linesToCover = asNumber(measures.new_lines_to_cover);
  const newCoverage = asNumber(measures.new_coverage);
  const newDuplication = asNumber(measures.new_duplicated_lines_density);

  if (requireMetrics && newLines === null && linesToCover === null) {
    failures.push(
      "el PR toca src/ pero Sonar no publicó new_lines/new_lines_to_cover",
    );
    return failures;
  }
  if (linesToCover !== null && linesToCover > 0) {
    if (newCoverage === null) {
      failures.push(
        "new code tiene líneas que cubrir pero Sonar no publicó new_coverage",
      );
    } else if (newCoverage < minNewCoverage) {
      failures.push(`cobertura de new code ${newCoverage}% < ${minNewCoverage}%`);
    }
  }
  if (newLines !== null && newLines > 0) {
    if (newDuplication === null) {
      failures.push(
        "new code tiene líneas pero Sonar no publicó new_duplicated_lines_density",
      );
    } else if (newDuplication > maxNewDuplication) {
      failures.push(
        `duplicación de new code ${newDuplication}% > ${maxNewDuplication}%`,
      );
    }
  }
  return failures;
}

export function blockingIssues(issues, threshold) {
  const minimum = SEVERITY_ORDER[String(threshold).toUpperCase()];
  return issues.filter(
    (issue) => (SEVERITY_ORDER[String(issue.severity ?? "").toUpperCase()] ?? -1) >= minimum,
  );
}

export function formatReport({ projectKey, gate, issues, pullRequest, branch }) {
  const status = gate.status ?? "UNKNOWN";
  const conditions = gate.conditions ?? [];
  const location = pullRequest ? `PR #${pullRequest}` : `rama \`${branch}\``;
  const lines = [
    "## SonarCloud quality gate",
    "",
    `Proyecto \`${projectKey}\` · ${location} · estado: **${status}**`,
    "",
    "| Condición | Estado | Valor | Umbral |",
    "|---|---|---|---|",
  ];
  for (const condition of conditions) {
    lines.push(
      `| ${escapeCell(condition.metricKey)} | ${escapeCell(condition.status)} | ` +
        `${escapeCell(condition.actualValue ?? "—")} | ` +
        `${escapeCell(`${condition.comparator ?? ""} ${condition.errorThreshold ?? ""}`.trim())} |`,
    );
  }
  if (conditions.length === 0) lines.push("| (sin condiciones reportadas) | — | — | — |");

  lines.push("", `### Issues abiertos (${issues.length})`, "");
  if (issues.length > 0) {
    lines.push("| Archivo | Línea | Severidad | Regla | Mensaje |", "|---|---|---|---|---|");
    for (const issue of issues) {
      const file = String(issue.component ?? "").split(":").at(-1);
      lines.push(
        `| ${escapeCell(file)} | ${escapeCell(issue.line ?? "—")} | ` +
          `${escapeCell(issue.severity)} | ${escapeCell(issue.rule)} | ` +
          `${escapeCell(String(issue.message ?? "").slice(0, 180))} |`,
      );
    }
  } else {
    lines.push("Sin issues abiertos en el alcance analizado.");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: sonar-gate-report.mjs --project-key KEY [--pull-request N | --branch NAME]",
    );
    return 0;
  }
  if (!TOKEN) {
    if (args.failOnSeverity) {
      console.error("::error::SONAR_TOKEN is required for the strict gate.");
      return 1;
    }
    console.log("::warning::SONAR_TOKEN is not available; skipping the gate report.");
    return 0;
  }
  if (!args.projectKey) {
    console.error("--project-key is required");
    return 2;
  }
  if (args.failOnSeverity) {
    args.failOnSeverity = String(args.failOnSeverity).toUpperCase();
    if (!(args.failOnSeverity in SEVERITY_ORDER)) {
      console.error(`--fail-on-severity must be one of ${Object.keys(SEVERITY_ORDER).join(", ")}`);
      return 2;
    }
  }

  const scope = args.pullRequest
    ? { pullRequest: args.pullRequest }
    : { branch: args.branch };
  try {
    const gatePayload = await apiGet("/api/qualitygates/project_status", {
      projectKey: args.projectKey,
      ...scope,
    });
    const issues = await fetchIssues({
      projectKey: args.projectKey,
      pullRequest: args.pullRequest,
      branch: args.branch,
      limit: args.maxIssues,
      fetchAll: Boolean(args.failOnSeverity),
    });
    const measures =
      args.failOnSeverity && args.pullRequest
        ? await fetchMeasures({
            projectKey: args.projectKey,
            pullRequest: args.pullRequest,
            branch: args.branch,
          })
        : {};
    const report = formatReport({
      projectKey: args.projectKey,
      gate: gatePayload.projectStatus ?? {},
      issues: issues.slice(0, args.maxIssues),
      pullRequest: args.pullRequest,
      branch: args.branch,
    });
    // codeql[js/http-to-file-access] -- CI report built from the Sonar API;
    // fixed output path and escaped table cells.
    writeFileSync(args.output, report, "utf8");
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) {
      // codeql[js/http-to-file-access] -- GitHub-provided summary file.
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, report, "utf8");
    }
    if (args.failOnSeverity) {
      console.log(
        `New code: lines=${measures.new_lines || "n/a"}, ` +
          `lines_to_cover=${measures.new_lines_to_cover || "n/a"}, ` +
          `coverage=${measures.new_coverage || "n/a"}, ` +
          `duplication=${measures.new_duplicated_lines_density || "n/a"}`,
      );
      const metricFailures = args.pullRequest
        ? measureFailures(
            measures,
            args.minNewCoverage,
            args.maxNewDuplication,
            args.requireNewCodeMetrics,
          )
        : [];
      if (metricFailures.length > 0) {
        for (const failure of metricFailures) console.error(`::error::${failure}.`);
        return 1;
      }

      const blocking = blockingIssues(issues, args.failOnSeverity);
      if (blocking.length > 0) {
        console.error(
          `::error::SonarCloud reporta ${blocking.length} issue(s) nuevos ` +
            `de severidad ${args.failOnSeverity} o superior.`,
        );
        for (const issue of blocking.slice(0, 20)) {
          const file = String(issue.component ?? "").split(":").at(-1);
          console.error(
            `  ${file}:${issue.line ?? "—"} [${issue.severity}] ${issue.rule} — ${issue.message}`,
          );
        }
        return 1;
      }
    }
  } catch (error) {
    console.log(`::warning::Could not read the SonarCloud gate: ${error.message}`);
    if (args.failOnSeverity) {
      console.log("::error::No se pudo verificar el gate estricto de SonarCloud.");
      return 1;
    }
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
