const fs = require("fs");
const path = require("path");

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (_error) {
    return false;
  }
}

function runBaseCheck() {
  const root = path.resolve(__dirname, "..");
  const base = path.join(root, "00_base_app");

  const rootFiles = ["package.json", ".gitignore", "YTConfig.json", "YTBuilder.json", "YTInstall.bat", "YTStart.bat"];
  const baseFiles = ["YTMain.js", "YTWindow.js", "YTPreload.js", "YTIpc.js", "YTMenu.js", "YTPaths.js", "YTBaseCheck.js", "YTBaseScreen.html", "YTBaseManual.md"];

  const checks = [];
  const errors = [];

  rootFiles.forEach((name) => {
    const ok = exists(path.join(root, name));
    checks.push({ name, status: ok ? "OK" : "ERROR", message: ok ? "Existe" : "Falta" });
    if (!ok) errors.push(name);
  });

  baseFiles.forEach((name) => {
    const ok = exists(path.join(base, name));
    checks.push({ name, status: ok ? "OK" : "ERROR", message: ok ? "Existe" : "Falta" });
    if (!ok) errors.push(name);
  });

  const status = errors.length === 0 ? "OK" : "ERROR";

  return {
    ok: status === "OK",
    approved: status === "OK",
    block: "00_base_app",
    title: "Bloque 00 — Base app",
    status,
    summary: status === "OK" ? "Bloque 00 correcto." : "Bloque 00 con archivos faltantes.",
    checks,
    errors,
    warnings: [],
    timestamp: new Date().toISOString()
  };
}

if (require.main === module) {
  console.log(JSON.stringify(runBaseCheck(), null, 2));
}

module.exports = { runBaseCheck };
