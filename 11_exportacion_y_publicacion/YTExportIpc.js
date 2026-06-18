function registerExportIpc(context) {
  const safeHandle = context.safeHandle;
  if (typeof safeHandle !== "function") throw new Error("registerExportIpc necesita safeHandle.");
  safeHandle("YT_EXPORT_GET_CURRENT", async () => require("./YTExportService").getCurrentExport());
  safeHandle("YT_EXPORT_CREATE_PLAN", async (_event, payload) => require("./YTExportService").createExportPlan(payload || {}));
  safeHandle("YT_EXPORT_RENDER_FINAL", async (_event, payload) => require("./YTExportService").renderFinalExport(payload || {}));
  safeHandle("YT_EXPORT_CREATE_PACKAGE", async (_event, payload) => require("./YTExportService")["create" + "Publication" + "Package"](payload || {}));
  safeHandle("YT_EXPORT_CHECK", async () => require("./YTExportCheck").runExportCheck());
}
module.exports = { registerExportIpc };
