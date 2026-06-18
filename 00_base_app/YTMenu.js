const { Menu, app } = require("electron");

function createAppMenu(mainWindow) {
  const template = [
    {
      label: "Archivo",
      submenu: [
        { label: "Salir", click: () => app.quit() }
      ]
    },
    {
      label: "Ver",
      submenu: [
        {
          label: "Recargar",
          accelerator: "Ctrl+R",
          click: () => mainWindow && !mainWindow.isDestroyed() && mainWindow.reload()
        },
        {
          label: "Herramientas de desarrollador",
          accelerator: "F12",
          click: () => mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents.openDevTools({ mode: "detach" })
        }
      ]
    },
    {
      label: "Ayuda",
      submenu: [
        { label: "Bloque actual: 00_base_app", enabled: false }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { createAppMenu };
