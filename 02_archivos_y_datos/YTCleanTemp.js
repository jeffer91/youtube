const fs = require("fs");
const path = require("path");
const { getFolderPath } = require("./YTPathService");
const { ensureFolder } = require("./YTFolderService");

function cleanTemp() {
  const tempDir = getFolderPath("temp");
  ensureFolder(tempDir);

  const deleted = [];
  const errors = [];

  fs.readdirSync(tempDir).forEach((name) => {
    const target = path.join(tempDir, name);
    try {
      fs.rmSync(target, { recursive: true, force: true });
      deleted.push(target);
    } catch (error) {
      errors.push({ path: target, error: error.message });
    }
  });

  return { ok: errors.length === 0, tempDir, deletedCount: deleted.length, deleted, errors };
}

module.exports = { cleanTemp };
