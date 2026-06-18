const fs = require("fs");
const path = require("path");
const { createResourceRecord, isSupportedResource } = require("./YTResourceModel");

function walkFolder(folderPath, options = {}) {
  const maxDepth = Number.isFinite(Number(options.maxDepth)) ? Number(options.maxDepth) : 4;
  const normalizedRoot = path.normalize(String(folderPath || ""));
  const files = [];
  const errors = [];

  function visit(currentPath, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (error) {
      errors.push({ path: currentPath, message: error.message });
      return;
    }

    entries.forEach((entry) => {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".")) visit(fullPath, depth + 1);
        return;
      }
      if (entry.isFile()) files.push(fullPath);
    });
  }

  if (!fs.existsSync(normalizedRoot)) {
    return { ok: false, status: "ERROR", folderPath: normalizedRoot, files: [], errors: [{ path: normalizedRoot, message: "La carpeta no existe." }] };
  }

  visit(normalizedRoot, 0);
  return { ok: errors.length === 0, status: errors.length ? "WARNING" : "OK", folderPath: normalizedRoot, files, errors };
}

function scanResourceFolder(folderPath, options = {}) {
  const walked = walkFolder(folderPath, options);
  if (!walked.files.length && !walked.ok) return { ...walked, resources: [], count: 0, skipped: [] };

  const supportedOnly = options.supportedOnly !== false;
  const skipped = [];
  const resources = [];

  walked.files.forEach((filePath, index) => {
    if (supportedOnly && !isSupportedResource(filePath)) {
      skipped.push({ path: filePath, reason: "Extensión no soportada" });
      return;
    }
    resources.push(createResourceRecord(filePath, {
      index,
      source: options.source || "scan",
      imported: Boolean(options.imported),
      tags: options.tags || ["escaneado"]
    }));
  });

  return {
    ok: walked.ok,
    status: walked.errors.length ? "WARNING" : "OK",
    folderPath: walked.folderPath,
    count: resources.length,
    resources,
    skipped,
    errors: walked.errors,
    scannedAt: new Date().toISOString()
  };
}

module.exports = { walkFolder, scanResourceFolder };
