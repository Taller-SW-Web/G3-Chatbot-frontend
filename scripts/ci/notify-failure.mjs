#!/usr/bin/env node
/**
 * Publish (or update) a pull request comment when the CI pipeline fails.
 * The marker makes the comment idempotent across retries and new failures.
 */
import { pathToFileURL } from "node:url";

const MARKER = "<!-- g3-ci-failure -->";
const MAX_COMMENT_CHARS = 55_000;
const MAX_LOG_LINES = 120;
const MAX_LOG_CHARS = 12_000;
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;
const FAILED = new Set(["failure", "cancelled", "timed_out", "action_required"]);

function apiBase() {
  const server = (process.env.GITHUB_SERVER_URL ?? "https://github.com").replace(/\/$/, "");
  return server === "https://github.com" ? "https://api.github.com" : `${server}/api/v3`;
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "g3-chatbot-ci",
  };
}

async function requestJson(method, url, token, payload) {
  const response = await fetch(url, {
    method,
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

export function stripAnsi(text) {
  return String(text ?? "").replace(ANSI_RE, "");
}

export function truncateLog(text) {
  const cleaned = stripAnsi(text).replaceAll("```", "~~~").trimEnd();
  const lines = cleaned.split("\n").slice(-MAX_LOG_LINES);
  let rendered = lines.join("\n");
  if (rendered.length > MAX_LOG_CHARS) {
    rendered = `…(recortado)\n${rendered.slice(-MAX_LOG_CHARS)}`;
  }
  return rendered || "(sin salida)";
}

function needsFailures(needsJson) {
  try {
    const needs = JSON.parse(needsJson || "{}");
    return Object.entries(needs)
      .filter(([, value]) => value && FAILED.has(value.result))
      .map(([name]) => name)
      .sort();
  } catch {
    return [];
  }
}

export function buildMarkdown({ runUrl, reason, jobs, logs, needsJson = "" }) {
  const names = jobs.map((job) => String(job.name ?? ""));
  for (const name of needsFailures(needsJson)) {
    if (!names.includes(name)) names.push(name);
  }
  const lines = [
    MARKER,
    "## CI falló",
    "",
    `**Run:** ${runUrl}`,
    `**Alcance:** ${reason || "no reportado"}`,
    "",
    "| Job | Conclusión |",
    "|---|---|",
  ];
  for (const job of jobs) {
    lines.push(`| ${String(job.name ?? "").replaceAll("|", "\\|")} | ${job.conclusion} |`);
  }
  if (jobs.length === 0) lines.push("| (sin jobs fallidos reportados por la API) | — |");
  if (names.length > jobs.length) {
    lines.push("", `Jobs fallidos según \`needs\`: ${names.map((name) => `\`${name}\``).join(", ")}`);
  }
  for (const job of jobs) {
    const log = logs[String(job.id)] ?? "";
    if (!log) continue;
    lines.push(
      "",
      `<details><summary>Log de ${job.name}</summary>`,
      "",
      "```text",
      truncateLog(log),
      "```",
      "",
      "</details>",
    );
  }
  let body = `${lines.join("\n")}\n`;
  if (body.length > MAX_COMMENT_CHARS) {
    body = `${body.slice(0, MAX_COMMENT_CHARS - 200)}\n\n…(comentario recortado por tamaño)\n`;
  }
  return body;
}

async function failedJobs(repo, runId, token) {
  const { status, body } = await requestJson(
    "GET",
    `${apiBase()}/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`,
    token,
  );
  if (status !== 200) {
    console.log(`::warning::No se pudieron leer los jobs del run (${status}).`);
    return [];
  }
  return (body.jobs ?? []).filter((job) => FAILED.has(job.conclusion));
}

async function jobLogs(repo, jobs, token) {
  const logs = {};
  for (const job of jobs) {
    const response = await fetch(
      `${apiBase()}/repos/${repo}/actions/jobs/${job.id}/logs`,
      { headers: headers(token) },
    );
    logs[String(job.id)] = response.ok ? await response.text() : "";
  }
  return logs;
}

async function findComment(repo, pr, token) {
  for (let page = 1; page <= 5; page += 1) {
    const { status, body } = await requestJson(
      "GET",
      `${apiBase()}/repos/${repo}/issues/${pr}/comments?per_page=100&page=${page}`,
      token,
    );
    if (status !== 200 || !Array.isArray(body)) return null;
    const found = body.find((comment) => {
      const author = comment.user ?? {};
      const isBot =
        author.login === "github-actions[bot]" || author.type === "Bot";
      return isBot && String(comment.body ?? "").includes(MARKER);
    });
    if (found) return found.id;
    if (body.length < 100) return null;
  }
  return null;
}

async function upsertComment(repo, pr, token, body) {
  const existing = await findComment(repo, pr, token);
  let status;
  if (existing) {
    ({ status } = await requestJson(
      "PATCH",
      `${apiBase()}/repos/${repo}/issues/comments/${existing}`,
      token,
      { body },
    ));
    if (status !== 200 && status !== 201) {
      // A stale marker owned by another actor must not silence the bot.
      ({ status } = await requestJson(
        "POST",
        `${apiBase()}/repos/${repo}/issues/${pr}/comments`,
        token,
        { body },
      ));
    }
  } else {
    ({ status } = await requestJson(
      "POST",
      `${apiBase()}/repos/${repo}/issues/${pr}/comments`,
      token,
      { body },
    ));
  }
  if (status !== 200 && status !== 201) {
    console.log(`::warning::No se pudo publicar el comentario en el PR (${status}).`);
  }
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const runId = process.env.GITHUB_RUN_ID ?? "";
  const pr = process.env.PR_NUMBER ?? "";
  const headRepo = process.env.HEAD_REPO ?? "";
  const reason = process.env.SCOPE_REASON ?? "";
  const needsJson = process.env.NEEDS_JSON ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  const server = (process.env.GITHUB_SERVER_URL ?? "https://github.com").replace(/\/$/, "");
  const runUrl = `${server}/${repo}/actions/runs/${runId}`;

  const jobs = token && repo && runId ? await failedJobs(repo, runId, token) : [];
  const logs = token && repo && runId ? await jobLogs(repo, jobs, token) : [];
  const body = buildMarkdown({ runUrl, reason, jobs, logs, needsJson });
  console.log(body);

  if (!token || !pr) {
    console.log("No hay token o PR: el reporte queda en el job summary.");
    return 0;
  }
  if (headRepo && headRepo !== repo) {
    console.log("PR desde un fork: el token es de solo lectura; se omite el comentario.");
    return 0;
  }
  await upsertComment(repo, pr, token, body);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
