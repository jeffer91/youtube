function createDefaultData() {
  return {
    app: {
      name: "AutoEdit Studio",
      version: "0.0.1",
      currentBlock: "02_archivos_y_datos"
    },
    settings: {
      language: "es",
      compactUi: true,
      autosave: true
    },
    projects: [],
    recentMedia: [],
    exports: [],
    logs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createLogEntry(type, message, extra = {}) {
  return {
    id: "log_" + Date.now(),
    type: type || "INFO",
    message: String(message || ""),
    extra,
    createdAt: new Date().toISOString()
  };
}

module.exports = { createDefaultData, createLogEntry };
