#!/usr/bin/env node
/**
 * Explain a failed SonarCloud quality gate for the current PR or branch.
 * Reporting must never mask the real scan failure, so API errors exit 0.
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const HOST = (process.env.SONAR_HOST_URL ?? "https://sonarcloud.io").replace(/\/$/, "");
const TOKEN = process.env.SONAR_TOKEN ?? "";

function parseArgs(argv) {
  const args = { projectKey: "", pullRequest: "", branch: "", output: "sonar-gate-report.md", maxIssues: 50 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--project-key") args.projectKey = argv[++index];
    else if (arg === "--pull-request") args.pullRequest = argv[++index];
    else if (arg === "--branch") args.branch = argv[++index];
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--max-issues") args.maxIssues = Number(argv[++index]);
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
    console.log("::warning::SONAR_TOKEN is not available; skipping the gate report.");
    return 0;
  }
  if (!args.projectKey) {
    console.error("--project-key is required");
    return 2;
  }

  const scope = args.pullRequest
    ? { pullRequest: args.pullRequest }
    : { branch: args.branch };
  try {
    const gatePayload = await apiGet("/api/qualitygates/project_status", {
      projectKey: args.projectKey,
      ...scope,
    });
    const issuePayload = await apiGet("/api/issues/search", {
      componentKeys: args.projectKey,
      resolved: "false",
      ps: String(args.maxIssues),
      s: "SEVERITY",
      asc: "false",
      ...scope,
    });
    const report = formatReport({
      projectKey: args.projectKey,
      gate: gatePayload.projectStatus ?? {},
      issues: issuePayload.issues ?? [],
      pullRequest: args.pullRequest,
      branch: args.branch,
    });
    writeFileSync(args.output, report, "utf8");
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, report, "utf8");
    }
  } catch (error) {
    console.log(`::warning::Could not read the SonarCloud gate: ${error.message}`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
