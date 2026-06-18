function registerDiagnosticIpc({ safeHandle }) {
  if (typeof safeHandle !== "function") throw new Error("registerDiagnosticIpc necesita safeHandle.");

  safeHandle("YT_DIAGNOSTIC_RUN_ALL", async (_event, payload = {}) => {
    return require("./YTDiagnosticService").runFullDiagnostic(payload || {});
  });

  safeHandle("YT_DIAGNOSTIC_RUN_NO_SAVE", async () => {
    return require("./YTDiagnosticService").runFullDiagnosticWithoutSaving();
  });

  safeHandle("YT_DIAGNOSTIC_CHECK", async () => {
    return require("./YTDiagnosticCheck").runDiagnosticCheck();
  });

  safeHandle("YT_DIAGNOSTIC_LIST_REPORTS", async () => {
    return require("./YTDiagnosticService").getDiagnosticReports();
  });
}

module.exports = { registerDiagnosticIpc };
