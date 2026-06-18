const { getDiagnosticBlocks, runRegisteredBlockCheck } = require("./YTDiagnosticRegistry");
const { runDiagnosticCheck } = require("./YTDiagnosticCheck");
const { saveDiagnosticReport, listDiagnosticReports } = require("./YTDiagnosticReport");

function normalizeChecks(result) {
  const checks = Array.isArray(result.checks) ? result.checks : [];
  return checks.map((check) => ({ ...check, id: result.block + ":" + (check.id || check.name || check.label || "check"), label: result.block + " — " + (check.label || check.name || check.id || "Check") }));
}

function combineDiagnosticResults(results) {
  const checks = [];
  const errors = [];
  const warnings = [];

  results.forEach((result) => {
    checks.push({ id: result.block + ":summary", label: result.title || result.block, status: result.status || "WARNING", ok: result.status !== "ERROR", message: result.summary || "", recommendation: "" });
    checks.push(...normalizeChecks(result));
    if (Array.isArray(result.errors)) errors.push(...result.errors.map((error) => result.block + ": " + error));
    if (Array.isArray(result.warnings)) warnings.push(...result.warnings.map((warning) => result.block + ": " + warning));
  });

  const status = errors.length ? "ERROR" : warnings.length ? "WARNING" : "OK";
  return {
    ok: status !== "ERROR",
    approved: status === "OK",
    block: "diagnostico_integrado",
    title: "Diagnóstico integrado",
    status,
    summary: status === "OK" ? "Todos los bloques revisados están correctos." : status === "WARNING" ? "La app funciona, pero tiene advertencias." : "La app tiene errores que deben corregirse.",
    checkedBlocks: results.map((result) => ({ block: result.block, title: result.title, status: result.status, ok: result.ok, approved: result.approved })),
    results,
    checks,
    errors,
    warnings,
    timestamp: new Date().toISOString()
  };
}

async function runFullDiagnostic(options = {}) {
  const shouldSaveReport = options.saveReport !== false;
  const results = [];
  const blocks = getDiagnosticBlocks();

  for (const block of blocks) {
    results.push(await runRegisteredBlockCheck(block));
  }

  results.push(runDiagnosticCheck());
  const combined = combineDiagnosticResults(results);
  if (shouldSaveReport) combined.report = saveDiagnosticReport(combined);
  return combined;
}

function runFullDiagnosticWithoutSaving() {
  return runFullDiagnostic({ saveReport: false });
}

function getDiagnosticReports() {
  return listDiagnosticReports();
}

if (require.main === module) {
  runFullDiagnostic({ saveReport: true })
    .then((result) => { console.log(JSON.stringify(result, null, 2)); if (!result.ok) process.exitCode = 1; })
    .catch((error) => { console.error(error); process.exitCode = 1; });
}

module.exports = { runFullDiagnostic, runFullDiagnosticWithoutSaving, getDiagnosticReports, combineDiagnosticResults };
