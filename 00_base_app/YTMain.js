const { app } = require("electron");
const { createMainWindow } = require("./YTWindow");
const { registerBaseIpc } = require("./YTIpc");
const { createAppMenu } = require("./YTMenu");

app.setName("AutoEdit Studio");

let mainWindow = null;
const lock = app.requestSingleInstanceLock();

if (!lock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    registerBaseIpc({ getMainWindow: () => mainWindow });
    mainWindow = createMainWindow();
    createAppMenu(mainWindow);
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      mainWindow = createMainWindow();
      createAppMenu(mainWindow);
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
