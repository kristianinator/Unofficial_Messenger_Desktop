const { app, BrowserWindow, ipcMain, shell, Menu } = require("electron");
const path = require("path");

let win;

app.commandLine.appendSwitch("enable-features", "PlatformNotifications");

function setDockBadge(countStr) {
  if (process.platform !== "darwin") return;
  const n = Number(countStr);
  app.dock.setBadge(!n ? "" : String(n));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: "persist:messenger",
    },
  });

  win.setMenuBarVisibility(false);
  win.loadURL("https://www.messenger.com");

  // ✅ 1) Open new-window links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // ✅ 2) Open external navigation in default browser
  win.webContents.on("will-navigate", (event, url) => {
    const allowedDomains = [
      "https://www.messenger.com",
      "https://messenger.com",
      "https://www.facebook.com",
      "https://facebook.com",
    ];

    const isAllowed = allowedDomains.some((d) => url.startsWith(d));

    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // ✅ Right click context menu (copy / paste)
  win.webContents.on("context-menu", (event, params) => {
    const menu = Menu.buildFromTemplate([
      { role: "cut", enabled: params.editFlags.canCut },
      { role: "copy", enabled: params.editFlags.canCopy },
      { role: "paste", enabled: params.editFlags.canPaste },
      { role: "selectAll" },
    ]);

    menu.popup({ window: win });
  });
}

ipcMain.on("unread-count", (event, countStr) => {
  setDockBadge(countStr);
});

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
