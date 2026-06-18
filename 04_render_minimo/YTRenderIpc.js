function registerRenderIpc({ safeHandle }) {
  if (typeof safeHandle !== "function") throw new Error("registerRenderIpc necesita safeHandle.");

  safeHandle("YT_RENDER_FIVE_SECONDS", async (_event, payload = {}) => {
    return require("./YTRenderService").renderFirstFiveSeconds(payload || {});
  });

  safeHandle("YT_RENDER_GET_LAST", async () => {
    return require("./YTRenderService").getLastRender();
  });

  safeHandle("YT_RENDER_CHECK", async () => {
    return require("./YTRenderCheck").runRenderCheck();
  });
}

module.exports = { registerRenderIpc };
