const { BrowserWindow } = require("electron");
const path = require("path");
const { getPreferredHtmlEntry } = require("./YTPaths");

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: "AutoEdit Studio",
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#f5f6f8",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "YTPreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(getPreferredHtmlEntry());
  mainWindow.once("ready-to-show", () => mainWindow.show());
  return mainWindow;
}

module.exports = { createMainWindow };
