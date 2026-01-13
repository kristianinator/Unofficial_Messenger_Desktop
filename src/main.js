const { app, BrowserWindow, ipcMain } = require("electron");
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

      // ✅ IMPORTANT: persistent session
      partition: "persist:messenger"
    }
  });

  win.setMenuBarVisibility(false);
  win.loadURL("https://www.messenger.com");
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
