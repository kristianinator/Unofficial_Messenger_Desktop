const { app, BrowserWindow, ipcMain, shell, Menu, nativeImage } = require("electron");
const path = require("path");

let win = null;
let lastUnread = -1;

// Enable platform notifications
app.commandLine.appendSwitch("enable-features", "PlatformNotifications");

// ----------------------------
// macOS dock badge
// ----------------------------
function setDockBadge(countStr) {
  if (process.platform !== "darwin") return;

  const n = Number(countStr) || 0;
  app.dock.setBadge(n > 0 ? String(n) : "");
}

// ----------------------------
// Windows: generate overlay badge icon
// ----------------------------
function createBadgeIcon(count) {
  if (process.platform !== "win32") return null;

  const { createCanvas } = require("canvas");
  const size = 32; // ✅ overlay icon size must be small
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  // red circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#E53935";
  ctx.fill();

  // text
  const text = count > 99 ? "99+" : String(count);

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // better font sizing
  if (count > 99) ctx.font = "bold 12px Arial";
  else if (count > 9) ctx.font = "bold 14px Arial";
  else ctx.font = "bold 16px Arial";

  // slight vertical offset because Windows renders slightly high
  ctx.fillText(text, size / 2, size / 2 + 1);

  return nativeImage.createFromBuffer(canvas.toBuffer("image/png"));
}

// ----------------------------
// Windows: flash + overlay icon
// ----------------------------
function setWindowsTaskbarBadge(countStr) {
  if (process.platform !== "win32") return;
  if (!win || win.isDestroyed()) return;

  const n = Number(countStr) || 0;

  // avoid re-setting same value constantly (prevents Windows ignoring it)
  if (n === lastUnread) return;
  lastUnread = n;

  // ✅ flash taskbar (your behavior)
  win.flashFrame(n > 0);

  // ✅ overlay badge
  try {
    if (n <= 0) {
      win.setOverlayIcon(null, "");
    } else {
      const badge = createBadgeIcon(n);
      win.setOverlayIcon(badge, `${n} unread messages`);
    }
  } catch (err) {
    console.error("Failed to set overlay icon:", err);
  }
}

// ----------------------------
// Create window
// ----------------------------
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // ✅ show only when ready
    icon: path.join(__dirname, "../assets/icon.ico"), // important for taskbar grouping
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: "persist:messenger"
    }
  });

  win.setMenuBarVisibility(false);

  win.once("ready-to-show", () => {
    win.show();

    // ensure overlay icon is applied after window exists on taskbar
    if (process.platform === "win32" && lastUnread > 0) {
      setTimeout(() => setWindowsTaskbarBadge(String(lastUnread)), 250);
    }
  });

  win.loadURL("https://www.messenger.com");

  // ✅ open popup windows in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // ✅ open external navigation in default browser
  win.webContents.on("will-navigate", (event, url) => {
    const allowedDomains = [
      "https://www.messenger.com",
      "https://messenger.com",
      "https://www.facebook.com",
      "https://facebook.com"
    ];

    const isAllowed = allowedDomains.some((d) => url.startsWith(d));

    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // ✅ Right click context menu
  win.webContents.on("context-menu", (event, params) => {
    const menu = Menu.buildFromTemplate([
      { role: "cut", enabled: params.editFlags.canCut },
      { role: "copy", enabled: params.editFlags.canCopy },
      { role: "paste", enabled: params.editFlags.canPaste },
      { role: "selectAll" }
    ]);

    menu.popup({ window: win });
  });

  win.on("closed", () => {
    win = null;
  });
}

// ----------------------------
// IPC: unread count updates
// ----------------------------
ipcMain.on("unread-count", (event, countStr) => {
  setDockBadge(countStr);            // macOS badge
  setWindowsTaskbarBadge(countStr);  // Windows badge + flash
});

// ----------------------------
// App lifecycle
// ----------------------------
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
